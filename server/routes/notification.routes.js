const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/notifications/unread-count (must be before /:id)
router.get('/unread-count', notificationController.getUnreadCount);

// GET /api/notifications/stats
router.get('/stats', notificationController.getNotificationStats);

// GET /api/notifications/preferences
router.get('/preferences', notificationController.getPreferences);

// PUT /api/notifications/preferences
router.put('/preferences', notificationController.updatePreferences);

// GET /api/notifications
router.get('/', notificationController.getAll);

// PUT /api/notifications/read-all (must be before /:id)
router.put('/read-all', notificationController.markAllAsRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', notificationController.remove);

module.exports = router;
