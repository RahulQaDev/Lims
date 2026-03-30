const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const RateMaster = db.RateMaster;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, testMasterId, clientId, standardId, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (testMasterId) where.testMasterId = testMasterId;
    if (clientId) where.clientId = clientId;
    if (standardId) where.standardId = standardId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await RateMaster.findAndCountAll({
      where,
      include: [
        { model: db.TestMaster, as: 'testMaster', attributes: ['id', 'name', 'code'] },
        { model: db.Client, as: 'client', attributes: ['id', 'name', 'code'] },
        { model: db.Standard, as: 'standard', attributes: ['id', 'name', 'code'] },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return paginated(res, rows, page, limit, count, 'Rate masters retrieved successfully.');
  } catch (err) {
    console.error('Get rate masters error:', err);
    return error(res, 'Failed to retrieve rate masters.', 500);
  }
};

// GET /lookup
const lookup = async (req, res) => {
  try {
    const { testMasterId, clientId, standardId } = req.query;

    if (!testMasterId) {
      return error(res, 'Test master ID is required.', 400);
    }

    // Try client+standard specific, then client-only, then standard-only, then default
    const conditions = [];
    if (clientId && standardId) {
      conditions.push({ testMasterId, clientId, standardId, isActive: true });
    }
    if (clientId) {
      conditions.push({ testMasterId, clientId, standardId: null, isActive: true });
    }
    if (standardId) {
      conditions.push({ testMasterId, clientId: null, standardId, isActive: true });
    }
    conditions.push({ testMasterId, clientId: null, standardId: null, isActive: true });

    let rate = null;
    for (const condition of conditions) {
      rate = await RateMaster.findOne({
        where: condition,
        include: [
          { model: db.TestMaster, as: 'testMaster', attributes: ['id', 'name', 'code', 'price'] },
        ],
      });
      if (rate) break;
    }

    if (!rate) {
      // Fall back to test master price
      const testMaster = await db.TestMaster.findByPk(testMasterId, { attributes: ['id', 'name', 'price'] });
      if (testMaster) {
        return success(res, { price: testMaster.price, source: 'test_master', testMaster }, 'Rate found from test master default.');
      }
      return error(res, 'No rate found for the given combination.', 404);
    }

    return success(res, rate, 'Rate found successfully.');
  } catch (err) {
    console.error('Lookup rate error:', err);
    return error(res, 'Failed to lookup rate.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const rate = await RateMaster.findByPk(req.params.id, {
      include: [
        { model: db.TestMaster, as: 'testMaster' },
        { model: db.Client, as: 'client' },
        { model: db.Standard, as: 'standard' },
      ],
    });

    if (!rate) {
      return error(res, 'Rate not found.', 404);
    }

    return success(res, rate, 'Rate retrieved successfully.');
  } catch (err) {
    console.error('Get rate error:', err);
    return error(res, 'Failed to retrieve rate.', 500);
  }
};

// POST /
const create = async (req, res) => {
  try {
    const rate = await RateMaster.create(req.body);
    return success(res, rate, 'Rate created successfully.', 201);
  } catch (err) {
    console.error('Create rate error:', err);
    return error(res, 'Failed to create rate.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const rate = await RateMaster.findByPk(req.params.id);
    if (!rate) {
      return error(res, 'Rate not found.', 404);
    }
    await rate.update(req.body);
    return success(res, rate, 'Rate updated successfully.');
  } catch (err) {
    console.error('Update rate error:', err);
    return error(res, 'Failed to update rate.', 500);
  }
};

// DELETE /:id
const remove = async (req, res) => {
  try {
    const rate = await RateMaster.findByPk(req.params.id);
    if (!rate) {
      return error(res, 'Rate not found.', 404);
    }
    await rate.update({ isActive: false });
    return success(res, null, 'Rate deactivated successfully.');
  } catch (err) {
    console.error('Delete rate error:', err);
    return error(res, 'Failed to deactivate rate.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove, lookup };
