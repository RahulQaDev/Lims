const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Review = db.Review;
const Result = db.Result;
const BookingTest = db.BookingTest;

// GET /pending - Results pending review
const getPendingReview = async (req, res) => {
  try {
    const { page = 1, limit = 20, departmentId } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: 'entered' };

    const includeWhere = {};
    if (departmentId) includeWhere.departmentId = departmentId;

    const { count, rows } = await Result.findAndCountAll({
      where,
      include: [
        {
          model: BookingTest, as: 'bookingTest',
          where: includeWhere,
          include: [
            { model: db.TestMaster, as: 'testMaster', attributes: ['id', 'name', 'code', 'method'] },
            {
              model: db.Booking, as: 'booking',
              attributes: ['id', 'reportNumber', 'priority'],
              include: [{ model: db.Sample, as: 'sample', attributes: ['id', 'sampleCode', 'description'], include: [{ model: db.Client, as: 'client', attributes: ['id', 'name'] }] }],
            },
            { model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] },
          ],
        },
        { model: db.User, as: 'enteredByUser', attributes: ['id', 'fullName'] },
        { model: db.ResultParameter, as: 'parameters' },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'ASC']],
    });

    return paginated(res, rows, page, limit, count, 'Pending reviews retrieved successfully.');
  } catch (err) {
    console.error('Get pending review error:', err);
    return error(res, 'Failed to retrieve pending reviews.', 500);
  }
};

// GET /pending-approval - Results pending approval
const getPendingApproval = async (req, res) => {
  try {
    const { page = 1, limit = 20, departmentId } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: 'reviewed' };

    const includeWhere = {};
    if (departmentId) includeWhere.departmentId = departmentId;

    const { count, rows } = await Result.findAndCountAll({
      where,
      include: [
        {
          model: BookingTest, as: 'bookingTest',
          where: includeWhere,
          include: [
            { model: db.TestMaster, as: 'testMaster', attributes: ['id', 'name', 'code', 'method'] },
            {
              model: db.Booking, as: 'booking',
              attributes: ['id', 'reportNumber', 'priority'],
              include: [{ model: db.Sample, as: 'sample', attributes: ['id', 'sampleCode', 'description'], include: [{ model: db.Client, as: 'client', attributes: ['id', 'name'] }] }],
            },
            { model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] },
          ],
        },
        { model: db.User, as: 'enteredByUser', attributes: ['id', 'fullName'] },
        { model: db.ResultParameter, as: 'parameters' },
        { model: Review, as: 'reviews', include: [{ model: db.User, as: 'reviewer', attributes: ['id', 'fullName'] }] },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'ASC']],
    });

    return paginated(res, rows, page, limit, count, 'Pending approvals retrieved successfully.');
  } catch (err) {
    console.error('Get pending approval error:', err);
    return error(res, 'Failed to retrieve pending approvals.', 500);
  }
};

// POST /:resultId/review
const submitReview = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const result = await Result.findByPk(req.params.resultId, {
      include: [{ model: BookingTest, as: 'bookingTest' }],
    });

    if (!result) {
      await transaction.rollback();
      return error(res, 'Result not found.', 404);
    }

    if (result.status !== 'entered') {
      await transaction.rollback();
      return error(res, 'Result is not in a reviewable state.', 400);
    }

    const { status, remarks } = req.body;

    // Create review record
    const review = await Review.create({
      resultId: result.id,
      reviewerId: req.userId,
      status,
      remarks,
      level: 'review',
    }, { transaction });

    if (status === 'approved') {
      await result.update({ status: 'reviewed' }, { transaction });
      await result.bookingTest.update({ status: 'reviewed' }, { transaction });
    } else if (status === 'rejected') {
      await result.update({ status: 'rejected' }, { transaction });
      await result.bookingTest.update({ status: 'rejected' }, { transaction });
    }

    await transaction.commit();
    return success(res, review, 'Review submitted successfully.', 201);
  } catch (err) {
    await transaction.rollback();
    console.error('Submit review error:', err);
    return error(res, 'Failed to submit review.', 500);
  }
};

// POST /:resultId/approve
const submitApproval = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const result = await Result.findByPk(req.params.resultId, {
      include: [{ model: BookingTest, as: 'bookingTest', include: [{ model: db.Booking, as: 'booking' }] }],
    });

    if (!result) {
      await transaction.rollback();
      return error(res, 'Result not found.', 404);
    }

    if (result.status !== 'reviewed') {
      await transaction.rollback();
      return error(res, 'Result is not in an approvable state.', 400);
    }

    const { status, remarks } = req.body;

    const review = await Review.create({
      resultId: result.id,
      reviewerId: req.userId,
      status,
      remarks,
      level: 'approval',
    }, { transaction });

    if (status === 'approved') {
      await result.update({ status: 'approved' }, { transaction });
      await result.bookingTest.update({ status: 'approved' }, { transaction });

      // Check if all booking tests for this booking are approved
      const bookingId = result.bookingTest.bookingId;
      const totalTests = await BookingTest.count({ where: { bookingId } });
      const approvedTests = await BookingTest.count({ where: { bookingId, status: 'approved' } });

      // Account for the current one being approved in this transaction
      if (approvedTests + 1 >= totalTests || approvedTests >= totalTests) {
        await db.Booking.update({ status: 'completed' }, { where: { id: bookingId }, transaction });
        await db.Sample.update(
          { status: 'approved' },
          { where: { id: result.bookingTest.booking.sampleId }, transaction }
        );
      } else {
        // Update sample to under_review if not all done
        await db.Sample.update(
          { status: 'under_review' },
          { where: { id: result.bookingTest.booking.sampleId, status: { [Op.in]: ['in_testing', 'booked'] } }, transaction }
        );
      }
    } else if (status === 'rejected') {
      await result.update({ status: 'rejected' }, { transaction });
      await result.bookingTest.update({ status: 'rejected' }, { transaction });
    }

    await transaction.commit();
    return success(res, review, 'Approval submitted successfully.', 201);
  } catch (err) {
    await transaction.rollback();
    console.error('Submit approval error:', err);
    return error(res, 'Failed to submit approval.', 500);
  }
};

module.exports = { getPendingReview, getPendingApproval, submitReview, submitApproval };
