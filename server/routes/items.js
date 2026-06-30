const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const itemController = require('../controllers/itemController');

const router = express.Router();

router.use(requireAuth);

router.get('/', itemController.getAllItems);
router.get('/:id', itemController.getItemById);
router.post('/', requireAdmin, itemController.createItem);
router.put('/:id', requireAdmin, itemController.updateItem);
router.delete('/:id', requireAdmin, itemController.deleteItem);

module.exports = router;
