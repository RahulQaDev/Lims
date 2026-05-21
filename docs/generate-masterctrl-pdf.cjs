const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const doc = new PDFDocument({ size: 'A4', margins: { top: 45, bottom: 45, left: 50, right: 50 } });
const output = fs.createWriteStream(path.join(__dirname, 'Master-Controller-Dashboard-Logic.pdf'));
doc.pipe(output);
const W = 495;
const C = { pri: '#7C3AED', sec: '#6D28D9', txt: '#1F2937', mut: '#6B7280', lgt: '#F3F4F6', wht: '#FFFFFF', bdr: '#E5E7EB' };
function h1(t){doc.moveDown(1);doc.font('Helvetica-Bold').fontSize(18).fillColor(C.pri).text(t);doc.moveDown(0.15);doc.moveTo(50,doc.y).lineTo(545,doc.y).strokeColor(C.pri).lineWidth(1.5).stroke();doc.moveDown(0.4);}
function h2(t){doc.moveDown(0.6);doc.font('Helvetica-Bold').fontSize(13).fillColor(C.sec).text(t);doc.moveDown(0.25);}
function h3(t){doc.moveDown(0.4);doc.font('Helvetica-Bold').fontSize(11).fillColor(C.txt).text(t);doc.moveDown(0.15);}
function p(t){doc.font('Helvetica').fontSize(9.5).fillColor(C.txt).text(t,{lineGap:2.5});doc.moveDown(0.2);}
function b(t){doc.font('Helvetica').fontSize(9.5).fillColor(C.txt).text('  \u2022  '+t,{lineGap:2});}
function tbl(headers,rows,widths){var x0=50,y=doc.y+4,rh=18,px=5;if(y+(rows.length+1)*rh+10>780){doc.addPage();y=45;}doc.rect(x0,y,W,rh).fill(C.pri);var x=x0;headers.forEach(function(h,i){doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.wht).text(h,x+px,y+5,{width:widths[i]-px*2});x+=widths[i];});y+=rh;rows.forEach(function(row,ri){if(y+rh>780){doc.addPage();y=45;}doc.rect(x0,y,W,rh).fill(ri%2===0?C.wht:C.lgt);x=x0;row.forEach(function(cell,ci){doc.font('Helvetica').fontSize(7.5).fillColor(C.txt).text(String(cell||''),x+px,y+5,{width:widths[ci]-px*2});x+=widths[ci];});y+=rh;});doc.y=y+4;doc.moveDown(0.3);}

doc.rect(0,0,595,842).fill('#2E1065');
doc.circle(480,80,180).fill('#3B0764').opacity(0.3);doc.circle(100,720,130).fill('#7C3AED').opacity(0.2);doc.opacity(1);
doc.font('Helvetica-Bold').fontSize(32).fillColor('#FFFFFF').text('Master Controller',50,270,{width:W,align:'center'});
doc.font('Helvetica-Bold').fontSize(32).fillColor('#FFFFFF').text('Dashboard',{width:W,align:'center'});
doc.moveDown(0.2);doc.font('Helvetica').fontSize(16).fillColor('#C4B5FD').text('Logic & Calculation Document',{width:W,align:'center'});
doc.moveDown(2);doc.moveTo(200,doc.y).lineTo(395,doc.y).strokeColor('#8B5CF6').lineWidth(2).stroke();doc.moveDown(2);
doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text('LabWise LIMS',{width:W,align:'center'});
doc.moveDown(3);doc.font('Helvetica').fontSize(10).fillColor('#A78BFA').text('9 April 2026',{width:W,align:'center'});

doc.addPage();
h1('Role Overview');
p('The Master Controller is the approval authority over master data. They review STPs, analytes, generic masters, standards, and products created by the Master Personnel. Their primary action is Approve or Reject.');
p('Key difference from Master Personnel: Master Personnel creates data, Master Controller approves it. Same modules, but with Approve permission added on Analyte Master, STP Master, and Generic Master.');

h1('Stats Strip');
h3('Approved Today');p('Count of AuditLog where userId = this user, action = approve, entity in master entities, createdAt = today.');
h3('Rejected Today');p('Count of AuditLog where userId = this user, action = reject, same filters.');
h3('Pending Approval');p('Count of TestMaster where isActive = true AND (specification or method is null/empty). Proxy for items needing review.');
h3('Reviewed / Month');p('Total approved + rejected AuditLog entries this month.');
h3('Data Quality');p('% of TestMasters with all critical fields filled (method, spec, limits, standard).');

doc.addPage();
h1('KPIs (5 Metrics)');
tbl(['KPI','Target','What It Measures','Source'],[
['Reviewed / Month','80','Total STPs reviewed (approved + rejected)','AuditLog (approve + reject)'],
['Approved / Month','70','STPs approved this month','AuditLog (approve only)'],
['Rejection Rate','10%','% of reviews that were rejections (inverse)','rejected / total reviewed x 100'],
['Pending Review','0 (inverse)','Incomplete STPs awaiting action','TestMaster (missing spec/method)'],
['Data Quality','98%','% of tests fully complete','TestMaster field completeness'],
],[110,50,165,170]);

h1('KRAs (4 Weighted Areas)');
tbl(['KRA','Target','Weight','Calculation'],[
['Review Throughput','80/mo','30%','reviewed / 80 target x 100'],
['Data Quality Oversight','98%','25%','% of tests with spec + method + limits + standard'],
['NABL Compliance','100%','25%','% of tests with isAccredited = true'],
['Review Turnaround','95%','20%','Placeholder -- needs SLA tracking'],
],[115,55,50,275]);

h2('Overall KRA Formula');
p('(Throughput Score x 0.30) + (Quality Score x 0.25) + (NABL Score x 0.25) + (Turnaround Score x 0.20)');

doc.addPage();
h1('Approval Queue');
p('Shows all active TestMaster records sorted by createdAt descending. Each test shows:');
b('Name, code, department');b('Linked standard (or "Not linked")');b('Parameter count');b('Issues: missing method, spec, standard, limits, parameters');b('Approve / Reject action buttons');

h1('Alerts');
tbl(['Alert','Trigger','Severity'],[
['Pending Review','TestMaster missing spec or method','Amber'],
['No Standard','TestMaster with standardId = null','Red'],
['Not NABL Accredited','TestMaster with isAccredited = false','Amber'],
],[165,215,115]);

h1('Auto-Refresh');
tbl(['Data','Refresh','Stale'],[
['Stats, Queue, Alerts, Reviews','60 seconds','30s'],
['KPIs, KRAs','5 minutes','60s'],
],[200,150,145]);

h1('Data Sources');
tbl(['What','Table'],[
['Approval/rejection activity','AuditLog'],
['Test completeness, issues','TestMaster'],
['Parameters count','TestParameter'],
['Standards linkage','Standard'],
],[ 200,295]);

doc.moveDown(2);doc.moveTo(50,doc.y).lineTo(545,doc.y).strokeColor(C.bdr).lineWidth(0.5).stroke();doc.moveDown(0.5);
doc.font('Helvetica').fontSize(8).fillColor(C.mut).text('LabWise LIMS -- Master Controller Dashboard Logic -- 9 April 2026',{align:'center'});
doc.end();
output.on('finish',function(){console.log('PDF generated: docs/Master-Controller-Dashboard-Logic.pdf');});
