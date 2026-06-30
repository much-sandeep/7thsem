const billModel = require('../models/billModel');

async function getAllBills(_req, res) {
  try {
    const bills = await billModel.findAll();
    return res.json({ bills });
  } catch (error) {
    console.error('Get bills error:', error);
    return res.status(500).json({ error: 'Failed to fetch bills' });
  }
}

async function getBillById(req, res) {
  try {
    const bill = await billModel.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    return res.json({ bill });
  } catch (error) {
    console.error('Get bill error:', error);
    return res.status(500).json({ error: 'Failed to fetch bill' });
  }
}

async function createBill(req, res) {
  try {
    const { cash_received, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one cart item is required' });
    }

    if (cash_received === undefined || cash_received === null || cash_received === '') {
      return res.status(400).json({ error: 'Cash received is required' });
    }

    const bill = await billModel.createBill({ cash_received, items });
    return res.status(201).json({ bill });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Create bill error:', error);
    return res.status(500).json({ error: 'Failed to create bill' });
  }
}

module.exports = {
  getAllBills,
  getBillById,
  createBill,
};
