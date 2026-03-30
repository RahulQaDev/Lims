const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const rateMasterController = require('../controllers/rateMaster.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/rates/lookup (must be before /:id)
router.get('/lookup', rateMasterController.lookup);

// GET /api/rates
router.get('/', rateMasterController.getAll);

// GET /api/rates/:id
router.get('/:id', rateMasterController.getById);

// POST /api/rates
router.post('/', requireRole('admin', 'lab_head', 'accounts'), [
  body('testMasterId').isInt().withMessage('Valid test master ID is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
], createAuditMiddleware('create', 'RateMaster'), rateMasterController.create);

// PUT /api/rates/:id
router.put('/:id', requireRole('admin', 'lab_head', 'accounts'), [
  body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
], captureOldValues('RateMaster'), createAuditMiddleware('update', 'RateMaster'), rateMasterController.update);

// DELETE /api/rates/:id
router.delete('/:id', requireRole('admin', 'lab_head'), captureOldValues('RateMaster'), createAuditMiddleware('delete', 'RateMaster'), rateMasterController.remove);

module.exports = router;
