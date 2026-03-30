const nodemailer = require('nodemailer');

// Socket.io instance (set from index.js)
let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

// ─── Email Transporter ───────────────────────────────────

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email helper
const sendEmail = async (to, subject, htmlBody, attachments = []) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'LIMS System'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlBody,
      attachments,
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

// ─── Core Notification Helpers ───────────────────────────

// Check user notification preferences before sending
const shouldNotify = async (userId, notificationType, channel = 'inApp') => {
  try {
    const db = require('../models');
    if (!db.NotificationPreference) return true;
    const pref = await db.NotificationPreference.findOne({ where: { userId } });
    if (!pref) return true; // default: all enabled
    const prefs = pref.preferences || {};
    const typePref = prefs[notificationType];
    if (!typePref) return true;
    return typePref[channel] !== false;
  } catch {
    return true;
  }
};

// Create in-app notification
const createNotification = async (userId, type, title, message, category = 'system', metadata = {}) => {
  try {
    const db = require('../models');

    // Check if user wants in-app notifications for this category
    const wantsInApp = await shouldNotify(userId, category, 'inApp');
    if (!wantsInApp) return null;

    const notification = await db.Notification.create({
      userId,
      type,
      title,
      message,
      link: metadata.link || null,
      category,
      metadata: metadata.metadata || null,
    });

    // Emit real-time notification via Socket.io
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        id: notification.id,
        type,
        title,
        message,
        link: notification.link,
        category,
        createdAt: notification.createdAt,
      });
    }

    // Check if user wants email for this category
    const wantsEmail = await shouldNotify(userId, category, 'email');
    if (wantsEmail && metadata.sendEmail) {
      const user = await db.User.findByPk(userId, { attributes: ['email', 'fullName'] });
      if (user && user.email) {
        await sendEmail(
          user.email,
          title,
          buildEmailTemplate(title, message, metadata.link)
        );
      }
    }

    return notification;
  } catch (err) {
    console.error('Create notification error:', err.message);
    return null;
  }
};

// Bulk notifications (e.g., notify all reviewers)
const createBulkNotifications = async (userIds, type, title, message, category = 'system', metadata = {}) => {
  try {
    const db = require('../models');
    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    if (uniqueIds.length === 0) return [];

    const notifications = await db.Notification.bulkCreate(
      uniqueIds.map(userId => ({
        userId,
        type,
        title,
        message,
        link: metadata.link || null,
        category,
      }))
    );

    // Emit to all users
    if (io) {
      uniqueIds.forEach(userId => {
        io.to(`user_${userId}`).emit('notification', {
          type, title, message,
          link: metadata.link || null,
          category,
        });
      });
    }

    return notifications;
  } catch (err) {
    console.error('Bulk notification error:', err.message);
    return [];
  }
};

// Notify all users in a department
const notifyDepartment = async (departmentId, type, title, message, metadata = {}) => {
  try {
    const db = require('../models');
    const deptUsers = await db.DepartmentUser.findAll({
      where: { departmentId },
      attributes: ['userId'],
    });
    const userIds = deptUsers.map(du => du.userId);
    return createBulkNotifications(userIds, type, title, message, metadata.category || 'system', metadata);
  } catch (err) {
    console.error('Department notification error:', err.message);
    return [];
  }
};

// Notify all users with a specific role
const notifyRole = async (role, type, title, message, metadata = {}) => {
  try {
    const db = require('../models');
    const users = await db.User.findAll({
      where: { role, isActive: true },
      attributes: ['id'],
    });
    const userIds = users.map(u => u.id);
    return createBulkNotifications(userIds, type, title, message, metadata.category || 'system', metadata);
  } catch (err) {
    console.error('Role notification error:', err.message);
    return [];
  }
};

// ─── LIMS Workflow Notifications ─────────────────────────

// Sample received: notify client coordinator + booking team
const notifySampleReceived = async (sample, client) => {
  try {
    const sampleCode = sample.sampleCode || sample.code || `SMP-${sample.id}`;
    const clientName = client?.name || 'Unknown Client';

    // Notify booking team
    await notifyRole(
      'booking',
      'task',
      'New Sample Received',
      `Sample ${sampleCode} from ${clientName} has been received and is ready for booking.`,
      { category: 'sample', link: `/samples/${sample.id}` }
    );

    // Notify customer coordinator
    await notifyRole(
      'customer_coordinator',
      'info',
      'Sample Received',
      `Sample ${sampleCode} from ${clientName} has been received at the lab.`,
      { category: 'sample', link: `/samples/${sample.id}` }
    );

    // Send email to client if they have an email
    if (client?.email) {
      await sendEmail(
        client.email,
        `Sample Received - ${sampleCode}`,
        buildEmailTemplate(
          'Sample Received',
          `Dear ${client.contactPerson || clientName},<br><br>Your sample <strong>${sampleCode}</strong> has been received at our laboratory and is being processed. You will be notified once testing is complete.<br><br>Thank you for choosing our services.`,
          null
        )
      );
    }
  } catch (err) {
    console.error('notifySampleReceived error:', err.message);
  }
};

// Sample assigned to analyst
const notifySampleAssigned = async (bookingTest, analyst) => {
  try {
    const testName = bookingTest.testMaster?.name || bookingTest.testName || `Test #${bookingTest.id}`;
    const sampleCode = bookingTest.booking?.sample?.sampleCode || '';

    await createNotification(
      analyst.id || analyst,
      'task',
      'New Test Assigned',
      `You have been assigned test "${testName}" for sample ${sampleCode}. Please begin analysis.`,
      'sample',
      { link: `/analysis/results`, sendEmail: true }
    );
  } catch (err) {
    console.error('notifySampleAssigned error:', err.message);
  }
};

// Results entered: notify reviewer
const notifyResultsEntered = async (bookingTest, result) => {
  try {
    const db = require('../models');
    const testName = bookingTest.testMaster?.name || bookingTest.testName || `Test #${bookingTest.id}`;
    const sampleCode = result.sample?.sampleCode || '';

    // Find reviewers in the department
    const deptReviewers = await db.DepartmentUser.findAll({
      where: {
        departmentId: result.departmentId || bookingTest.departmentId,
        role: 'reviewer',
      },
      attributes: ['userId'],
    });

    const reviewerIds = deptReviewers.map(r => r.userId);
    if (reviewerIds.length > 0) {
      await createBulkNotifications(
        reviewerIds,
        'task',
        'Results Pending Review',
        `Test "${testName}" for sample ${sampleCode} has results ready for review.`,
        'result',
        { link: `/review` }
      );
    }
  } catch (err) {
    console.error('notifyResultsEntered error:', err.message);
  }
};

// Review complete: notify analyst (if rejected) or approver (if approved)
const notifyReviewComplete = async (review, isApproved) => {
  try {
    const db = require('../models');
    const result = await db.Result.findByPk(review.resultId, {
      include: [
        { model: db.Sample, as: 'sample', attributes: ['sampleCode'] },
        { model: db.BookingTest, as: 'bookingTest', include: [{ model: db.TestMaster, as: 'testMaster', attributes: ['name'] }] },
      ],
    });

    const testName = result?.bookingTest?.testMaster?.name || 'Unknown Test';
    const sampleCode = result?.sample?.sampleCode || '';

    if (isApproved) {
      // Notify approvers in the department
      const deptApprovers = await db.DepartmentUser.findAll({
        where: { departmentId: result.departmentId, role: 'approver' },
        attributes: ['userId'],
      });
      const approverIds = deptApprovers.map(a => a.userId);
      if (approverIds.length > 0) {
        await createBulkNotifications(
          approverIds,
          'task',
          'Result Pending Approval',
          `Test "${testName}" for sample ${sampleCode} has been reviewed and is pending final approval.`,
          'review',
          { link: `/review` }
        );
      }
    } else {
      // Notify analyst of rejection
      if (result?.enteredBy) {
        await createNotification(
          result.enteredBy,
          'warning',
          'Result Rejected',
          `Your result for test "${testName}" on sample ${sampleCode} has been rejected. Reason: ${review.remarks || 'See comments'}. Please re-test.`,
          'review',
          { link: `/analysis/results`, sendEmail: true }
        );
      }
    }
  } catch (err) {
    console.error('notifyReviewComplete error:', err.message);
  }
};

// Approval complete: notify all stakeholders that CoA is ready
const notifyApprovalComplete = async (booking) => {
  try {
    const sampleCode = booking.sample?.sampleCode || '';

    // Notify booking team and reception
    await notifyRole(
      'booking',
      'success',
      'All Results Approved',
      `All test results for sample ${sampleCode} have been approved. CoA can now be generated.`,
      { category: 'coa', link: `/coa` }
    );

    await notifyRole(
      'reception',
      'info',
      'Results Approved',
      `Sample ${sampleCode} testing is complete and all results are approved.`,
      { category: 'coa', link: `/coa` }
    );
  } catch (err) {
    console.error('notifyApprovalComplete error:', err.message);
  }
};

// CoA ready: send email to client
const notifyCoAReady = async (coa, client) => {
  try {
    const sampleCode = coa.sample?.sampleCode || coa.sampleCode || '';

    // Notify internal printing team
    await notifyRole(
      'printing',
      'task',
      'CoA Ready for Printing',
      `Certificate of Analysis for sample ${sampleCode} is ready for printing and dispatch.`,
      { category: 'coa', link: `/coa/${coa.id}` }
    );

    // Send email to client
    if (client?.email) {
      await sendEmail(
        client.email,
        `Certificate of Analysis Ready - ${sampleCode}`,
        buildEmailTemplate(
          'Certificate of Analysis Ready',
          `Dear ${client.contactPerson || client.name},<br><br>The Certificate of Analysis for your sample <strong>${sampleCode}</strong> has been generated and approved. It will be dispatched shortly.<br><br>Thank you for your patience.`,
          null
        )
      );
    }
  } catch (err) {
    console.error('notifyCoAReady error:', err.message);
  }
};

// TAT Warning: approaching deadline
const notifyTATWarning = async (sample, hoursRemaining) => {
  try {
    const db = require('../models');
    const sampleCode = sample.sampleCode || sample.code || `SMP-${sample.id}`;

    // Notify assigned analysts
    const bookingTests = await db.BookingTest.findAll({
      include: [{
        model: db.Booking,
        as: 'booking',
        where: { sampleId: sample.id },
        attributes: ['id'],
      }],
      where: { status: ['pending', 'in_progress'] },
      attributes: ['assignedTo', 'departmentId'],
    });

    const analystIds = bookingTests.map(bt => bt.assignedTo).filter(Boolean);
    const departmentIds = [...new Set(bookingTests.map(bt => bt.departmentId).filter(Boolean))];

    if (analystIds.length > 0) {
      await createBulkNotifications(
        analystIds,
        'warning',
        'TAT Warning',
        `Sample ${sampleCode} is approaching its TAT deadline. Only ${hoursRemaining} hours remaining. Please prioritize.`,
        'sample',
        { link: `/samples/${sample.id}` }
      );
    }

    // Notify department heads
    for (const deptId of departmentIds) {
      const deptHead = await db.DepartmentUser.findOne({
        where: { departmentId: deptId, role: 'head' },
        attributes: ['userId'],
      });
      if (deptHead) {
        await createNotification(
          deptHead.userId,
          'warning',
          'TAT Warning - Department',
          `Sample ${sampleCode} in your department is approaching TAT deadline. ${hoursRemaining} hours remaining.`,
          'sample',
          { link: `/samples/${sample.id}`, sendEmail: true }
        );
      }
    }
  } catch (err) {
    console.error('notifyTATWarning error:', err.message);
  }
};

// TAT Breach: escalate to management
const notifyTATBreach = async (sample) => {
  try {
    const db = require('../models');
    const sampleCode = sample.sampleCode || sample.code || `SMP-${sample.id}`;

    // Notify lab heads and admin
    const managementUsers = await db.User.findAll({
      where: {
        role: ['lab_head', 'admin'],
        isActive: true,
      },
      attributes: ['id', 'email', 'fullName'],
    });

    const userIds = managementUsers.map(u => u.id);
    await createBulkNotifications(
      userIds,
      'escalation',
      'TAT Breach Alert',
      `Sample ${sampleCode} has breached its Turn Around Time. Immediate action required.`,
      'sample',
      { link: `/samples/${sample.id}` }
    );

    // Send escalation emails to management
    for (const user of managementUsers) {
      if (user.email) {
        await sendEmail(
          user.email,
          `[URGENT] TAT Breach - Sample ${sampleCode}`,
          buildEmailTemplate(
            'TAT Breach Escalation',
            `<span style="color:#dc2626;font-weight:bold;">URGENT:</span> Sample <strong>${sampleCode}</strong> has breached its Turn Around Time deadline.<br><br>Please take immediate action to resolve this issue and communicate with the client.`,
            `/samples/${sample.id}`
          )
        );
      }
    }

    // Also notify department heads
    await notifyRole(
      'dept_head',
      'escalation',
      'TAT Breach Escalation',
      `Sample ${sampleCode} has breached TAT. Management has been notified.`,
      { category: 'sample', link: `/samples/${sample.id}` }
    );
  } catch (err) {
    console.error('notifyTATBreach error:', err.message);
  }
};

// Low inventory alert
const notifyLowInventory = async (item) => {
  try {
    const itemName = item.name || item.itemName || 'Unknown Item';
    const itemCode = item.code || item.itemCode || '';
    const currentQty = item.currentQuantity ?? item.quantity ?? 'N/A';
    const minQty = item.minimumQuantity ?? item.minLevel ?? 'N/A';
    const unit = item.unit || '';

    await notifyRole(
      'purchase',
      'warning',
      'Low Inventory Alert',
      `${itemName} (${itemCode}) stock is below minimum level. Current: ${currentQty} ${unit}, Minimum: ${minQty} ${unit}. Please raise a purchase order.`,
      { category: 'inventory', link: `/inventory` }
    );

    // Also notify QA team
    await notifyRole(
      'qa',
      'warning',
      'Low Stock Warning',
      `${itemName} (${itemCode}) is running low. Current stock: ${currentQty} ${unit}.`,
      { category: 'inventory', link: `/inventory` }
    );
  } catch (err) {
    console.error('notifyLowInventory error:', err.message);
  }
};

// Calibration due alert
const notifyCalibrationDue = async (instrument) => {
  try {
    const instName = instrument.name || instrument.instrumentName || 'Unknown Instrument';
    const instCode = instrument.code || instrument.instrumentCode || '';
    const dueDate = instrument.nextCalibrationDate || instrument.calibrationDue || '';

    // Notify QA team
    await notifyRole(
      'qa',
      'reminder',
      'Calibration Due',
      `Instrument ${instName} (${instCode}) is due for calibration${dueDate ? ` on ${new Date(dueDate).toLocaleDateString('en-IN')}` : ''}. Please schedule calibration.`,
      { category: 'system', link: `/masters/instruments` }
    );

    // Notify department if instrument has a department
    if (instrument.departmentId) {
      const deptHead = await (require('../models')).DepartmentUser.findOne({
        where: { departmentId: instrument.departmentId, role: 'head' },
        attributes: ['userId'],
      });
      if (deptHead) {
        await createNotification(
          deptHead.userId,
          'reminder',
          'Instrument Calibration Due',
          `Instrument ${instName} (${instCode}) in your department requires calibration${dueDate ? ` by ${new Date(dueDate).toLocaleDateString('en-IN')}` : ''}.`,
          'system',
          { link: `/masters/instruments`, sendEmail: true }
        );
      }
    }
  } catch (err) {
    console.error('notifyCalibrationDue error:', err.message);
  }
};

// ─── Email Template ──────────────────────────────────────

const buildEmailTemplate = (title, bodyHtml, link) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const linkButton = link
    ? `<div style="margin-top:20px;"><a href="${appUrl}${link}" style="background-color:#2563eb;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">View in LIMS</a></div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f3f4f6;margin:0;padding:0;">
      <div style="max-width:600px;margin:40px auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background-color:#1e40af;padding:24px 32px;">
          <h1 style="color:#ffffff;margin:0;font-size:20px;">${title}</h1>
        </div>
        <div style="padding:32px;">
          <div style="color:#374151;font-size:14px;line-height:1.6;">${bodyHtml}</div>
          ${linkButton}
        </div>
        <div style="background-color:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">This is an automated notification from LIMS. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ─── Legacy Compat ───────────────────────────────────────

const sendTATAlert = async (sampleId, sampleCode, departmentName, hoursOverdue) => {
  try {
    const db = require('../models');
    const deptHeads = await db.DepartmentUser.findAll({
      where: { role: 'head' },
      include: [{ model: db.Department, as: 'department', where: { name: departmentName } }],
    });
    const labHeads = await db.User.findAll({ where: { role: 'lab_head', isActive: true } });

    const userIds = [
      ...deptHeads.map(dh => dh.userId),
      ...labHeads.map(lh => lh.id),
    ];

    await createBulkNotifications(
      userIds,
      'escalation',
      'TAT Breach Alert',
      `Sample ${sampleCode} in ${departmentName} is overdue by ${hoursOverdue} hours.`,
      'sample',
      { link: `/samples/${sampleId}` }
    );
  } catch (err) {
    console.error('TAT alert error:', err.message);
  }
};

module.exports = {
  setSocketIO,
  createNotification,
  createBulkNotifications,
  notifyDepartment,
  notifyRole,
  sendEmail,
  sendTATAlert,
  // Workflow notifications
  notifySampleReceived,
  notifySampleAssigned,
  notifyResultsEntered,
  notifyReviewComplete,
  notifyApprovalComplete,
  notifyCoAReady,
  notifyTATWarning,
  notifyTATBreach,
  notifyLowInventory,
  notifyCalibrationDue,
};
