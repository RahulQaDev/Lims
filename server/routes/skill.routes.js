const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/skill.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// Matrix endpoints come before /:id
router.get('/matrix', ctrl.getMatrix);
router.put('/matrix', requireRole('admin', 'lab_head', 'dept_head', 'hr'), ctrl.updateMatrix);
router.put('/matrix/:userId/:skillId', requireRole('admin', 'lab_head', 'dept_head', 'hr'), ctrl.updateCell);

// CRUD
router.get('/', ctrl.getAll);
router.post('/', requireRole('admin', 'lab_head', 'dept_head', 'hr'), ctrl.create);
router.put('/:id', requireRole('admin', 'lab_head', 'dept_head', 'hr'), ctrl.update);
router.delete('/:id', requireRole('admin', 'lab_head'), ctrl.remove);

module.exports = router;
