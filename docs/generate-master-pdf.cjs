const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 45, bottom: 45, left: 50, right: 50 } });
const output = fs.createWriteStream(path.join(__dirname, 'Master-Dashboard-Logic.pdf'));
doc.pipe(output);

const W = 495;
const C = { pri: '#059669', sec: '#0D9488', txt: '#1F2937', mut: '#6B7280', lgt: '#F3F4F6', wht: '#FFFFFF', bdr: '#E5E7EB' };

function h1(t) { doc.moveDown(1); doc.font('Helvetica-Bold').fontSize(18).fillColor(C.pri).text(t); doc.moveDown(0.15); doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.pri).lineWidth(1.5).stroke(); doc.moveDown(0.4); }
function h2(t) { doc.moveDown(0.6); doc.font('Helvetica-Bold').fontSize(13).fillColor(C.sec).text(t); doc.moveDown(0.25); }
function h3(t) { doc.moveDown(0.4); doc.font('Helvetica-Bold').fontSize(11).fillColor(C.txt).text(t); doc.moveDown(0.15); }
function p(t) { doc.font('Helvetica').fontSize(9.5).fillColor(C.txt).text(t, { lineGap: 2.5 }); doc.moveDown(0.2); }
function b(t) { doc.font('Helvetica').fontSize(9.5).fillColor(C.txt).text('  \u2022  ' + t, { lineGap: 2 }); }
function note(t) { doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(C.mut).text(t); doc.moveDown(0.15); }

function tbl(headers, rows, widths) {
  var x0 = 50, y = doc.y + 4, rh = 18, px = 5;
  if (y + (rows.length + 1) * rh + 10 > 780) { doc.addPage(); y = 45; }
  doc.rect(x0, y, W, rh).fill(C.pri);
  var x = x0;
  headers.forEach(function(h, i) { doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.wht).text(h, x + px, y + 5, { width: widths[i] - px * 2 }); x += widths[i]; });
  y += rh;
  rows.forEach(function(row, ri) {
    if (y + rh > 780) { doc.addPage(); y = 45; }
    doc.rect(x0, y, W, rh).fill(ri % 2 === 0 ? C.wht : C.lgt);
    x = x0;
    row.forEach(function(cell, ci) { doc.font('Helvetica').fontSize(7.5).fillColor(C.txt).text(String(cell || ''), x + px, y + 5, { width: widths[ci] - px * 2 }); x += widths[ci]; });
    y += rh;
  });
  doc.y = y + 4; doc.moveDown(0.3);
}

// COVER
doc.rect(0, 0, 595, 842).fill('#064E3B');
doc.circle(480, 80, 180).fill('#065F46').opacity(0.3);
doc.circle(100, 720, 130).fill('#059669').opacity(0.2);
doc.opacity(1);
doc.font('Helvetica-Bold').fontSize(32).fillColor('#FFFFFF').text('Master Personnel', 50, 270, { width: W, align: 'center' });
doc.font('Helvetica-Bold').fontSize(32).fillColor('#FFFFFF').text('Dashboard', { width: W, align: 'center' });
doc.moveDown(0.2);
doc.font('Helvetica').fontSize(16).fillColor('#6EE7B7').text('Logic & Calculation Document', { width: W, align: 'center' });
doc.moveDown(2);
doc.moveTo(200, doc.y).lineTo(395, doc.y).strokeColor('#34D399').lineWidth(2).stroke();
doc.moveDown(2);
doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text('LabWise LIMS', { width: W, align: 'center' });
doc.moveDown(3);
doc.font('Helvetica').fontSize(10).fillColor('#6EE7B7').text('8 April 2026', { width: W, align: 'center' });

// STATS
doc.addPage();
h1('Stats Strip (Top Bar)');

h3('STPs Created Today');
p('Count of AuditLog entries where userId = this user, entity = TestMaster, action = create, createdAt = today.');

h3('Analytes Added Today');
p('Count of AuditLog entries where userId = this user, entity = TestParameter, action = create, createdAt = today.');

h3('Total Active STPs');
p('System-wide count of TestMaster records where isActive = true.');

h3('Incomplete STPs');
p('Count of TestMaster where isActive = true AND (specification is null/empty OR method is null/empty).');

h3('Data Completeness');
p('Percentage of active TestMasters with all required fields filled (name, code, method, unit, departmentId). Formula: complete / total x 100.');

note('Unique approach: Activity tracked via AuditLog since master tables have no createdBy field.');

// KPIs
doc.addPage();
h1('KPIs (5 Metrics)');
tbl(
  ['KPI', 'Target', 'What It Measures', 'Source'],
  [
    ['STPs Created / Month', '50', 'Volume of new test masters this month', 'AuditLog (entity=TestMaster, action=create)'],
    ['Analytes Added / Month', '100', 'Volume of new parameters this month', 'AuditLog (entity=TestParameter, action=create)'],
    ['Methods Updated / Month', '30', 'Test masters updated this month', 'AuditLog (entity=TestMaster, action=update)'],
    ['Pending STPs', '0 (inverse)', 'Incomplete test masters', 'TestMaster (missing spec or method)'],
    ['Data Completeness', '100%', 'Fields completeness across all tests', 'TestMaster field checks'],
  ],
  [110, 60, 150, 175]
);

h2('Data Source: AuditLog');
p('Since master tables (TestMaster, TestParameter, etc.) do not have createdBy fields, all user-scoped metrics are derived from the AuditLog table which records every create/update/delete action with the userId.');

// KRAs
doc.addPage();
h1('KRAs (4 Weighted Areas)');
tbl(
  ['KRA', 'Target', 'Weight', 'Calculation'],
  [
    ['Data Quality', '98%', '35%', '% of tests with spec + method + min/max limits filled'],
    ['STP Throughput', '100%', '25%', 'STPs created this month / 50 target x 100'],
    ['Standards Compliance', '100%', '20%', '% of tests linked to a valid standardId'],
    ['Turnaround', '95%', '20%', 'Placeholder (95%) -- needs SLA tracking'],
  ],
  [115, 55, 50, 275]
);

h2('Overall KRA Formula');
p('(Data Quality Score x 0.35) + (Throughput Score x 0.25) + (Standards Score x 0.20) + (Turnaround Score x 0.20)');
p('Each score = min(100, (actual / target) x 100)');

// ALERTS
h1('Alerts (4 Types)');
tbl(
  ['Alert', 'Trigger', 'Severity'],
  [
    ['Incomplete STPs', 'TestMaster missing specification or method', 'Amber'],
    ['No Parameters', 'TestMaster with zero TestParameter records', 'Amber'],
    ['No Standard', 'TestMaster with standardId = null', 'Red'],
    ['Not NABL Accredited', 'TestMaster with isAccredited = false', 'Amber'],
  ],
  [120, 260, 115]
);

// DATA QUALITY
doc.addPage();
h1('Data Quality Breakdown');
p('Shows per-field completeness across all active TestMaster records. Fields checked:');
tbl(
  ['Field', 'What It Checks'],
  [
    ['Name', 'Not null and not empty'],
    ['Code', 'Not null and not empty'],
    ['Method', 'Not null and not empty'],
    ['Unit', 'Not null and not empty'],
    ['Department', 'departmentId not null'],
    ['Specification', 'Not null and not empty'],
    ['Standard', 'standardId not null'],
    ['Min Limit', 'minLimit not null'],
    ['Max Limit', 'maxLimit not null'],
  ],
  [120, 375]
);

// REFRESH + SOURCES
h1('Auto-Refresh Schedule');
tbl(['Data', 'Refresh', 'Stale Time'], [['Stats, Activity, Alerts', '60 seconds', '30s'], ['KPIs, KRAs, Quality', '5 minutes', '60s']], [200, 150, 145]);

h1('Data Sources');
tbl(['What', 'Table'], [['User activity tracking', 'AuditLog'], ['Test definitions, completeness', 'TestMaster'], ['Test parameters', 'TestParameter'], ['Standards', 'Standard'], ['Products', 'ProductType']], [230, 265]);

// PENDING
h1('Pending Items');
tbl(['Item', 'Current', 'Planned'], [
  ['DMS/Method Upload', 'No file upload model', 'Create Document model with file storage'],
  ['Turnaround KRA', 'Hardcoded at 95%', 'Track actual SLA from request to completion'],
  ['NABL Integration', 'Read-only flag on TestMaster', 'Full accreditation workflow'],
  ['Specification Routes', 'Models exist, no API', 'Implement /api/specifications CRUD'],
], [120, 170, 205]);

doc.moveDown(2);
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.bdr).lineWidth(0.5).stroke();
doc.moveDown(0.5);
doc.font('Helvetica').fontSize(8).fillColor(C.mut).text('LabWise LIMS -- Master Personnel Dashboard Logic Document -- Generated 8 April 2026', { align: 'center' });

doc.end();
output.on('finish', function() { console.log('PDF generated: docs/Master-Dashboard-Logic.pdf'); });
