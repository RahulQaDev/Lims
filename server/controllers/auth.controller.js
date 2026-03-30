const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const db = require('../models');
const { success, error } = require('../utils/response');
const { logAudit } = require('../middleware/auditLog');

const User = db.User;

// POST /login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, 'Username and password are required.', 400);
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email: username }],
        isActive: true,
      },
      include: [{
        model: db.DepartmentUser,
        as: 'departmentAssignments',
        include: [{ model: db.Department, as: 'department' }],
      }],
    });

    if (!user) {
      return error(res, 'Invalid credentials.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 'Invalid credentials.', 401);
    }

    // Update lastLogin
    await user.update({ lastLogin: new Date() });

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    const userData = user.toJSON();
    delete userData.password;

    await logAudit(user.id, 'login', 'User', user.id, { ipAddress: req.ip });

    return success(res, { token, user: userData }, 'Login successful.');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed.', 500);
  }
};

// POST /logout
const logout = async (req, res) => {
  try {
    await logAudit(req.userId, 'logout', 'User', req.userId, { ipAddress: req.ip });
    return success(res, null, 'Logout successful.');
  } catch (err) {
    console.error('Logout error:', err);
    return error(res, 'Logout failed.', 500);
  }
};

// GET /me
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: db.DepartmentUser,
        as: 'departmentAssignments',
        include: [{ model: db.Department, as: 'department' }],
      }],
    });

    if (!user) {
      return error(res, 'User not found.', 404);
    }

    return success(res, user, 'User retrieved successfully.');
  } catch (err) {
    console.error('Get me error:', err);
    return error(res, 'Failed to retrieve user.', 500);
  }
};

// PUT /change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return error(res, 'Current password and new password are required.', 400);
    }

    if (newPassword.length < 6) {
      return error(res, 'New password must be at least 6 characters.', 400);
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return error(res, 'User not found.', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return error(res, 'Current password is incorrect.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });

    await logAudit(req.userId, 'update', 'User', req.userId, {
      ipAddress: req.ip,
      newValues: { action: 'password_change' },
    });

    return success(res, null, 'Password changed successfully.');
  } catch (err) {
    console.error('Change password error:', err);
    return error(res, 'Failed to change password.', 500);
  }
};

module.exports = { login, logout, getMe, changePassword };
