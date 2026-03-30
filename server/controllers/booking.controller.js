const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Booking = db.Booking;
const BookingTest = db.BookingTest;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { reportNumber: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.bookingDate = {};
      if (dateFrom) where.bookingDate[Op.gte] = dateFrom;
      if (dateTo) where.bookingDate[Op.lte] = dateTo;
    }

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: db.Sample, as: 'sample',
          attributes: ['id', 'sampleCode', 'description', 'status'],
          include: [{ model: db.Client, as: 'client', attributes: ['id', 'name', 'code'] }],
        },
        { model: db.Standard, as: 'standard', attributes: ['id', 'name', 'code'] },
        { model: db.User, as: 'bookedByUser', attributes: ['id', 'fullName'] },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return paginated(res, rows, page, limit, count, 'Bookings retrieved successfully.');
  } catch (err) {
    console.error('Get bookings error:', err);
    return error(res, 'Failed to retrieve bookings.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: db.Sample, as: 'sample',
          include: [
            { model: db.Client, as: 'client' },
            { model: db.ProductType, as: 'productType' },
          ],
        },
        { model: db.Standard, as: 'standard' },
        { model: db.User, as: 'bookedByUser', attributes: ['id', 'fullName'] },
        {
          model: BookingTest, as: 'bookingTests',
          include: [
            { model: db.TestMaster, as: 'testMaster', include: [{ model: db.TestParameter, as: 'parameters' }] },
            { model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] },
            { model: db.User, as: 'assignedToUser', attributes: ['id', 'fullName'] },
            { model: db.Result, as: 'result' },
          ],
        },
      ],
    });

    if (!booking) {
      return error(res, 'Booking not found.', 404);
    }

    return success(res, booking, 'Booking retrieved successfully.');
  } catch (err) {
    console.error('Get booking error:', err);
    return error(res, 'Failed to retrieve booking.', 500);
  }
};

// POST /
const create = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { sampleId, standardId, specificationId, tests, testingType, priority, dueDate, remarks, discountPercent } = req.body;

    // Verify sample exists
    const sample = await db.Sample.findByPk(sampleId);
    if (!sample) {
      await transaction.rollback();
      return error(res, 'Sample not found.', 404);
    }

    // Create booking
    const booking = await Booking.create({
      sampleId,
      standardId,
      specificationId,
      bookedBy: req.userId,
      testingType,
      priority: priority || sample.priority,
      dueDate,
      remarks,
      discountPercent: discountPercent || 0,
    }, { transaction });

    // Create booking tests and calculate total
    let totalAmount = 0;

    if (tests && tests.length > 0) {
      for (const testItem of tests) {
        // Look up rate from rate master (client-specific first, then standard, then default)
        let price = testItem.price || 0;

        if (!price) {
          const rate = await db.RateMaster.findOne({
            where: {
              testMasterId: testItem.testMasterId,
              isActive: true,
              [Op.or]: [
                { clientId: sample.clientId, standardId: standardId || null },
                { clientId: sample.clientId, standardId: null },
                { clientId: null, standardId: standardId || null },
                { clientId: null, standardId: null },
              ],
            },
            order: [
              ['clientId', 'DESC NULLS LAST'],
              ['standardId', 'DESC NULLS LAST'],
            ],
          });

          if (rate) {
            price = rate.price;
          } else {
            // Fall back to test master price
            const testMaster = await db.TestMaster.findByPk(testItem.testMasterId);
            if (testMaster) price = testMaster.price || 0;
          }
        }

        await BookingTest.create({
          bookingId: booking.id,
          testMasterId: testItem.testMasterId,
          departmentId: testItem.departmentId,
          assignedTo: testItem.assignedTo || null,
          price,
          dueDate: testItem.dueDate || dueDate,
          remarks: testItem.remarks,
        }, { transaction });

        totalAmount += parseFloat(price) || 0;
      }
    }

    // Calculate amounts
    const discountAmt = totalAmount * (parseFloat(discountPercent || 0) / 100);
    const netAmount = totalAmount - discountAmt;

    await booking.update({
      totalAmount,
      discountAmount: discountAmt,
      netAmount,
    }, { transaction });

    // Update sample status
    await sample.update({ status: 'booked' }, { transaction });

    await transaction.commit();

    // Fetch complete booking
    const fullBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: db.Sample, as: 'sample', include: [{ model: db.Client, as: 'client' }] },
        { model: db.Standard, as: 'standard' },
        { model: BookingTest, as: 'bookingTests', include: [{ model: db.TestMaster, as: 'testMaster' }] },
      ],
    });

    return success(res, fullBooking, 'Booking created successfully.', 201);
  } catch (err) {
    await transaction.rollback();
    console.error('Create booking error:', err);
    return error(res, 'Failed to create booking.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return error(res, 'Booking not found.', 404);
    }
    await booking.update(req.body);
    return success(res, booking, 'Booking updated successfully.');
  } catch (err) {
    console.error('Update booking error:', err);
    return error(res, 'Failed to update booking.', 500);
  }
};

// POST /:id/tests - Add tests to booking
const addTests = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      await transaction.rollback();
      return error(res, 'Booking not found.', 404);
    }

    const { tests } = req.body;
    if (!tests || !tests.length) {
      await transaction.rollback();
      return error(res, 'Tests array is required.', 400);
    }

    const createdTests = [];
    let addedAmount = 0;

    for (const testItem of tests) {
      const price = testItem.price || 0;
      const bt = await BookingTest.create({
        bookingId: booking.id,
        testMasterId: testItem.testMasterId,
        departmentId: testItem.departmentId,
        assignedTo: testItem.assignedTo || null,
        price,
        dueDate: testItem.dueDate || booking.dueDate,
        remarks: testItem.remarks,
      }, { transaction });
      createdTests.push(bt);
      addedAmount += parseFloat(price) || 0;
    }

    // Recalculate totals
    const newTotal = parseFloat(booking.totalAmount) + addedAmount;
    const discountAmt = newTotal * (parseFloat(booking.discountPercent) / 100);
    await booking.update({
      totalAmount: newTotal,
      discountAmount: discountAmt,
      netAmount: newTotal - discountAmt,
      isAmended: true,
    }, { transaction });

    await transaction.commit();
    return success(res, createdTests, 'Tests added to booking successfully.', 201);
  } catch (err) {
    await transaction.rollback();
    console.error('Add tests error:', err);
    return error(res, 'Failed to add tests.', 500);
  }
};

// DELETE /:id/tests/:testId
const removeTest = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingTest = await BookingTest.findOne({
      where: { id: req.params.testId, bookingId: req.params.id },
    });

    if (!bookingTest) {
      await transaction.rollback();
      return error(res, 'Booking test not found.', 404);
    }

    const booking = await Booking.findByPk(req.params.id);
    const removedPrice = parseFloat(bookingTest.price) || 0;

    await bookingTest.destroy({ transaction });

    // Recalculate totals
    const newTotal = parseFloat(booking.totalAmount) - removedPrice;
    const discountAmt = newTotal * (parseFloat(booking.discountPercent) / 100);
    await booking.update({
      totalAmount: newTotal,
      discountAmount: discountAmt,
      netAmount: newTotal - discountAmt,
      isAmended: true,
    }, { transaction });

    await transaction.commit();
    return success(res, null, 'Test removed from booking successfully.');
  } catch (err) {
    await transaction.rollback();
    console.error('Remove test error:', err);
    return error(res, 'Failed to remove test.', 500);
  }
};

// PUT /:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: db.Sample, as: 'sample' }],
    });
    if (!booking) {
      return error(res, 'Booking not found.', 404);
    }

    if (booking.status === 'cancelled') {
      return error(res, 'Booking is already cancelled.', 400);
    }

    await booking.update({ status: 'cancelled' });

    // Check if sample has other active bookings
    const activeBookings = await Booking.count({
      where: { sampleId: booking.sampleId, status: { [Op.ne]: 'cancelled' }, id: { [Op.ne]: booking.id } },
    });

    if (activeBookings === 0 && booking.sample) {
      await booking.sample.update({ status: 'received' });
    }

    return success(res, booking, 'Booking cancelled successfully.');
  } catch (err) {
    console.error('Cancel booking error:', err);
    return error(res, 'Failed to cancel booking.', 500);
  }
};

module.exports = { getAll, getById, create, update, addTests, removeTest, cancelBooking };
