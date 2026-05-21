const { Op } = require('sequelize');
const db = require('../models');
const { success, error } = require('../utils/response');

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }

// ── 1. Stats ──────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const today = startOfToday();
    const monthStart = startOfMonth();

    const [processedToday, receivedToday, pendingTrfs, receivedThisMonth] = await Promise.all([
      // TRFs processed today (samples this user received/processed today)
      db.Sample.count({ where: { receivedBy: userId, createdAt: { [Op.gte]: today } } }),
      // Samples in received status today
      db.Sample.count({ where: { receivedBy: userId, status: 'received', createdAt: { [Op.gte]: today } } }),
      // Pending TRFs — samples in received status not yet booked (global for this location)
      db.Sample.count({ where: { status: 'received' } }),
      // Total processed this month
      db.Sample.count({ where: { receivedBy: userId, createdAt: { [Op.gte]: monthStart } } }),
    ]);

    // Avg processing time today (minutes between sample receivedDate and createdAt)
    const todaySamples = await db.Sample.findAll({
      where: { receivedBy: userId, createdAt: { [Op.gte]: today } },
      attributes: ['receivedDate', 'createdAt'],
      raw: true,
    });
    let avgProcessingTime = 0;
    if (todaySamples.length > 0) {
      let totalMins = 0;
      for (const s of todaySamples) {
        const received = new Date(s.receivedDate || s.createdAt);
        const created = new Date(s.createdAt);
        totalMins += Math.max(0, (created - received) / 60000);
      }
      avgProcessingTime = Math.round((totalMins / todaySamples.length) * 10) / 10;
    }

    // Approval rate — samples that moved past received status / total processed this month
    const bookedThisMonth = await db.Sample.count({
      where: {
        receivedBy: userId,
        createdAt: { [Op.gte]: monthStart },
        status: { [Op.notIn]: ['received'] },
      },
    });
    const approvalRate = receivedThisMonth > 0
      ? Math.round((bookedThisMonth / receivedThisMonth) * 1000) / 10
      : 100;

    return success(res, {
      processedToday,
      receivedToday,
      pendingTrfs,
      avgProcessingTime,
      approvalRate,
    });
  } catch (err) {
    console.error('Reception stats error:', err);
    return error(res, 'Failed to load stats.', 500);
  }
};

// ── 2. TRF Queue ──────────────────────────────────────────

const getTrfQueue = async (req, res) => {
  try {
    // Samples in 'received' status awaiting further action (booking)
    const samples = await db.Sample.findAll({
      where: { status: 'received' },
      include: [
        { model: db.Client, as: 'client', attributes: ['id', 'name', 'code'] },
        { model: db.ProductType, as: 'productType', attributes: ['id', 'name'] },
      ],
      order: [
        [db.sequelize.literal("CASE WHEN priority = 'express' THEN 0 WHEN priority = 'urgent' THEN 1 ELSE 2 END"), 'ASC'],
        ['receivedDate', 'ASC'],
      ],
      limit: 30,
    });

    const now = new Date();
    const queue = samples.map((s) => {
      const json = s.toJSON();
      const receivedAt = new Date(json.receivedDate || json.createdAt);
      const waitMinutes = Math.round((now - receivedAt) / 60000);

      return {
        id: json.id,
        sampleCode: json.sampleCode,
        client: json.client?.name || '-',
        clientCode: json.client?.code || '-',
        isNewClient: !json.client?.code, // no code = potentially new client
        description: json.description,
        productType: json.productType?.name || '-',
        priority: (json.priority || 'normal').toUpperCase(),
        condition: json.condition,
        receivedDate: json.receivedDate,
        waitMinutes,
      };
    });

    return success(res, queue);
  } catch (err) {
    console.error('Reception TRF queue error:', err);
    return error(res, 'Failed to load TRF queue.', 500);
  }
};

// ── 3. Received Samples ───────────────────────────────────

const getReceivedSamples = async (req, res) => {
  try {
    const userId = req.userId;

    const samples = await db.Sample.findAll({
      where: { receivedBy: userId },
      include: [
        { model: db.Client, as: 'client', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 15,
    });

    const data = samples.map((s) => {
      const json = s.toJSON();
      return {
        id: json.id,
        sampleCode: json.sampleCode,
        client: json.client?.name || '-',
        description: json.description,
        condition: json.condition,
        priority: (json.priority || 'normal').toUpperCase(),
        status: json.status.toUpperCase(),
        receivedDate: json.receivedDate || json.createdAt,
      };
    });

    return success(res, data);
  } catch (err) {
    console.error('Reception received samples error:', err);
    return error(res, 'Failed to load received samples.', 500);
  }
};

// ── 4. KPIs + KRAs ───────────────────────────────────────

const getKpisAndKras = async (req, res) => {
  try {
    const userId = req.userId;
    const today = startOfToday();
    const monthStart = startOfMonth();

    // Monthly data
    const monthSamples = await db.Sample.findAll({
      where: { receivedBy: userId, createdAt: { [Op.gte]: monthStart } },
      attributes: ['id', 'receivedDate', 'createdAt', 'status', 'condition', 'clientId', 'description', 'batchNumber'],
      raw: true,
    });

    const todaySamples = monthSamples.filter((s) => new Date(s.createdAt) >= today);

    // KPI 1: TRFs Processed / Day (today's count)
    const trfsProcessedToday = todaySamples.length;

    // KPI 2: Avg Processing Time (minutes) — today
    let avgTime = 0;
    if (todaySamples.length > 0) {
      let total = 0;
      for (const s of todaySamples) {
        const r = new Date(s.receivedDate || s.createdAt);
        const c = new Date(s.createdAt);
        total += Math.max(0, (c - r) / 60000);
      }
      avgTime = Math.round((total / todaySamples.length) * 10) / 10;
    }

    // KPI 3: Approval Accuracy — % of samples that moved past received without issues
    const totalMonth = monthSamples.length;
    const movedPastReceived = monthSamples.filter((s) => s.status !== 'received').length;
    const approvalAccuracy = totalMonth > 0 ? Math.round((movedPastReceived / totalMonth) * 1000) / 10 : 100;

    // KPI 4: Pending TRFs
    const pendingCount = await db.Sample.count({ where: { status: 'received' } });

    // KPI 5: New Client Activations this month (unique new clients from samples this month)
    const clientIds = [...new Set(monthSamples.map((s) => s.clientId).filter(Boolean))];
    // Count clients created this month (new clients)
    let newClientCount = 0;
    if (clientIds.length > 0) {
      newClientCount = await db.Client.count({
        where: { id: { [Op.in]: clientIds }, createdAt: { [Op.gte]: monthStart } },
      });
    }

    const kpis = [
      { key: 'trfs_processed', label: 'TRFs Processed / Day', actual: trfsProcessedToday, target: 30, unit: '', inverse: false },
      { key: 'avg_time', label: 'Avg Processing Time', actual: avgTime, target: 10, unit: 'mins', inverse: true },
      { key: 'approval_accuracy', label: 'Approval Accuracy', actual: approvalAccuracy, target: 99, unit: '%', inverse: false },
      { key: 'pending_trfs', label: 'Pending TRFs', actual: pendingCount, target: 0, unit: '', inverse: true },
      { key: 'new_clients', label: 'New Client Activations', actual: newClientCount, target: 0, unit: '', inverse: false },
    ];

    // KRAs
    // 1. Processing Accuracy (30%) — samples processed without condition issues
    const withoutIssues = monthSamples.filter((s) => s.condition === 'intact' || !s.condition).length;
    const processingAccuracy = totalMonth > 0 ? Math.round((withoutIssues / totalMonth) * 1000) / 10 : 100;

    // 2. Processing Speed (25%) — % processed within 10 minutes
    let withinTarget = 0;
    for (const s of monthSamples) {
      const r = new Date(s.receivedDate || s.createdAt);
      const c = new Date(s.createdAt);
      if ((c - r) / 60000 <= 10) withinTarget++;
    }
    const processingSpeed = totalMonth > 0 ? Math.round((withinTarget / totalMonth) * 1000) / 10 : 100;

    // 3. Client Verification (25%) — % of samples with valid client assigned
    const withClient = monthSamples.filter((s) => s.clientId).length;
    const clientVerification = totalMonth > 0 ? Math.round((withClient / totalMonth) * 1000) / 10 : 100;

    // 4. Documentation Compliance (20%) — % with all required fields filled
    const compliant = monthSamples.filter((s) => s.clientId && s.description && s.description.trim() !== '').length;
    const docCompliance = totalMonth > 0 ? Math.round((compliant / totalMonth) * 1000) / 10 : 100;

    const kras = [
      { key: 'processing_accuracy', label: 'Processing Accuracy', target: '99%', actual: processingAccuracy, score: Math.min(100, (processingAccuracy / 99) * 100), weight: 30, inverse: false },
      { key: 'processing_speed', label: 'Processing Speed', target: '95%', actual: processingSpeed, score: Math.min(100, (processingSpeed / 95) * 100), weight: 25, inverse: false },
      { key: 'client_verification', label: 'Client Verification', target: '90%', actual: clientVerification, score: Math.min(100, (clientVerification / 90) * 100), weight: 25, inverse: false },
      { key: 'doc_compliance', label: 'Documentation Compliance', target: '100%', actual: docCompliance, score: Math.min(100, (docCompliance / 100) * 100), weight: 20, inverse: false },
    ];

    const overallKraScore = Math.round(kras.reduce((sum, k) => sum + k.score * (k.weight / 100), 0) * 10) / 10;

    return success(res, { kpis, kras, overallKraScore });
  } catch (err) {
    console.error('Reception KPIs error:', err);
    return error(res, 'Failed to load KPIs.', 500);
  }
};

// ── 5. Alerts ─────────────────────────────────────────────

const getAlerts = async (req, res) => {
  try {
    const alerts = [];

    // Urgent/Express TRFs waiting
    const urgentTrfs = await db.Sample.count({
      where: { status: 'received', priority: { [Op.in]: ['urgent', 'express'] } },
    });
    if (urgentTrfs > 0) {
      alerts.push({ type: 'urgent_trf', severity: 'red', message: `${urgentTrfs} urgent/express TRF(s) awaiting action`, count: urgentTrfs });
    }

    // Damaged samples received today
    const damaged = await db.Sample.count({
      where: {
        status: 'received',
        condition: { [Op.in]: ['damaged', 'temperature_deviation', 'leaking'] },
      },
    });
    if (damaged > 0) {
      alerts.push({ type: 'damaged', severity: 'amber', message: `${damaged} sample(s) received in damaged/compromised condition`, count: damaged });
    }

    // Long-waiting TRFs (> 2 hours in received status)
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
    const longWaiting = await db.Sample.count({
      where: { status: 'received', receivedDate: { [Op.lt]: twoHoursAgo } },
    });
    if (longWaiting > 0) {
      alerts.push({ type: 'long_wait', severity: 'amber', message: `${longWaiting} sample(s) waiting over 2 hours for processing`, count: longWaiting });
    }

    return success(res, alerts);
  } catch (err) {
    console.error('Reception alerts error:', err);
    return error(res, 'Failed to load alerts.', 500);
  }
};

// ── 6. Recent Activity ────────────────────────────────────

const getRecentActivity = async (req, res) => {
  try {
    const userId = req.userId;

    // Recent samples handled by this user
    const samples = await db.Sample.findAll({
      where: { receivedBy: userId },
      include: [
        { model: db.Client, as: 'client', attributes: ['name'] },
      ],
      attributes: ['id', 'sampleCode', 'description', 'status', 'priority', 'condition', 'createdAt', 'receivedDate'],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    const data = samples.map((s) => {
      const json = s.toJSON();
      return {
        id: json.id,
        sampleCode: json.sampleCode,
        client: json.client?.name || '-',
        description: json.description,
        status: json.status.toUpperCase(),
        priority: (json.priority || 'normal').toUpperCase(),
        condition: json.condition,
        timestamp: json.createdAt,
      };
    });

    return success(res, data);
  } catch (err) {
    console.error('Reception activity error:', err);
    return error(res, 'Failed to load activity.', 500);
  }
};

module.exports = { getStats, getTrfQueue, getReceivedSamples, getKpisAndKras, getAlerts, getRecentActivity };
