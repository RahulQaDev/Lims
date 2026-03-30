const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/invoices/outstanding (must be before /:id)
router.get('/outstanding', invoiceController.getOutstanding);

// GET /api/invoices
router.get('/', invoiceController.getAll);

// GET /api/invoices/:id
router.get('/:id', invoiceController.getById);

// POST /api/invoices
router.post('/', requireRole('admin', 'lab_head', 'accounts'), [
  body('clientId').isInt().withMessage('Valid client ID is required'),
], createAuditMiddleware('create', 'Invoice'), invoiceController.create);

// PUT /api/invoices/:id
router.put('/:id', requireRole('admin', 'lab_head', 'accounts'), captureOldValues('Invoice'), createAuditMiddleware('update', 'Invoice'), invoiceController.update);

// DELETE /api/invoices/:id
router.delete('/:id', requireRole('admin', 'accounts'), captureOldValues('Invoice'), createAuditMiddleware('delete', 'Invoice'), invoiceController.remove);

// POST /api/invoices/generate/:bookingId
router.post('/generate/:bookingId', requireRole('admin', 'lab_head', 'accounts'), createAuditMiddleware('create', 'Invoice'), invoiceController.generateFromBooking);

// PUT /api/invoices/:id/payment
router.put('/:id/payment', requireRole('admin', 'accounts'), [
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid payment amount is required'),
  body('paymentMode').notEmpty().withMessage('Payment mode is required'),
], captureOldValues('Invoice'), createAuditMiddleware('update', 'Invoice'), invoiceController.recordPayment);

module.exports = router;
