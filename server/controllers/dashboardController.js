const dashboardModel = require('../models/dashboardModel');

async function getSummary(_req, res) {
  try {
    const summary = await dashboardModel.getSummary();
    return res.json(summary);
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
}

async function getDailySales(_req, res) {
  try {
    const dailySales = await dashboardModel.getDailySales();
    return res.json({ dailySales });
  } catch (error) {
    console.error('Dashboard daily sales error:', error);
    return res.status(500).json({ error: 'Failed to fetch daily sales' });
  }
}

async function getTopItems(_req, res) {
  try {
    const topItems = await dashboardModel.getTopItems();
    return res.json({ topItems });
  } catch (error) {
    console.error('Dashboard top items error:', error);
    return res.status(500).json({ error: 'Failed to fetch top items' });
  }
}

module.exports = {
  getSummary,
  getDailySales,
  getTopItems,
};
