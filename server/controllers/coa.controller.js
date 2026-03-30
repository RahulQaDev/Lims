const { Op } = require('sequelize');
const crypto = require('crypto');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Coa = db.Coa;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { reportNumber: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;

    const { count, rows } = await Coa.findAndCountAll({
      where,
      include: [
        {
          model: db.Booking, as: 'booking',
          attributes: ['id', 'reportNumber'],
          include: [{ model: db.Sample, as: 'sample', attributes: ['id', 'sampleCode', 'description'], include: [{ model: db.Client, as: 'client', attributes: ['id', 'name'] }] }],
        },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['generatedDate', 'DESC']],
    });

    return paginated(res, rows, page, limit, count, 'CoAs retrieved successfully.');
  } catch (err) {
    console.error('Get CoAs error:', err);
    return error(res, 'Failed to retrieve CoAs.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const coa = await Coa.findByPk(req.params.id, {
      include: [
        {
          model: db.Booking, as: 'booking',
          include: [
            {
              model: db.Sample, as: 'sample',
              include: [{ model: db.Client, as: 'client' }, { model: db.ProductType, as: 'productType' }],
            },
            { model: db.Standard, as: 'standard' },
            {
              model: db.BookingTest, as: 'bookingTests',
              include: [
                { model: db.TestMaster, as: 'testMaster' },
                {
                  model: db.Result, as: 'result',
                  include: [{ model: db.ResultParameter, as: 'parameters' }],
                },
              ],
            },
          ],
        },
        { model: db.CoaTemplate, as: 'template' },
      ],
    });

    if (!coa) {
      return error(res, 'CoA not found.', 404);
    }

    return success(res, coa, 'CoA retrieved successfully.');
  } catch (err) {
    console.error('Get CoA error:', err);
    return error(res, 'Failed to retrieve CoA.', 500);
  }
};

// POST /generate/:bookingId
const generate = async (req, res) => {
  try {
    const booking = await db.Booking.findByPk(req.params.bookingId, {
      include: [
        { model: db.Sample, as: 'sample' },
        {
          model: db.BookingTest, as: 'bookingTests',
          include: [{ model: db.Result, as: 'result' }],
        },
      ],
    });

    if (!booking) {
      return error(res, 'Booking not found.', 404);
    }

    if (booking.status !== 'completed') {
      return error(res, 'Booking must be completed before generating CoA.', 400);
    }

    // Check all tests are approved
    const unapproved = booking.bookingTests.filter(bt => bt.status !== 'approved');
    if (unapproved.length > 0) {
      return error(res, 'All tests must be approved before generating CoA.', 400);
    }

    // Check if CoA already exists for this booking
    const existing = await Coa.findOne({ where: { bookingId: booking.id, status: { [Op.ne]: 'cancelled' } } });
    if (existing) {
      return error(res, 'CoA already exists for this booking.', 400);
    }

    // Generate verification code
    const verificationCode = crypto.randomBytes(16).toString('hex').toUpperCase();

    const coa = await Coa.create({
      bookingId: booking.id,
      sampleId: booking.sampleId,
      templateId: req.body.templateId || null,
      reportNumber: booking.reportNumber,
      verificationCode,
    });

    // Update sample status
    await booking.sample.update({ status: 'coa_generated' });

    const fullCoa = await Coa.findByPk(coa.id, {
      include: [
        { model: db.Booking, as: 'booking', include: [{ model: db.Sample, as: 'sample', include: [{ model: db.Client, as: 'client' }] }] },
      ],
    });

    return success(res, fullCoa, 'CoA generated successfully.', 201);
  } catch (err) {
    console.error('Generate CoA error:', err);
    return error(res, 'Failed to generate CoA.', 500);
  }
};

// GET /verify/:verificationCode - Public endpoint
const verify = async (req, res) => {
  try {
    const coa = await Coa.findOne({
      where: { verificationCode: req.params.verificationCode },
      include: [
        {
          model: db.Booking, as: 'booking',
          attributes: ['id', 'reportNumber', 'bookingDate'],
          include: [
            {
              model: db.Sample, as: 'sample',
              attributes: ['id', 'sampleCode', 'description'],
              include: [{ model: db.Client, as: 'client', attributes: ['id', 'name'] }],
            },
          ],
        },
      ],
    });

    if (!coa) {
      return error(res, 'Invalid verification code. CoA not found.', 404);
    }

    return success(res, {
      valid: true,
      reportNumber: coa.reportNumber,
      generatedDate: coa.generatedDate,
      status: coa.status,
      booking: coa.booking,
    }, 'CoA verified successfully.');
  } catch (err) {
    console.error('Verify CoA error:', err);
    return error(res, 'Failed to verify CoA.', 500);
  }
};

module.exports = { getAll, getById, generate, verify };
