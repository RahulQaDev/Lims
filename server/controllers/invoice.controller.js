const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, clientId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { invoiceNumber: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: db.Client, as: 'client', attributes: ['id', 'name', 'code'] },
        { model: db.Booking, as: 'booking', attributes: ['id', 'reportNumber'] },
        { model: InvoiceItem, as: 'items' },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return paginated(res, rows, page, limit, count, 'Invoices retrieved successfully.');
  } catch (err) {
    console.error('Get invoices error:', err);
    return error(res, 'Failed to retrieve invoices.', 500);
  }
};

// GET /outstanding
const getOutstanding = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Invoice.findAndCountAll({
      where: {
        status: { [Op.in]: ['generated', 'sent', 'partially_paid', 'overdue'] },
      },
      include: [
        { model: db.Client, as: 'client', attributes: ['id', 'name', 'code'] },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['dueDate', 'ASC']],
    });

    return paginated(res, rows, page, limit, count, 'Outstanding invoices retrieved successfully.');
  } catch (err) {
    console.error('Get outstanding invoices error:', err);
    return error(res, 'Failed to retrieve outstanding invoices.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [
        { model: db.Client, as: 'client' },
        { model: db.Booking, as: 'booking' },
        { model: InvoiceItem, as: 'items' },
      ],
    });

    if (!invoice) {
      return error(res, 'Invoice not found.', 404);
    }

    return success(res, invoice, 'Invoice retrieved successfully.');
  } catch (err) {
    console.error('Get invoice error:', err);
    return error(res, 'Failed to retrieve invoice.', 500);
  }
};

// POST /
const create = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { items, ...invoiceData } = req.body;

    const invoice = await Invoice.create(invoiceData, { transaction });

    if (items && items.length > 0) {
      let subtotal = 0;
      for (const item of items) {
        const amount = (item.quantity || 1) * (item.rate || 0);
        const cgstAmount = amount * (item.cgstRate || 9) / 100;
        const sgstAmount = amount * (item.sgstRate || 9) / 100;
        const igstAmount = amount * (item.igstRate || 0) / 100;

        await InvoiceItem.create({
          ...item,
          invoiceId: invoice.id,
          amount,
          cgstAmount,
          sgstAmount,
          igstAmount,
        }, { transaction });

        subtotal += amount;
      }

      // Calculate totals
      const allItems = await InvoiceItem.findAll({ where: { invoiceId: invoice.id }, transaction });
      const totalCgst = allItems.reduce((sum, i) => sum + parseFloat(i.cgstAmount || 0), 0);
      const totalSgst = allItems.reduce((sum, i) => sum + parseFloat(i.sgstAmount || 0), 0);
      const totalIgst = allItems.reduce((sum, i) => sum + parseFloat(i.igstAmount || 0), 0);
      const totalTax = totalCgst + totalSgst + totalIgst;
      const totalAmount = subtotal + totalTax;
      const roundOff = Math.round(totalAmount) - totalAmount;
      const grandTotal = Math.round(totalAmount);

      await invoice.update({
        subtotal,
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        totalTax,
        totalAmount,
        roundOff,
        grandTotal,
      }, { transaction });
    }

    await transaction.commit();

    const fullInvoice = await Invoice.findByPk(invoice.id, {
      include: [
        { model: db.Client, as: 'client' },
        { model: InvoiceItem, as: 'items' },
      ],
    });

    return success(res, fullInvoice, 'Invoice created successfully.', 201);
  } catch (err) {
    await transaction.rollback();
    console.error('Create invoice error:', err);
    return error(res, 'Failed to create invoice.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return error(res, 'Invoice not found.', 404);
    }
    await invoice.update(req.body);
    return success(res, invoice, 'Invoice updated successfully.');
  } catch (err) {
    console.error('Update invoice error:', err);
    return error(res, 'Failed to update invoice.', 500);
  }
};

// DELETE /:id
const remove = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return error(res, 'Invoice not found.', 404);
    }
    await invoice.update({ status: 'cancelled' });
    return success(res, null, 'Invoice cancelled successfully.');
  } catch (err) {
    console.error('Delete invoice error:', err);
    return error(res, 'Failed to cancel invoice.', 500);
  }
};

// POST /generate/:bookingId
const generateFromBooking = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const booking = await db.Booking.findByPk(req.params.bookingId, {
      include: [
        { model: db.Sample, as: 'sample', include: [{ model: db.Client, as: 'client' }] },
        { model: db.BookingTest, as: 'bookingTests', include: [{ model: db.TestMaster, as: 'testMaster' }] },
      ],
    });

    if (!booking) {
      await transaction.rollback();
      return error(res, 'Booking not found.', 404);
    }

    // Create invoice
    const invoice = await Invoice.create({
      bookingId: booking.id,
      clientId: booking.sample.clientId,
      dueDate: new Date(Date.now() + (booking.sample.client.creditDays || 30) * 86400000),
      status: 'generated',
    }, { transaction });

    // Create items from booking tests
    let subtotal = 0;
    for (const bt of booking.bookingTests) {
      const amount = parseFloat(bt.price) || 0;
      const cgstRate = 9;
      const sgstRate = 9;
      const cgstAmount = amount * cgstRate / 100;
      const sgstAmount = amount * sgstRate / 100;

      await InvoiceItem.create({
        invoiceId: invoice.id,
        testMasterId: bt.testMasterId,
        description: bt.testMaster ? bt.testMaster.name : 'Test',
        quantity: 1,
        rate: amount,
        amount,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
      }, { transaction });

      subtotal += amount;
    }

    // Calculate totals
    const allItems = await InvoiceItem.findAll({ where: { invoiceId: invoice.id }, transaction });
    const totalCgst = allItems.reduce((sum, i) => sum + parseFloat(i.cgstAmount || 0), 0);
    const totalSgst = allItems.reduce((sum, i) => sum + parseFloat(i.sgstAmount || 0), 0);
    const totalTax = totalCgst + totalSgst;
    const totalAmount = subtotal + totalTax;
    const roundOff = Math.round(totalAmount) - totalAmount;
    const grandTotal = Math.round(totalAmount);

    await invoice.update({
      subtotal,
      cgst: totalCgst,
      sgst: totalSgst,
      totalTax,
      totalAmount,
      roundOff,
      grandTotal,
    }, { transaction });

    await transaction.commit();

    const fullInvoice = await Invoice.findByPk(invoice.id, {
      include: [{ model: db.Client, as: 'client' }, { model: InvoiceItem, as: 'items' }],
    });

    return success(res, fullInvoice, 'Invoice generated from booking successfully.', 201);
  } catch (err) {
    await transaction.rollback();
    console.error('Generate invoice error:', err);
    return error(res, 'Failed to generate invoice.', 500);
  }
};

// PUT /:id/payment
const recordPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) {
      return error(res, 'Invoice not found.', 404);
    }

    const { amount, paymentMode, paymentReference } = req.body;
    const newPaidAmount = parseFloat(invoice.paidAmount || 0) + parseFloat(amount);
    const grandTotal = parseFloat(invoice.grandTotal);

    let newStatus = invoice.status;
    if (newPaidAmount >= grandTotal) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially_paid';
    }

    await invoice.update({
      paidAmount: newPaidAmount,
      paymentDate: new Date(),
      paymentMode,
      paymentReference,
      status: newStatus,
    });

    return success(res, invoice, 'Payment recorded successfully.');
  } catch (err) {
    console.error('Record payment error:', err);
    return error(res, 'Failed to record payment.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove, generateFromBooking, recordPayment, getOutstanding };
