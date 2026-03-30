const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/clients
router.get('/', clientController.getAll);

// GET /api/clients/:id
router.get('/:id', clientController.getById);

// POST /api/clients
router.post('/', requireRole('admin', 'lab_head', 'customer_coordinator', 'marketing'), [
  body('name').notEmpty().withMessage('Client name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
], createAuditMiddleware('create', 'Client'), clientController.create);

// PUT /api/clients/:id
router.put('/:id', requireRole('admin', 'lab_head', 'customer_coordinator', 'marketing'), [
  body('name').optional().notEmpty().withMessage('Client name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
], captureOldValues('Client'), createAuditMiddleware('update', 'Client'), clientController.update);

// DELETE /api/clients/:id
router.delete('/:id', requireRole('admin'), captureOldValues('Client'), createAuditMiddleware('delete', 'Client'), clientController.remove);

// GET /api/clients/:id/samples
router.get('/:id/samples', clientController.getClientSamples);

// GET /api/clients/:id/invoices
router.get('/:id/invoices', clientController.getClientInvoices);

module.exports = router;
