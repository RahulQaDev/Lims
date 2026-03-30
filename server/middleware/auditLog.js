const createAuditMiddleware = (action, entity) => {
  return async (req, res, next) => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Only log successful mutations
      if (body && body.success && ['create', 'update', 'delete'].includes(action)) {
        const logEntry = {
          userId: req.userId || null,
          action,
          entity,
          entityId: req.params.id || body.data?.id || null,
          oldValues: req._auditOldValues || null,
          newValues: action === 'delete' ? null : (req.body || null),
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'] || null,
        };

        // Fire and forget - don't block response
        const db = require('../models');
        db.AuditLog.create(logEntry).catch(err => {
          console.error('Audit log error:', err.message);
        });
      }

      return originalJson(body);
    };

    next();
  };
};

// Middleware to capture old values before update/delete
const captureOldValues = (model) => {
  return async (req, res, next) => {
    try {
      if (req.params.id) {
        const db = require('../models');
        const record = await db[model].findByPk(req.params.id, { raw: true });
        req._auditOldValues = record;
      }
    } catch (err) {
      console.error('Capture old values error:', err.message);
    }
    next();
  };
};

// Direct audit log creation for custom actions
const logAudit = async (userId, action, entity, entityId, details = {}) => {
  try {
    const db = require('../models');
    await db.AuditLog.create({
      userId,
      action,
      entity,
      entityId: entityId?.toString(),
      oldValues: details.oldValues || null,
      newValues: details.newValues || null,
      ipAddress: details.ipAddress || null,
      userAgent: details.userAgent || null,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditMiddleware, captureOldValues, logAudit };
