const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 45, bottom: 45, left: 50, right: 50 } });
const output = fs.createWriteStream(path.join(__dirname, 'Booking-Dashboard-Logic.pdf'));
doc.pipe(output);

const W = 495;
const C = { pri: '#4338CA', sec: '#4F46E5', txt: '#1F2937', mut: '#6B7280', lgt: '#F3F4F6', wht: '#FFFFFF', bdr: '#E5E7EB' };

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
doc.rect(0, 0, 595, 842).fill('#1E1B4B');
doc.circle(480, 80, 180).fill('#312E81').opacity(0.3);
doc.circle(100, 720, 130).fill('#4338CA').opacity(0.2);
doc.opacity(1);
doc.font('Helvetica-Bold').fontSize(34).fillColor('#FFFFFF').text('Booking Dashboard', 50, 280, { width: W, align: 'center' });
doc.moveDown(0.2);
doc.font('Helvetica').fontSize(16).fillColor('#A5B4FC').text('Logic & Calculation Document', { width: W, align: 'center' });
doc.moveDown(2);
doc.moveTo(200, doc.y).lineTo(395, doc.y).strokeColor('#6366F1').lineWidth(2).stroke();
doc.moveDown(2);
doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text('LabWise LIMS', { width: W, align: 'center' });
doc.moveDown(3);
doc.font('Helvetica').fontSize(10).fillColor('#818CF8').text('8 April 2026', { width: W, align: 'center' });

// STATS
doc.addPage();
h1('Stats Strip (Top Bar)');

h3('Booked Today');
p('Count of Booking records where bookedBy = this user AND createdAt = today. Shows % trend vs yesterday.');

h3('Pending Queue');
p('Global count of Sample records where status = "received". Lab-wide metric, not user-scoped.');

h3('Revenue');
p('SUM(Booking.netAmount) where bookedBy = this user AND createdAt = today. Shown in thousands.');

h3('On-Time Rate');
p('For each booking this month: hours = (Booking.createdAt - Sample.receivedDate). On-time if hours <= 2. Count on-time / total valid x 100. Only bookings with 0-720 hour range counted.');

h3('Avg Time');
p('Average of (Booking.createdAt - Sample.receivedDate) in hours for all bookings this month. This is the Booking TAT: sample received at lab to booking completed.');

note('All stats refresh every 60 seconds.');

// KPIs
doc.addPage();
h1('KPIs (6 Metrics)');

tbl(
  ['KPI', 'Target', 'What It Measures'],
  [
    ['Booked / Day', '25', 'Volume of bookings today'],
    ['Avg Booking Time', '2 hrs', 'TAT: sample received to booking created'],
    ['On-Time Rate', '95%', '% booked within 2 hours of receipt'],
    ['Amendment Rate', '5%', '% of bookings needing corrections (inverse)'],
    ['Barcode Same Day', '100%', '% of barcodes generated same day'],
    ['Pending Queue', '0', 'Lab-wide unbooked samples (inverse)'],
  ],
  [120, 65, 310]
);

h2('Booking TAT Definition');
p('Start: Sample.receivedDate (when sample physically arrived at the lab)');
p('End: Booking.createdAt (when booking person completed the booking)');
p('On-time threshold: 2 hours or less between these two timestamps.');
note('Only bookings where time difference is 0-720 hours are counted (filters bad data).');

h2('KPI Progress Formulas');
b('Normal: min(100, actual / target x 100)');
b('Inverse (target=0): actual is 0 = 100%, else max(0, 100 - actual x 10)');
b('Inverse (target>0): min(100, target / actual x 100)');

// KRAs
doc.addPage();
h1('KRAs (5 Weighted Areas)');

tbl(
  ['KRA', 'Target', 'Weight', 'Calculation'],
  [
    ['Booking Accuracy', '99%', '30%', '(1 - amended / total) x 100'],
    ['Booking Turnaround', '95%', '25%', '% booked within 2 hrs of receipt'],
    ['Daily Volume', '100%', '20%', 'total month / (working days x 25) x 100'],
    ['Amendment Rate', '<=5%', '15%', 'amended / total x 100 (inverse)'],
    ['Client Compliance', '100%', '10%', '% with client name+email+phone+address'],
  ],
  [110, 55, 50, 280]
);

h2('Client Data Compliance (Fixed)');
p('Previously hardcoded at 97%. Now auto-computed by checking each booking:');
b('Client has name filled?');
b('Client has email filled?');
b('Client has phone filled?');
b('Client has address filled?');
p('If all four present = compliant. Percentage = compliant / total x 100.');

h2('Overall KRA Formula');
p('Normal: score = min(100, (actual / target) x 100)');
p('Inverse: if actual <= target, score = 100. Else: max(0, 100 - ((actual - target) / target) x 100)');
p('Overall = SUM(score x weight / 100) for all 5 KRAs');

h3('Example:');
b('Accuracy: 97.8% / 99% target = score 98.8 x 0.30 = 29.6');
b('Turnaround: 92.1% / 95% target = score 96.9 x 0.25 = 24.2');
b('Volume: 76% x 0.20 = 15.2');
b('Amendment: 3.8% (<=5% target) = score 100 x 0.15 = 15.0');
b('Compliance: 98.5% / 100% = score 98.5 x 0.10 = 9.9');
p('Overall = 29.6 + 24.2 + 15.2 + 15.0 + 9.9 = 93.9%');

// QUEUE + REFRESH
h1('Booking Queue');
p('Samples in "received" status, sorted by receivedDate ascending. Limited to 50.');
tbl(['Wait Time', 'Color', 'Meaning'], [['<= 2 hours', 'Green', 'Within target'], ['2 - 4 hours', 'Yellow', 'Getting slow'], ['> 4 hours', 'Red', 'Needs attention']], [165, 165, 165]);

doc.addPage();
h1('Auto-Refresh Schedule');
tbl(['Data', 'Refresh', 'Stale Time', 'Reason'], [['Booking Queue', '30 seconds', '15s', 'New samples arrive frequently'], ['Stats, Bookings', '60 seconds', '30s', 'Work changes during the day'], ['KRAs', '5 minutes', '60s', 'Monthly metrics change slowly']], [130, 80, 65, 220]);

h1('Data Sources');
tbl(['What', 'Database Table'], [['Booking counts, amounts, amendments', 'Booking'], ['Sample receivedDate, status, priority', 'Sample'], ['Client name, email, phone, address', 'Client'], ['Test count per booking', 'BookingTest']], [230, 265]);

h1('Pending Items');
tbl(['Item', 'Current', 'Planned'], [['Barcode Tracking', 'Approximated', 'Track actual barcode timestamp'], ['Quotation Module', 'Not on dashboard', 'Add quotation status'], ['PO Consumption', 'Not on dashboard', 'Add PO tracking widget'], ['Cancellation Rate', 'Calculated, not shown', 'Add to KPI sidebar']], [120, 170, 205]);

// FOOTER
doc.moveDown(2);
doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.bdr).lineWidth(0.5).stroke();
doc.moveDown(0.5);
doc.font('Helvetica').fontSize(8).fillColor(C.mut).text('LabWise LIMS -- Booking Dashboard Logic Document -- Generated 8 April 2026', { align: 'center' });

doc.end();
output.on('finish', function() { console.log('PDF generated: docs/Booking-Dashboard-Logic.pdf'); });
