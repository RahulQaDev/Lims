/**
 * YLIMS Signatories Module — Delhi unit seed
 * Source: Authorised_Signatories - Template_group_wise.docx
 * Total: 11 templates · 17 disciplines · 13 signatories · 105 authority rows
 *
 * Called by seeders/seed.js after the core seed completes. Safe to call
 * standalone too — re-running first deletes existing signatories rows.
 */

const TEMPLATES = [
  { code: 'FORM_39',     name: 'Form 39',                   body: 'CDSCO' },
  { code: 'FORM_39A',    name: 'Form 39A',                  body: 'CDSCO' },
  { code: 'COS_24',      name: 'Cos 24',                    body: 'CDSCO' },
  { code: 'MD_40',       name: 'MD 40',                     body: 'CDSCO' },
  { code: 'FORM_50',     name: 'Form 50 (AYUSH)',           body: 'AYUSH' },
  { code: 'FORM_VII',    name: 'Form VII',                  body: 'FSSAI' },
  { code: 'FOOD_NESTLE', name: 'Food / Food Nestle',        body: 'FSSAI' },
  { code: 'EIA_2',       name: 'EIA-2',                     body: 'FSSAI' },
  { code: 'BIS_WATER',   name: 'BIS Water Template',        body: 'BIS' },
  { code: 'NON_DRUG',    name: 'Non Drug',                  body: 'NABL' },
  { code: 'GMO',         name: 'GMO',                       body: 'FSSAI' },
];

const DISCIPLINES = [
  { code: 'CHEM_DRUGS',       name: 'Chemical - Drugs, Pharmaceutical',                                 group: 'Chemical'   },
  { code: 'CHEM_COSMETICS',   name: 'Chemical - Cosmetics and Essential Oil',                           group: 'Chemical'   },
  { code: 'CHEM_NUTRA',       name: 'Chemical - Nutraceuticals and Functional Foods',                   group: 'Chemical'   },
  { code: 'CHEM_POLLUTION',   name: 'Chemical - Pollution and Environment (effluents/wastewater)',      group: 'Chemical'   },
  { code: 'CHEM_INDUSTRIAL',  name: 'Chemical - Industrial and Fine Chemicals',                         group: 'Chemical'   },
  { code: 'CHEM_PLASTIC',     name: 'Chemical - Plastic and Resins',                                    group: 'Chemical'   },
  { code: 'CHEM_WATER',       name: 'Chemical - Water',                                                 group: 'Chemical'   },
  { code: 'CHEM_SOAPS',       name: 'Chemical - Soaps, Detergents and Toiletries',                      group: 'Chemical'   },
  { code: 'CHEM_FOOD_AGRI',   name: 'Chemical - Food & Agricultural Products',                          group: 'Chemical'   },
  { code: 'CHEM_RESIDUES',    name: 'Chemical - Residues / Contaminants in Food and Water',             group: 'Chemical'   },
  { code: 'CHEM_AYUSH',       name: 'Chemical - AYUSH',                                                 group: 'Chemical'   },
  { code: 'CHEM_MED_DEVICE',  name: 'Chemical - Medical Device',                                        group: 'Chemical'   },
  { code: 'BIO_MULTI',        name: 'Biological - Multi-domain (AYUSH, Biocides, Cosmetics, Drugs, Env, Food, GM, Med Accessories, Molecular, Nutra, Water)', group: 'Biological' },
  { code: 'BIO_FOOD_NUTRA',   name: 'Biological - Food & Agricultural Products, Nutraceuticals',        group: 'Biological' },
  { code: 'MECH_PLASTIC',     name: 'Mechanical - Plastic and Plastic Products',                        group: 'Mechanical' },
  { code: 'PIC_DRUGS_COS_MD', name: 'Statutory PIC - Drugs / Cosmetics / Medical Devices',              group: 'Statutory'  },
  { code: 'PIC_AYUSH',        name: 'Statutory PIC - AYUSH',                                            group: 'Statutory'  },
];

const SIGNATORIES = [
  { empId: 'TBC-001', name: 'Dr. Saurabh Arora',          designation: 'CFO / Quality Head',   unit: 'Delhi' },
  { empId: 'TBC-002', name: 'Ms. Silpi Rani Kalita',      designation: 'Senior Tech Manager',  unit: 'Delhi' },
  { empId: 'TBC-003', name: 'Mr. Sanjeev Tiwari',         designation: 'Tech Manager',         unit: 'Delhi' },
  { empId: 'TBC-004', name: 'Dr. Neha S Arora',           designation: 'Tech Manager',         unit: 'Delhi' },
  { empId: 'TBC-005', name: 'Mr. Padam Garg',             designation: 'Tech Manager',         unit: 'Delhi' },
  { empId: 'TBC-006', name: 'Mr. Deepak Kumar Pant',      designation: 'Senior Analyst',       unit: 'Delhi' },
  { empId: 'TBC-007', name: 'Ms. Megha',                  designation: 'Senior Analyst',       unit: 'Delhi' },
  { empId: 'TBC-008', name: 'Mr. Pushpendra Kumar Chauhan', designation: 'Senior Analyst',     unit: 'Delhi' },
  { empId: 'TBC-009', name: 'Mr. Sanjay Kumar Sharma',    designation: 'Senior Analyst',       unit: 'Delhi' },
  { empId: 'TBC-010', name: 'Ms. Puja Kumari',            designation: 'Senior Analyst',       unit: 'Delhi' },
  { empId: 'TBC-011', name: 'Mr. Amit Shakya',            designation: 'Microbiologist',       unit: 'Delhi' },
  { empId: 'TBC-012', name: 'Mr. Vaibhav Tyagi',          designation: 'Microbiologist',       unit: 'Delhi' },
  { empId: 'TBC-013', name: 'Mr. Deepak Kumar',           designation: 'Microbiologist',       unit: 'Delhi' },
];

// 105 authority rows, exploded from the 17 source groups in the FINAL plan §13.1
// Each entry: [signatoryNameSubstring, templateCode, disciplineCode]
const AUTHORITIES = [
  // S1-R1 — Statutory PIC, Drugs/Cos/MD (12)
  ['Saurabh Arora',          'FORM_39',     'PIC_DRUGS_COS_MD'],
  ['Saurabh Arora',          'FORM_39A',    'PIC_DRUGS_COS_MD'],
  ['Saurabh Arora',          'COS_24',      'PIC_DRUGS_COS_MD'],
  ['Saurabh Arora',          'MD_40',       'PIC_DRUGS_COS_MD'],
  ['Silpi Rani Kalita',      'FORM_39',     'PIC_DRUGS_COS_MD'],
  ['Silpi Rani Kalita',      'FORM_39A',    'PIC_DRUGS_COS_MD'],
  ['Silpi Rani Kalita',      'COS_24',      'PIC_DRUGS_COS_MD'],
  ['Silpi Rani Kalita',      'MD_40',       'PIC_DRUGS_COS_MD'],
  ['Sanjeev Tiwari',         'FORM_39',     'PIC_DRUGS_COS_MD'],
  ['Sanjeev Tiwari',         'FORM_39A',    'PIC_DRUGS_COS_MD'],
  ['Sanjeev Tiwari',         'COS_24',      'PIC_DRUGS_COS_MD'],
  ['Sanjeev Tiwari',         'MD_40',       'PIC_DRUGS_COS_MD'],
  // S1-R2 — Statutory PIC, AYUSH (2)
  ['Neha S Arora',           'FORM_50',     'PIC_AYUSH'],
  ['Sanjeev Tiwari',         'FORM_50',     'PIC_AYUSH'],
  // S2-A — NABL Chem Drugs (8)
  ['Saurabh Arora',          'FORM_39',     'CHEM_DRUGS'],
  ['Saurabh Arora',          'FORM_39A',    'CHEM_DRUGS'],
  ['Sanjeev Tiwari',         'FORM_39',     'CHEM_DRUGS'],
  ['Sanjeev Tiwari',         'FORM_39A',    'CHEM_DRUGS'],
  ['Padam Garg',             'FORM_39',     'CHEM_DRUGS'],
  ['Padam Garg',             'FORM_39A',    'CHEM_DRUGS'],
  ['Silpi Rani Kalita',      'FORM_39',     'CHEM_DRUGS'],
  ['Silpi Rani Kalita',      'FORM_39A',    'CHEM_DRUGS'],
  // S2-B — NABL Chem Cosmetics (4)
  ['Sanjeev Tiwari',         'COS_24',      'CHEM_COSMETICS'],
  ['Neha S Arora',           'COS_24',      'CHEM_COSMETICS'],
  ['Padam Garg',             'COS_24',      'CHEM_COSMETICS'],
  ['Silpi Rani Kalita',      'COS_24',      'CHEM_COSMETICS'],
  // S2-C — NABL Chem Nutra (10) — Food Nestle + Form VII × 5 people
  ['Saurabh Arora',          'FOOD_NESTLE', 'CHEM_NUTRA'],
  ['Saurabh Arora',          'FORM_VII',    'CHEM_NUTRA'],
  ['Deepak Kumar Pant',      'FOOD_NESTLE', 'CHEM_NUTRA'],
  ['Deepak Kumar Pant',      'FORM_VII',    'CHEM_NUTRA'],
  ['Megha',                  'FOOD_NESTLE', 'CHEM_NUTRA'],
  ['Megha',                  'FORM_VII',    'CHEM_NUTRA'],
  ['Pushpendra Kumar Chauhan','FOOD_NESTLE','CHEM_NUTRA'],
  ['Pushpendra Kumar Chauhan','FORM_VII',   'CHEM_NUTRA'],
  ['Sanjay Kumar Sharma',    'FOOD_NESTLE', 'CHEM_NUTRA'],
  ['Sanjay Kumar Sharma',    'FORM_VII',    'CHEM_NUTRA'],
  // S2-D — Pollution (1)
  ['Puja Kumari',            'BIS_WATER',   'CHEM_POLLUTION'],
  // S2-E — Industrial (4)
  ['Sanjeev Tiwari',         'NON_DRUG',    'CHEM_INDUSTRIAL'],
  ['Neha S Arora',           'NON_DRUG',    'CHEM_INDUSTRIAL'],
  ['Padam Garg',             'NON_DRUG',    'CHEM_INDUSTRIAL'],
  ['Puja Kumari',            'NON_DRUG',    'CHEM_INDUSTRIAL'],
  // S2-F — Plastic (5)
  ['Sanjay Kumar Sharma',    'BIS_WATER',   'CHEM_PLASTIC'],
  ['Sanjeev Tiwari',         'BIS_WATER',   'CHEM_PLASTIC'],
  ['Megha',                  'BIS_WATER',   'CHEM_PLASTIC'],
  ['Puja Kumari',            'BIS_WATER',   'CHEM_PLASTIC'],
  ['Pushpendra Kumar Chauhan','BIS_WATER',  'CHEM_PLASTIC'],
  // S2-G — Water (6)
  ['Saurabh Arora',          'BIS_WATER',   'CHEM_WATER'],
  ['Deepak Kumar Pant',      'BIS_WATER',   'CHEM_WATER'],
  ['Megha',                  'BIS_WATER',   'CHEM_WATER'],
  ['Puja Kumari',            'BIS_WATER',   'CHEM_WATER'],
  ['Pushpendra Kumar Chauhan','BIS_WATER',  'CHEM_WATER'],
  ['Sanjay Kumar Sharma',    'BIS_WATER',   'CHEM_WATER'],
  // S2-H — Soaps (3)
  ['Sanjeev Tiwari',         'COS_24',      'CHEM_SOAPS'],
  ['Neha S Arora',           'COS_24',      'CHEM_SOAPS'],
  ['Padam Garg',             'COS_24',      'CHEM_SOAPS'],
  // S2-I — Food & Agri (21) — 7 ppl × 3 templates
  ['Saurabh Arora',          'FOOD_NESTLE', 'CHEM_FOOD_AGRI'],
  ['Saurabh Arora',          'EIA_2',       'CHEM_FOOD_AGRI'],
  ['Saurabh Arora',          'FORM_VII',    'CHEM_FOOD_AGRI'],
  ['Deepak Kumar Pant',      'FOOD_NESTLE', 'CHEM_FOOD_AGRI'],
  ['Deepak Kumar Pant',      'EIA_2',       'CHEM_FOOD_AGRI'],
  ['Deepak Kumar Pant',      'FORM_VII',    'CHEM_FOOD_AGRI'],
  ['Pushpendra Kumar Chauhan','FOOD_NESTLE','CHEM_FOOD_AGRI'],
  ['Pushpendra Kumar Chauhan','EIA_2',      'CHEM_FOOD_AGRI'],
  ['Pushpendra Kumar Chauhan','FORM_VII',   'CHEM_FOOD_AGRI'],
  ['Sanjay Kumar Sharma',    'FOOD_NESTLE', 'CHEM_FOOD_AGRI'],
  ['Sanjay Kumar Sharma',    'EIA_2',       'CHEM_FOOD_AGRI'],
  ['Sanjay Kumar Sharma',    'FORM_VII',    'CHEM_FOOD_AGRI'],
  ['Sanjeev Tiwari',         'FOOD_NESTLE', 'CHEM_FOOD_AGRI'],
  ['Sanjeev Tiwari',         'EIA_2',       'CHEM_FOOD_AGRI'],
  ['Sanjeev Tiwari',         'FORM_VII',    'CHEM_FOOD_AGRI'],
  ['Padam Garg',             'FOOD_NESTLE', 'CHEM_FOOD_AGRI'],
  ['Padam Garg',             'EIA_2',       'CHEM_FOOD_AGRI'],
  ['Padam Garg',             'FORM_VII',    'CHEM_FOOD_AGRI'],
  ['Megha',                  'FOOD_NESTLE', 'CHEM_FOOD_AGRI'],
  ['Megha',                  'EIA_2',       'CHEM_FOOD_AGRI'],
  ['Megha',                  'FORM_VII',    'CHEM_FOOD_AGRI'],
  // S2-J — Residues (12) — 4 ppl × 3 templates
  ['Saurabh Arora',          'FOOD_NESTLE', 'CHEM_RESIDUES'],
  ['Saurabh Arora',          'EIA_2',       'CHEM_RESIDUES'],
  ['Saurabh Arora',          'FORM_VII',    'CHEM_RESIDUES'],
  ['Sanjay Kumar Sharma',    'FOOD_NESTLE', 'CHEM_RESIDUES'],
  ['Sanjay Kumar Sharma',    'EIA_2',       'CHEM_RESIDUES'],
  ['Sanjay Kumar Sharma',    'FORM_VII',    'CHEM_RESIDUES'],
  ['Pushpendra Kumar Chauhan','FOOD_NESTLE','CHEM_RESIDUES'],
  ['Pushpendra Kumar Chauhan','EIA_2',      'CHEM_RESIDUES'],
  ['Pushpendra Kumar Chauhan','FORM_VII',   'CHEM_RESIDUES'],
  ['Megha',                  'FOOD_NESTLE', 'CHEM_RESIDUES'],
  ['Megha',                  'EIA_2',       'CHEM_RESIDUES'],
  ['Megha',                  'FORM_VII',    'CHEM_RESIDUES'],
  // S2-K — AYUSH chemical (2)
  ['Sanjeev Tiwari',         'FORM_50',     'CHEM_AYUSH'],
  ['Neha S Arora',           'FORM_50',     'CHEM_AYUSH'],
  // S2-L — Med Device (3)
  ['Silpi Rani Kalita',      'MD_40',       'CHEM_MED_DEVICE'],
  ['Saurabh Arora',          'MD_40',       'CHEM_MED_DEVICE'],
  ['Sanjeev Tiwari',         'MD_40',       'CHEM_MED_DEVICE'],
  // S2-M — Bio Multi: Amit Shakya (2)
  ['Amit Shakya',            'FORM_50',     'BIO_MULTI'],
  ['Amit Shakya',            'NON_DRUG',    'BIO_MULTI'],
  // S2-N — Bio Multi: Vaibhav Tyagi (4)
  ['Vaibhav Tyagi',          'FOOD_NESTLE', 'BIO_MULTI'],
  ['Vaibhav Tyagi',          'EIA_2',       'BIO_MULTI'],
  ['Vaibhav Tyagi',          'FORM_VII',    'BIO_MULTI'],
  ['Vaibhav Tyagi',          'GMO',         'BIO_MULTI'],
  // S2-O — Bio Food Nutra: Deepak Kumar (4)
  ['Mr. Deepak Kumar',       'FOOD_NESTLE', 'BIO_FOOD_NUTRA'],
  ['Mr. Deepak Kumar',       'EIA_2',       'BIO_FOOD_NUTRA'],
  ['Mr. Deepak Kumar',       'FORM_VII',    'BIO_FOOD_NUTRA'],
  ['Mr. Deepak Kumar',       'GMO',         'BIO_FOOD_NUTRA'],
  // S2-P — Mechanical Plastic (2)
  ['Megha',                  'BIS_WATER',   'MECH_PLASTIC'],
  ['Puja Kumari',            'BIS_WATER',   'MECH_PLASTIC'],
];

// Pre-baked substitute chains. Each entry: [primaryAuthorityKey, substituteAuthorityKey, priority]
// authorityKey = "${signatorySubstring}|${templateCode}|${disciplineCode}"
const SUBSTITUTIONS = [
  // For Saurabh as Drugs PIC — Silpi as P1, Sanjeev as P2
  ['Saurabh Arora|FORM_39|PIC_DRUGS_COS_MD',  'Silpi Rani Kalita|FORM_39|PIC_DRUGS_COS_MD',  1],
  ['Saurabh Arora|FORM_39|PIC_DRUGS_COS_MD',  'Sanjeev Tiwari|FORM_39|PIC_DRUGS_COS_MD',     2],
  ['Saurabh Arora|FORM_39A|PIC_DRUGS_COS_MD', 'Silpi Rani Kalita|FORM_39A|PIC_DRUGS_COS_MD', 1],
  ['Saurabh Arora|FORM_39A|PIC_DRUGS_COS_MD', 'Sanjeev Tiwari|FORM_39A|PIC_DRUGS_COS_MD',    2],
  // Neha (AYUSH PIC) → Sanjeev as substitute
  ['Neha S Arora|FORM_50|PIC_AYUSH',          'Sanjeev Tiwari|FORM_50|PIC_AYUSH',            1],
  // Saurabh on Chem Water → Deepak Pant P1, Sanjay P2
  ['Saurabh Arora|BIS_WATER|CHEM_WATER',      'Deepak Kumar Pant|BIS_WATER|CHEM_WATER',      1],
  ['Saurabh Arora|BIS_WATER|CHEM_WATER',      'Sanjay Kumar Sharma|BIS_WATER|CHEM_WATER',    2],
];

// Sample absences for the Coverage Dashboard demo
const ABSENCES = [
  { name: 'Padam Garg',         days: -2, length: 5, reason: 'Annual Leave',  source: 'HR_SYNC' },
  { name: 'Megha',              days: 1,  length: 2, reason: 'Sick Leave',    source: 'MANUAL' },
];

async function seedSignatories(db, { silent = false } = {}) {
  const log = (m) => silent || console.log(m);

  // Wipe existing signatories tables (in FK-safe order)
  await db.SignatureAuditLog.destroy({ where: {}, truncate: true });
  await db.SignatorySubstitution.destroy({ where: {}, truncate: true, force: true });
  await db.SignatoryAbsence.destroy({ where: {}, truncate: true, force: true });
  await db.SignatoryAuthority.destroy({ where: {}, truncate: true, force: true });
  await db.Signatory.destroy({ where: {}, truncate: true, force: true });
  await db.SignatoryTemplate.destroy({ where: {}, truncate: true, force: true });
  await db.SignatoryDiscipline.destroy({ where: {}, truncate: true, force: true });

  // Templates
  log('--- Signatories: templates ---');
  const tmplMap = new Map();
  for (const t of TEMPLATES) {
    const row = await db.SignatoryTemplate.create({
      templateCode: t.code,
      templateName: t.name,
      regulatoryBody: t.body,
      templateVersion: 'Current',
      effectiveFrom: '2026-01-01',
      status: 'Active',
    });
    tmplMap.set(t.code, row.id);
  }
  log(`  Created ${tmplMap.size} templates`);

  // Disciplines
  log('--- Signatories: disciplines ---');
  const discMap = new Map();
  for (const d of DISCIPLINES) {
    const row = await db.SignatoryDiscipline.create({
      disciplineCode: d.code,
      disciplineName: d.name,
      groupType: d.group,
      nablScopeCode: d.group === 'Statutory' ? 'N/A' : '[NABL_TBC]',
      status: 'Active',
    });
    discMap.set(d.code, row.id);
  }
  log(`  Created ${discMap.size} disciplines`);

  // Signatories
  log('--- Signatories: people ---');
  const sigMap = new Map();
  for (const s of SIGNATORIES) {
    const row = await db.Signatory.create({
      employeeId: s.empId,
      fullName: s.name,
      designation: s.designation,
      unit: s.unit,
      status: 'Active',
    });
    sigMap.set(s.name, row.id);
  }
  log(`  Created ${sigMap.size} signatories`);

  // Helper: find signatory id by name fragment
  function findSignatoryId(fragment) {
    // Special-case "Mr. Deepak Kumar" — must NOT match "Deepak Kumar Pant"
    if (fragment === 'Mr. Deepak Kumar') {
      const exact = SIGNATORIES.find((s) => s.name === 'Mr. Deepak Kumar');
      return sigMap.get(exact.name);
    }
    const match = SIGNATORIES.find((s) => s.name.includes(fragment));
    if (!match) throw new Error(`Signatory fragment not found: ${fragment}`);
    return sigMap.get(match.name);
  }

  // Authorities
  log('--- Signatories: authority rows ---');
  const authKeyMap = new Map(); // key -> authority id
  for (const [name, tplCode, discCode] of AUTHORITIES) {
    const sigId = findSignatoryId(name);
    const tplId = tmplMap.get(tplCode);
    const discId = discMap.get(discCode);
    if (!tplId)  throw new Error(`Template not found: ${tplCode}`);
    if (!discId) throw new Error(`Discipline not found: ${discCode}`);
    const row = await db.SignatoryAuthority.create({
      signatoryId: sigId,
      templateId: tplId,
      disciplineId: discId,
      unit: 'Delhi',
      authorisedFrom: '2026-01-01',
      authorisedTo: '2026-12-31',
      authorityStatus: 'Active',
      competenceEvidence: '[TBC]',
    });
    authKeyMap.set(`${name}|${tplCode}|${discCode}`, row.id);
  }
  log(`  Created ${authKeyMap.size} authority rows`);

  // Substitutions
  log('--- Signatories: substitutes ---');
  let subCount = 0;
  for (const [primaryKey, subKey, priority] of SUBSTITUTIONS) {
    const primaryId = authKeyMap.get(primaryKey);
    const subId = authKeyMap.get(subKey);
    if (!primaryId || !subId) {
      console.warn(`  ! Skip substitution (missing key): ${primaryKey} → ${subKey}`);
      continue;
    }
    await db.SignatorySubstitution.create({
      primaryAuthorityId: primaryId,
      substituteAuthorityId: subId,
      priority,
    });
    subCount++;
  }
  log(`  Created ${subCount} substitution rows`);

  // Absences
  log('--- Signatories: absences ---');
  const today = new Date();
  for (const a of ABSENCES) {
    const sigId = findSignatoryId(a.name);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + a.days);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + (a.length - 1));
    const fmt = (d) => d.toISOString().slice(0, 10);
    await db.SignatoryAbsence.create({
      signatoryId: sigId,
      absentFrom: fmt(start),
      absentTo: fmt(end),
      reason: a.reason,
      source: a.source,
    });
  }
  log(`  Created ${ABSENCES.length} absence rows`);

  log('--- Signatories module seed complete ---');
  return {
    templates: tmplMap.size,
    disciplines: discMap.size,
    signatories: sigMap.size,
    authorities: authKeyMap.size,
    substitutions: subCount,
    absences: ABSENCES.length,
  };
}

module.exports = { seedSignatories };

// Allow standalone invocation: `node seeders/signatories.seed.js`
if (require.main === module) {
  (async () => {
    try {
      const db = require('../models');
      await db.sequelize.sync(); // assumes core seed already ran
      const stats = await seedSignatories(db);
      console.log('\nDone:', stats);
      process.exit(0);
    } catch (err) {
      console.error('Signatories seed failed:', err);
      process.exit(1);
    }
  })();
}
