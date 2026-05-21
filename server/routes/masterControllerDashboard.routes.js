const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/masterControllerDashboard.controller');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/approval-queue', ctrl.getApprovalQueue);
router.get('/kpis', ctrl.getKpisAndKras);
router.get('/alerts', ctrl.getAlerts);
router.get('/recent-activity', ctrl.getRecentActivity);

module.exports = router;
