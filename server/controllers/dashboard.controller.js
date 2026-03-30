const { Op } = require('sequelize');
const db = require('../models');
const { success, error } = require('../utils/response');

// GET /stats
const getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalSamplesToday,
      pendingBooking,
      inTesting,
      pendingReview,
      coaReady,
      totalSamples,
    ] = await Promise.all([
      db.Sample.count({ where: { receivedDate: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
      db.Sample.count({ where: { status: 'received' } }),
      db.Sample.count({ where: { status: 'in_testing' } }),
      db.Sample.count({ where: { status: 'under_review' } }),
      db.Sample.count({ where: { status: 'coa_generated' } }),
      db.Sample.count(),
    ]);

    // Overdue samples (past due date and not completed)
    const overdue = await db.Sample.count({
      where: {
        dueDate: { [Op.lt]: new Date() },
        status: { [Op.notIn]: ['approved', 'coa_generated', 'dispatched', 'archived'] },
      },
    });

    return success(res, {
      totalSamplesToday,
      pendingBooking,
      inTesting,
      pendingReview,
      coaReady,
      overdue,
      totalSamples,
    }, 'Dashboard stats retrieved successfully.');
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    return error(res, 'Failed to retrieve dashboard stats.', 500);
  }
};

// GET /recent-samples
const getRecentSamples = async (req, res) => {
  try {
    const samples = await db.Sample.findAll({
      include: [
        { model: db.Client, as: 'client', attributes: ['id', 'name', 'code'] },
        { model: db.ProductType, as: 'productType', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    return success(res, samples, 'Recent samples retrieved successfully.');
  } catch (err) {
    console.error('Get recent samples error:', err);
    return error(res, 'Failed to retrieve recent samples.', 500);
  }
};

// GET /department-workload
const getDepartmentWorkload = async (req, res) => {
  try {
    const departments = await db.Department.findAll({
      where: { isActive: true, type: 'analytical' },
      attributes: ['id', 'name', 'code'],
    });

    const workload = [];
    for (const dept of departments) {
      const pending = await db.BookingTest.count({
        where: { departmentId: dept.id, status: { [Op.in]: ['pending', 'in_progress'] } },
      });
      const completed = await db.BookingTest.count({
        where: { departmentId: dept.id, status: { [Op.in]: ['completed', 'reviewed', 'approved'] } },
      });

      workload.push({
        department: dept,
        pending,
        completed,
        total: pending + completed,
      });
    }

    return success(res, workload, 'Department workload retrieved successfully.');
  } catch (err) {
    console.error('Get department workload error:', err);
    return error(res, 'Failed to retrieve department workload.', 500);
  }
};

// GET /revenue-summary
const getRevenueSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const invoicesThisMonth = await db.Invoice.findAll({
      where: {
        invoiceDate: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth },
        status: { [Op.ne]: 'cancelled' },
      },
      attributes: ['id', 'grandTotal', 'paidAmount', 'status'],
    });

    const totalInvoiced = invoicesThisMonth.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);
    const totalCollected = invoicesThisMonth.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || 0), 0);
    const totalOutstanding = totalInvoiced - totalCollected;

    const overallOutstanding = await db.Invoice.sum('grandTotal', {
      where: { status: { [Op.in]: ['generated', 'sent', 'partially_paid', 'overdue'] } },
    }) || 0;

    const overallPaid = await db.Invoice.sum('paidAmount', {
      where: { status: { [Op.in]: ['generated', 'sent', 'partially_paid', 'overdue'] } },
    }) || 0;

    return success(res, {
      thisMonth: {
        invoiceCount: invoicesThisMonth.length,
        totalInvoiced,
        totalCollected,
        totalOutstanding,
      },
      overall: {
        totalOutstanding: overallOutstanding - overallPaid,
      },
    }, 'Revenue summary retrieved successfully.');
  } catch (err) {
    console.error('Get revenue summary error:', err);
    return error(res, 'Failed to retrieve revenue summary.', 500);
  }
};

module.exports = { getStats, getRecentSamples, getDepartmentWorkload, getRevenueSummary };
