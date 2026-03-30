const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

// All routes require authentication
router.use(authenticate);

// GET /api/users
router.get('/', requireRole('admin', 'lab_head'), userController.getAll);

// GET /api/users/:id
router.get('/:id', userController.getById);

// POST /api/users
router.post('/', requireRole('admin'), [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('role').notEmpty().withMessage('Role is required'),
], createAuditMiddleware('create', 'User'), userController.create);

// PUT /api/users/:id
router.put('/:id', requireRole('admin'), [
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
], captureOldValues('User'), createAuditMiddleware('update', 'User'), userController.update);

// DELETE /api/users/:id
router.delete('/:id', requireRole('admin'), captureOldValues('User'), createAuditMiddleware('delete', 'User'), userController.remove);

// GET /api/users/:id/departments
router.get('/:id/departments', userController.getUserDepartments);

module.exports = router;
