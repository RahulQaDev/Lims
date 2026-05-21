const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const roleController = require('../controllers/role.controller');

// All routes require authentication
router.use(authenticate);

// GET /api/roles — list all roles (any authenticated user)
router.get('/', roleController.getAll);

// PUT /api/roles/matrix — bulk-save permission matrix (admin only)
// NOTE: must be before /:id to avoid matching "matrix" as an id
router.put('/matrix', requireRole('admin'), roleController.saveMatrix);

// GET /api/roles/:id — single role detail
router.get('/:id', roleController.getById);

// POST /api/roles — create custom role (admin only)
router.post('/', requireRole('admin'), roleController.create);

// PUT /api/roles/:id — update role (admin only)
router.put('/:id', requireRole('admin'), roleController.update);

// DELETE /api/roles/:id — delete custom role (admin only)
router.delete('/:id', requireRole('admin'), roleController.remove);

module.exports = router;
