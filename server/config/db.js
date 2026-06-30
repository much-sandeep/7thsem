let pool = null;

function setPool(newPool) {
  pool = newPool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool;
}

module.exports = { getPool, setPool };
