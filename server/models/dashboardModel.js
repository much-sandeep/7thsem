const { getPool } = require('../config/db');

async function getSummary() {
  const pool = getPool();

  const [[revenueRow]] = await pool.query(`
    SELECT
      COALESCE(SUM(total_amount), 0) AS totalRevenue,
      COUNT(*) AS totalBills
    FROM bills
  `);

  const [[itemsRow]] = await pool.query(`
    SELECT COALESCE(SUM(quantity), 0) AS totalItemsSold
    FROM bill_items
  `);

  return {
    totalRevenue: Number(revenueRow.totalRevenue),
    totalBills: Number(revenueRow.totalBills),
    totalItemsSold: Number(itemsRow.totalItemsSold),
  };
}

async function getDailySales() {
  const pool = getPool();

  const [rows] = await pool.query(`
    SELECT
      DATE(date) AS date,
      SUM(total_amount) AS totalSales
    FROM bills
    GROUP BY DATE(date)
    ORDER BY date ASC
  `);

  return rows.map((row) => ({
    date: row.date instanceof Date
      ? row.date.toISOString().slice(0, 10)
      : String(row.date).slice(0, 10),
    totalSales: Number(row.totalSales),
  }));
}

async function getTopItems(limit = 10) {
  const pool = getPool();

  const [rows] = await pool.query(
    `
    SELECT
      i.name AS itemName,
      SUM(bi.quantity) AS quantitySold
    FROM bill_items bi
    INNER JOIN items i ON i.id = bi.item_id
    GROUP BY i.id, i.name
    ORDER BY quantitySold DESC
    LIMIT ?
    `,
    [limit]
  );

  return rows.map((row) => ({
    itemName: row.itemName,
    quantitySold: Number(row.quantitySold),
  }));
}

module.exports = {
  getSummary,
  getDailySales,
  getTopItems,
};
