const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const TestMaster = db.TestMaster;
const TestParameter = db.TestParameter;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, departmentId, standardId, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (standardId) where.standardId = standardId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await TestMaster.findAndCountAll({
      where,
      include: [
        { model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: db.Standard, as: 'standard', attributes: ['id', 'name', 'code'] },
        { model: TestParameter, as: 'parameters' },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['name', 'ASC']],
      distinct: true,
    });

    return paginated(res, rows, page, limit, count, 'Tests retrieved successfully.');
  } catch (err) {
    console.error('Get tests error:', err);
    return error(res, 'Failed to retrieve tests.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const test = await TestMaster.findByPk(req.params.id, {
      include: [
        { model: db.Department, as: 'department' },
        { model: db.Standard, as: 'standard' },
        { model: TestParameter, as: 'parameters', order: [['sortOrder', 'ASC']] },
      ],
    });

    if (!test) {
      return error(res, 'Test not found.', 404);
    }

    return success(res, test, 'Test retrieved successfully.');
  } catch (err) {
    console.error('Get test error:', err);
    return error(res, 'Failed to retrieve test.', 500);
  }
};

// POST /
const create = async (req, res) => {
  try {
    const test = await TestMaster.create(req.body);
    return success(res, test, 'Test created successfully.', 201);
  } catch (err) {
    console.error('Create test error:', err);
    return error(res, 'Failed to create test.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const test = await TestMaster.findByPk(req.params.id);
    if (!test) {
      return error(res, 'Test not found.', 404);
    }
    await test.update(req.body);
    return success(res, test, 'Test updated successfully.');
  } catch (err) {
    console.error('Update test error:', err);
    return error(res, 'Failed to update test.', 500);
  }
};

// DELETE /:id
const remove = async (req, res) => {
  try {
    const test = await TestMaster.findByPk(req.params.id);
    if (!test) {
      return error(res, 'Test not found.', 404);
    }
    await test.update({ isActive: false });
    return success(res, null, 'Test deactivated successfully.');
  } catch (err) {
    console.error('Delete test error:', err);
    return error(res, 'Failed to deactivate test.', 500);
  }
};

// POST /:id/parameters
const addParameter = async (req, res) => {
  try {
    const test = await TestMaster.findByPk(req.params.id);
    if (!test) {
      return error(res, 'Test not found.', 404);
    }

    const parameter = await TestParameter.create({
      ...req.body,
      testMasterId: parseInt(req.params.id),
    });

    return success(res, parameter, 'Parameter added successfully.', 201);
  } catch (err) {
    console.error('Add parameter error:', err);
    return error(res, 'Failed to add parameter.', 500);
  }
};

// PUT /parameters/:paramId
const updateParameter = async (req, res) => {
  try {
    const parameter = await TestParameter.findByPk(req.params.paramId);
    if (!parameter) {
      return error(res, 'Parameter not found.', 404);
    }
    await parameter.update(req.body);
    return success(res, parameter, 'Parameter updated successfully.');
  } catch (err) {
    console.error('Update parameter error:', err);
    return error(res, 'Failed to update parameter.', 500);
  }
};

// DELETE /parameters/:paramId
const deleteParameter = async (req, res) => {
  try {
    const parameter = await TestParameter.findByPk(req.params.paramId);
    if (!parameter) {
      return error(res, 'Parameter not found.', 404);
    }
    await parameter.destroy();
    return success(res, null, 'Parameter deleted successfully.');
  } catch (err) {
    console.error('Delete parameter error:', err);
    return error(res, 'Failed to delete parameter.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove, addParameter, updateParameter, deleteParameter };
