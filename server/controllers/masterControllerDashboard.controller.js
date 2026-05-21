const { Op } = require('sequelize');
const db = require('../models');
const { success, error } = require('../utils/response');

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }

const MASTER_ENTITIES = ['TestMaster', 'TestParameter', 'Standard', 'ProductType', 'Specification'];

// ── 1. Stats (creation + approval combined) ───────────────

const getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const today = startOfToday();
    const monthStart = startOfMonth();

    const [stpsCreatedToday, analytesToday, approvedToday, rejectedToday, pendingItems, totalTests] = await Promise.all([
      // Creation stats (same as Master Personnel)
      db.AuditLog.count({ where: { userId, entity: 'TestMaster', action: 'create', createdAt: { [Op.gte]: today } } }),
      db.AuditLog.count({ where: { userId, entity: 'TestParameter', action: 'create', createdAt: { [Op.gte]: today } } }),
      // Approval stats
      db.AuditLog.count({ where: { userId, action: 'approve', entity: { [Op.in]: MASTER_ENTITIES }, createdAt: { [Op.gte]: today } } }),
      db.AuditLog.count({ where: { userId, action: 'reject', entity: { [Op.in]: MASTER_ENTITIES }, createdAt: { [Op.gte]: today } } }),
      // Pending (incomplete STPs)
      db.TestMaster.count({ where: { isActive: true, [Op.or]: [{ specification: null }, { specification: '' }, { method: null }, { method: '' }] } }),
      db.TestMaster.count({ where: { isActive: true } }),
    ]);

    // Data completeness
    const complete = await db.TestMaster.count({
      where: {
        isActive: true,
        method: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        specification: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        minLimit: { [Op.ne]: null },
        maxLimit: { [Op.ne]: null },
        standardId: { [Op.ne]: null },
      },
    });
    const dataCompleteness = totalTests > 0 ? Math.round((complete / totalTests) * 1000) / 10 : 100;

    return success(res, {
      stpsCreatedToday,
      analytesToday,
      approvedToday,
      rejectedToday,
      pendingItems,
      dataCompleteness,
    });
  } catch (err) {
    console.error('MasterController stats error:', err);
    return error(res, 'Failed to load stats.', 500);
  }
};

// ── 2. Approval Queue ─────────────────────────────────────

const getApprovalQueue = async (req, res) => {
  try {
    const tests = await db.TestMaster.findAll({
      where: { isActive: true },
      include: [
        { model: db.Department, as: 'department', attributes: ['name', 'code'] },
        { model: db.Standard, as: 'standard', attributes: ['name', 'code'] },
        { model: db.TestParameter, as: 'parameters', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    const data = tests.map((t) => {
      const json = t.toJSON();
      const issues = [];
      if (!json.method || json.method === '') issues.push('No method');
      if (!json.specification || json.specification === '') issues.push('No specification');
      if (!json.standardId) issues.push('No standard');
      if (!json.minLimit && !json.maxLimit) issues.push('No limits');
      if (!json.parameters || json.parameters.length === 0) issues.push('No parameters');

      return {
        id: json.id,
        name: json.name,
        code: json.code,
        department: json.department?.name || '-',
        standard: json.standard?.name || 'Not linked',
        paramCount: json.parameters?.length || 0,
        hasMethod: !!json.method && json.method !== '',
        hasSpec: !!json.specification && json.specification !== '',
        hasLimits: !!json.minLimit || !!json.maxLimit,
        isAccredited: json.isAccredited,
        issues,
        createdAt: json.createdAt,
      };
    });

    return success(res, data);
  } catch (err) {
    console.error('MasterController queue error:', err);
    return error(res, 'Failed to load approval queue.', 500);
  }
};

// ── 3. KPIs + KRAs (creation + approval combined) ────────

const getKpisAndKras = async (req, res) => {
  try {
    const userId = req.userId;
    const monthStart = startOfMonth();

    // Creation metrics (same as Master Personnel)
    const stpsMonth = await db.AuditLog.count({ where: { userId, entity: 'TestMaster', action: 'create', createdAt: { [Op.gte]: monthStart } } });
    const analytesMonth = await db.AuditLog.count({ where: { userId, entity: 'TestParameter', action: 'create', createdAt: { [Op.gte]: monthStart } } });

    // Approval metrics
    const approvedMonth = await db.AuditLog.count({ where: { userId, action: 'approve', entity: { [Op.in]: MASTER_ENTITIES }, createdAt: { [Op.gte]: monthStart } } });
    const rejectedMonth = await db.AuditLog.count({ where: { userId, action: 'reject', entity: { [Op.in]: MASTER_ENTITIES }, createdAt: { [Op.gte]: monthStart } } });
    const totalReviewed = approvedMonth + rejectedMonth;

    // Pending
    const pendingCount = await db.TestMaster.count({ where: { isActive: true, [Op.or]: [{ specification: null }, { specification: '' }, { method: null }, { method: '' }] } });

    // Data quality
    const totalTests = await db.TestMaster.count({ where: { isActive: true } });
    const fullyComplete = await db.TestMaster.count({
      where: {
        isActive: true,
        name: { [Op.ne]: '' }, code: { [Op.ne]: null },
        method: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        specification: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        minLimit: { [Op.ne]: null }, maxLimit: { [Op.ne]: null },
        standardId: { [Op.ne]: null },
      },
    });
    const dataCompleteness = totalTests > 0 ? Math.round((fullyComplete / totalTests) * 1000) / 10 : 100;

    // NABL + standards compliance
    const accredited = await db.TestMaster.count({ where: { isActive: true, isAccredited: true } });
    const nablPct = totalTests > 0 ? Math.round((accredited / totalTests) * 1000) / 10 : 100;
    const withStandard = await db.TestMaster.count({ where: { isActive: true, standardId: { [Op.ne]: null } } });
    const standardsPct = totalTests > 0 ? Math.round((withStandard / totalTests) * 1000) / 10 : 100;

    const kpis = [
      { key: 'stps_created', label: 'STPs Created / Month', actual: stpsMonth, target: 50, unit: '', inverse: false },
      { key: 'analytes_added', label: 'Analytes Added / Month', actual: analytesMonth, target: 100, unit: '', inverse: false },
      { key: 'reviews_completed', label: 'Reviews Completed / Month', actual: totalReviewed, target: 80, unit: '', inverse: false },
      { key: 'pending_items', label: 'Pending Items', actual: pendingCount, target: 0, unit: '', inverse: true },
      { key: 'data_completeness', label: 'Data Completeness', actual: dataCompleteness, target: 100, unit: '%', inverse: false },
    ];

    // KRAs — covers both creation and approval
    const stpThroughput = Math.min(100, Math.round((stpsMonth / 50) * 1000) / 10);
    const reviewThroughput = Math.min(100, Math.round((totalReviewed / 80) * 1000) / 10);

    const kras = [
      { key: 'data_quality', label: 'Data Quality', target: '98%', actual: dataCompleteness, score: Math.min(100, (dataCompleteness / 98) * 100), weight: 30, inverse: false },
      { key: 'stp_throughput', label: 'STP Throughput', target: '50/mo', actual: stpThroughput, score: stpThroughput, weight: 20, inverse: false },
      { key: 'review_throughput', label: 'Review Throughput', target: '80/mo', actual: reviewThroughput, score: reviewThroughput, weight: 20, inverse: false },
      { key: 'nabl_compliance', label: 'NABL Compliance', target: '100%', actual: nablPct, score: Math.min(100, nablPct), weight: 15, inverse: false },
      { key: 'standards_compliance', label: 'Standards Compliance', target: '100%', actual: standardsPct, score: Math.min(100, standardsPct), weight: 15, inverse: false },
    ];

    const overallKraScore = Math.round(kras.reduce((sum, k) => sum + k.score * (k.weight / 100), 0) * 10) / 10;

    return success(res, { kpis, kras, overallKraScore });
  } catch (err) {
    console.error('MasterController KPIs error:', err);
    return error(res, 'Failed to load KPIs.', 500);
  }
};

// ── 4. Alerts ─────────────────────────────────────────────

const getAlerts = async (req, res) => {
  try {
    const alerts = [];

    const incomplete = await db.TestMaster.count({ where: { isActive: true, [Op.or]: [{ specification: null }, { specification: '' }, { method: null }, { method: '' }] } });
    if (incomplete > 0) alerts.push({ type: 'incomplete', severity: 'amber', message: `${incomplete} STP(s) missing specification or method`, count: incomplete });

    const noStandard = await db.TestMaster.count({ where: { isActive: true, standardId: null } });
    if (noStandard > 0) alerts.push({ type: 'no_standard', severity: 'red', message: `${noStandard} test(s) not linked to any standard`, count: noStandard });

    const notAccredited = await db.TestMaster.count({ where: { isActive: true, isAccredited: false } });
    if (notAccredited > 0) alerts.push({ type: 'not_nabl', severity: 'amber', message: `${notAccredited} test(s) not NABL accredited`, count: notAccredited });

    const noParams = await db.TestMaster.count({
      where: { isActive: true, '$parameters.id$': null },
      include: [{ model: db.TestParameter, as: 'parameters', attributes: ['id'], required: false }],
    });
    if (noParams > 0) alerts.push({ type: 'no_params', severity: 'amber', message: `${noParams} test(s) have no parameters defined`, count: noParams });

    return success(res, alerts);
  } catch (err) {
    console.error('MasterController alerts error:', err);
    return error(res, 'Failed to load alerts.', 500);
  }
};

// ── 5. Recent Activity (creation + reviews combined) ──────

const getRecentActivity = async (req, res) => {
  try {
    const userId = req.userId;

    const logs = await db.AuditLog.findAll({
      where: { userId, entity: { [Op.in]: MASTER_ENTITIES } },
      attributes: ['id', 'action', 'entity', 'entityId', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 15,
    });

    const data = logs.map((l) => {
      const json = l.toJSON();
      return {
        id: json.id,
        action: json.action,
        entity: json.entity,
        entityId: json.entityId,
        timestamp: json.createdAt,
        description: `${json.action.charAt(0).toUpperCase() + json.action.slice(1)}d ${json.entity.replace(/([A-Z])/g, ' $1').trim()} #${json.entityId}`,
      };
    });

    return success(res, data);
  } catch (err) {
    console.error('MasterController activity error:', err);
    return error(res, 'Failed to load activity.', 500);
  }
};

module.exports = { getStats, getApprovalQueue, getKpisAndKras, getAlerts, getRecentActivity };
