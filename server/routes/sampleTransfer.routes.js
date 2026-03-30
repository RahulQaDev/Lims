const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/sampleTransfer.controller');

router.use(authenticate);
router.get('/stats', ctrl.getStats);
router.get('/incoming', ctrl.getIncoming);
router.get('/outgoing', ctrl.getOutgoing);
router.get('/:id', ctrl.getById);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id/approve', ctrl.approve);
router.put('/:id/in-transit', ctrl.markInTransit);
router.put('/:id/receive', ctrl.receive);
router.put('/:id/reject', ctrl.reject);
router.put('/:id/cancel', ctrl.cancel);

module.exports = router;
