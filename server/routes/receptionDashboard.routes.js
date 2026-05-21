const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/receptionDashboard.controller');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/trf-queue', ctrl.getTrfQueue);
router.get('/received-samples', ctrl.getReceivedSamples);
router.get('/kpis', ctrl.getKpisAndKras);
router.get('/alerts', ctrl.getAlerts);
router.get('/recent-activity', ctrl.getRecentActivity);

module.exports = router;
