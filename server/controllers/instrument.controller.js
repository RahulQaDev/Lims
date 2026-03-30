const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Instrument = db.Instrument;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, departmentId, status, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { make: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await Instrument.findAndCountAll({
      where,
      include: [{ model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['name', 'ASC']],
    });

    return paginated(res, rows, page, limit, count, 'Instruments retrieved successfully.');
  } catch (err) {
    console.error('Get instruments error:', err);
    return error(res, 'Failed to retrieve instruments.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const instrument = await Instrument.findByPk(req.params.id, {
      include: [{ model: db.Department, as: 'department' }],
    });

    if (!instrument) {
      return error(res, 'Instrument not found.', 404);
    }

    return success(res, instrument, 'Instrument retrieved successfully.');
  } catch (err) {
    console.error('Get instrument error:', err);
    return error(res, 'Failed to retrieve instrument.', 500);
  }
};

// POST /
const create = async (req, res) => {
  try {
    const instrument = await Instrument.create(req.body);
    return success(res, instrument, 'Instrument created successfully.', 201);
  } catch (err) {
    console.error('Create instrument error:', err);
    return error(res, 'Failed to create instrument.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const instrument = await Instrument.findByPk(req.params.id);
    if (!instrument) {
      return error(res, 'Instrument not found.', 404);
    }
    await instrument.update(req.body);
    return success(res, instrument, 'Instrument updated successfully.');
  } catch (err) {
    console.error('Update instrument error:', err);
    return error(res, 'Failed to update instrument.', 500);
  }
};

// DELETE /:id
const remove = async (req, res) => {
  try {
    const instrument = await Instrument.findByPk(req.params.id);
    if (!instrument) {
      return error(res, 'Instrument not found.', 404);
    }
    await instrument.update({ isActive: false });
    return success(res, null, 'Instrument deactivated successfully.');
  } catch (err) {
    console.error('Delete instrument error:', err);
    return error(res, 'Failed to deactivate instrument.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove };
