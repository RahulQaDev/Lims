const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookingKpi.controller');
const { authenticate } = require('../middleware/auth');

router.get('/stats', authenticate, controller.getStats);
router.get('/kra', authenticate, controller.getKraActuals);
router.get('/pending-queue', authenticate, controller.getPendingQueue);
router.get('/my-bookings', authenticate, controller.getMyBookings);

module.exports = router;
