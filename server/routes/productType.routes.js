const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const productTypeController = require('../controllers/productType.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/product-types
router.get('/', productTypeController.getAll);

// GET /api/product-types/:id
router.get('/:id', productTypeController.getById);

// POST /api/product-types
router.post('/', requireRole('admin', 'lab_head'), [
  body('name').notEmpty().withMessage('Product type name is required'),
], createAuditMiddleware('create', 'ProductType'), productTypeController.create);

// PUT /api/product-types/:id
router.put('/:id', requireRole('admin', 'lab_head'), [
  body('name').optional().notEmpty().withMessage('Product type name cannot be empty'),
], captureOldValues('ProductType'), createAuditMiddleware('update', 'ProductType'), productTypeController.update);

// DELETE /api/product-types/:id
router.delete('/:id', requireRole('admin'), captureOldValues('ProductType'), createAuditMiddleware('delete', 'ProductType'), productTypeController.remove);

module.exports = router;
