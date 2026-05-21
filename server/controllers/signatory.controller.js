/**
 * Signatories Module — single controller for masters, authority, substitutes,
 * absences, coverage resolution, and dual-check signing.
 *
 * Plan reference: YLIMS_Signatories_Module_Plan_FINAL.md §5 (signing service)
 *                                                       §6 (resolveActiveSignatory)
 */

const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const {
  SignatoryTemplate,
  SignatoryDiscipline,
  Signatory,
  SignatoryAuthority,
  SignatorySubstitution,
  SignatoryAbsence,
  SignatureAuditLog,
} = db;

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 10);

async function isAbsent(signatoryId, dateISO) {
  const hit = await SignatoryAbsence.findOne({
    where: {
      signatoryId,
      absentFrom: { [Op.lte]: dateISO },
      absentTo:   { [Op.gte]: dateISO },
    },
  });
  return !!hit;
}

/**
 * Coverage resolver — given (template, discipline, unit, date), returns:
 *   { active: signatoryId, authorityId, coveringFor: signatoryId|null, status: 'GREEN'|'AMBER'|'RED' }
 *
 * GREEN: a primary holder is active and not absent
 * AMBER: primary is absent; a substitute (priority-ordered) is active
 * RED:   no qualified signatory available
 */
async function resolveActiveSignatory(templateId, disciplineId, unit, dateISO) {
  const authorities = await SignatoryAuthority.findAll({
    where: {
      templateId,
      disciplineId,
      unit,
      authorityStatus: 'Active',
      authorisedFrom: { [Op.lte]: dateISO },
      authorisedTo:   { [Op.gte]: dateISO },
    },
    order: [['authorisedFrom', 'ASC']],
  });

  if (authorities.length === 0) return { status: 'RED', reason: 'NO_ACTIVE_AUTHORITY' };

  // First try any primary that is not absent — GREEN
  for (const auth of authorities) {
    if (!(await isAbsent(auth.signatoryId, dateISO))) {
      return {
        status: 'GREEN',
        authorityId: auth.id,
        active: auth.signatoryId,
        coveringFor: null,
      };
    }
  }

  // All primaries absent — walk substitute chains in priority order — AMBER
  for (const auth of authorities) {
    const subs = await SignatorySubstitution.findAll({
      where: { primaryAuthorityId: auth.id },
      order: [['priority', 'ASC']],
      include: [{ model: SignatoryAuthority, as: 'substitute' }],
    });
    for (const sub of subs) {
      const subAuth = sub.substitute;
      if (!subAuth) continue;
      const subAbsent = await isAbsent(subAuth.signatoryId, dateISO);
      if (!subAbsent) {
        return {
          status: 'AMBER',
          authorityId: subAuth.id,
          active: subAuth.signatoryId,
          coveringFor: auth.signatoryId,
          priority: sub.priority,
        };
      }
    }
  }

  return { status: 'RED', reason: 'ALL_SUBSTITUTES_UNAVAILABLE' };
}

// ─────────────────────────────────────────────────────────────────────────
// Templates CRUD
// ─────────────────────────────────────────────────────────────────────────

const listTemplates = async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { templateName: { [Op.like]: `%${search}%` } },
        { templateCode: { [Op.like]: `%${search}%` } },
      ];
    }
    if (page && limit) {
      const offset = (page - 1) * limit;
      const { count, rows } = await SignatoryTemplate.findAndCountAll({
        where, offset: +offset, limit: +limit, order: [['templateCode', 'ASC']],
      });
      return paginated(res, rows, page, limit, count);
    }
    const rows = await SignatoryTemplate.findAll({ where, order: [['templateCode', 'ASC']] });
    return success(res, rows);
  } catch (err) { console.error(err); return error(res, 'Failed to list templates'); }
};

const createTemplate = async (req, res) => {
  try {
    const row = await SignatoryTemplate.create(req.body);
    return success(res, row, 'Template created', 201);
  } catch (err) { console.error(err); return error(res, err.message || 'Create failed', 400); }
};

const updateTemplate = async (req, res) => {
  try {
    const row = await SignatoryTemplate.findByPk(req.params.id);
    if (!row) return error(res, 'Template not found', 404);
    await row.update(req.body);
    return success(res, row, 'Template updated');
  } catch (err) { console.error(err); return error(res, err.message || 'Update failed', 400); }
};

const deleteTemplate = async (req, res) => {
  try {
    const row = await SignatoryTemplate.findByPk(req.params.id);
    if (!row) return error(res, 'Template not found', 404);
    await row.destroy();
    return success(res, null, 'Template archived');
  } catch (err) { console.error(err); return error(res, 'Delete failed', 500); }
};

// ─────────────────────────────────────────────────────────────────────────
// Disciplines CRUD
// ─────────────────────────────────────────────────────────────────────────

const listDisciplines = async (_req, res) => {
  try {
    const rows = await SignatoryDiscipline.findAll({ order: [['groupType', 'ASC'], ['disciplineName', 'ASC']] });
    return success(res, rows);
  } catch (err) { console.error(err); return error(res, 'Failed to list disciplines'); }
};

const createDiscipline = async (req, res) => {
  try {
    const row = await SignatoryDiscipline.create(req.body);
    return success(res, row, 'Discipline created', 201);
  } catch (err) { console.error(err); return error(res, err.message || 'Create failed', 400); }
};

const updateDiscipline = async (req, res) => {
  try {
    const row = await SignatoryDiscipline.findByPk(req.params.id);
    if (!row) return error(res, 'Discipline not found', 404);
    await row.update(req.body);
    return success(res, row, 'Discipline updated');
  } catch (err) { console.error(err); return error(res, err.message || 'Update failed', 400); }
};

const deleteDiscipline = async (req, res) => {
  try {
    const row = await SignatoryDiscipline.findByPk(req.params.id);
    if (!row) return error(res, 'Discipline not found', 404);
    await row.destroy();
    return success(res, null, 'Discipline archived');
  } catch (err) { console.error(err); return error(res, 'Delete failed', 500); }
};

// ─────────────────────────────────────────────────────────────────────────
// Signatories CRUD
// ─────────────────────────────────────────────────────────────────────────

const listSignatories = async (req, res) => {
  try {
    const { unit, status, search } = req.query;
    const where = {};
    if (unit) where.unit = unit;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } },
      ];
    }
    const rows = await Signatory.findAll({ where, order: [['fullName', 'ASC']] });
    return success(res, rows);
  } catch (err) { console.error(err); return error(res, 'Failed to list signatories'); }
};

const getSignatoryProfile = async (req, res) => {
  try {
    const sig = await Signatory.findByPk(req.params.id);
    if (!sig) return error(res, 'Signatory not found', 404);

    const authorities = await SignatoryAuthority.findAll({
      where: { signatoryId: sig.id },
      include: [
        { model: SignatoryTemplate, as: 'template' },
        { model: SignatoryDiscipline, as: 'discipline' },
      ],
      order: [['authorisedFrom', 'DESC']],
    });

    const absences = await SignatoryAbsence.findAll({
      where: { signatoryId: sig.id },
      order: [['absentFrom', 'DESC']],
    });

    // History — last 50 audit entries that named this person
    const history = await SignatureAuditLog.findAll({
      where: { [Op.or]: [{ signatoryId: sig.id }, { signedOnBehalfOf: sig.id }] },
      order: [['signedAt', 'DESC']],
      limit: 50,
    });

    // Substitutes covering this signatory's authorities
    const myAuthIds = authorities.map((a) => a.id);
    const subsForMe = myAuthIds.length
      ? await SignatorySubstitution.findAll({
          where: { primaryAuthorityId: { [Op.in]: myAuthIds } },
          include: [{
            model: SignatoryAuthority,
            as: 'substitute',
            include: [{ model: Signatory, as: 'signatory' }],
          }],
          order: [['priority', 'ASC']],
        })
      : [];

    return success(res, {
      signatory: sig,
      authorities,
      absences,
      substitutes: subsForMe,
      history,
    });
  } catch (err) { console.error(err); return error(res, 'Failed to load profile'); }
};

const createSignatory = async (req, res) => {
  try {
    const row = await Signatory.create(req.body);
    return success(res, row, 'Signatory created', 201);
  } catch (err) { console.error(err); return error(res, err.message || 'Create failed', 400); }
};

const updateSignatory = async (req, res) => {
  try {
    const row = await Signatory.findByPk(req.params.id);
    if (!row) return error(res, 'Signatory not found', 404);
    await row.update(req.body);
    return success(res, row, 'Signatory updated');
  } catch (err) { console.error(err); return error(res, err.message || 'Update failed', 400); }
};

const deleteSignatory = async (req, res) => {
  try {
    const row = await Signatory.findByPk(req.params.id);
    if (!row) return error(res, 'Signatory not found', 404);
    await row.destroy();
    return success(res, null, 'Signatory archived');
  } catch (err) { console.error(err); return error(res, 'Delete failed', 500); }
};

// ─────────────────────────────────────────────────────────────────────────
// Authority CRUD
// ─────────────────────────────────────────────────────────────────────────

const listAuthorities = async (req, res) => {
  try {
    const { templateId, disciplineId, unit, signatoryId, status } = req.query;
    const where = {};
    if (templateId)   where.templateId = templateId;
    if (disciplineId) where.disciplineId = disciplineId;
    if (unit)         where.unit = unit;
    if (signatoryId)  where.signatoryId = signatoryId;
    if (status)       where.authorityStatus = status;

    const rows = await SignatoryAuthority.findAll({
      where,
      include: [
        { model: Signatory, as: 'signatory' },
        { model: SignatoryTemplate, as: 'template' },
        { model: SignatoryDiscipline, as: 'discipline' },
      ],
      order: [['authorisedTo', 'ASC']],
    });
    return success(res, rows);
  } catch (err) { console.error(err); return error(res, 'Failed to list authorities'); }
};

const createAuthority = async (req, res) => {
  try {
    const row = await SignatoryAuthority.create(req.body);
    return success(res, row, 'Authority created', 201);
  } catch (err) { console.error(err); return error(res, err.message || 'Create failed', 400); }
};

const updateAuthority = async (req, res) => {
  try {
    const row = await SignatoryAuthority.findByPk(req.params.id);
    if (!row) return error(res, 'Authority not found', 404);
    await row.update(req.body);
    return success(res, row, 'Authority updated');
  } catch (err) { console.error(err); return error(res, err.message || 'Update failed', 400); }
};

const withdrawAuthority = async (req, res) => {
  try {
    const row = await SignatoryAuthority.findByPk(req.params.id);
    if (!row) return error(res, 'Authority not found', 404);
    await row.update({
      authorityStatus: 'Withdrawn',
      withdrawnReason: req.body?.reason || 'Manual withdrawal',
      withdrawnOn: todayISO(),
    });
    return success(res, row, 'Authority withdrawn');
  } catch (err) { console.error(err); return error(res, err.message || 'Withdraw failed', 400); }
};

// ─────────────────────────────────────────────────────────────────────────
// Substitution chain
// ─────────────────────────────────────────────────────────────────────────

const listSubstitutions = async (req, res) => {
  try {
    const where = req.query.primaryAuthorityId
      ? { primaryAuthorityId: req.query.primaryAuthorityId }
      : {};
    const rows = await SignatorySubstitution.findAll({
      where,
      include: [
        { model: SignatoryAuthority, as: 'primary',    include: [{ model: Signatory, as: 'signatory' }] },
        { model: SignatoryAuthority, as: 'substitute', include: [{ model: Signatory, as: 'signatory' }] },
      ],
      order: [['priority', 'ASC']],
    });
    return success(res, rows);
  } catch (err) { console.error(err); return error(res, 'Failed to list substitutions'); }
};

const createSubstitution = async (req, res) => {
  try {
    const { primaryAuthorityId, substituteAuthorityId, priority } = req.body;
    // App-layer constraint: substitute authority must match primary on (template, discipline, unit)
    const primary = await SignatoryAuthority.findByPk(primaryAuthorityId);
    const sub = await SignatoryAuthority.findByPk(substituteAuthorityId);
    if (!primary || !sub) return error(res, 'Authority not found', 404);
    if (primary.templateId !== sub.templateId
      || primary.disciplineId !== sub.disciplineId
      || primary.unit !== sub.unit) {
      return error(res, 'Substitute must match the primary on template, discipline and unit', 400);
    }
    if (primary.signatoryId === sub.signatoryId) {
      return error(res, 'Substitute cannot be the same person as the primary', 400);
    }
    const row = await SignatorySubstitution.create({ primaryAuthorityId, substituteAuthorityId, priority });
    return success(res, row, 'Substitution created', 201);
  } catch (err) { console.error(err); return error(res, err.message || 'Create failed', 400); }
};

const deleteSubstitution = async (req, res) => {
  try {
    const row = await SignatorySubstitution.findByPk(req.params.id);
    if (!row) return error(res, 'Substitution not found', 404);
    await row.destroy();
    return success(res, null, 'Substitution removed');
  } catch (err) { console.error(err); return error(res, 'Delete failed', 500); }
};

// ─────────────────────────────────────────────────────────────────────────
// Absences
// ─────────────────────────────────────────────────────────────────────────

const listAbsences = async (req, res) => {
  try {
    const { signatoryId, from, to } = req.query;
    const where = {};
    if (signatoryId) where.signatoryId = signatoryId;
    if (from) where.absentTo = { [Op.gte]: from };
    if (to)   where.absentFrom = { ...(where.absentFrom || {}), [Op.lte]: to };
    const rows = await SignatoryAbsence.findAll({
      where,
      include: [{ model: Signatory, as: 'signatory' }],
      order: [['absentFrom', 'DESC']],
    });
    return success(res, rows);
  } catch (err) { console.error(err); return error(res, 'Failed to list absences'); }
};

const createAbsence = async (req, res) => {
  try {
    const row = await SignatoryAbsence.create({ ...req.body, source: req.body.source || 'MANUAL' });
    return success(res, row, 'Absence recorded', 201);
  } catch (err) { console.error(err); return error(res, err.message || 'Create failed', 400); }
};

const deleteAbsence = async (req, res) => {
  try {
    const row = await SignatoryAbsence.findByPk(req.params.id);
    if (!row) return error(res, 'Absence not found', 404);
    await row.destroy();
    return success(res, null, 'Absence removed');
  } catch (err) { console.error(err); return error(res, 'Delete failed', 500); }
};

// ─────────────────────────────────────────────────────────────────────────
// Authority Matrix grid (Screen 1)
// ─────────────────────────────────────────────────────────────────────────

const matrix = async (req, res) => {
  try {
    const unit = req.query.unit || 'Delhi';
    const date = req.query.date || todayISO();

    const [templates, disciplines, signatories, authorities] = await Promise.all([
      SignatoryTemplate.findAll({ where: { status: 'Active' }, order: [['templateCode', 'ASC']] }),
      SignatoryDiscipline.findAll({ where: { status: 'Active' }, order: [['groupType', 'ASC'], ['disciplineName', 'ASC']] }),
      Signatory.findAll({ where: { unit, status: 'Active' }, order: [['fullName', 'ASC']] }),
      SignatoryAuthority.findAll({
        where: {
          unit,
          authorityStatus: 'Active',
          authorisedFrom: { [Op.lte]: date },
          authorisedTo:   { [Op.gte]: date },
        },
      }),
    ]);

    return success(res, { unit, date, templates, disciplines, signatories, authorities });
  } catch (err) { console.error(err); return error(res, 'Failed to load matrix'); }
};

// ─────────────────────────────────────────────────────────────────────────
// Today's Coverage (Screen 4)
// ─────────────────────────────────────────────────────────────────────────

const coverage = async (req, res) => {
  try {
    const unit = req.query.unit || 'Delhi';
    const date = req.query.date || todayISO();

    const [templates, disciplines] = await Promise.all([
      SignatoryTemplate.findAll({ where: { status: 'Active' }, order: [['templateCode', 'ASC']] }),
      SignatoryDiscipline.findAll({ where: { status: 'Active' }, order: [['groupType', 'ASC'], ['disciplineName', 'ASC']] }),
    ]);

    const cells = [];
    for (const t of templates) {
      for (const d of disciplines) {
        // Skip pairs that have no authority at all (keep grid concise)
        const hasAny = await SignatoryAuthority.count({
          where: { templateId: t.id, disciplineId: d.id, unit, authorityStatus: 'Active' },
        });
        if (!hasAny) continue;
        const r = await resolveActiveSignatory(t.id, d.id, unit, date);
        cells.push({
          templateId: t.id, templateCode: t.templateCode, templateName: t.templateName,
          disciplineId: d.id, disciplineCode: d.disciplineCode, disciplineName: d.disciplineName,
          ...r,
        });
      }
    }

    // Hydrate signatory names
    const sigIds = [...new Set(cells.flatMap((c) => [c.active, c.coveringFor]).filter(Boolean))];
    const sigs = sigIds.length
      ? await Signatory.findAll({ where: { id: { [Op.in]: sigIds } } })
      : [];
    const sigById = new Map(sigs.map((s) => [s.id, s]));
    const enriched = cells.map((c) => ({
      ...c,
      activeName: c.active ? sigById.get(c.active)?.fullName : null,
      coveringForName: c.coveringFor ? sigById.get(c.coveringFor)?.fullName : null,
    }));

    const summary = {
      green: enriched.filter((c) => c.status === 'GREEN').length,
      amber: enriched.filter((c) => c.status === 'AMBER').length,
      red:   enriched.filter((c) => c.status === 'RED').length,
    };

    return success(res, { unit, date, summary, cells: enriched });
  } catch (err) { console.error(err); return error(res, 'Failed to compute coverage'); }
};

// Coverage point query (used by signing screen + Template view)
const coveragePoint = async (req, res) => {
  try {
    const { templateId, disciplineId, unit = 'Delhi', date } = req.query;
    if (!templateId || !disciplineId) return error(res, 'templateId and disciplineId are required', 400);
    const r = await resolveActiveSignatory(+templateId, +disciplineId, unit, date || todayISO());

    const sigIds = [r.active, r.coveringFor].filter(Boolean);
    const sigs = sigIds.length
      ? await Signatory.findAll({ where: { id: { [Op.in]: sigIds } } })
      : [];
    const sigById = new Map(sigs.map((s) => [s.id, s]));
    return success(res, {
      ...r,
      activeName: r.active ? sigById.get(r.active)?.fullName : null,
      coveringForName: r.coveringFor ? sigById.get(r.coveringFor)?.fullName : null,
    });
  } catch (err) { console.error(err); return error(res, 'Failed to resolve coverage'); }
};

// ─────────────────────────────────────────────────────────────────────────
// Audit log feed
// ─────────────────────────────────────────────────────────────────────────

const auditFeed = async (req, res) => {
  try {
    const { signatoryId, reportId, result, page = 1, limit = 50 } = req.query;
    const where = {};
    if (signatoryId) where[Op.or] = [{ signatoryId }, { signedOnBehalfOf: signatoryId }];
    if (reportId) where.reportId = reportId;
    if (result) where.result = result;
    const offset = (page - 1) * limit;
    const { count, rows } = await SignatureAuditLog.findAndCountAll({
      where,
      include: [
        { model: Signatory, as: 'signatory' },
        { model: Signatory, as: 'principal' },
        { model: SignatoryTemplate, as: 'template' },
        { model: SignatoryDiscipline, as: 'discipline' },
      ],
      order: [['signedAt', 'DESC']],
      offset: +offset, limit: +limit,
    });
    return paginated(res, rows, page, limit, count);
  } catch (err) { console.error(err); return error(res, 'Failed to load audit log'); }
};

// ─────────────────────────────────────────────────────────────────────────
// Dual-check signing
// ─────────────────────────────────────────────────────────────────────────

async function logSignature(payload) {
  try { await SignatureAuditLog.create(payload); } catch (e) { console.error('audit log fail', e); }
}

const signReport = async (req, res) => {
  const { reportId } = req.params;
  const { templateId, disciplineId, signatureMethod = 'INTERNAL_HASH' } = req.body;
  const userId = req.user?.id;
  const ip = req.ip;
  const ua = req.get('user-agent') || '';

  try {
    if (!templateId || !disciplineId) return error(res, 'templateId and disciplineId are required', 400);

    // CHECK 1 — permission gate (skipped here when role has admin/qa; full RBAC integration is the
    // can_sign permission column on RolePermission; that's wired via requirePermission middleware
    // at the route layer in production builds).
    const allowedRoles = ['admin', 'lab_head', 'qa', 'reviewer', 'approver'];
    if (!allowedRoles.includes(req.user?.role)) {
      await logSignature({
        reportId, templateId, disciplineId, signatoryId: null, authorityId: null,
        signedOnBehalfOf: null, signatureMethod, signatureHash: null,
        ipAddress: ip, userAgent: ua, result: 'REJECTED', rejectReason: 'PERMISSION_DENIED',
      });
      return error(res, 'PERMISSION_DENIED', 403);
    }

    // CHECK 2 — signatory authority
    const signatory = await Signatory.findOne({ where: { userId } });
    if (!signatory || signatory.status !== 'Active') {
      await logSignature({
        reportId, templateId, disciplineId, signatoryId: null, authorityId: null,
        signedOnBehalfOf: null, signatureMethod, signatureHash: null,
        ipAddress: ip, userAgent: ua, result: 'REJECTED', rejectReason: 'NOT_A_REGISTERED_SIGNATORY',
      });
      return error(res, 'NOT_A_REGISTERED_SIGNATORY', 403);
    }

    const today = todayISO();
    const authority = await SignatoryAuthority.findOne({
      where: {
        signatoryId: signatory.id,
        templateId, disciplineId, unit: signatory.unit,
        authorityStatus: 'Active',
        authorisedFrom: { [Op.lte]: today },
        authorisedTo:   { [Op.gte]: today },
      },
    });
    if (!authority) {
      await logSignature({
        reportId, templateId, disciplineId, signatoryId: signatory.id, authorityId: null,
        signedOnBehalfOf: null, signatureMethod, signatureHash: null,
        ipAddress: ip, userAgent: ua, result: 'REJECTED', rejectReason: 'NO_ACTIVE_AUTHORITY',
      });
      return error(res, 'NO_ACTIVE_AUTHORITY', 403);
    }

    if (await isAbsent(signatory.id, today)) {
      await logSignature({
        reportId, templateId, disciplineId, signatoryId: signatory.id, authorityId: authority.id,
        signedOnBehalfOf: null, signatureMethod, signatureHash: null,
        ipAddress: ip, userAgent: ua, result: 'REJECTED', rejectReason: 'PRIMARY_ON_LEAVE_USE_SUBSTITUTE',
      });
      return error(res, 'PRIMARY_ON_LEAVE_USE_SUBSTITUTE', 409);
    }

    // PASS — generate hash + log
    const signatureHash = crypto
      .createHash('sha256')
      .update([reportId, signatory.id, authority.id, Date.now()].join('|'))
      .digest('hex');

    await logSignature({
      reportId, templateId, disciplineId,
      signatoryId: signatory.id, authorityId: authority.id, signedOnBehalfOf: null,
      signatureMethod, signatureHash, ipAddress: ip, userAgent: ua, result: 'SUCCESS',
    });

    return success(res, { reportId, signatureHash, signatoryId: signatory.id, authorityId: authority.id }, 'Report signed');
  } catch (err) {
    console.error('signReport error:', err);
    return error(res, 'Signing failed', 500);
  }
};

const signAsSubstitute = async (req, res) => {
  const { reportId } = req.params;
  const { templateId, disciplineId, primarySignatoryId, signatureMethod = 'INTERNAL_HASH' } = req.body;
  const userId = req.user?.id;
  const ip = req.ip;
  const ua = req.get('user-agent') || '';

  try {
    const allowedRoles = ['admin', 'lab_head', 'qa', 'reviewer', 'approver'];
    if (!allowedRoles.includes(req.user?.role)) {
      return error(res, 'PERMISSION_DENIED', 403);
    }

    const me = await Signatory.findOne({ where: { userId } });
    if (!me) return error(res, 'NOT_A_REGISTERED_SIGNATORY', 403);

    const today = todayISO();

    // I must have own authority for this template+discipline+unit
    const myAuth = await SignatoryAuthority.findOne({
      where: {
        signatoryId: me.id, templateId, disciplineId, unit: me.unit,
        authorityStatus: 'Active',
        authorisedFrom: { [Op.lte]: today },
        authorisedTo:   { [Op.gte]: today },
      },
    });
    if (!myAuth) return error(res, 'NO_ACTIVE_AUTHORITY', 403);

    // Primary must have a current authority I'm linked to as substitute
    const primaryAuth = await SignatoryAuthority.findOne({
      where: {
        signatoryId: primarySignatoryId, templateId, disciplineId, unit: me.unit,
        authorityStatus: 'Active',
        authorisedFrom: { [Op.lte]: today },
        authorisedTo:   { [Op.gte]: today },
      },
    });
    if (!primaryAuth) return error(res, 'PRIMARY_HAS_NO_ACTIVE_AUTHORITY', 400);

    const link = await SignatorySubstitution.findOne({
      where: { primaryAuthorityId: primaryAuth.id, substituteAuthorityId: myAuth.id },
    });
    if (!link) return error(res, 'NOT_LISTED_AS_SUBSTITUTE_FOR_PRIMARY', 403);

    if (!(await isAbsent(primarySignatoryId, today))) {
      return error(res, 'PRIMARY_NOT_ABSENT', 409);
    }

    const signatureHash = crypto
      .createHash('sha256')
      .update([reportId, me.id, myAuth.id, primarySignatoryId, Date.now()].join('|'))
      .digest('hex');

    await logSignature({
      reportId, templateId, disciplineId,
      signatoryId: me.id, authorityId: myAuth.id, signedOnBehalfOf: primarySignatoryId,
      signatureMethod, signatureHash, ipAddress: ip, userAgent: ua, result: 'SUCCESS',
    });

    return success(res, {
      reportId, signatureHash, signatoryId: me.id, authorityId: myAuth.id,
      signedOnBehalfOf: primarySignatoryId,
    }, 'Signed on behalf of primary');
  } catch (err) {
    console.error('signAsSubstitute error:', err);
    return error(res, 'Signing failed', 500);
  }
};

module.exports = {
  // masters
  listTemplates, createTemplate, updateTemplate, deleteTemplate,
  listDisciplines, createDiscipline, updateDiscipline, deleteDiscipline,
  // signatories
  listSignatories, getSignatoryProfile, createSignatory, updateSignatory, deleteSignatory,
  // authority
  listAuthorities, createAuthority, updateAuthority, withdrawAuthority,
  // substitutes
  listSubstitutions, createSubstitution, deleteSubstitution,
  // absences
  listAbsences, createAbsence, deleteAbsence,
  // matrix + coverage
  matrix, coverage, coveragePoint,
  // audit
  auditFeed,
  // signing
  signReport, signAsSubstitute,
};
