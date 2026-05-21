const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 45, bottom: 45, left: 50, right: 50 } });
const output = fs.createWriteStream(path.join(__dirname, 'Reception-Dashboard-Logic.pdf'));
doc.pipe(output);

const W = 495;
const C = { pri: '#0E7490', sec: '#0D9488', txt: '#1F2937', mut: '#6B7280', lgt: '#F3F4F6', wht: '#FFFFFF', bdr: '#E5E7EB' };

function h1(t) { doc.moveDown(1); doc.font('Helvetica-Bold').fontSize(18).fillColor(C.pri).text(t); doc.moveDown(0.15); doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.pri).lineWidth(1.5).stroke(); doc.moveDown(0.4); }
function h2(t) { doc.moveDown(0.6); doc.font('Helvetica-Bold').fontSize(13).fillColor(C.sec).text(t); doc.moveDown(0.25); }
function h3(t) { doc.moveDown(0.4); doc.font('Helvetica-Bold').fontSize(11).fillColor(C.txt).text(t); doc.moveDown(0.15); }
function p(t) { doc.font('Helvetica').fontSize(9.5).fillColor(C.txt).text(t, { lineGap: 2.5 }); doc.moveDown(0.2); }
function b(t) { doc.font('Helvetica').fontSize(9.5).fillColor(C.txt).text(`  \u2022  ${t}`, { lineGap: 2 }); }
function note(t) { doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(C.mut).text(t); doc.moveDown(0.15); }

function tbl(headers, rows, widths) {
  const x0 = 50; let y = doc.y + 4; const rh = 18; const px = 5;
  if (y + (rows.length + 1) * rh + 10 > 780) { doc.addPage(); y = 45; }
  doc.rect(x0, y, W, rh).fill(C.pri);
  let x = x0;
  headers.forEach((h, i) => { doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.wht).text(h, x + px, y + 5, { width: widths[i] - px * 2 }); x += widths[i]; });
  y += rh;
  rows.forEach((row, ri) => {
    if (y + rh > 780) { doc.addPage(); y = 45; }
    doc.rect(x0, y, W, rh).fill(ri % 2 === 0 ? C.wht : C.lgt);
    x = x0;
    row.forEach((cell, ci) => { doc.font('Helvetica').fontSize(7.5).fillColor(C.txt).text(String(cell || ''), x + px, y + 5, { width: widths[ci] - px * 2 }); x += widths[ci]; });
    y += rh;
  });
  doc.y = y + 4; doc.moveDown(0.3);
}

// ═══ COVER ═══
doc.rect(0, 0, 595, 842).fill('#134E4A');
doc.circle(480, 80, 180).fill('#115E59').opacity(0.3);
doc.circle(100, 720, 130).fill('#0D9488').opacity(0.2);
doc.opacity(1);
doc.font('Helvetica-Bold').fontSize(34).fillColor('#FFFFFF').text('Reception Dashboard', 50, 280, { width: W, align: 'center' });
doc.moveDown(0.2);
doc.font('Helvetica').fontSize(16).fillColor('#99F6E4').text('Logic & Calculation Document', { width: W, align: 'center' });
doc.moveDown(2);
doc.moveTo(200, doc.y).lineTo(395, doc.y).strokeColor('#2DD4BF').lineWidth(2).stroke();
doc.moveDown(2);
doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text('LabWise LIMS', { width: W, align: 'center' });
doc.moveDown(3);
doc.font('Helvetica').fontSize(10).fillColor('#5EEAD4').text('8 April 2026', { width: W, align: 'center' });

// ═══ STATS ═══
doc.addPage();
h1('Stats Strip (Top Bar)');

h3('Processed Today');
p('How many samples this receptionist processed (received into the system) today.');
p('Logic: Count Sample records where receivedBy = this user AND createdAt = today.');

h3('Received Today');
p('How many samples this receptionist received that are still in "received" status today.');
p('Logic: Count Sample records where receivedBy = this user, status = "received", AND createdAt = today.');

h3('Pending TRFs');
p('How many TRFs are globally waiting to be booked. This is a system-wide number — every receptionist sees the same count.');
p('Logic: Count all Sample records where status = "received" (no user filter).');

h3('Avg Time');
p('Average time in minutes between a sample arriving and the receptionist logging it.');
p('Logic: For each sample today: (Sample.createdAt - Sample.receivedDate) in minutes. Average all values. If receivedDate is missing, createdAt is used (resulting in 0 minutes).');

h3('Approval Rate');
p('What percentage of this month\'s samples have moved past "received" status.');
p('Logic: (samples not in "received" status / total samples this month) x 100. Defaults to 100% if no samples.');

note('All stats refresh every 60 seconds automatically.');

// ═══ KPIs ═══
doc.addPage();
h1('KPIs (5 Metrics)');
p('All KPIs auto-computed from database. No manual input needed.');

tbl(
  ['KPI', 'Target', 'What It Measures'],
  [
    ['TRFs Processed / Day', '30', 'Volume of samples registered today'],
    ['Avg Processing Time', '10 mins', 'Time from sample arrival to system entry'],
    ['Approval Accuracy', '99%', 'Percentage of samples moving past received status'],
    ['Pending TRFs', '0', 'System-wide queue of unbooked samples'],
    ['New Client Activations', 'Info only', 'New clients onboarded this month'],
  ],
  [140, 70, 285]
);

h2('Detailed Calculations');

h3('1. TRFs Processed / Day');
p('Count of Sample records where receivedBy = this user AND createdAt = today.');
p('Target: 30. Color: Green >= 90% of target, Amber >= 75%, Red < 75%.');

h3('2. Avg Processing Time');
b('For each sample today: (Sample.createdAt - Sample.receivedDate) in minutes');
b('Average all values, rounded to 1 decimal');
b('Fallback: if receivedDate is null, uses createdAt (= 0 minutes)');
p('Target: 10 minutes. Inverse KPI — lower is better. Progress = target / actual.');

h3('3. Approval Accuracy');
p('Samples that moved past "received" / total processed this month x 100.');
p('If a sample stays stuck in "received" it counts against accuracy.');
p('Target: 99%.');

h3('4. Pending TRFs');
p('Global count of samples in "received" status. Not user-scoped — shows lab-wide queue health.');
p('Target: 0. Inverse KPI — lower is better.');

h3('5. New Client Activations');
p('Unique clients from this month\'s samples whose Client.createdAt is also this month.');
p('Informational only — no target, no color scoring.');

// ═══ KRAs ═══
doc.addPage();
h1('KRAs (4 Weighted Areas)');
p('Overall KRA = weighted average of 4 scores. Each gets a score out of 100.');

tbl(
  ['KRA', 'Target', 'Weight', 'How Score is Calculated'],
  [
    ['Processing Accuracy', '99%', '30%', 'Intact samples / total samples x 100'],
    ['Processing Speed', '95%', '25%', '% of samples processed within 10 mins'],
    ['Client Verification', '90%', '25%', '% of samples with valid client assigned'],
    ['Doc Compliance', '100%', '20%', '% of samples with all required fields filled'],
  ],
  [110, 55, 50, 280]
);

h2('Overall KRA Formula');
p('(Accuracy Score x 0.30) + (Speed Score x 0.25) + (Verification Score x 0.25) + (Compliance Score x 0.20)');

h3('Example:');
b('Processing Accuracy: 97.5% actual, target 99% => Score: min(100, 97.5/99 x 100) = 98.5%');
b('Processing Speed: 92% actual, target 95% => Score: min(100, 92/95 x 100) = 96.8%');
b('Client Verification: 100% actual, target 90% => Score: min(100, 100/90 x 100) = 100% (capped)');
b('Doc Compliance: 95.5% actual, target 100% => Score: min(100, 95.5/100 x 100) = 95.5%');
p('Overall = (98.5 x 0.30) + (96.8 x 0.25) + (100 x 0.25) + (95.5 x 0.20) = 29.6 + 24.2 + 25.0 + 19.1 = 97.9%');

h3('Color Coding:');
b('Green: Score >= 90%');
b('Yellow: Score >= 75%');
b('Red: Score < 75%');

// ═══ TRF QUEUE ═══
h1('TRF Queue Logic');

h2('Sorting');
b('First by priority: Express > Urgent > Normal');
b('Within same priority: earliest received first (receivedDate ascending)');
b('Limited to 30 records');

h2('Wait Time Colors');
tbl(
  ['Wait Time', 'Color', 'Meaning'],
  [
    ['<= 30 minutes', 'Green', 'Timely processing'],
    ['31 - 60 minutes', 'Yellow', 'Getting slow'],
    ['> 60 minutes', 'Red', 'Needs immediate attention'],
  ],
  [165, 165, 165]
);

h2('New Client Detection');
p('If a sample\'s client has no client code (code is null/empty), it is flagged with a purple "New Client" badge. This tells the receptionist to trigger client activation before approving.');

// ═══ ALERTS ═══
doc.addPage();
h1('Alerts (Auto-Triggered)');

tbl(
  ['Alert Type', 'Trigger Condition', 'Severity', 'Refresh'],
  [
    ['Urgent/Express TRFs', 'Sample in received status with priority urgent or express', 'Red', '30s'],
    ['Damaged Samples', 'Sample in received status with condition damaged/temperature_deviation/leaking', 'Amber', '30s'],
    ['Long-Waiting TRFs', 'Sample in received status with receivedDate > 2 hours ago', 'Amber', '30s'],
  ],
  [120, 210, 60, 50]
);

// ═══ REFRESH ═══
h1('Auto-Refresh Schedule');

tbl(
  ['Data', 'Refresh', 'Stale Time', 'Reason'],
  [
    ['Alerts + TRF Queue', '30 seconds', '15s', 'Samples arrive frequently, need fast response'],
    ['Stats + Received + Activity', '60 seconds', '30s', 'Work volume changes during the day'],
    ['KPIs + KRAs', '5 minutes', '60s', 'Monthly metrics change slowly'],
  ],
  [140, 80, 70, 205]
);
p('If server is unavailable, dashboard shows mock data so the page doesn\'t break.');

// ═══ DATA SOURCES ═══
h1('Data Sources');
tbl(
  ['What', 'Database Table'],
  [
    ['Sample counts, status, dates, condition', 'Sample'],
    ['Client names, codes, new client detection', 'Client'],
    ['Product type names', 'ProductType'],
    ['User identity for scoping', 'User (via JWT)'],
  ],
  [220, 275]
);

// ═══ PENDING ═══
h1('Pending Items');
tbl(
  ['Item', 'Current State', 'What Will Change'],
  [
    ['Sample Condition KRA', 'Treats non-intact as receptionist issue', 'Separate arrival condition from processing errors'],
    ['Client Complaints KPI', 'Defined in role config but not on dashboard', 'Add complaint tracking mechanism'],
    ['Booking Accuracy KPI', 'Dashboard uses Approval Accuracy instead', 'Align with role config or update config'],
    ['Configurable Time Target', '10 min hardcoded', 'Make configurable per location/role'],
    ['Location-Scoped Pending', 'Pending TRFs is global count', 'Filter by receptionist\'s location'],
  ],
  [120, 175, 200]
);

// FOOTER
doc.moveDown(2);
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.bdr).lineWidth(0.5).stroke();
doc.moveDown(0.5);
doc.font('Helvetica').fontSize(8).fillColor(C.mut).text('LabWise LIMS \u2014 Reception Dashboard Logic Document \u2014 Generated 8 April 2026', { align: 'center' });

doc.end();
output.on('finish', () => console.log('PDF generated: docs/Reception-Dashboard-Logic.pdf'));
