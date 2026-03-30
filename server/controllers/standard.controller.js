const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Standard = db.Standard;

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

    const { count, rows } = await Standard.findAndCountAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['name', 'ASC']],
    });

    return paginated(res, rows, page, limit, count, 'Standards retrieved successfully.');
  } catch (err) {
    console.error('Get standards error:', err);
    return error(res, 'Failed to retrieve standards.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const standard = await Standard.findByPk(req.params.id);
    if (!standard) {
      return error(res, 'Standard not found.', 404);
    }
    return success(res, standard, 'Standard retrieved successfully.');
  } catch (err) {
    console.error('Get standard error:', err);
    return error(res, 'Failed to retrieve standard.', 500);
  }
};

// POST /
const create = async (req, res) => {
  try {
    const standard = await Standard.create(req.body);
    return success(res, standard, 'Standard created successfully.', 201);
  } catch (err) {
    console.error('Create standard error:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return error(res, 'Standard code already exists.', 400);
    }
    return error(res, 'Failed to create standard.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const standard = await Standard.findByPk(req.params.id);
    if (!standard) {
      return error(res, 'Standard not found.', 404);
    }
    await standard.update(req.body);
    return success(res, standard, 'Standard updated successfully.');
  } catch (err) {
    console.error('Update standard error:', err);
    return error(res, 'Failed to update standard.', 500);
  }
};

// DELETE /:id
const remove = async (req, res) => {
  try {
    const standard = await Standard.findByPk(req.params.id);
    if (!standard) {
      return error(res, 'Standard not found.', 404);
    }
    await standard.update({ isActive: false });
    return success(res, null, 'Standard deactivated successfully.');
  } catch (err) {
    console.error('Delete standard error:', err);
    return error(res, 'Failed to deactivate standard.', 500);
  }
};

// GET /:id/tests
const getStandardTests = async (req, res) => {
  try {
    const tests = await db.TestMaster.findAll({
      where: { standardId: req.params.id, isActive: true },
      include: [
        { model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: db.TestParameter, as: 'parameters' },
      ],
      order: [['name', 'ASC']],
    });

    return success(res, tests, 'Standard tests retrieved successfully.');
  } catch (err) {
    console.error('Get standard tests error:', err);
    return error(res, 'Failed to retrieve standard tests.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove, getStandardTests };
