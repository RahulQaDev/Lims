const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/reviews/pending
router.get('/pending', requireRole('admin', 'lab_head', 'dept_head', 'reviewer'), reviewController.getPendingReview);

// GET /api/reviews/pending-approval
router.get('/pending-approval', requireRole('admin', 'lab_head', 'dept_head', 'approver'), reviewController.getPendingApproval);

// POST /api/reviews/:resultId/review
router.post('/:resultId/review', requireRole('admin', 'lab_head', 'dept_head', 'reviewer'), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('remarks').optional().isString(),
], createAuditMiddleware('create', 'Review'), reviewController.submitReview);

// POST /api/reviews/:resultId/approve
router.post('/:resultId/approve', requireRole('admin', 'lab_head', 'dept_head', 'approver'), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('remarks').optional().isString(),
], createAuditMiddleware('create', 'Review'), reviewController.submitApproval);

module.exports = router;
