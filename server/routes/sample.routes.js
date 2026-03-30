const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const sampleController = require('../controllers/sample.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/samples/stats/summary (must be before /:id)
router.get('/stats/summary', sampleController.getStatsSummary);

// GET /api/samples
router.get('/', sampleController.getAll);

// GET /api/samples/:id
router.get('/:id', sampleController.getById);

// POST /api/samples
router.post('/', [
  body('clientId').isInt().withMessage('Valid client ID is required'),
  body('description').notEmpty().withMessage('Description is required'),
], createAuditMiddleware('create', 'Sample'), sampleController.create);

// PUT /api/samples/:id
router.put('/:id', [
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
], captureOldValues('Sample'), createAuditMiddleware('update', 'Sample'), sampleController.update);

// POST /api/samples/:id/reception
router.post('/:id/reception', [
  body('numberOfContainers').optional().isInt({ min: 1 }).withMessage('Number of containers must be positive'),
], createAuditMiddleware('create', 'SampleReception'), sampleController.addReception);

// PUT /api/samples/:id/status
router.put('/:id/status', [
  body('status').notEmpty().withMessage('Status is required'),
], captureOldValues('Sample'), createAuditMiddleware('update', 'Sample'), sampleController.updateStatus);

module.exports = router;
