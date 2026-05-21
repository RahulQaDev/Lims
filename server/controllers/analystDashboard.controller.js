const { Op } = require('sequelize');
const db = require('../models');
const { success, error } = require('../utils/response');

const BookingTest = db.BookingTest;
const Result = db.Result;
const ResultParameter = db.ResultParameter;

// ── Helpers ────────────────────────────────────────────────

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get department IDs for the analyst from their assignments */
async function getAnalystDepartmentIds(userId) {
  const assignments = await db.DepartmentUser.findAll({
    where: { userId },
    attributes: ['departmentId'],
    raw: true,
  });
  return assignments.map((a) => a.departmentId);
}

// ── 1. Stats (auto-computed) ──────────────────────────────

const getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const today = startOfToday();
    const monthStart = startOfMonth();

    const [assignedToday, completed, pending, overdue, completedOnTime, completedThisMonth] = await Promise.all([
      // Tests assigned to me today
      BookingTest.count({
        where: { assignedTo: userId, createdAt: { [Op.gte]: today } },
      }),
      // Tests I completed today
      BookingTest.count({
        where: {
          assignedTo: userId,
          status: { [Op.in]: ['completed', 'reviewed', 'approved'] },
          updatedAt: { [Op.gte]: today },
        },
      }),
      // My pending tests
      BookingTest.count({
        where: {
          assignedTo: userId,
          status: { [Op.in]: ['pending', 'in_progress'] },
        },
      }),
      // My overdue tests
      BookingTest.count({
        where: {
          assignedTo: userId,
          status: { [Op.in]: ['pending', 'in_progress'] },
          dueDate: { [Op.lt]: new Date() },
        },
      }),
      // Completed on time this month (for on-time rate)
      BookingTest.count({
        where: {
          assignedTo: userId,
          status: { [Op.in]: ['completed', 'reviewed', 'approved'] },
          updatedAt: { [Op.gte]: monthStart },
          [Op.and]: db.sequelize.literal('`BookingTest`.`updatedAt` <= `BookingTest`.`dueDate`'),
        },
      }),
      // Total completed this month
      BookingTest.count({
        where: {
          assignedTo: userId,
          status: { [Op.in]: ['completed', 'reviewed', 'approved'] },
          updatedAt: { [Op.gte]: monthStart },
        },
      }),
    ]);

    const onTimeRate = completedThisMonth > 0
      ? Math.round((completedOnTime / completedThisMonth) * 1000) / 10
      : 100;

    return success(res, {
      assignedToday,
      completed,
      pending,
      overdue,
      onTimeRate,
    });
  } catch (err) {
    console.error('Analyst stats error:', err);
    return error(res, 'Failed to load stats.', 500);
  }
};

// ── 2. Work Queue (auto-sorted, auto-escalated) ──────────

const getWorkQueue = async (req, res) => {
  try {
    const userId = req.userId;

    const tests = await BookingTest.findAll({
      where: {
        assignedTo: userId,
        status: { [Op.in]: ['pending', 'in_progress'] },
      },
      include: [
        {
          model: db.Booking, as: 'booking',
          attributes: ['id', 'reportNumber', 'priority'],
          include: [{
            model: db.Sample, as: 'sample',
            attributes: ['id', 'sampleCode', 'description'],
            include: [{
              model: db.Client, as: 'client',
              attributes: ['id', 'name'],
            }],
          }],
        },
        { model: db.TestMaster, as: 'testMaster', attributes: ['id', 'name', 'code', 'tatHours'] },
        { model: db.Department, as: 'department', attributes: ['id', 'name', 'code'] },
      ],
      order: [['dueDate', 'ASC']],
    });

    const now = new Date();
    const queue = tests.map((bt) => {
      const json = bt.toJSON();
      const dueDate = json.dueDate ? new Date(json.dueDate) : null;
      const minutesLeft = dueDate ? Math.round((dueDate - now) / 60000) : null;
      const tatHours = json.testMaster?.tatHours || 48;
      const tatMinutes = tatHours * 60;

      // Auto-escalate priority
      let priority = (json.booking?.priority || 'normal').toUpperCase();
      if (minutesLeft !== null && priority === 'NORMAL' && minutesLeft < tatMinutes * 0.25) {
        priority = 'URGENT';
      }
      if (minutesLeft !== null && priority !== 'CRITICAL' && minutesLeft < tatMinutes * 0.10) {
        priority = 'CRITICAL';
      }

      return {
        id: json.id,
        sampleCode: json.booking?.sample?.sampleCode || '-',
        testName: json.testMaster?.name || '-',
        testCode: json.testMaster?.code || '-',
        department: json.department?.name || '-',
        departmentCode: json.department?.code || '-',
        client: json.booking?.sample?.client?.name || '-',
        priority,
        dueDate: json.dueDate,
        minutesLeft,
        status: json.status.toUpperCase(),
      };
    });

    // Sort: CRITICAL first, then URGENT, then NORMAL; within same priority, by minutesLeft ASC
    const priorityOrder = { CRITICAL: 0, URGENT: 1, NORMAL: 2 };
    queue.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 3;
      const pb = priorityOrder[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return (a.minutesLeft ?? 99999) - (b.minutesLeft ?? 99999);
    });

    return success(res, queue);
  } catch (err) {
    console.error('Analyst work queue error:', err);
    return error(res, 'Failed to load work queue.', 500);
  }
};

// ── 3. KPIs + KRAs (auto-aggregated monthly) ─────────────

const getKpisAndKras = async (req, res) => {
  try {
    const userId = req.userId;
    const monthStart = startOfMonth();
    const now = new Date();

    // Completed this month — join with Result to get actual enteredAt
    const completedTests = await BookingTest.findAll({
      where: {
        assignedTo: userId,
        status: { [Op.in]: ['completed', 'reviewed', 'approved'] },
        updatedAt: { [Op.gte]: monthStart },
      },
      attributes: ['id', 'dueDate', 'updatedAt', 'createdAt', 'status'],
      include: [{
        model: db.Result, as: 'result',
        attributes: ['enteredAt'],
        required: false,
      }],
    });

    const rejectedTests = await BookingTest.findAll({
      where: {
        assignedTo: userId,
        status: 'rejected',
        updatedAt: { [Op.gte]: monthStart },
      },
      raw: true,
    });

    const pendingCount = await BookingTest.count({
      where: {
        assignedTo: userId,
        status: { [Op.in]: ['pending', 'in_progress'] },
      },
    });

    // Analyst TAT = BookingTest.createdAt (test reaches dept) → Result.enteredAt (analyst submits result)
    let totalTatHours = 0;
    let onTimeCount = 0;
    for (const t of completedTests) {
      const json = t.toJSON();
      const reachedDept = new Date(json.createdAt);
      const resultEntered = json.result?.enteredAt ? new Date(json.result.enteredAt) : new Date(json.updatedAt);
      totalTatHours += (resultEntered - reachedDept) / 3600000;
      if (json.dueDate && resultEntered <= new Date(json.dueDate)) {
        onTimeCount++;
      }
    }

    const samplesCompleted = completedTests.length;
    const avgTat = samplesCompleted > 0 ? Math.round((totalTatHours / samplesCompleted) * 10) / 10 : 0;
    const onTimePct = samplesCompleted > 0 ? Math.round((onTimeCount / samplesCompleted) * 1000) / 10 : 100;
    const totalDone = samplesCompleted + rejectedTests.length;
    const rejectionRate = totalDone > 0 ? Math.round((rejectedTests.length / totalDone) * 1000) / 10 : 0;

    // KPIs
    const kpis = [
      { key: 'samples_completed', label: 'Samples Completed / Month', actual: samplesCompleted, target: 120, unit: '', inverse: false },
      { key: 'avg_tat', label: 'Average TAT', actual: avgTat, target: 24, unit: 'hrs', inverse: true },
      { key: 'on_time_pct', label: 'On-Time Delivery', actual: onTimePct, target: 95, unit: '%', inverse: false },
      { key: 'rejection_rate', label: 'Rejection Rate', actual: rejectionRate, target: 2, unit: '%', inverse: true },
      { key: 'pending_tasks', label: 'Pending Tasks', actual: pendingCount, target: 0, unit: '', inverse: true },
    ];

    // KRAs (auto-computed from same data)
    const testingAccuracy = totalDone > 0 ? Math.round(((totalDone - rejectedTests.length) / totalDone) * 1000) / 10 : 100;
    const tatCompliance = onTimePct;
    const throughputPct = Math.min(100, Math.round((samplesCompleted / 120) * 1000) / 10);
    // Quality score = 100 - (rejection rate * 5) — penalizes rejections
    const qualityScore = Math.max(0, Math.round((100 - rejectionRate * 5) * 10) / 10);

    const kras = [
      { key: 'testing_accuracy', label: 'Testing Accuracy', target: '98%', actual: testingAccuracy, score: Math.min(100, (testingAccuracy / 98) * 100), weight: 30, inverse: false },
      { key: 'tat_compliance', label: 'TAT Compliance', target: '95%', actual: tatCompliance, score: Math.min(100, (tatCompliance / 95) * 100), weight: 25, inverse: false },
      { key: 'sample_throughput', label: 'Sample Throughput', target: '120/month', actual: throughputPct, score: throughputPct, weight: 25, inverse: false },
      { key: 'quality_score', label: 'Quality Score', target: '95%', actual: qualityScore, score: Math.min(100, (qualityScore / 95) * 100), weight: 20, inverse: false },
    ];

    const overallKraScore = Math.round(kras.reduce((sum, k) => sum + k.score * (k.weight / 100), 0) * 10) / 10;

    return success(res, { kpis, kras, overallKraScore });
  } catch (err) {
    console.error('Analyst KPIs error:', err);
    return error(res, 'Failed to load KPIs.', 500);
  }
};

// ── 4. Recent Results (auto-updated) ─────────────────────

const getRecentResults = async (req, res) => {
  try {
    const userId = req.userId;

    const results = await Result.findAll({
      where: { enteredBy: userId },
      include: [
        {
          model: db.BookingTest, as: 'bookingTest',
          attributes: ['id', 'status'],
          include: [{
            model: db.TestMaster, as: 'testMaster',
            attributes: ['name', 'code'],
          }],
        },
        { model: db.Sample, as: 'sample', attributes: ['sampleCode'] },
        { model: ResultParameter, as: 'parameters', attributes: ['parameterName', 'observedValue', 'passFail'], limit: 1 },
      ],
      order: [['enteredAt', 'DESC']],
      limit: 10,
    });

    const data = results.map((r) => {
      const json = r.toJSON();
      const param = json.parameters?.[0];
      return {
        id: json.id,
        sampleCode: json.sample?.sampleCode || '-',
        testName: json.bookingTest?.testMaster?.name || '-',
        result: param?.observedValue || json.rawData || '-',
        status: json.status.toUpperCase(),
        enteredAt: json.enteredAt,
      };
    });

    return success(res, data);
  } catch (err) {
    console.error('Analyst recent results error:', err);
    return error(res, 'Failed to load recent results.', 500);
  }
};

// ── 5. OOS Alerts (auto-detected) ────────────────────────

const getOosAlerts = async (req, res) => {
  try {
    const userId = req.userId;

    const failedParams = await ResultParameter.findAll({
      where: { passFail: 'fail' },
      include: [{
        model: Result, as: 'result',
        where: {
          enteredBy: userId,
          status: { [Op.in]: ['entered', 'reviewed'] }, // not yet fully resolved
        },
        attributes: ['id', 'enteredAt', 'status'],
        include: [
          { model: db.Sample, as: 'sample', attributes: ['sampleCode'] },
          {
            model: db.BookingTest, as: 'bookingTest',
            attributes: ['id'],
            include: [{ model: db.TestMaster, as: 'testMaster', attributes: ['name'] }],
          },
        ],
      }],
      attributes: ['id', 'parameterName', 'observedValue', 'minLimit', 'maxLimit', 'specification'],
    });

    const alerts = failedParams.map((fp) => {
      const json = fp.toJSON();
      return {
        id: json.id,
        sampleCode: json.result?.sample?.sampleCode || '-',
        testName: json.result?.bookingTest?.testMaster?.name || '-',
        parameter: json.parameterName,
        obtainedValue: json.observedValue || '-',
        specLimit: json.specification || `${json.minLimit || ''} - ${json.maxLimit || ''}`,
        raisedAt: json.result?.enteredAt,
        responded: json.result?.status !== 'entered', // if reviewed, someone has seen it
      };
    });

    return success(res, alerts);
  } catch (err) {
    console.error('Analyst OOS alerts error:', err);
    return error(res, 'Failed to load OOS alerts.', 500);
  }
};

// ── 6. Equipment Status (auto from dept) ─────────────────

const getEquipment = async (req, res) => {
  try {
    const userId = req.userId;
    const deptIds = await getAnalystDepartmentIds(userId);

    const where = { isActive: true };
    if (deptIds.length > 0) {
      where.departmentId = { [Op.in]: deptIds };
    }

    const instruments = await db.Instrument.findAll({
      where,
      attributes: ['id', 'name', 'code', 'status', 'calibrationDate', 'nextCalibrationDate'],
      include: [{ model: db.Department, as: 'department', attributes: ['name', 'code'] }],
      order: [['name', 'ASC']],
    });

    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 86400000);

    const data = instruments.map((inst) => {
      const json = inst.toJSON();
      let computedStatus = json.status;

      // Auto-flag calibration due
      if (json.nextCalibrationDate) {
        const nextCal = new Date(json.nextCalibrationDate);
        if (nextCal <= today && computedStatus === 'active') {
          computedStatus = 'calibration_due';
        }
      }

      return {
        id: json.id,
        name: json.name,
        code: json.code,
        department: json.department?.name || '-',
        status: computedStatus,
        lastCalibration: json.calibrationDate,
        nextCalibrationDate: json.nextCalibrationDate,
        pmDueSoon: json.nextCalibrationDate && new Date(json.nextCalibrationDate) <= weekFromNow,
      };
    });

    return success(res, data);
  } catch (err) {
    console.error('Analyst equipment error:', err);
    return error(res, 'Failed to load equipment.', 500);
  }
};

// ── 7. Consumable Alerts (auto low-stock) ────────────────

const getConsumableAlerts = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await db.User.findByPk(userId, { attributes: ['locationId'] });

    const where = {
      isActive: true,
      [Op.and]: db.sequelize.literal('`InventoryItem`.`currentStock` <= `InventoryItem`.`minStock`'),
    };
    if (user?.locationId) {
      where.locationId = user.locationId;
    }

    const lowStock = await db.InventoryItem.findAll({
      where,
      attributes: ['id', 'name', 'code', 'category', 'currentStock', 'minStock', 'unit'],
      order: [['currentStock', 'ASC']],
      limit: 10,
    });

    const data = lowStock.map((item) => {
      const json = item.toJSON();
      return {
        id: json.id,
        name: json.name,
        code: json.code,
        category: json.category,
        currentStock: parseFloat(json.currentStock),
        minStock: parseFloat(json.minStock),
        unit: json.unit,
        critical: parseFloat(json.currentStock) === 0,
      };
    });

    return success(res, data);
  } catch (err) {
    console.error('Analyst consumable alerts error:', err);
    return error(res, 'Failed to load consumable alerts.', 500);
  }
};

module.exports = { getStats, getWorkQueue, getKpisAndKras, getRecentResults, getOosAlerts, getEquipment, getConsumableAlerts };
