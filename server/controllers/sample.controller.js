const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Sample = db.Sample;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, clientId, priority, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { sampleCode: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { batchNumber: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (priority) where.priority = priority;
    if (dateFrom || dateTo) {
      where.receivedDate = {};
      if (dateFrom) where.receivedDate[Op.gte] = dateFrom;
      if (dateTo) where.receivedDate[Op.lte] = dateTo;
    }

    const { count, rows } = await Sample.findAndCountAll({
      where,
      include: [
        { model: db.Client, as: 'client', attributes: ['id', 'name', 'code'] },
        { model: db.ProductType, as: 'productType', attributes: ['id', 'name'] },
        { model: db.User, as: 'receivedByUser', attributes: ['id', 'fullName'] },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return paginated(res, rows, page, limit, count, 'Samples retrieved successfully.');
  } catch (err) {
    console.error('Get samples error:', err);
    return error(res, 'Failed to retrieve samples.', 500);
  }
};

// GET /stats/summary
const getStatsSummary = async (req, res) => {
  try {
    const statuses = ['received', 'booked', 'in_testing', 'under_review', 'approved', 'coa_generated', 'dispatched', 'archived'];
    const stats = {};

    for (const status of statuses) {
      stats[status] = await Sample.count({ where: { status } });
    }

    stats.total = await Sample.count();

    return success(res, stats, 'Sample statistics retrieved successfully.');
  } catch (err) {
    console.error('Get sample stats error:', err);
    return error(res, 'Failed to retrieve sample statistics.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const sample = await Sample.findByPk(req.params.id, {
      include: [
        { model: db.Client, as: 'client' },
        { model: db.ProductType, as: 'productType' },
        { model: db.User, as: 'receivedByUser', attributes: ['id', 'fullName'] },
        { model: db.SampleReception, as: 'receptions', include: [{ model: db.User, as: 'receivedByUser', attributes: ['id', 'fullName'] }] },
        {
          model: db.Booking, as: 'bookings',
          include: [
            { model: db.Standard, as: 'standard', attributes: ['id', 'name', 'code'] },
            { model: db.User, as: 'bookedByUser', attributes: ['id', 'fullName'] },
            {
              model: db.BookingTest, as: 'bookingTests',
              include: [{ model: db.TestMaster, as: 'testMaster', attributes: ['id', 'name', 'code'] }],
            },
          ],
        },
      ],
    });

    if (!sample) {
      return error(res, 'Sample not found.', 404);
    }

    return success(res, sample, 'Sample retrieved successfully.');
  } catch (err) {
    console.error('Get sample error:', err);
    return error(res, 'Failed to retrieve sample.', 500);
  }
};

// POST /
const create = async (req, res) => {
  try {
    const sampleData = {
      ...req.body,
      receivedBy: req.userId,
      receivedDate: req.body.receivedDate || new Date(),
    };

    const sample = await Sample.create(sampleData);

    return success(res, sample, 'Sample created successfully.', 201);
  } catch (err) {
    console.error('Create sample error:', err);
    return error(res, 'Failed to create sample.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const sample = await Sample.findByPk(req.params.id);
    if (!sample) {
      return error(res, 'Sample not found.', 404);
    }
    await sample.update(req.body);
    return success(res, sample, 'Sample updated successfully.');
  } catch (err) {
    console.error('Update sample error:', err);
    return error(res, 'Failed to update sample.', 500);
  }
};

// POST /:id/reception
const addReception = async (req, res) => {
  try {
    const sample = await Sample.findByPk(req.params.id);
    if (!sample) {
      return error(res, 'Sample not found.', 404);
    }

    const reception = await db.SampleReception.create({
      ...req.body,
      sampleId: parseInt(req.params.id),
      receivedBy: req.userId,
    });

    return success(res, reception, 'Reception record added successfully.', 201);
  } catch (err) {
    console.error('Add reception error:', err);
    return error(res, 'Failed to add reception record.', 500);
  }
};

// PUT /:id/status
const updateStatus = async (req, res) => {
  try {
    const sample = await Sample.findByPk(req.params.id);
    if (!sample) {
      return error(res, 'Sample not found.', 404);
    }

    const { status } = req.body;
    if (!status) {
      return error(res, 'Status is required.', 400);
    }

    await sample.update({ status });
    return success(res, sample, 'Sample status updated successfully.');
  } catch (err) {
    console.error('Update sample status error:', err);
    return error(res, 'Failed to update sample status.', 500);
  }
};

module.exports = { getAll, getById, create, update, addReception, updateStatus, getStatsSummary };
