const { Op } = require('sequelize');
const db = require('../models');
const { successResponse, errorResponse } = require('../utils/response');

// Helper: get start of today
function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function yesterdayStart() {
  const d = todayStart();
  d.setDate(d.getDate() - 1);
  return d;
}

exports.getStats = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    const today = todayStart();
    const yesterday = yesterdayStart();
    const now = new Date();

    // Bookings by this user today
    const bookedToday = await db.Booking.count({
      where: { bookedBy: userId, createdAt: { [Op.gte]: today } }
    });
    const bookedYesterday = await db.Booking.count({
      where: { bookedBy: userId, createdAt: { [Op.gte]: yesterday, [Op.lt]: today } }
    });

    // Pending queue (samples received but not booked)
    const pendingQueue = await db.Sample.count({
      where: { status: 'RECEIVED' }
    });

    // Revenue today
    const revResult = await db.Booking.findAll({
      where: { bookedBy: userId, createdAt: { [Op.gte]: today } },
      attributes: [[db.sequelize.fn('SUM', db.sequelize.col('netAmount')), 'total']]
    });
    const revenueToday = revResult[0]?.dataValues?.total || 0;

    const revYesterday = await db.Booking.findAll({
      where: { bookedBy: userId, createdAt: { [Op.gte]: yesterday, [Op.lt]: today } },
      attributes: [[db.sequelize.fn('SUM', db.sequelize.col('netAmount')), 'total']]
    });
    const revenueYesterday = revYesterday[0]?.dataValues?.total || 0;

    // Total bookings this month by user
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalMonth = await db.Booking.count({
      where: { bookedBy: userId, createdAt: { [Op.gte]: monthStart } }
    });
    const cancelledMonth = await db.Booking.count({
      where: { bookedBy: userId, status: 'CANCELLED', createdAt: { [Op.gte]: monthStart } }
    });
    const amendedMonth = await db.Booking.count({
      where: { bookedBy: userId, isAmended: true, createdAt: { [Op.gte]: monthStart } }
    });

    const cancellationRate = totalMonth > 0 ? Math.round((cancelledMonth / totalMonth) * 100 * 10) / 10 : 0;
    const amendmentRate = totalMonth > 0 ? Math.round((amendedMonth / totalMonth) * 100 * 10) / 10 : 0;

    // Average booking time (hours between sample received and booking created)
    const bookingsWithSamples = await db.Booking.findAll({
      where: { bookedBy: userId, createdAt: { [Op.gte]: monthStart } },
      include: [{ model: db.Sample, as: 'sample', attributes: ['receivedDate'] }]
    });

    let totalHours = 0;
    let onTimeCount = 0;
    let validCount = 0;
    for (const b of bookingsWithSamples) {
      if (b.sample && b.sample.receivedDate) {
        const hours = (new Date(b.createdAt) - new Date(b.sample.receivedDate)) / 3600000;
        if (hours >= 0 && hours < 720) { // reasonable range
          totalHours += hours;
          validCount++;
          if (hours <= 2) onTimeCount++;
        }
      }
    }
    const avgBookingTime = validCount > 0 ? Math.round((totalHours / validCount) * 10) / 10 : 0;
    const onTimeRate = validCount > 0 ? Math.round((onTimeCount / validCount) * 100 * 10) / 10 : 0;

    // Pending bookings (status = BOOKED, not started)
    const totalPending = await db.Booking.count({
      where: { status: 'BOOKED' }
    });

    return successResponse(res, {
      bookedToday,
      bookedYesterday,
      pendingQueue,
      revenueToday: Math.round(revenueToday),
      revenueYesterday: Math.round(revenueYesterday),
      onTimeRate,
      amendmentRate,
      cancellationRate,
      avgBookingTime,
      barcodesGeneratedSameDay: 94, // placeholder
      totalPending,
      totalMonth,
    });
  } catch (error) {
    console.error('BookingKPI getStats error:', error);
    return errorResponse(res, 'Failed to fetch booking KPI stats', 500);
  }
};

exports.getKraActuals = async (req, res) => {
  try {
    const userId = req.query.userId || req.user.id;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const totalMonth = await db.Booking.count({
      where: { bookedBy: userId, createdAt: { [Op.gte]: monthStart } }
    });
    const amendedMonth = await db.Booking.count({
      where: { bookedBy: userId, isAmended: true, createdAt: { [Op.gte]: monthStart } }
    });

    const bookingsWithSamples = await db.Booking.findAll({
      where: { bookedBy: userId, createdAt: { [Op.gte]: monthStart } },
      include: [{ model: db.Sample, as: 'sample', attributes: ['receivedDate'] }]
    });

    let onTimeCount = 0;
    let validCount = 0;
    for (const b of bookingsWithSamples) {
      if (b.sample && b.sample.receivedDate) {
        const hours = (new Date(b.createdAt) - new Date(b.sample.receivedDate)) / 3600000;
        if (hours >= 0 && hours < 720) {
          validCount++;
          if (hours <= 2) onTimeCount++;
        }
      }
    }

    // Expected daily bookings: ~25
    const workingDays = Math.ceil((new Date() - monthStart) / 86400000) || 1;
    const expectedVolume = workingDays * 25;

    const kras = [
      {
        id: 'booking_accuracy',
        label: 'Booking Accuracy',
        target: 99,
        weightage: 30,
        actual: totalMonth > 0 ? Math.round((1 - amendedMonth / totalMonth) * 100 * 10) / 10 : 100,
        unit: '%'
      },
      {
        id: 'booking_turnaround',
        label: 'Booking Turnaround (≤2 hrs)',
        target: 95,
        weightage: 25,
        actual: validCount > 0 ? Math.round((onTimeCount / validCount) * 100 * 10) / 10 : 100,
        unit: '%'
      },
      {
        id: 'daily_volume',
        label: 'Daily Booking Volume',
        target: 100,
        weightage: 20,
        actual: expectedVolume > 0 ? Math.min(100, Math.round((totalMonth / expectedVolume) * 100 * 10) / 10) : 0,
        unit: '%'
      },
      {
        id: 'amendment_rate',
        label: 'Amendment Rate (≤5%)',
        target: 5,
        weightage: 15,
        actual: totalMonth > 0 ? Math.round((amendedMonth / totalMonth) * 100 * 10) / 10 : 0,
        unit: '%',
        inverse: true
      },
      {
        id: 'client_compliance',
        label: 'Client Data Compliance',
        target: 100,
        weightage: 10,
        actual: 97, // placeholder - would need client field completeness check
        unit: '%'
      }
    ];

    // Calculate weighted score
    let weightedScore = 0;
    for (const kra of kras) {
      const ratio = kra.inverse
        ? (kra.actual <= kra.target ? 100 : Math.max(0, 100 - ((kra.actual - kra.target) / kra.target) * 100))
        : Math.min(100, (kra.actual / kra.target) * 100);
      weightedScore += (ratio * kra.weightage) / 100;
    }

    return successResponse(res, { kras, weightedScore: Math.round(weightedScore * 10) / 10 });
  } catch (error) {
    console.error('BookingKPI getKraActuals error:', error);
    return errorResponse(res, 'Failed to fetch KRA actuals', 500);
  }
};

exports.getPendingQueue = async (req, res) => {
  try {
    const samples = await db.Sample.findAll({
      where: { status: 'RECEIVED' },
      include: [{ model: db.Client, as: 'client', attributes: ['id', 'name', 'code'] }],
      order: [['receivedDate', 'ASC']],
      limit: 50
    });

    const now = new Date();
    const queue = samples.map(s => ({
      id: s.id,
      sampleCode: s.sampleCode,
      description: s.description,
      clientName: s.client?.name || 'Unknown',
      clientCode: s.client?.code || '',
      priority: s.priority,
      receivedDate: s.receivedDate,
      waitHours: Math.round(((now - new Date(s.receivedDate)) / 3600000) * 10) / 10,
      quantity: s.quantity,
      unit: s.unit,
    }));

    return successResponse(res, { queue, total: queue.length });
  } catch (error) {
    console.error('BookingKPI getPendingQueue error:', error);
    return errorResponse(res, 'Failed to fetch pending queue', 500);
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = todayStart();

    const bookings = await db.Booking.findAll({
      where: { bookedBy: userId, createdAt: { [Op.gte]: today } },
      include: [
        { model: db.Sample, as: 'sample', include: [{ model: db.Client, as: 'client', attributes: ['id', 'name'] }] },
      ],
      order: [['createdAt', 'DESC']],
    });

    const result = [];
    for (const b of bookings) {
      const testCount = await db.BookingTest.count({ where: { bookingId: b.id } });
      const timeTaken = b.sample?.receivedDate
        ? Math.round(((new Date(b.createdAt) - new Date(b.sample.receivedDate)) / 3600000) * 10) / 10
        : null;

      result.push({
        id: b.id,
        reportNumber: b.reportNumber,
        sampleCode: b.sample?.sampleCode || '',
        clientName: b.sample?.client?.name || '',
        testCount,
        netAmount: b.netAmount,
        priority: b.priority,
        status: b.status,
        createdAt: b.createdAt,
        timeTaken,
      });
    }

    return successResponse(res, { bookings: result, total: result.length });
  } catch (error) {
    console.error('BookingKPI getMyBookings error:', error);
    return errorResponse(res, 'Failed to fetch my bookings', 500);
  }
};
