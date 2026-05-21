const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/masterDashboard.controller');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/recent-activity', ctrl.getRecentActivity);
router.get('/kpis', ctrl.getKpisAndKras);
router.get('/alerts', ctrl.getAlerts);
router.get('/data-quality', ctrl.getDataQuality);

module.exports = router;
