const db = require('../models');
const { success, error } = require('../utils/response');

// GET /api/outsource/labs
exports.getLabs = async (req, res) => {
  try {
    const labs = await db.OutsourceLab.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
    return success(res, labs, 'Outsource labs retrieved.');
  } catch (err) {
    console.error('Get outsource labs error:', err);
    return error(res, 'Failed to fetch outsource labs.', 500);
  }
};

// POST /api/outsource/labs
exports.createLab = async (req, res) => {
  try {
    const lab = await db.OutsourceLab.create(req.body);
    return success(res, lab, 'Outsource lab created.', 201);
  } catch (err) {
    console.error('Create outsource lab error:', err);
    return error(res, 'Failed to create outsource lab.', 500);
  }
};

// GET /api/outsource/pending-tests
exports.getPendingTests = async (req, res) => {
  try {
    const tests = await db.OutsourceTest.findAll({
      where: { status: 'pending' },
      include: [
        { model: db.BookingTest, as: 'bookingTest', include: [{ model: db.Booking, as: 'booking' }] },
        { model: db.OutsourceLab, as: 'outsourceLab' },
      ],
      order: [['createdAt', 'DESC']],
    });
    return success(res, tests, 'Pending outsource tests retrieved.');
  } catch (err) {
    console.error('Get pending outsource tests error:', err);
    return error(res, 'Failed to fetch pending tests.', 500);
  }
};

// GET /api/outsource
exports.getAll = async (req, res) => {
  try {
    const tests = await db.OutsourceTest.findAll({
      include: [
        { model: db.BookingTest, as: 'bookingTest' },
        { model: db.OutsourceLab, as: 'outsourceLab' },
      ],
      order: [['createdAt', 'DESC']],
    });
    return success(res, tests, 'Outsource tests retrieved.');
  } catch (err) {
    console.error('Get outsource tests error:', err);
    return error(res, 'Failed to fetch outsource tests.', 500);
  }
};

// POST /api/outsource/send
exports.send = async (req, res) => {
  try {
    const { bookingTestId, outsourceLabId, notes } = req.body;
    const test = await db.OutsourceTest.create({
      bookingTestId, outsourceLabId, notes, status: 'sent', sentBy: req.userId, sentAt: new Date(),
    });
    return success(res, test, 'Test sent for outsourcing.', 201);
  } catch (err) {
    console.error('Send outsource error:', err);
    return error(res, 'Failed to send for outsourcing.', 500);
  }
};

// PUT /api/outsource/:id/results
exports.updateResults = async (req, res) => {
  try {
    const test = await db.OutsourceTest.findByPk(req.params.id);
    if (!test) return error(res, 'Outsource test not found.', 404);
    await test.update({ ...req.body, status: 'completed', completedAt: new Date() });
    return success(res, test, 'Outsource results updated.');
  } catch (err) {
    console.error('Update outsource results error:', err);
    return error(res, 'Failed to update results.', 500);
  }
};

// PUT /api/outsource/:id/cancel
exports.cancel = async (req, res) => {
  try {
    const test = await db.OutsourceTest.findByPk(req.params.id);
    if (!test) return error(res, 'Outsource test not found.', 404);
    await test.update({ status: 'cancelled' });
    return success(res, test, 'Outsource test cancelled.');
  } catch (err) {
    console.error('Cancel outsource error:', err);
    return error(res, 'Failed to cancel outsource test.', 500);
  }
};
