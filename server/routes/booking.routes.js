const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/bookings
router.get('/', bookingController.getAll);

// GET /api/bookings/:id
router.get('/:id', bookingController.getById);

// POST /api/bookings
router.post('/', [
  body('sampleId').isInt().withMessage('Valid sample ID is required'),
  body('tests').isArray({ min: 1 }).withMessage('At least one test is required'),
  body('tests.*.testMasterId').isInt().withMessage('Valid test master ID is required for each test'),
], createAuditMiddleware('create', 'Booking'), bookingController.create);

// PUT /api/bookings/:id
router.put('/:id', [
  body('remarks').optional().isString(),
], captureOldValues('Booking'), createAuditMiddleware('update', 'Booking'), bookingController.update);

// POST /api/bookings/:id/tests
router.post('/:id/tests', [
  body('tests').isArray({ min: 1 }).withMessage('At least one test is required'),
  body('tests.*.testMasterId').isInt().withMessage('Valid test master ID is required'),
], createAuditMiddleware('create', 'BookingTest'), bookingController.addTests);

// DELETE /api/bookings/:id/tests/:testId
router.delete('/:id/tests/:testId', createAuditMiddleware('delete', 'BookingTest'), bookingController.removeTest);

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', captureOldValues('Booking'), createAuditMiddleware('update', 'Booking'), bookingController.cancelBooking);

module.exports = router;
