const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vendor.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requireRole('admin', 'lab_head', 'purchase'), ctrl.create);
router.put('/:id', requireRole('admin', 'lab_head', 'purchase'), ctrl.update);
router.delete('/:id', requireRole('admin', 'lab_head'), ctrl.remove);

module.exports = router;
