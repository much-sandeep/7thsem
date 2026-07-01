const express = require('express');
const { requireAuth } = require('../middleware/auth');
const fpGrowthController = require('../controllers/fpGrowthController');

const router = express.Router();

// All FP-Growth debug routes require an authenticated session.
router.use(requireAuth);

// Mining + association-rule endpoints.
router.get('/itemsets', fpGrowthController.getItemsets);
router.get('/rules', fpGrowthController.getRules);

// Temporary debug endpoints for the FP-Tree construction stage.
router.get('/transactions', fpGrowthController.getProcessedTransactions);
router.get('/frequency-table', fpGrowthController.getFrequencyTable);
router.get('/header-table', fpGrowthController.getHeaderTable);
router.get('/tree', fpGrowthController.getTreeStructure);

module.exports = router;
