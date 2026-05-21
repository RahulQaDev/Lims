const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 45, bottom: 45, left: 50, right: 50 } });
const output = fs.createWriteStream(path.join(__dirname, 'Analyst-Dashboard-Logic.pdf'));
doc.pipe(output);

const W = 495;
const C = { pri: '#4F46E5', sec: '#7C3AED', txt: '#1F2937', mut: '#6B7280', lgt: '#F3F4F6', wht: '#FFFFFF', bdr: '#E5E7EB', grn: '#059669', amb: '#D97706', red: '#DC2626' };

function h1(t) { doc.moveDown(1); doc.font('Helvetica-Bold').fontSize(18).fillColor(C.pri).text(t); doc.moveDown(0.15); doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.pri).lineWidth(1.5).stroke(); doc.moveDown(0.4); }
function h2(t) { doc.moveDown(0.6); doc.font('Helvetica-Bold').fontSize(13).fillColor(C.sec).text(t); doc.moveDown(0.25); }
function h3(t) { doc.moveDown(0.4); doc.font('Helvetica-Bold').fontSize(11).fillColor(C.txt).text(t); doc.moveDown(0.15); }
function p(t) { doc.font('Helvetica').fontSize(9.5).fillColor(C.txt).text(t, { lineGap: 2.5 }); doc.moveDown(0.2); }
function b(t) { doc.font('Helvetica').fontSize(9.5).fillColor(C.txt).text(`  \u2022  ${t}`, { lineGap: 2 }); }
function note(t) { doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(C.mut).text(t); doc.moveDown(0.15); }
function gap() { doc.moveDown(0.3); }

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
doc.rect(0, 0, 595, 842).fill('#1E1B4B');
doc.circle(480, 80, 180).fill('#312E81').opacity(0.3);
doc.circle(100, 720, 130).fill('#4338CA').opacity(0.2);
doc.opacity(1);
doc.font('Helvetica-Bold').fontSize(34).fillColor('#FFFFFF').text('Analyst Dashboard', 50, 280, { width: W, align: 'center' });
doc.moveDown(0.2);
doc.font('Helvetica').fontSize(16).fillColor('#A5B4FC').text('Logic & Calculation Document', { width: W, align: 'center' });
doc.moveDown(2);
doc.moveTo(200, doc.y).lineTo(395, doc.y).strokeColor('#6366F1').lineWidth(2).stroke();
doc.moveDown(2);
doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text('LabWise LIMS', { width: W, align: 'center' });
doc.moveDown(3);
doc.font('Helvetica').fontSize(10).fillColor('#818CF8').text('7 April 2026', { width: W, align: 'center' });

// ═══ STATS ═══
doc.addPage();
h1('Stats Strip (Top Bar)');

h3('Assigned Today');
p('How many tests were assigned to this analyst today.');
p('Logic: Count BookingTest records where assignedTo = this analyst AND createdAt = today.');

h3('Completed');
p('How many tests this analyst finished today.');
p('Logic: Count BookingTest records where assignedTo = this analyst, status is completed/reviewed/approved, AND updatedAt = today.');

h3('Pending');
p('Tests waiting in the analyst\'s queue right now.');
p('Logic: Count BookingTest records where assignedTo = this analyst, status is pending or in_progress. No date filter.');

h3('Overdue');
p('Tests that have crossed their deadline and are still not done.');
p('Logic: Count BookingTest records where assignedTo = this analyst, status is pending/in_progress, AND dueDate < current time.');

h3('On-Time Rate');
p('Percentage of tests finished before their deadline this month.');
p('Logic: (tests completed before dueDate this month / total completed this month) x 100.');

note('All stats refresh every 60 seconds automatically.');

// ═══ KPIs ═══
doc.addPage();
h1('KPIs (5 Monthly Metrics)');
p('All KPIs are auto-computed from database records. No manual input needed.');
gap();

tbl(
  ['KPI', 'Target', 'What It Measures'],
  [
    ['Samples Completed / Month', '120', 'Volume of work done this month'],
    ['Average TAT', '24 hrs', 'Time from test reaching dept to result entry'],
    ['On-Time Delivery', '95%', 'Percentage of results entered before deadline'],
    ['Rejection Rate', '2%', 'How often reviewer sends results back'],
    ['Pending Tasks', '0', 'Tests still in the queue'],
  ],
  [150, 70, 275]
);

h2('Detailed Calculation Logic');

h3('1. Samples Completed / Month');
p('Count all BookingTest records assigned to this analyst with status completed/reviewed/approved, updated this month.');
p('Target: 120 tests (currently same for all, will be per-department later).');
p('Color: Green >= 100, Yellow >= 80, Red < 80.');

h3('2. Average TAT (Turnaround Time)');
p('Measures how long the analyst takes from receiving a test to entering the result.');
b('Start: BookingTest.createdAt \u2014 when the booking was done and test landed in the department');
b('End: Result.enteredAt \u2014 when the analyst submitted the result');
b('Formula: Average of (Result.enteredAt - BookingTest.createdAt) in hours for all completed tests this month');
b('Fallback: If no Result record exists, uses BookingTest.updatedAt');
gap();
p('Color: Green <= 24h, Yellow <= 36h, Red > 36h. Lower is better.');

h3('3. On-Time Delivery');
p('Percentage of results entered before the deadline.');
b('For each completed test: check if Result.enteredAt <= BookingTest.dueDate');
b('Count on-time / total completed x 100');
b('Same fallback as TAT if no Result record');
gap();
p('Color: Green >= 90%, Yellow >= 70%, Red < 70%.');

h3('4. Rejection Rate');
p('How often the reviewer rejects and sends results back.');
b('Formula: rejected / (completed + rejected) x 100');
b('Lower is better');
gap();
p('Color: Green <= 3%, Yellow <= 7%, Red > 7%.');
note('Current limitation: Only counts tests currently in "rejected" status. Once ResultHistory table is implemented, every rejection will count permanently.');

h3('5. Pending Tasks');
p('Count of tests with status pending or in_progress assigned to this analyst.');
p('Target: 0. Color: Green <= 5, Yellow <= 10, Red > 10. Lower is better.');

// ═══ KPI PROGRESS ═══
gap();
h2('How KPI Progress Bar is Calculated');
b('Normal KPI: min(100, actual / target x 100)');
b('Inverse KPI (target = 0): actual is 0 = 100%, otherwise max(0, 100 - actual x 10)');
b('Inverse KPI (target > 0): min(100, target / actual x 100)');

// ═══ KRAs ═══
doc.addPage();
h1('KRAs (4 Weighted Performance Areas)');
p('The overall KRA score is a weighted average. Each area gets a score out of 100, multiplied by its weight.');
gap();

tbl(
  ['KRA', 'Target', 'Weight', 'How Score is Calculated'],
  [
    ['Testing Accuracy', '98%', '30%', '(total tests - rejected) / total tests x 100'],
    ['TAT Compliance', '95%', '25%', 'Same as On-Time Delivery KPI percentage'],
    ['Sample Throughput', '120/mo', '25%', 'min(100, tests completed / 120 x 100)'],
    ['Quality Score', '95%', '20%', '100 - (rejection rate x 5)'],
  ],
  [110, 60, 50, 275]
);

h2('Overall KRA Score Formula');
p('(Accuracy Score x 0.30) + (TAT Score x 0.25) + (Throughput Score x 0.25) + (Quality Score x 0.20)');
gap();
h3('Example:');
b('Testing Accuracy: 98.2% \u2192 Score: 100% (exceeds 98% target)');
b('TAT Compliance: 93.2% \u2192 Score: 98.1% (93.2/95 x 100)');
b('Sample Throughput: 98/120 = 81.7% \u2192 Score: 81.7%');
b('Quality Score: rejection 1.8%, so 100 - 9 = 91% \u2192 Score: 95.8% (91/95 x 100)');
gap();
p('Overall = (100 x 0.30) + (98.1 x 0.25) + (81.7 x 0.25) + (95.8 x 0.20) = 30 + 24.5 + 20.4 + 19.2 = 94.1%');
gap();
h3('Color Coding:');
b('Green: Score >= 90%');
b('Yellow: Score >= 75%');
b('Red: Score < 75%');

h2('Quality Score Penalty Explained');
p('Each 1% of rejection rate removes 5 points from the quality score:');
tbl(
  ['Rejection Rate', 'Quality Score', 'Impact'],
  [
    ['0%', '100', 'Perfect quality'],
    ['1%', '95', 'At target'],
    ['2%', '90', 'Slightly below target'],
    ['5%', '75', 'Needs attention (amber zone)'],
    ['10%', '50', 'Critical (red zone)'],
  ],
  [165, 165, 165]
);
note('The x5 multiplier is pending final confirmation from stakeholder.');

// ═══ WORK QUEUE ═══
doc.addPage();
h1('Work Queue Logic');

h2('Sorting');
p('Tests are sorted in two levels:');
b('First by priority: Critical > Urgent > Normal');
b('Within same priority: least time remaining comes first');

h2('Auto-Escalation');
p('The system automatically bumps priority when TAT is running low:');
gap();
tbl(
  ['Condition', 'Action', 'Example (48h TAT test)'],
  [
    ['Less than 25% TAT remaining, currently Normal', 'Escalate to Urgent', '12 hours left \u2192 Urgent'],
    ['Less than 10% TAT remaining, not already Critical', 'Escalate to Critical', '4.8 hours left \u2192 Critical'],
    ['Past due date', 'Show as OVERDUE in red', 'Deadline passed \u2192 red label'],
  ],
  [185, 155, 155]
);

h2('Time Remaining Colors');
tbl(
  ['Time Left', 'Color', 'Meaning'],
  [
    ['More than 4 hours', 'Green', 'Comfortable'],
    ['1 to 4 hours', 'Yellow', 'Getting tight'],
    ['Less than 1 hour', 'Red', 'Urgent attention needed'],
    ['Past deadline', 'Red + OVERDUE label', 'Missed deadline'],
  ],
  [140, 120, 235]
);

h2('Due Date Calculation');
p('Current: Booking date + TAT hours from test master (e.g., 48h TAT = due in 2 days).');
p('Planned: Smart scheduling that considers lab queue, machine availability, and chemical stock.');

// ═══ ALERTS ═══
h1('Alerts');

h2('OOS (Out of Specification)');
b('Triggers when: Any result parameter entered by this analyst has passFail = "fail"');
b('Only shows if result status is "entered" or "reviewed" (not fully resolved yet)');
b('Shows: Sample code, test name, parameter, obtained value, spec limit');
b('Refresh: Every 30 seconds (most frequent on the dashboard)');
b('Display: Red banner at top of dashboard');

h2('Low Stock');
b('Triggers when: Any consumable in the analyst\'s location has current stock <= minimum stock');
b('Critical flag: Red if stock is zero');
b('Refresh: Every 5 minutes');

h2('Equipment Issues');
b('Triggers when: Any instrument in analyst\'s department is not "active"');
b('Auto-detects: Calibration overdue if next calibration date has passed');
b('PM due soon: Flagged if calibration due within 7 days');
b('Only shows instruments with problems; hidden if everything is fine');
b('Refresh: Every 5 minutes');

// ═══ REFRESH ═══
doc.addPage();
h1('Auto-Refresh Schedule');
p('The dashboard updates itself automatically. No manual refresh needed.');
gap();
tbl(
  ['Data', 'Refresh Interval', 'Reason'],
  [
    ['OOS Alerts', 'Every 30 seconds', 'Safety critical \u2014 analyst must respond quickly'],
    ['Stats, Work Queue, Recent Results', 'Every 60 seconds', 'Work changes frequently during the day'],
    ['KPIs, KRAs', 'Every 5 minutes', 'Monthly numbers don\'t change rapidly'],
    ['Equipment, Consumables', 'Every 5 minutes', 'Status changes are infrequent'],
  ],
  [155, 110, 230]
);
p('If the server is unavailable, the dashboard shows the last known data or sample mock data so the page doesn\'t break.');

// ═══ DATA SOURCES ═══
h1('Data Sources');
p('Where each number on the dashboard comes from:');
gap();
tbl(
  ['What', 'Database Table'],
  [
    ['Test assignments, status, due dates', 'BookingTest'],
    ['Sample codes, client names', 'Sample, Client (via Booking)'],
    ['Test names, TAT hours', 'TestMaster'],
    ['Department info', 'Department, DepartmentUser'],
    ['When the analyst entered the result', 'Result (enteredAt field)'],
    ['Pass/fail for OOS detection', 'ResultParameter'],
    ['Instrument status, calibration dates', 'Instrument'],
    ['Stock levels for consumables', 'InventoryItem'],
  ],
  [200, 295]
);

// ═══ PENDING ═══
h1('Pending Items');

tbl(
  ['Item', 'Current State', 'What Will Change', 'Effort'],
  [
    ['Rejection History', 'Only tracks current status; rejections lost on re-entry', 'ResultHistory table logs every rejection permanently', '3 hrs'],
    ['Throughput Target', 'Hardcoded 120/month for all', 'Configurable per department by dept head', '1 hr'],
    ['Smart Due Dates', 'Booking date + TAT hours', 'Factors in lab queue, machine, chemicals', 'TBD'],
    ['Quality Penalty', 'x5 multiplier set', 'Awaiting stakeholder confirmation', '-'],
  ],
  [100, 140, 165, 45]
);

// ═══ FOOTER ═══
doc.moveDown(2);
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.bdr).lineWidth(0.5).stroke();
doc.moveDown(0.5);
doc.font('Helvetica').fontSize(8).fillColor(C.mut).text('LabWise LIMS \u2014 Analyst Dashboard Logic Document \u2014 Generated 7 April 2026', { align: 'center' });

doc.end();
output.on('finish', () => console.log('PDF generated: docs/Analyst-Dashboard-Logic.pdf'));
