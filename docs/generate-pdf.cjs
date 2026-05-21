const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
const output = fs.createWriteStream(path.join(__dirname, 'Agent-Q-Dashboard-Summary.pdf'));
doc.pipe(output);

const W = 495; // usable width
const COLORS = { primary: '#4F46E5', secondary: '#7C3AED', accent: '#059669', text: '#1F2937', muted: '#6B7280', light: '#F3F4F6', white: '#FFFFFF', red: '#DC2626', amber: '#D97706', green: '#059669', border: '#E5E7EB' };

// ─── Helpers ─────────────────────────────────────────────

function heading(text, level = 1) {
  doc.moveDown(level === 1 ? 1.5 : 0.8);
  const sizes = { 1: 22, 2: 16, 3: 13 };
  const colors = { 1: COLORS.primary, 2: COLORS.secondary, 3: COLORS.text };
  doc.font('Helvetica-Bold').fontSize(sizes[level] || 13).fillColor(colors[level] || COLORS.text).text(text);
  if (level === 1) {
    doc.moveDown(0.2);
    doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).strokeColor(COLORS.primary).lineWidth(2).stroke();
  }
  doc.moveDown(0.3);
}

function para(text) {
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.text).text(text, { lineGap: 3 });
  doc.moveDown(0.3);
}

function bold(text) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.text).text(text);
}

function bullet(text) {
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.text).text(`  •  ${text}`, { lineGap: 2 });
}

function table(headers, rows, colWidths) {
  const startX = 50;
  let y = doc.y + 5;
  const rowH = 22;
  const padX = 6;

  // Check if table fits on page
  const needed = (rows.length + 1) * rowH + 20;
  if (y + needed > 750) { doc.addPage(); y = 50; }

  // Header row
  doc.rect(startX, y, W, rowH).fill(COLORS.primary);
  let x = startX;
  headers.forEach((h, i) => {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.white).text(h, x + padX, y + 6, { width: colWidths[i] - padX * 2 });
    x += colWidths[i];
  });
  y += rowH;

  // Data rows
  rows.forEach((row, ri) => {
    if (y + rowH > 750) { doc.addPage(); y = 50; }
    const bg = ri % 2 === 0 ? COLORS.white : COLORS.light;
    doc.rect(startX, y, W, rowH).fill(bg);
    x = startX;
    row.forEach((cell, ci) => {
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.text).text(String(cell || ''), x + padX, y + 6, { width: colWidths[ci] - padX * 2 });
      x += colWidths[ci];
    });
    y += rowH;
  });

  // Border
  doc.rect(startX, doc.y + 5 - ((rows.length + 1) * rowH) - 5, W, (rows.length + 1) * rowH).strokeColor(COLORS.border).lineWidth(0.5).stroke();

  doc.y = y + 5;
  doc.moveDown(0.5);
}

function infoBox(label, value, color) {
  const boxW = 90;
  const x = doc.x;
  doc.rect(x, doc.y, boxW, 40).fill(color || COLORS.light).strokeColor(COLORS.border).stroke();
  doc.font('Helvetica-Bold').fontSize(14).fillColor(COLORS.text).text(value, x, doc.y - 35, { width: boxW, align: 'center' });
  doc.font('Helvetica').fontSize(7).fillColor(COLORS.muted).text(label, x, doc.y - 15, { width: boxW, align: 'center' });
}

function separator() {
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).strokeColor(COLORS.border).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

// ═══════════════════════════════════════════════════════════
// COVER PAGE
// ═══════════════════════════════════════════════════════════

doc.rect(0, 0, 595, 842).fill('#1E1B4B');

// Decorative circles
doc.circle(500, 100, 200).fill('#312E81').opacity(0.3);
doc.circle(80, 700, 150).fill('#4338CA').opacity(0.2);
doc.opacity(1);

// Title
doc.font('Helvetica-Bold').fontSize(38).fillColor('#FFFFFF').text('Agent Q', 50, 250, { width: W, align: 'center' });
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(14).fillColor('#A5B4FC').text('Dashboard Intelligence Summary', { width: W, align: 'center' });

doc.moveDown(2);
doc.moveTo(200, doc.y).lineTo(395, doc.y).strokeColor('#6366F1').lineWidth(2).stroke();
doc.moveDown(2);

doc.font('Helvetica-Bold').fontSize(20).fillColor('#FFFFFF').text('LabWise LIMS', { width: W, align: 'center' });
doc.moveDown(0.5);
doc.font('Helvetica').fontSize(12).fillColor('#A5B4FC').text('Laboratory Information Management System', { width: W, align: 'center' });

doc.moveDown(4);
doc.font('Helvetica').fontSize(11).fillColor('#818CF8').text('Compiled: 7 April 2026', { width: W, align: 'center' });
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(10).fillColor('#6366F1').text('Source files audited: 10 (frontend, backend, config)', { width: W, align: 'center' });

// ═══════════════════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════════════════

doc.addPage();
heading('Table of Contents');
doc.moveDown(0.5);
const toc = [
  ['1', 'Dashboard Overview', '3'],
  ['2', 'Analyst Dashboard — Full Detail', '4'],
  ['3', 'Analyst KPIs (5 Metrics)', '5'],
  ['4', 'Analyst KRAs (4 Weighted Areas)', '6'],
  ['5', 'Automation Logic & Alert Triggers', '7'],
  ['6', 'Booking Dashboard Summary', '8'],
  ['7', 'HQ Dashboard Summary', '9'],
  ['8', 'Role-Level KRA/KPI Reference', '10'],
  ['9', 'Auto-Refresh & Data Source Map', '11'],
];
toc.forEach(([num, title, pg]) => {
  doc.font('Helvetica').fontSize(11).fillColor(COLORS.text).text(`${num}.  ${title}`, 70, doc.y, { continued: true, width: 400 });
  doc.font('Helvetica').fontSize(11).fillColor(COLORS.muted).text(pg, { align: 'right', width: 60 });
  doc.moveDown(0.4);
});

// ═══════════════════════════════════════════════════════════
// 1. DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════════════

doc.addPage();
heading('1. Dashboard Overview');
para('LabWise LIMS currently has 4 dashboards, each targeting different user roles. The Analyst Dashboard is the most advanced — fully API-driven with auto-computed KPIs, KRAs, and real-time alerts.');

doc.moveDown(0.3);
table(
  ['Dashboard', 'Target Roles', 'API Status', 'KPIs', 'KRAs', 'Auto-Refresh'],
  [
    ['Default', 'All (fallback)', 'Static mock', 'None', 'None', 'None'],
    ['Analyst', 'analyst', 'Fully automated (7 APIs)', '5', '4 (weighted)', 'Yes (30-300s)'],
    ['Booking', 'booking, reception', 'Partial (4 APIs)', '8', '5 (1 placeholder)', 'Partial'],
    ['HQ', 'admin, area_manager', 'Static mock', 'None', 'None', 'None'],
  ],
  [80, 90, 110, 60, 85, 70]
);

heading('Key Findings', 2);
bullet('Analyst Dashboard: 100% automated — zero manual input required for any metric');
bullet('Booking Dashboard: 4/5 KRAs computed from real data; "Client Data Compliance" is hardcoded at 97%');
bullet('Default & HQ Dashboards: Entirely static mock data — no API integration yet');
bullet('OOS alerts refresh every 30 seconds (most aggressive interval)');

// ═══════════════════════════════════════════════════════════
// 2. ANALYST DASHBOARD DETAIL
// ═══════════════════════════════════════════════════════════

doc.addPage();
heading('2. Analyst Dashboard — Full Detail');
para('Route: /dashboard/analyst  |  Backend: /api/analyst-dashboard/*  |  Auth: JWT, auto-scoped to req.userId');

heading('Sections / Widgets', 2);
table(
  ['#', 'Widget', 'API Endpoint', 'Refresh', 'Stale'],
  [
    ['1', 'Header + Stats Strip', '/analyst-dashboard/stats', '60s', '30s'],
    ['2', 'OOS Alert Bar', '/analyst-dashboard/oos-alerts', '30s', '15s'],
    ['3', 'Low Stock Alert', '/analyst-dashboard/consumable-alerts', '300s', '120s'],
    ['4', 'Work Queue Table', '/analyst-dashboard/work-queue', '60s', '30s'],
    ['5', 'KRA Score + KPI Metrics', '/analyst-dashboard/kpis', '300s', '60s'],
    ['6', 'Equipment Issues', '/analyst-dashboard/equipment', '300s', '120s'],
    ['7', 'Recent Results (toggle)', '/analyst-dashboard/recent-results', '60s', '30s'],
    ['8', 'Quick Actions (toggle)', 'N/A (static links)', 'N/A', 'N/A'],
  ],
  [25, 110, 170, 55, 50]
);

heading('Stats Strip (Header Banner)', 2);
table(
  ['Stat', 'Calculation'],
  [
    ['Assigned Today', 'COUNT(BookingTest) WHERE assignedTo=me AND createdAt >= startOfToday'],
    ['Completed', 'COUNT(BookingTest) WHERE assignedTo=me AND status IN (completed,reviewed,approved) AND updatedAt >= today'],
    ['Pending', 'COUNT(BookingTest) WHERE assignedTo=me AND status IN (pending,in_progress)'],
    ['Overdue', 'COUNT(BookingTest) WHERE assignedTo=me AND status IN (pending,in_progress) AND dueDate < NOW()'],
    ['On-Time Rate', '(completedOnTimeThisMonth / completedThisMonth) * 100'],
  ],
  [90, 405]
);

// ═══════════════════════════════════════════════════════════
// 3. ANALYST KPIs
// ═══════════════════════════════════════════════════════════

doc.addPage();
heading('3. Analyst KPIs (5 Metrics)');
para('All KPIs are auto-computed monthly from BookingTest and Result tables. No manual input required.');

table(
  ['KPI', 'Target', 'Unit', 'Inv?', 'Calculation Formula'],
  [
    ['Samples Completed / Month', '120', 'count', 'No', 'COUNT(BookingTest) WHERE status IN (completed,reviewed,approved) AND updatedAt >= monthStart'],
    ['Average TAT', '24', 'hrs', 'Yes', 'SUM(updatedAt - createdAt) / COUNT(completedTests) in hours'],
    ['On-Time Delivery', '95', '%', 'No', 'COUNT(completed WHERE updatedAt <= dueDate) / total * 100'],
    ['Rejection Rate', '2', '%', 'Yes', 'COUNT(status=rejected) / (completed + rejected) * 100'],
    ['Pending Tasks', '0', 'count', 'Yes', 'COUNT(BookingTest) WHERE status IN (pending,in_progress)'],
  ],
  [110, 45, 40, 35, 265]
);

heading('KPI Progress Formula', 2);
bullet('Normal KPI: min(100, (actual / target) * 100)');
bullet('Inverse (target=0): actual === 0 ? 100 : max(0, 100 - actual * 10)');
bullet('Inverse (target>0): min(100, (target / max(actual, 0.01)) * 100)');

heading('Color Thresholds', 2);
table(
  ['Range', 'Color', 'Meaning'],
  [
    ['>= 90%', 'Green (emerald)', 'On track / Excellent'],
    ['>= 75%', 'Amber', 'Needs attention'],
    ['< 75%', 'Red', 'Critical / Failing'],
  ],
  [120, 150, 225]
);

heading('KPI Alert Thresholds (from defaultRoles.ts)', 2);
table(
  ['KPI', 'Green Threshold', 'Yellow Threshold'],
  [
    ['Samples Completed', '>= 100', '>= 80'],
    ['Average TAT', '<= 24 hrs', '<= 36 hrs'],
    ['On-Time Delivery', '>= 90%', '>= 70%'],
    ['Rejection Rate', '<= 3%', '<= 7%'],
    ['Pending Tasks', '<= 5', '<= 10'],
  ],
  [165, 165, 165]
);

// ═══════════════════════════════════════════════════════════
// 4. ANALYST KRAs
// ═══════════════════════════════════════════════════════════

doc.addPage();
heading('4. Analyst KRAs (4 Weighted Areas)');
para('All KRAs are auto-computed from the same monthly data as KPIs. The overall score is a weighted average.');

table(
  ['KRA', 'Target', 'Weight', 'Score Formula (Backend)'],
  [
    ['Testing Accuracy', '98%', '30%', '(totalDone - rejected) / totalDone * 100'],
    ['TAT Compliance', '95%', '25%', 'Same as On-Time Delivery KPI (onTimePct)'],
    ['Sample Throughput', '120/month', '25%', 'min(100, (samplesCompleted / 120) * 100)'],
    ['Quality Score', '95%', '20%', 'max(0, 100 - rejectionRate * 5)'],
  ],
  [105, 65, 50, 275]
);

heading('Overall KRA Score Formula', 2);
bold('Overall = SUM( kra.score * kra.weight / 100 )  for all 4 KRAs');
doc.moveDown(0.3);
para('Example: If Testing Accuracy scores 100% (weight 30%), TAT Compliance 98% (25%), Throughput 82% (25%), Quality 96% (20%):');
para('Overall = (100*0.30) + (98*0.25) + (82*0.25) + (96*0.20) = 30 + 24.5 + 20.5 + 19.2 = 94.2%');

heading('Individual KRA Score', 2);
bullet('Score = min(100, (actual / target) * 100)');
bullet('Color: Green >= 90%, Amber >= 75%, Red < 75%');
bullet('Displayed as a progress bar with percentage in the KRA Score Card');

// ═══════════════════════════════════════════════════════════
// 5. AUTOMATION LOGIC
// ═══════════════════════════════════════════════════════════

doc.addPage();
heading('5. Automation Logic & Alert Triggers');

heading('Work Queue — Auto-Escalation', 2);
para('The work queue automatically escalates test priority based on remaining TAT time:');
table(
  ['Condition', 'Action', 'Example'],
  [
    ['Time left < 25% of TAT AND priority = NORMAL', 'Escalate to URGENT', '48h TAT, 12h left => URGENT'],
    ['Time left < 10% of TAT AND priority != CRITICAL', 'Escalate to CRITICAL', '48h TAT, 4.8h left => CRITICAL'],
    ['Time left <= 0', 'Show as OVERDUE (red)', 'Past due date => red label'],
  ],
  [200, 140, 155]
);

heading('OOS (Out-of-Specification) Detection', 2);
para('Auto-detected from ResultParameter where passFail = "fail". Checks results entered by this analyst with status "entered" or "reviewed" (not yet fully resolved). Refreshes every 30 seconds.');

heading('Equipment Auto-Flagging', 2);
bullet('If nextCalibrationDate <= today AND status is "active" => auto-set to "calibration_due"');
bullet('pmDueSoon = true if nextCalibrationDate <= today + 7 days');
bullet('Only equipment with issues shown on dashboard (status != active)');

heading('Consumable Low Stock', 2);
bullet('Triggers when currentStock <= minStock');
bullet('critical = true when currentStock === 0 (red badge)');
bullet('Filtered by analyst\'s location (user.locationId)');

heading('Time-Left Color Coding (Work Queue)', 2);
table(
  ['Time Remaining', 'Color', 'Background'],
  [
    ['<= 0 (OVERDUE)', 'Red', 'Red-50'],
    ['< 60 minutes', 'Red', 'Red-50'],
    ['< 240 minutes (4h)', 'Amber', 'Amber-50'],
    ['>= 240 minutes', 'Green', 'Emerald-50'],
  ],
  [165, 165, 165]
);

// ═══════════════════════════════════════════════════════════
// 6. BOOKING DASHBOARD
// ═══════════════════════════════════════════════════════════

doc.addPage();
heading('6. Booking Dashboard Summary');
para('Route: /dashboard/booking  |  Backend: /api/booking-kpi/*  |  Target: booking, reception roles');

heading('KPIs (8 Metrics)', 2);
table(
  ['KPI', 'Target', 'Unit', 'Inverse'],
  [
    ['Samples Booked / Day', '25', 'count', 'No'],
    ['Avg Booking Time', '2', 'hrs', 'Yes'],
    ['On-Time Rate', '95', '%', 'No'],
    ['Cancellation Rate', '2', '%', 'Yes'],
    ['Amendment Rate', '5', '%', 'Yes'],
    ['Revenue / Day', '50,000', 'INR', 'No'],
    ['Barcodes Same Day', '100', '%', 'No'],
    ['Pending Bookings', '0', 'count', 'Yes'],
  ],
  [140, 80, 80, 80]
);

heading('KRAs (5 Weighted)', 2);
table(
  ['KRA', 'Target', 'Weight', 'Status'],
  [
    ['Booking Accuracy', '99%', '30%', 'Auto-computed'],
    ['Booking Turnaround', '95%', '25%', 'Auto-computed'],
    ['Daily Volume', '100%', '20%', 'Auto-computed'],
    ['Amendment Rate', '<=5%', '15%', 'Auto-computed (inverse)'],
    ['Client Data Compliance', '100%', '10%', 'PLACEHOLDER (hardcoded 97%)'],
  ],
  [130, 65, 55, 245]
);

// ═══════════════════════════════════════════════════════════
// 7. HQ DASHBOARD
// ═══════════════════════════════════════════════════════════

heading('7. HQ Dashboard Summary', 1);
para('Route: /dashboard/hq  |  Target: HQ management, admin, area_manager  |  Status: FULLY STATIC (mock data)');
bullet('5 location cards: Delhi HQ, Alcatec, Manesar, Bangalore, Baddi');
bullet('Summary stats: Total Samples, Pending Tests, TAT Compliance (avg), Revenue (sum)');
bullet('TAT color coding: Green >= 93%, Yellow >= 88%, Red < 88%');
bullet('No backend API integration yet — all hardcoded mock data');

// ═══════════════════════════════════════════════════════════
// 8. ROLE KRA/KPI REFERENCE
// ═══════════════════════════════════════════════════════════

doc.addPage();
heading('8. Role-Level KRA/KPI Reference');
para('Defined in src/config/defaultRoles.ts. These are benchmark configurations for each role.');

heading('Analyst', 3);
table(['KRA', 'Target', 'Weight'], [['Testing Accuracy', '98%', '30%'], ['Turnaround Compliance', '95%', '25%'], ['Sample Throughput', '100%', '25%'], ['Quality Score', '95%', '20%']], [200, 150, 145]);

heading('Reviewer', 3);
table(['KRA', 'Target', 'Weight'], [['Review Accuracy', '99%', '35%'], ['Review Turnaround', '95%', '25%'], ['Rejection Identification', '90%', '20%'], ['Compliance Adherence', '100%', '20%']], [200, 150, 145]);

heading('Receptionist', 3);
table(['KRA', 'Target', 'Weight'], [['Registration Accuracy', '99%', '30%'], ['Processing Speed', '95%', '25%'], ['Client Satisfaction', '90%', '25%'], ['Documentation Compliance', '100%', '20%']], [200, 150, 145]);

heading('Department Head', 3);
table(['KRA', 'Target', 'Weight'], [['Dept TAT Compliance', '95%', '25%'], ['Team Utilization', '90%', '20%'], ['Quality Metrics', '98%', '25%'], ['Cost Efficiency', '95%', '15%'], ['Training Compliance', '100%', '15%']], [200, 150, 145]);

heading('Quality Manager', 3);
table(['KRA', 'Target', 'Weight'], [['Audit Compliance', '100%', '30%'], ['CoA Accuracy', '99%', '25%'], ['CAPA Closure', '95%', '25%'], ['Process Improvement', '90%', '20%']], [200, 150, 145]);

// ═══════════════════════════════════════════════════════════
// 9. DATA SOURCE MAP
// ═══════════════════════════════════════════════════════════

doc.addPage();
heading('9. Auto-Refresh & Data Source Map');

heading('Refresh Intervals', 2);
table(
  ['Data Type', 'Interval', 'Dashboard'],
  [
    ['OOS Alerts', '30s (most aggressive)', 'Analyst'],
    ['Stats / Work Queue / Results', '60s', 'Analyst'],
    ['KPIs / KRAs', '300s (5 min)', 'Analyst'],
    ['Equipment / Consumables', '300s (5 min)', 'Analyst'],
    ['Booking Stats', '60s (staleTime only)', 'Booking'],
    ['Booking Queue', '30s (staleTime only)', 'Booking'],
  ],
  [165, 165, 165]
);

heading('Database Table → Widget Mapping', 2);
table(
  ['DB Table', 'Used By'],
  [
    ['BookingTest', 'Stats, Work Queue, KPIs, KRAs'],
    ['Booking', 'Work Queue (priority), Booking Dashboard'],
    ['Sample', 'Work Queue (sampleCode), Recent Results'],
    ['Client', 'Work Queue (client name)'],
    ['TestMaster', 'Work Queue (test name, TAT hours)'],
    ['Department / DepartmentUser', 'Equipment (dept assignment lookup)'],
    ['Result', 'Recent Results, OOS Alerts'],
    ['ResultParameter', 'OOS Alerts (passFail, observed vs spec)'],
    ['Instrument', 'Equipment Status, calibration tracking'],
    ['InventoryItem', 'Consumable low-stock alerts'],
    ['User', 'Consumables (locationId filter)'],
  ],
  [150, 345]
);

heading('Automation Coverage Summary', 2);
table(
  ['Feature', 'Automation Level', 'Notes'],
  [
    ['Analyst Stats', 'Fully automatic', 'Real-time from BookingTest'],
    ['Analyst Work Queue', 'Fully automatic', 'Auto-sorted + auto-escalated'],
    ['Analyst KPIs/KRAs', 'Fully automatic', 'Monthly aggregation'],
    ['Analyst OOS Alerts', 'Fully automatic', 'Auto-detected from passFail'],
    ['Analyst Equipment', 'Fully automatic', 'Auto-flags calibration overdue'],
    ['Analyst Consumables', 'Fully automatic', 'Auto-detects low stock'],
    ['Booking Stats', 'Fully automatic', 'From Booking/Sample'],
    ['Booking KRAs', 'Mostly automatic', '4/5 computed; 1 placeholder'],
    ['Default Dashboard', 'Static', 'All mock data'],
    ['HQ Dashboard', 'Static', 'All mock data'],
  ],
  [120, 110, 265]
);

// Footer on last page
doc.moveDown(2);
separator();
doc.font('Helvetica').fontSize(9).fillColor(COLORS.muted).text('Generated by Agent Q — LabWise LIMS Dashboard Intelligence System', { align: 'center' });
doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text('This document is auto-generated. Screenshots to be added in next revision.', { align: 'center' });

doc.end();
output.on('finish', () => {
  console.log('PDF generated: docs/Agent-Q-Dashboard-Summary.pdf');
});
