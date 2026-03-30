const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

// GET /api/dashboard/recent-samples
router.get('/recent-samples', dashboardController.getRecentSamples);

// GET /api/dashboard/department-workload
router.get('/department-workload', dashboardController.getDepartmentWorkload);

// GET /api/dashboard/revenue-summary
router.get('/revenue-summary', dashboardController.getRevenueSummary);

module.exports = router;
