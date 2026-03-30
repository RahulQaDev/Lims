const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lazy-load to avoid circular dependency
    const db = require('../models');
    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: db.DepartmentUser,
        as: 'departmentAssignments',
        include: [{ model: db.Department, as: 'department' }],
      }],
    });

    if (!user || !user.isActive) {
      return error(res, 'User not found or inactive.', 401);
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired. Please login again.', 401);
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 'Invalid token.', 401);
    }
    return error(res, 'Authentication failed.', 500);
  }
};

// Check if user has one of the required roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }
    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());
    if (!allowedRoles.includes(userRole)) {
      return error(res, 'Access denied. Insufficient role.', 403);
    }
    next();
  };
};

// Check if user belongs to one of the required departments
const requireDepartment = (...departmentCodes) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }
    if (req.user.role === 'admin' || req.user.role === 'lab_head') {
      return next(); // Admin and lab head have access to all departments
    }
    const userDepartments = req.user.departmentAssignments?.map(da => da.department?.code) || [];
    const hasAccess = departmentCodes.some(code => userDepartments.includes(code));
    if (!hasAccess) {
      return error(res, 'Access denied. Department access required.', 403);
    }
    next();
  };
};

// Check specific permission (extensible)
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }
    // Admin always has all permissions
    if (req.user.role === 'admin' || req.user.role === 'lab_head') {
      return next();
    }
    // For now, permission check is role-based; can be extended to granular permissions table
    const rolePermissions = {
      dept_head: ['manage_department', 'assign_work', 'view_reports', 'review_results'],
      analyst: ['enter_results', 'view_assigned'],
      reviewer: ['review_results', 'reject_results'],
      approver: ['approve_results', 'review_results', 'generate_coa'],
      booking: ['create_booking', 'edit_booking', 'view_samples'],
      reception: ['receive_samples', 'print_labels'],
      customer_coordinator: ['view_clients', 'view_samples', 'view_coa'],
      accounts: ['manage_invoices', 'view_payments'],
      marketing: ['view_clients', 'view_reports'],
      purchase: ['manage_inventory', 'create_po'],
      hr: ['manage_employees'],
      qa: ['view_audit', 'manage_instruments'],
    };

    const userPerms = rolePermissions[req.user.role] || [];
    if (!userPerms.includes(permission)) {
      return error(res, `Access denied. '${permission}' permission required.`, 403);
    }
    next();
  };
};

module.exports = { authenticate, requireRole, requireDepartment, requirePermission };
