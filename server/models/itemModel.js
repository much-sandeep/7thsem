const { getPool } = require('../config/db');

async function findAll() {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, name, price, stock FROM items ORDER BY name ASC'
  );
  return rows;
}

async function findById(id) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, name, price, stock FROM items WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function create({ name, price, stock }) {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO items (name, price, stock) VALUES (?, ?, ?)',
    [name, price, stock ?? 0]
  );
  return findById(result.insertId);
}

async function update(id, { name, price, stock }) {
  const pool = getPool();
  await pool.query(
    'UPDATE items SET name = ?, price = ?, stock = ? WHERE id = ?',
    [name, price, stock, id]
  );
  return findById(id);
}

async function remove(id) {
  const pool = getPool();
  try {
    const [result] = await pool.query('DELETE FROM items WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      const err = new Error('Cannot delete item with existing sales history');
      err.status = 409;
      throw err;
    }
    throw error;
  }
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
