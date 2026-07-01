const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DB_NAME = process.env.DB_NAME || 'pos_operational';

function getConnectionConfig(withDatabase = false) {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  if (withDatabase) {
    config.database = DB_NAME;
  }

  return config;
}

async function initializeDatabase() {
  const connection = await mysql.createConnection(getConnectionConfig());

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  await connection.query(`USE \`${DB_NAME}\``);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      username      VARCHAR(50)  NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role          ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_username (username)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS items (
      id    INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      name  VARCHAR(150)  NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock INT UNSIGNED  NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      KEY idx_items_name (name),
      CONSTRAINT chk_items_price CHECK (price >= 0),
      CONSTRAINT chk_items_stock CHECK (stock >= 0)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS bills (
      id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      date          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      total_amount  DECIMAL(10,2) NOT NULL,
      cash_received DECIMAL(10,2) NOT NULL,
      change_amount DECIMAL(10,2) NOT NULL,
      PRIMARY KEY (id),
      KEY idx_bills_date (date),
      CONSTRAINT chk_bills_total  CHECK (total_amount  >= 0),
      CONSTRAINT chk_bills_cash   CHECK (cash_received >= 0),
      CONSTRAINT chk_bills_change CHECK (change_amount >= 0)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
      bill_id  INT UNSIGNED  NOT NULL,
      item_id  INT UNSIGNED  NOT NULL,
      quantity INT UNSIGNED  NOT NULL,
      price    DECIMAL(10,2) NOT NULL,
      PRIMARY KEY (id),
      KEY idx_bill_items_bill_id (bill_id),
      KEY idx_bill_items_item_id (item_id),
      CONSTRAINT fk_bill_items_bill
        FOREIGN KEY (bill_id) REFERENCES bills (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      CONSTRAINT fk_bill_items_item
        FOREIGN KEY (item_id) REFERENCES items (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
      CONSTRAINT chk_bill_items_qty   CHECK (quantity >= 1),
      CONSTRAINT chk_bill_items_price CHECK (price >= 0)
    ) ENGINE=InnoDB
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
      min_support    DECIMAL(5,4) NOT NULL,
      min_confidence DECIMAL(5,4) NOT NULL,
      PRIMARY KEY (id),
      CONSTRAINT chk_settings_support    CHECK (min_support    >= 0 AND min_support    <= 1),
      CONSTRAINT chk_settings_confidence CHECK (min_confidence >= 0 AND min_confidence <= 1)
    ) ENGINE=InnoDB
  `);

  const [existingSettings] = await connection.query(
    'SELECT id FROM settings ORDER BY id ASC LIMIT 1'
  );

  if (existingSettings.length === 0) {
    await connection.query(
      'INSERT INTO settings (min_support, min_confidence) VALUES (?, ?)',
      [0.05, 0.6]
    );
    console.log('Default analytics settings created (min_support: 0.05, min_confidence: 0.60)');
  }

  const [existingAdmin] = await connection.query(
    'SELECT id, password_hash FROM users WHERE username = ?',
    ['admin']
  );

  const defaultPasswordHash = await bcrypt.hash('admin123', 10);

  if (existingAdmin.length === 0) {
    await connection.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      ['admin', defaultPasswordHash, 'admin']
    );
    console.log('Default admin user created (username: admin, password: admin123)');
  } else {
    const passwordValid = await bcrypt.compare('admin123', existingAdmin[0].password_hash);
    if (!passwordValid) {
      await connection.query(
        'UPDATE users SET password_hash = ?, role = ? WHERE username = ?',
        [defaultPasswordHash, 'admin', 'admin']
      );
      console.log('Default admin password reset (username: admin, password: admin123)');
    }
  }

  await connection.end();

  const pool = mysql.createPool({
    ...getConnectionConfig(true),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log(`Database "${DB_NAME}" is ready`);
  return pool;
}

module.exports = { initializeDatabase, DB_NAME };
