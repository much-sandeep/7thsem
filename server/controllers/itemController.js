const itemModel = require('../models/itemModel');

function parseItemInput(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const price = parseFloat(body.price);
  const stock = parseInt(body.stock, 10);

  if (!name) {
    const error = new Error('Item name is required');
    error.status = 400;
    throw error;
  }

  if (Number.isNaN(price) || price < 0) {
    const error = new Error('Price must be a non-negative number');
    error.status = 400;
    throw error;
  }

  if (
    Number.isNaN(stock) ||
    stock < 0 ||
    !Number.isInteger(stock) ||
    String(body.stock ?? '').includes('.')
  ) {
    const error = new Error('Stock must be a non-negative whole number');
    error.status = 400;
    throw error;
  }

  return { name, price, stock };
}

async function getAllItems(_req, res) {
  try {
    const items = await itemModel.findAll();
    return res.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
}

async function getItemById(req, res) {
  try {
    const item = await itemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    return res.status(500).json({ error: 'Failed to fetch item' });
  }
}

async function createItem(req, res) {
  try {
    const input = parseItemInput(req.body);
    const item = await itemModel.create(input);
    return res.status(201).json({ item });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Create item error:', error);
    return res.status(500).json({ error: 'Failed to create item' });
  }
}

async function updateItem(req, res) {
  try {
    const existing = await itemModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const input = parseItemInput(req.body);
    const item = await itemModel.update(req.params.id, input);
    return res.json({ item });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Update item error:', error);
    return res.status(500).json({ error: 'Failed to update item' });
  }
}

async function deleteItem(req, res) {
  try {
    const deleted = await itemModel.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Item not found' });
    }
    return res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Delete item error:', error);
    return res.status(500).json({ error: 'Failed to delete item' });
  }
}

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
