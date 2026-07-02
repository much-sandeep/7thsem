/**
 * archiveService.js — operational → warehouse historical archiving.
 *
 * Isolated, add-only feature. After a successful login the server performs an
 * archive check: bills (and their bill_items) older than the configured period
 * are copied into the warehouse database, verified, and then removed from the
 * operational database. The whole move runs inside a single transaction so a
 * failure at any step rolls back and leaves the operational data untouched.
 *
 * Nothing here changes billing, stock, auth, or the FP-Growth algorithm — it
 * only relocates already-completed historical transactions.
 */
const { getPool } = require('../config/db');

// Configuration — never hardcoded at the call site. Follows the project's
// existing `process.env.X || default` style (see config/initDb.js, index.js).
const ARCHIVE_PERIOD_DAYS = Number(process.env.ARCHIVE_PERIOD_DAYS) || 30;
const WAREHOUSE_DB_NAME = process.env.DB_WAREHOUSE_NAME || 'pos_warehouse';

// Guard against overlapping runs (e.g. several near-simultaneous logins).
let archiveInProgress = false;

/**
 * Ensure the warehouse database and archive tables exist.
 *
 * Mirrors the operational bill/bill_items columns so archival is a plain
 * INSERT … SELECT. The archive tables intentionally carry no foreign key to
 * `items`, so items never need to be archived to satisfy referential integrity.
 * DDL runs outside any transaction (DDL auto-commits in MySQL).
 */
async function ensureWarehouseSchema() {
  const pool = getPool();

  await pool.query(
    `CREATE DATABASE IF NOT EXISTS \`${WAREHOUSE_DB_NAME}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`${WAREHOUSE_DB_NAME}\`.bills (
      id            INT UNSIGNED  NOT NULL,
      date          DATETIME      NOT NULL,
      total_amount  DECIMAL(10,2) NOT NULL,
      cash_received DECIMAL(10,2) NOT NULL,
      change_amount DECIMAL(10,2) NOT NULL,
      PRIMARY KEY (id),
      KEY idx_bills_date (date)
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`${WAREHOUSE_DB_NAME}\`.bill_items (
      id       INT UNSIGNED  NOT NULL,
      bill_id  INT UNSIGNED  NOT NULL,
      item_id  INT UNSIGNED  NOT NULL,
      quantity INT UNSIGNED  NOT NULL,
      price    DECIMAL(10,2) NOT NULL,
      PRIMARY KEY (id),
      KEY idx_bill_items_bill_id (bill_id),
      KEY idx_bill_items_item_id (item_id)
    ) ENGINE=InnoDB
  `);
}

/**
 * Copy eligible historical bills + bill_items into the warehouse, verify the
 * copy, then delete only the verified records from the operational database.
 * Everything runs in one transaction with rollback on any failure.
 * @returns {Promise<{ archived: number }>}
 */
async function archiveOldBills() {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Find bills older than the configured cutoff.
    const [eligible] = await connection.query(
      `SELECT id FROM bills WHERE date < (NOW() - INTERVAL ? DAY) ORDER BY id ASC`,
      [ARCHIVE_PERIOD_DAYS]
    );

    if (eligible.length === 0) {
      await connection.commit();
      return { archived: 0 };
    }

    const ids = eligible.map((row) => row.id);

    // Expected line-item counts per bill (from operational, before deletion)
    // so the copy can be verified precisely.
    const [opCounts] = await connection.query(
      `SELECT bill_id, COUNT(*) AS c FROM bill_items WHERE bill_id IN (?) GROUP BY bill_id`,
      [ids]
    );
    const opCountMap = new Map(opCounts.map((r) => [Number(r.bill_id), Number(r.c)]));

    // 2. Copy bills. INSERT IGNORE keeps the operation idempotent and prevents
    //    duplicate archives when the same id was archived in a previous run.
    await connection.query(
      `INSERT IGNORE INTO \`${WAREHOUSE_DB_NAME}\`.bills
         (id, date, total_amount, cash_received, change_amount)
       SELECT id, date, total_amount, cash_received, change_amount
       FROM bills WHERE id IN (?)`,
      [ids]
    );

    // 3. Copy the corresponding bill_items (relationship preserved via bill_id).
    await connection.query(
      `INSERT IGNORE INTO \`${WAREHOUSE_DB_NAME}\`.bill_items
         (id, bill_id, item_id, quantity, price)
       SELECT id, bill_id, item_id, quantity, price
       FROM bill_items WHERE bill_id IN (?)`,
      [ids]
    );

    // 4. Verify: each bill must exist in the warehouse and its archived
    //    line-item count must match the operational source exactly.
    const [whBills] = await connection.query(
      `SELECT id FROM \`${WAREHOUSE_DB_NAME}\`.bills WHERE id IN (?)`,
      [ids]
    );
    const whBillSet = new Set(whBills.map((r) => Number(r.id)));

    const [whCounts] = await connection.query(
      `SELECT bill_id, COUNT(*) AS c FROM \`${WAREHOUSE_DB_NAME}\`.bill_items
       WHERE bill_id IN (?) GROUP BY bill_id`,
      [ids]
    );
    const whCountMap = new Map(whCounts.map((r) => [Number(r.bill_id), Number(r.c)]));

    const verifiedIds = ids.filter((id) => {
      const key = Number(id);
      if (!whBillSet.has(key)) {
        return false;
      }
      const expected = opCountMap.get(key) || 0;
      const actual = whCountMap.get(key) || 0;
      return actual === expected;
    });

    // If nothing could be verified, abort without deleting anything.
    if (verifiedIds.length === 0) {
      await connection.rollback();
      return { archived: 0 };
    }

    // 5. Delete only the successfully archived records from operational.
    //    bill_items first, then bills (also safe under the existing CASCADE FK).
    await connection.query(
      `DELETE FROM bill_items WHERE bill_id IN (?)`,
      [verifiedIds]
    );
    await connection.query(
      `DELETE FROM bills WHERE id IN (?)`,
      [verifiedIds]
    );

    await connection.commit();
    return { archived: verifiedIds.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Safe entry point invoked after login. Never throws and never blocks the
 * caller's critical path — any failure is logged and swallowed so authentication
 * and every other feature keep working exactly as before.
 * @returns {Promise<{ archived: number, skipped?: boolean, error?: string }>}
 */
async function runArchiveCheck() {
  if (archiveInProgress) {
    return { archived: 0, skipped: true };
  }
  archiveInProgress = true;

  try {
    await ensureWarehouseSchema();
    const result = await archiveOldBills();

    if (result.archived > 0) {
      console.log(
        `Warehouse archive: moved ${result.archived} bill(s) older than ` +
          `${ARCHIVE_PERIOD_DAYS} days into "${WAREHOUSE_DB_NAME}"`
      );
    }

    return result;
  } catch (error) {
    console.warn('Warehouse archive skipped:', error.message);
    return { archived: 0, error: error.message };
  } finally {
    archiveInProgress = false;
  }
}

module.exports = {
  runArchiveCheck,
  ensureWarehouseSchema,
  archiveOldBills,
  ARCHIVE_PERIOD_DAYS,
  WAREHOUSE_DB_NAME,
};
