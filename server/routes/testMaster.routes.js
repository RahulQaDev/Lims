const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const testMasterController = require('../controllers/testMaster.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const { createAuditMiddleware, captureOldValues } = require('../middleware/auditLog');

router.use(authenticate);

// GET /api/tests
router.get('/', testMasterController.getAll);

// GET /api/tests/:id
router.get('/:id', testMasterController.getById);

// POST /api/tests
router.post('/', requireRole('admin', 'lab_head', 'dept_head'), [
  body('name').notEmpty().withMessage('Test name is required'),
], createAuditMiddleware('create', 'TestMaster'), testMasterController.create);

// PUT /api/tests/:id
router.put('/:id', requireRole('admin', 'lab_head', 'dept_head'), [
  body('name').optional().notEmpty().withMessage('Test name cannot be empty'),
], captureOldValues('TestMaster'), createAuditMiddleware('update', 'TestMaster'), testMasterController.update);

// DELETE /api/tests/:id
router.delete('/:id', requireRole('admin', 'lab_head'), captureOldValues('TestMaster'), createAuditMiddleware('delete', 'TestMaster'), testMasterController.remove);

// POST /api/tests/:id/parameters
router.post('/:id/parameters', requireRole('admin', 'lab_head', 'dept_head'), [
  body('parameterName').notEmpty().withMessage('Parameter name is required'),
], createAuditMiddleware('create', 'TestParameter'), testMasterController.addParameter);

// PUT /api/tests/parameters/:paramId
router.put('/parameters/:paramId', requireRole('admin', 'lab_head', 'dept_head'), captureOldValues('TestParameter'), createAuditMiddleware('update', 'TestParameter'), testMasterController.updateParameter);

// DELETE /api/tests/parameters/:paramId
router.delete('/parameters/:paramId', requireRole('admin', 'lab_head', 'dept_head'), createAuditMiddleware('delete', 'TestParameter'), testMasterController.deleteParameter);

module.exports = router;
