const { Op } = require('sequelize');
const db = require('../models');
const { success, error } = require('../utils/response');

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }

const MASTER_ENTITIES = ['TestMaster', 'TestParameter', 'Standard', 'ProductType', 'Specification', 'SpecificationParameter', 'RateMaster'];

// ── 1. Stats ──────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const userId = req.userId;
    const today = startOfToday();

    // Activity from AuditLog
    const [stpsToday, analytesToday, totalActiveStps, incompleteStps, totalTests] = await Promise.all([
      // STPs created today by this user
      db.AuditLog.count({ where: { userId, entity: 'TestMaster', action: 'create', createdAt: { [Op.gte]: today } } }),
      // Analytes/parameters added today by this user
      db.AuditLog.count({ where: { userId, entity: 'TestParameter', action: 'create', createdAt: { [Op.gte]: today } } }),
      // Total active STPs system-wide
      db.TestMaster.count({ where: { isActive: true } }),
      // Incomplete STPs (missing specification or method)
      db.TestMaster.count({
        where: {
          isActive: true,
          [Op.or]: [
            { specification: null }, { specification: '' },
            { method: null }, { method: '' },
          ],
        },
      }),
      // Total tests with all fields
      db.TestMaster.count({ where: { isActive: true } }),
    ]);

    // Data completeness — % of test masters with required fields filled
    const complete = await db.TestMaster.count({
      where: {
        isActive: true,
        name: { [Op.ne]: '' },
        code: { [Op.ne]: null },
        method: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        unit: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        departmentId: { [Op.ne]: null },
      },
    });
    const dataCompleteness = totalTests > 0 ? Math.round((complete / totalTests) * 1000) / 10 : 100;

    return success(res, {
      stpsCreatedToday: stpsToday,
      analytesAddedToday: analytesToday,
      totalActiveStps: totalActiveStps,
      incompleteStps,
      dataCompleteness,
    });
  } catch (err) {
    console.error('Master stats error:', err);
    return error(res, 'Failed to load stats.', 500);
  }
};

// ── 2. Recent Activity ────────────────────────────────────

const getRecentActivity = async (req, res) => {
  try {
    const userId = req.userId;

    const logs = await db.AuditLog.findAll({
      where: {
        userId,
        entity: { [Op.in]: MASTER_ENTITIES },
      },
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
    console.error('Master activity error:', err);
    return error(res, 'Failed to load activity.', 500);
  }
};

// ── 3. KPIs + KRAs ───────────────────────────────────────

const getKpisAndKras = async (req, res) => {
  try {
    const userId = req.userId;
    const monthStart = startOfMonth();

    // Monthly counts from AuditLog
    const [stpsMonth, analytesMonth, methodsMonth] = await Promise.all([
      db.AuditLog.count({ where: { userId, entity: 'TestMaster', action: 'create', createdAt: { [Op.gte]: monthStart } } }),
      db.AuditLog.count({ where: { userId, entity: 'TestParameter', action: 'create', createdAt: { [Op.gte]: monthStart } } }),
      db.AuditLog.count({ where: { userId, entity: 'TestMaster', action: 'update', createdAt: { [Op.gte]: monthStart } } }),
    ]);

    // Pending STPs
    const pendingStps = await db.TestMaster.count({
      where: {
        isActive: true,
        [Op.or]: [
          { specification: null }, { specification: '' },
          { method: null }, { method: '' },
        ],
      },
    });

    // Data completeness
    const totalTests = await db.TestMaster.count({ where: { isActive: true } });
    const complete = await db.TestMaster.count({
      where: {
        isActive: true,
        name: { [Op.ne]: '' },
        code: { [Op.ne]: null },
        method: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        unit: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        departmentId: { [Op.ne]: null },
      },
    });
    const dataCompleteness = totalTests > 0 ? Math.round((complete / totalTests) * 1000) / 10 : 100;

    const kpis = [
      { key: 'stps_created', label: 'STPs Created / Month', actual: stpsMonth, target: 50, unit: '', inverse: false },
      { key: 'analytes_added', label: 'Analytes Added / Month', actual: analytesMonth, target: 100, unit: '', inverse: false },
      { key: 'methods_uploaded', label: 'Methods Updated / Month', actual: methodsMonth, target: 30, unit: '', inverse: false },
      { key: 'pending_stps', label: 'Pending STPs', actual: pendingStps, target: 0, unit: '', inverse: true },
      { key: 'data_completeness', label: 'Data Completeness', actual: dataCompleteness, target: 100, unit: '%', inverse: false },
    ];

    // KRAs
    // 1. Data Quality (35%) — % with complete spec + method + limits
    const withFullData = await db.TestMaster.count({
      where: {
        isActive: true,
        specification: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        method: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
        minLimit: { [Op.ne]: null },
        maxLimit: { [Op.ne]: null },
      },
    });
    const dataQuality = totalTests > 0 ? Math.round((withFullData / totalTests) * 1000) / 10 : 100;

    // 2. STP Throughput (25%)
    const throughput = Math.min(100, Math.round((stpsMonth / 50) * 1000) / 10);

    // 3. Standards Compliance (20%) — % of tests linked to a standard
    const withStandard = await db.TestMaster.count({
      where: { isActive: true, standardId: { [Op.ne]: null } },
    });
    const standardsCompliance = totalTests > 0 ? Math.round((withStandard / totalTests) * 1000) / 10 : 100;

    // 4. Turnaround (20%) — placeholder
    const turnaround = 95;

    const kras = [
      { key: 'data_quality', label: 'Data Quality', target: '98%', actual: dataQuality, score: Math.min(100, (dataQuality / 98) * 100), weight: 35, inverse: false },
      { key: 'stp_throughput', label: 'STP Throughput', target: '50/mo', actual: throughput, score: throughput, weight: 25, inverse: false },
      { key: 'standards_compliance', label: 'Standards Compliance', target: '100%', actual: standardsCompliance, score: Math.min(100, standardsCompliance), weight: 20, inverse: false },
      { key: 'turnaround', label: 'Turnaround', target: '95%', actual: turnaround, score: Math.min(100, (turnaround / 95) * 100), weight: 20, inverse: false },
    ];

    const overallKraScore = Math.round(kras.reduce((sum, k) => sum + k.score * (k.weight / 100), 0) * 10) / 10;

    return success(res, { kpis, kras, overallKraScore });
  } catch (err) {
    console.error('Master KPIs error:', err);
    return error(res, 'Failed to load KPIs.', 500);
  }
};

// ── 4. Alerts ─────────────────────────────────────────────

const getAlerts = async (req, res) => {
  try {
    const alerts = [];

    // Incomplete STPs
    const incomplete = await db.TestMaster.count({
      where: {
        isActive: true,
        [Op.or]: [
          { specification: null }, { specification: '' },
          { method: null }, { method: '' },
        ],
      },
    });
    if (incomplete > 0) {
      alerts.push({ type: 'incomplete_stp', severity: 'amber', message: `${incomplete} STP(s) missing specification or method`, count: incomplete });
    }

    // Tests without parameters
    const testsWithoutParams = await db.TestMaster.count({
      where: {
        isActive: true,
        '$parameters.id$': null,
      },
      include: [{ model: db.TestParameter, as: 'parameters', attributes: ['id'], required: false }],
    });
    if (testsWithoutParams > 0) {
      alerts.push({ type: 'no_params', severity: 'amber', message: `${testsWithoutParams} test(s) have no parameters defined`, count: testsWithoutParams });
    }

    // Tests not linked to a standard
    const noStandard = await db.TestMaster.count({
      where: { isActive: true, standardId: null },
    });
    if (noStandard > 0) {
      alerts.push({ type: 'no_standard', severity: 'red', message: `${noStandard} test(s) not linked to any standard`, count: noStandard });
    }

    // Tests not accredited
    const notAccredited = await db.TestMaster.count({
      where: { isActive: true, isAccredited: false },
    });
    if (notAccredited > 0) {
      alerts.push({ type: 'not_accredited', severity: 'amber', message: `${notAccredited} test(s) not NABL accredited`, count: notAccredited });
    }

    return success(res, alerts);
  } catch (err) {
    console.error('Master alerts error:', err);
    return error(res, 'Failed to load alerts.', 500);
  }
};

// ── 5. Data Quality Breakdown ─────────────────────────────

const getDataQuality = async (req, res) => {
  try {
    const total = await db.TestMaster.count({ where: { isActive: true } });
    if (total === 0) return success(res, { total: 0, fields: [] });

    const fields = [
      { field: 'Name', filled: await db.TestMaster.count({ where: { isActive: true, name: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } } }) },
      { field: 'Code', filled: await db.TestMaster.count({ where: { isActive: true, code: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } } }) },
      { field: 'Method', filled: await db.TestMaster.count({ where: { isActive: true, method: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } } }) },
      { field: 'Unit', filled: await db.TestMaster.count({ where: { isActive: true, unit: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } } }) },
      { field: 'Department', filled: await db.TestMaster.count({ where: { isActive: true, departmentId: { [Op.ne]: null } } }) },
      { field: 'Specification', filled: await db.TestMaster.count({ where: { isActive: true, specification: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } } }) },
      { field: 'Standard', filled: await db.TestMaster.count({ where: { isActive: true, standardId: { [Op.ne]: null } } }) },
      { field: 'Min Limit', filled: await db.TestMaster.count({ where: { isActive: true, minLimit: { [Op.ne]: null } } }) },
      { field: 'Max Limit', filled: await db.TestMaster.count({ where: { isActive: true, maxLimit: { [Op.ne]: null } } }) },
    ];

    const data = fields.map((f) => ({ ...f, total, percentage: Math.round((f.filled / total) * 1000) / 10 }));

    return success(res, { total, fields: data });
  } catch (err) {
    console.error('Master data quality error:', err);
    return error(res, 'Failed to load data quality.', 500);
  }
};

module.exports = { getStats, getRecentActivity, getKpisAndKras, getAlerts, getDataQuality };
