const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/analystDashboard.controller');

// All endpoints auto-scoped to authenticated user — no manual filtering needed
router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/work-queue', ctrl.getWorkQueue);
router.get('/kpis', ctrl.getKpisAndKras);
router.get('/recent-results', ctrl.getRecentResults);
router.get('/oos-alerts', ctrl.getOosAlerts);
router.get('/equipment', ctrl.getEquipment);
router.get('/consumable-alerts', ctrl.getConsumableAlerts);

module.exports = router;
