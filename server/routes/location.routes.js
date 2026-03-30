const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/location.controller');

router.use(authenticate);
router.get('/stats', ctrl.getLocationStats);
router.get('/department-mappings', ctrl.getAllLocationDepartments);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/departments', ctrl.getDepartments);
router.post('/', requireRole('ADMIN'), ctrl.create);
router.put('/:id', requireRole('ADMIN'), ctrl.update);
router.delete('/:id', requireRole('ADMIN'), ctrl.deactivate);

module.exports = router;
