const express = require('express');
const { requireAuth } = require('../middleware/auth');
const billController = require('../controllers/billController');

const router = express.Router();

router.use(requireAuth);

router.get('/', billController.getAllBills);
router.get('/:id', billController.getBillById);
router.post('/', billController.createBill);

module.exports = router;
