const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/departments
router.get('/', departmentController.getAll);

// GET /api/departments/:id
router.get('/:id', departmentController.getById);

// POST /api/departments
router.post('/', requireRole('admin', 'lab_head'), [
  body('name').notEmpty().withMessage('Department name is required'),
  body('code').notEmpty().withMessage('Department code is required'),
], createAuditMiddleware('create', 'Department'), departmentController.create);

// PUT /api/departments/:id
router.put('/:id', requireRole('admin', 'lab_head'), [
  body('name').optional().notEmpty().withMessage('Department name cannot be empty'),
], captureOldValues('Department'), createAuditMiddleware('update', 'Department'), departmentController.update);

// DELETE /api/departments/:id
router.delete('/:id', requireRole('admin'), captureOldValues('Department'), createAuditMiddleware('delete', 'Department'), departmentController.remove);

// GET /api/departments/:id/members
router.get('/:id/members', departmentController.getMembers);

// POST /api/departments/:id/members
router.post('/:id/members', requireRole('admin', 'lab_head', 'dept_head'), [
  body('userId').isInt().withMessage('Valid user ID is required'),
], createAuditMiddleware('create', 'DepartmentUser'), departmentController.addMember);

// DELETE /api/departments/:id/members/:userId
router.delete('/:id/members/:userId', requireRole('admin', 'lab_head', 'dept_head'), createAuditMiddleware('delete', 'DepartmentUser'), departmentController.removeMember);

module.exports = router;
