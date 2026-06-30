const express = require('express');
const { requireAuth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.use(requireAuth);

router.get('/summary', dashboardController.getSummary);
router.get('/daily-sales', dashboardController.getDailySales);
router.get('/top-items', dashboardController.getTopItems);

router.get('/', (_req, res) => {
  res.json({
    message: 'Dashboard access granted',
    user: _req.session.user,
  });
});

module.exports = router;
