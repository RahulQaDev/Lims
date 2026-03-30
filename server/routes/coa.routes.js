const express = require('express');
const router = express.Router();
const coaController = require('../controllers/coa.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware } = require('../middleware/auditLog');

// Public route - verify CoA
router.get('/verify/:verificationCode', coaController.verify);

// Protected routes
router.use(authenticate);

// GET /api/coa
router.get('/', coaController.getAll);

// GET /api/coa/:id
router.get('/:id', coaController.getById);

// POST /api/coa/generate/:bookingId
router.post('/generate/:bookingId', requireRole('admin', 'lab_head', 'dept_head', 'approver'), createAuditMiddleware('create', 'Coa'), coaController.generate);

module.exports = router;
