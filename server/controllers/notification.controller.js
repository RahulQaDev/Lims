const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Notification = db.Notification;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, isRead } = req.query;
    const offset = (page - 1) * limit;

    const where = { userId: req.userId };
    if (category && category !== 'all') where.category = category;
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const { count, rows } = await Notification.findAndCountAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return paginated(res, rows, page, limit, count, 'Notifications retrieved successfully.');
  } catch (err) {
    console.error('Get notifications error:', err);
    return error(res, 'Failed to retrieve notifications.', 500);
  }
};

// PUT /:id/read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!notification) {
      return error(res, 'Notification not found.', 404);
    }

    await notification.update({ isRead: true, readAt: new Date() });
    return success(res, notification, 'Notification marked as read.');
  } catch (err) {
    console.error('Mark as read error:', err);
    return error(res, 'Failed to mark notification as read.', 500);
  }
};

// PUT /read-all
const markAllAsRead = async (req, res) => {
  try {
    const where = { userId: req.userId, isRead: false };
    if (req.body.category && req.body.category !== 'all') {
      where.category = req.body.category;
    }

    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where }
    );

    return success(res, null, 'All notifications marked as read.');
  } catch (err) {
    console.error('Mark all as read error:', err);
    return error(res, 'Failed to mark all notifications as read.', 500);
  }
};

// GET /unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.userId, isRead: false },
    });

    return success(res, { count }, 'Unread count retrieved successfully.');
  } catch (err) {
    console.error('Get unread count error:', err);
    return error(res, 'Failed to retrieve unread count.', 500);
  }
};

// GET /stats - unread count by category
const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.findAll({
      where: { userId: req.userId, isRead: false },
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['category'],
      raw: true,
    });

    const totalUnread = await Notification.count({
      where: { userId: req.userId, isRead: false },
    });

    const totalCount = await Notification.count({
      where: { userId: req.userId },
    });

    // Build category map
    const byCategory = {};
    const categories = ['sample', 'booking', 'result', 'review', 'coa', 'invoice', 'inventory', 'system'];
    categories.forEach(cat => { byCategory[cat] = 0; });
    stats.forEach(s => { byCategory[s.category] = parseInt(s.count); });

    return success(res, {
      totalUnread,
      totalCount,
      byCategory,
    }, 'Notification stats retrieved successfully.');
  } catch (err) {
    console.error('Get notification stats error:', err);
    return error(res, 'Failed to retrieve notification stats.', 500);
  }
};

// GET /preferences
const getPreferences = async (req, res) => {
  try {
    let pref = await db.NotificationPreference.findOne({
      where: { userId: req.userId },
    });

    if (!pref) {
      // Return defaults
      pref = {
        userId: req.userId,
        preferences: {
          sample: { inApp: true, email: true },
          booking: { inApp: true, email: false },
          result: { inApp: true, email: true },
          review: { inApp: true, email: true },
          coa: { inApp: true, email: true },
          invoice: { inApp: true, email: false },
          inventory: { inApp: true, email: false },
          system: { inApp: true, email: false },
        },
      };
    }

    return success(res, pref, 'Preferences retrieved successfully.');
  } catch (err) {
    console.error('Get preferences error:', err);
    return error(res, 'Failed to retrieve preferences.', 500);
  }
};

// PUT /preferences
const updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return error(res, 'Invalid preferences data.', 400);
    }

    const [pref, created] = await db.NotificationPreference.findOrCreate({
      where: { userId: req.userId },
      defaults: { userId: req.userId, preferences },
    });

    if (!created) {
      await pref.update({ preferences });
    }

    return success(res, pref, 'Preferences updated successfully.');
  } catch (err) {
    console.error('Update preferences error:', err);
    return error(res, 'Failed to update preferences.', 500);
  }
};

// DELETE /:id
const remove = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!notification) {
      return error(res, 'Notification not found.', 404);
    }

    await notification.destroy();
    return success(res, null, 'Notification deleted successfully.');
  } catch (err) {
    console.error('Delete notification error:', err);
    return error(res, 'Failed to delete notification.', 500);
  }
};

module.exports = {
  getAll,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getNotificationStats,
  getPreferences,
  updatePreferences,
  remove,
};
