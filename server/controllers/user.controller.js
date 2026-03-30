const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const User = db.User;

// GET / - List all users (admin only)
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive, locationId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (locationId) where.locationId = locationId;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{
        model: db.DepartmentUser,
        as: 'departmentAssignments',
        include: [{ model: db.Department, as: 'department' }],
      }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return paginated(res, rows, page, limit, count, 'Users retrieved successfully.');
  } catch (err) {
    console.error('Get users error:', err);
    return error(res, 'Failed to retrieve users.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
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
    console.error('Get user error:', err);
    return error(res, 'Failed to retrieve user.', 500);
  }
};

// POST / - Create user (admin only)
const create = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, role } = req.body;

    // Check existing
    const existing = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existing) {
      return error(res, 'Username or email already exists.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      phone,
      role: role || 'analyst',
    });

    const userData = user.toJSON();
    delete userData.password;

    return success(res, userData, 'User created successfully.', 201);
  } catch (err) {
    console.error('Create user error:', err);
    return error(res, 'Failed to create user.', 500);
  }
};

// PUT /:id - Update user (admin only)
const update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return error(res, 'User not found.', 404);
    }

    const { password, ...updateData } = req.body;

    // If password is being updated, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    await user.update(updateData);

    const userData = user.toJSON();
    delete userData.password;

    return success(res, userData, 'User updated successfully.');
  } catch (err) {
    console.error('Update user error:', err);
    return error(res, 'Failed to update user.', 500);
  }
};

// DELETE /:id - Soft delete
const remove = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return error(res, 'User not found.', 404);
    }

    await user.update({ isActive: false });

    return success(res, null, 'User deactivated successfully.');
  } catch (err) {
    console.error('Delete user error:', err);
    return error(res, 'Failed to deactivate user.', 500);
  }
};

// GET /:id/departments
const getUserDepartments = async (req, res) => {
  try {
    const departments = await db.DepartmentUser.findAll({
      where: { userId: req.params.id },
      include: [{ model: db.Department, as: 'department' }],
    });

    return success(res, departments, 'User departments retrieved successfully.');
  } catch (err) {
    console.error('Get user departments error:', err);
    return error(res, 'Failed to retrieve user departments.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove, getUserDepartments };
