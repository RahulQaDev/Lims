const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/outsource.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/labs', ctrl.getLabs);
router.post('/labs', requireRole('admin', 'lab_head', 'purchase'), ctrl.createLab);
router.get('/pending-tests', ctrl.getPendingTests);
router.get('/', ctrl.getAll);
router.post('/send', requireRole('admin', 'lab_head', 'dept_head'), ctrl.send);
router.put('/:id/results', ctrl.updateResults);
router.put('/:id/cancel', requireRole('admin', 'lab_head', 'dept_head'), ctrl.cancel);

module.exports = router;
