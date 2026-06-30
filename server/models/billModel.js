const { getPool } = require('../config/db');

async function findAll() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, date, total_amount, cash_received, change_amount
     FROM bills
     ORDER BY date DESC`
  );
  return rows;
}

async function findById(id) {
  const pool = getPool();
  const [bills] = await pool.query(
    `SELECT id, date, total_amount, cash_received, change_amount
     FROM bills
     WHERE id = ?`,
    [id]
  );

  if (bills.length === 0) {
    return null;
  }

  const [items] = await pool.query(
    `SELECT bi.id, bi.item_id, bi.quantity, bi.price, i.name
     FROM bill_items bi
     JOIN items i ON i.id = bi.item_id
     WHERE bi.bill_id = ?
     ORDER BY bi.id ASC`,
    [id]
  );

  return { ...bills[0], items };
}

async function createBill({ cash_received, items: cartItems }) {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let totalAmount = 0;
    const lineItems = [];

    for (const cartItem of cartItems) {
      const [rows] = await connection.query(
        'SELECT id, name, price, stock FROM items WHERE id = ? FOR UPDATE',
        [cartItem.item_id]
      );

      if (rows.length === 0) {
        const error = new Error(`Item with id ${cartItem.item_id} not found`);
        error.status = 404;
        throw error;
      }

      const item = rows[0];
      const quantity = Number(cartItem.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        const error = new Error('Each item quantity must be a positive integer');
        error.status = 400;
        throw error;
      }

      if (item.stock < quantity) {
        const error = new Error(`Insufficient stock for ${item.name}`);
        error.status = 400;
        throw error;
      }

      const lineTotal = Number(item.price) * quantity;
      totalAmount += lineTotal;
      lineItems.push({
        item_id: item.id,
        quantity,
        price: Number(item.price),
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    const cashReceived = Number(cash_received);

    if (Number.isNaN(cashReceived) || cashReceived < totalAmount) {
      const error = new Error('Cash received must be greater than or equal to total amount');
      error.status = 400;
      throw error;
    }

    const changeAmount = Math.round((cashReceived - totalAmount) * 100) / 100;

    const [billResult] = await connection.query(
      `INSERT INTO bills (total_amount, cash_received, change_amount)
       VALUES (?, ?, ?)`,
      [totalAmount, cashReceived, changeAmount]
    );

    const billId = billResult.insertId;

    for (const line of lineItems) {
      await connection.query(
        `INSERT INTO bill_items (bill_id, item_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [billId, line.item_id, line.quantity, line.price]
      );

      await connection.query(
        'UPDATE items SET stock = stock - ? WHERE id = ?',
        [line.quantity, line.item_id]
      );
    }

    await connection.commit();
    return findById(billId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findAll,
  findById,
  createBill,
};
