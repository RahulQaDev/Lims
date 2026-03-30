const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Department = db.Department;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await Department.findAndCountAll({
      where,
      include: [{ model: db.User, as: 'head', attributes: ['id', 'fullName', 'email'] }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['name', 'ASC']],
    });

    return paginated(res, rows, page, limit, count, 'Departments retrieved successfully.');
  } catch (err) {
    console.error('Get departments error:', err);
    return error(res, 'Failed to retrieve departments.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [
        { model: db.User, as: 'head', attributes: ['id', 'fullName', 'email'] },
        {
          model: db.DepartmentUser,
          as: 'members',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'fullName', 'email', 'role'] }],
        },
      ],
    });

    if (!department) {
      return error(res, 'Department not found.', 404);
    }

    return success(res, department, 'Department retrieved successfully.');
  } catch (err) {
    console.error('Get department error:', err);
    return error(res, 'Failed to retrieve department.', 500);
  }
};

// POST /
const create = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    return success(res, department, 'Department created successfully.', 201);
  } catch (err) {
    console.error('Create department error:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return error(res, 'Department name or code already exists.', 400);
    }
    return error(res, 'Failed to create department.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return error(res, 'Department not found.', 404);
    }

    await department.update(req.body);
    return success(res, department, 'Department updated successfully.');
  } catch (err) {
    console.error('Update department error:', err);
    return error(res, 'Failed to update department.', 500);
  }
};

// DELETE /:id
const remove = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return error(res, 'Department not found.', 404);
    }

    await department.update({ isActive: false });
    return success(res, null, 'Department deactivated successfully.');
  } catch (err) {
    console.error('Delete department error:', err);
    return error(res, 'Failed to deactivate department.', 500);
  }
};

// GET /:id/members
const getMembers = async (req, res) => {
  try {
    const members = await db.DepartmentUser.findAll({
      where: { departmentId: req.params.id },
      include: [{ model: db.User, as: 'user', attributes: ['id', 'fullName', 'email', 'role', 'isActive'] }],
    });

    return success(res, members, 'Department members retrieved successfully.');
  } catch (err) {
    console.error('Get members error:', err);
    return error(res, 'Failed to retrieve department members.', 500);
  }
};

// POST /:id/members
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return error(res, 'Department not found.', 404);
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      return error(res, 'User not found.', 404);
    }

    const existing = await db.DepartmentUser.findOne({
      where: { departmentId: req.params.id, userId },
    });
    if (existing) {
      return error(res, 'User is already a member of this department.', 400);
    }

    const member = await db.DepartmentUser.create({
      departmentId: parseInt(req.params.id),
      userId,
      role: role || 'member',
    });

    return success(res, member, 'Member added successfully.', 201);
  } catch (err) {
    console.error('Add member error:', err);
    return error(res, 'Failed to add member.', 500);
  }
};

// DELETE /:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const member = await db.DepartmentUser.findOne({
      where: { departmentId: req.params.id, userId: req.params.userId },
    });

    if (!member) {
      return error(res, 'Member not found in this department.', 404);
    }

    await member.destroy();
    return success(res, null, 'Member removed successfully.');
  } catch (err) {
    console.error('Remove member error:', err);
    return error(res, 'Failed to remove member.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove, getMembers, addMember, removeMember };
