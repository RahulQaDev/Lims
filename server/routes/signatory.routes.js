const express = require('express');
const router = express.Router();
const c = require('../controllers/signatory.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// Roles allowed to manage the masters / authority / substitutes
const QA = requireRole('admin', 'lab_head', 'qa');
// Roles allowed to mark absences (HR + QA + admin)
const ABS = requireRole('admin', 'lab_head', 'qa', 'hr');

// ── Templates ─────────────────────────────────────
router.get('/templates',          c.listTemplates);
router.post('/templates',         QA, c.createTemplate);
router.put('/templates/:id',      QA, c.updateTemplate);
router.delete('/templates/:id',   QA, c.deleteTemplate);

// ── Disciplines ───────────────────────────────────
router.get('/disciplines',        c.listDisciplines);
router.post('/disciplines',       QA, c.createDiscipline);
router.put('/disciplines/:id',    QA, c.updateDiscipline);
router.delete('/disciplines/:id', QA, c.deleteDiscipline);

// ── Signatories ───────────────────────────────────
router.get('/signatories',           c.listSignatories);
router.get('/signatories/:id',       c.getSignatoryProfile);
router.post('/signatories',          QA, c.createSignatory);
router.put('/signatories/:id',       QA, c.updateSignatory);
router.delete('/signatories/:id',    QA, c.deleteSignatory);

// ── Authorities ───────────────────────────────────
router.get('/authorities',                c.listAuthorities);
router.post('/authorities',               QA, c.createAuthority);
router.put('/authorities/:id',            QA, c.updateAuthority);
router.post('/authorities/:id/withdraw',  QA, c.withdrawAuthority);

// ── Substitutions ─────────────────────────────────
router.get('/substitutions',         c.listSubstitutions);
router.post('/substitutions',        QA, c.createSubstitution);
router.delete('/substitutions/:id',  QA, c.deleteSubstitution);

// ── Absences ──────────────────────────────────────
router.get('/absences',          c.listAbsences);
router.post('/absences',         ABS, c.createAbsence);
router.delete('/absences/:id',   ABS, c.deleteAbsence);

// ── Matrix + Coverage ─────────────────────────────
router.get('/matrix',                  c.matrix);
router.get('/coverage',                c.coverage);
router.get('/coverage/point',          c.coveragePoint);

// ── Audit ─────────────────────────────────────────
router.get('/audit',                   c.auditFeed);

// ── Signing service ───────────────────────────────
router.post('/sign/:reportId',                  c.signReport);
router.post('/sign-as-substitute/:reportId',    c.signAsSubstitute);

module.exports = router;
