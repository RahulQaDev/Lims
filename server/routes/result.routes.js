const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const resultController = require('../controllers/result.controller');
const { authenticate } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/results/department/:deptId
router.get('/department/:deptId', resultController.getDepartmentPending);

// GET /api/results/booking-test/:bookingTestId
router.get('/booking-test/:bookingTestId', resultController.getByBookingTest);

// POST /api/results
router.post('/', [
  body('bookingTestId').isInt().withMessage('Valid booking test ID is required'),
  body('parameters').optional().isArray().withMessage('Parameters must be an array'),
], createAuditMiddleware('create', 'Result'), resultController.create);

// PUT /api/results/:id
router.put('/:id', [
  body('parameters').optional().isArray().withMessage('Parameters must be an array'),
], captureOldValues('Result'), createAuditMiddleware('update', 'Result'), resultController.update);

// PUT /api/results/booking-test/:id/assign
router.put('/booking-test/:id/assign', [
  body('assignedTo').isInt().withMessage('Valid user ID is required'),
], createAuditMiddleware('update', 'BookingTest'), resultController.assignBookingTest);

module.exports = router;
