const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const instrumentController = require('../controllers/instrument.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/instruments
router.get('/', instrumentController.getAll);

// GET /api/instruments/:id
router.get('/:id', instrumentController.getById);

// POST /api/instruments
router.post('/', requireRole('admin', 'lab_head', 'dept_head', 'qa'), [
  body('name').notEmpty().withMessage('Instrument name is required'),
], createAuditMiddleware('create', 'Instrument'), instrumentController.create);

// PUT /api/instruments/:id
router.put('/:id', requireRole('admin', 'lab_head', 'dept_head', 'qa'), [
  body('name').optional().notEmpty().withMessage('Instrument name cannot be empty'),
], captureOldValues('Instrument'), createAuditMiddleware('update', 'Instrument'), instrumentController.update);

// DELETE /api/instruments/:id
router.delete('/:id', requireRole('admin', 'lab_head'), captureOldValues('Instrument'), createAuditMiddleware('delete', 'Instrument'), instrumentController.remove);

module.exports = router;
