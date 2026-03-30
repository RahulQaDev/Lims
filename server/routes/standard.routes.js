const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const standardController = require('../controllers/standard.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/standards
router.get('/', standardController.getAll);

// GET /api/standards/:id
router.get('/:id', standardController.getById);

// POST /api/standards
router.post('/', requireRole('admin', 'lab_head', 'dept_head'), [
  body('name').notEmpty().withMessage('Standard name is required'),
  body('type').notEmpty().withMessage('Standard type is required'),
], createAuditMiddleware('create', 'Standard'), standardController.create);

// PUT /api/standards/:id
router.put('/:id', requireRole('admin', 'lab_head', 'dept_head'), [
  body('name').optional().notEmpty().withMessage('Standard name cannot be empty'),
], captureOldValues('Standard'), createAuditMiddleware('update', 'Standard'), standardController.update);

// DELETE /api/standards/:id
router.delete('/:id', requireRole('admin', 'lab_head'), captureOldValues('Standard'), createAuditMiddleware('delete', 'Standard'), standardController.remove);

// GET /api/standards/:id/tests
router.get('/:id/tests', standardController.getStandardTests);

module.exports = router;
