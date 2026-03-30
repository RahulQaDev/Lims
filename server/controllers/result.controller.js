const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Result = db.Result;
const ResultParameter = db.ResultParameter;
const BookingTest = db.BookingTest;

// GET /department/:deptId - Get pending tests for a department
const getDepartmentPending = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await BookingTest.findAndCountAll({
      where: {
        departmentId: req.params.deptId,
        status: { [Op.in]: ['pending', 'in_progress'] },
      },
      include: [
        {
          model: db.Booking, as: 'booking',
          attributes: ['id', 'reportNumber', 'bookingDate', 'priority', 'dueDate'],
          include: [
            { model: db.Sample, as: 'sample', attributes: ['id', 'sampleCode', 'description'], include: [{ model: db.Client, as: 'client', attributes: ['id', 'name'] }] },
          ],
        },
        { model: db.TestMaster, as: 'testMaster', attributes: ['id', 'name', 'code', 'method'] },
        { model: db.User, as: 'assignedToUser', attributes: ['id', 'fullName'] },
        { model: Result, as: 'result' },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'ASC']],
    });

    return paginated(res, rows, page, limit, count, 'Department pending tests retrieved successfully.');
  } catch (err) {
    console.error('Get department pending error:', err);
    return error(res, 'Failed to retrieve department pending tests.', 500);
  }
};

// GET /booking-test/:bookingTestId
const getByBookingTest = async (req, res) => {
  try {
    const result = await Result.findOne({
      where: { bookingTestId: req.params.bookingTestId },
      include: [
        { model: ResultParameter, as: 'parameters', include: [{ model: db.TestParameter, as: 'testParameter' }] },
        { model: db.User, as: 'enteredByUser', attributes: ['id', 'fullName'] },
        { model: db.Instrument, as: 'instrument' },
        {
          model: BookingTest, as: 'bookingTest',
          include: [{ model: db.TestMaster, as: 'testMaster', include: [{ model: db.TestParameter, as: 'parameters' }] }],
        },
      ],
    });

    if (!result) {
      return error(res, 'Result not found for this booking test.', 404);
    }

    return success(res, result, 'Result retrieved successfully.');
  } catch (err) {
    console.error('Get result error:', err);
    return error(res, 'Failed to retrieve result.', 500);
  }
};

// POST / - Enter result with parameters
const create = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { bookingTestId, instrumentId, rawData, remarks, parameters } = req.body;

    // Verify booking test exists
    const bookingTest = await BookingTest.findByPk(bookingTestId, {
      include: [
        { model: db.Booking, as: 'booking' },
        { model: db.TestMaster, as: 'testMaster', include: [{ model: db.TestParameter, as: 'parameters' }] },
      ],
    });

    if (!bookingTest) {
      await transaction.rollback();
      return error(res, 'Booking test not found.', 404);
    }

    // Check if result already exists
    const existing = await Result.findOne({ where: { bookingTestId } });
    if (existing) {
      await transaction.rollback();
      return error(res, 'Result already exists for this booking test.', 400);
    }

    // Create result
    const result = await Result.create({
      bookingTestId,
      sampleId: bookingTest.booking.sampleId,
      departmentId: bookingTest.departmentId,
      enteredBy: req.userId,
      instrumentId,
      rawData,
      remarks,
      status: 'entered',
    }, { transaction });

    // Create result parameters with auto pass/fail
    if (parameters && parameters.length > 0) {
      for (const param of parameters) {
        let paramResult = 'na';

        // Auto-calculate pass/fail based on limits
        if (param.observedValue && (param.minLimit || param.maxLimit)) {
          const observed = parseFloat(param.observedValue);
          if (!isNaN(observed)) {
            const min = param.minLimit ? parseFloat(param.minLimit) : null;
            const max = param.maxLimit ? parseFloat(param.maxLimit) : null;
            if ((min !== null && !isNaN(min) && observed < min) || (max !== null && !isNaN(max) && observed > max)) {
              paramResult = 'fail';
            } else if ((min === null || !isNaN(min)) && (max === null || !isNaN(max))) {
              paramResult = 'pass';
            }
          }
        }

        await ResultParameter.create({
          resultId: result.id,
          testParameterId: param.testParameterId || null,
          parameterName: param.parameterName,
          method: param.method,
          unit: param.unit,
          specification: param.specification,
          minLimit: param.minLimit,
          maxLimit: param.maxLimit,
          observedValue: param.observedValue,
          calculatedValue: param.calculatedValue,
          result: param.result || paramResult,
          remarks: param.remarks,
        }, { transaction });
      }
    }

    // Update booking test status
    await bookingTest.update({ status: 'in_progress' }, { transaction });

    // Update sample status if needed
    await db.Sample.update(
      { status: 'in_testing' },
      { where: { id: bookingTest.booking.sampleId, status: { [Op.in]: ['received', 'booked'] } }, transaction }
    );

    await transaction.commit();

    // Fetch full result
    const fullResult = await Result.findByPk(result.id, {
      include: [
        { model: ResultParameter, as: 'parameters' },
        { model: db.User, as: 'enteredByUser', attributes: ['id', 'fullName'] },
      ],
    });

    return success(res, fullResult, 'Result entered successfully.', 201);
  } catch (err) {
    await transaction.rollback();
    console.error('Create result error:', err);
    return error(res, 'Failed to enter result.', 500);
  }
};

// PUT /:id - Update result
const update = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const result = await Result.findByPk(req.params.id);
    if (!result) {
      await transaction.rollback();
      return error(res, 'Result not found.', 404);
    }

    const { parameters, ...resultData } = req.body;

    await result.update(resultData, { transaction });

    // Update parameters if provided
    if (parameters && parameters.length > 0) {
      for (const param of parameters) {
        if (param.id) {
          // Update existing parameter
          const existingParam = await ResultParameter.findByPk(param.id);
          if (existingParam) {
            await existingParam.update(param, { transaction });
          }
        } else {
          // Create new parameter
          await ResultParameter.create({
            ...param,
            resultId: result.id,
          }, { transaction });
        }
      }
    }

    await transaction.commit();

    const fullResult = await Result.findByPk(result.id, {
      include: [{ model: ResultParameter, as: 'parameters' }],
    });

    return success(res, fullResult, 'Result updated successfully.');
  } catch (err) {
    await transaction.rollback();
    console.error('Update result error:', err);
    return error(res, 'Failed to update result.', 500);
  }
};

// PUT /booking-test/:id/assign
const assignBookingTest = async (req, res) => {
  try {
    const bookingTest = await BookingTest.findByPk(req.params.id);
    if (!bookingTest) {
      return error(res, 'Booking test not found.', 404);
    }

    const { assignedTo } = req.body;
    if (!assignedTo) {
      return error(res, 'Assigned user ID is required.', 400);
    }

    await bookingTest.update({ assignedTo });

    return success(res, bookingTest, 'Booking test assigned successfully.');
  } catch (err) {
    console.error('Assign booking test error:', err);
    return error(res, 'Failed to assign booking test.', 500);
  }
};

module.exports = { getDepartmentPending, getByBookingTest, create, update, assignBookingTest };
