const db = require('../models');
const { success, error, paginate } = require('../utils/response');
const { Op } = require('sequelize');

const transferIncludes = [
  { model: db.Sample, as: 'sample' },
  { model: db.Location, as: 'fromLocation', attributes: ['id', 'name', 'code'] },
  { model: db.Location, as: 'toLocation', attributes: ['id', 'name', 'code'] },
  { model: db.User, as: 'requestedByUser', attributes: ['id', 'fullName', 'username'] },
  { model: db.User, as: 'approvedByUser', attributes: ['id', 'fullName', 'username'] },
  { model: db.User, as: 'receivedByUser', attributes: ['id', 'fullName', 'username'] },
];

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, fromLocationId, toLocationId, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (fromLocationId) where.fromLocationId = fromLocationId;
    if (toLocationId) where.toLocationId = toLocationId;
    if (search) {
      where[Op.or] = [{ trackingNumber: { [Op.like]: `%${search}%` } }];
    }
    const offset = (page - 1) * limit;
    const { count, rows } = await db.SampleTransfer.findAndCountAll({
      where, include: transferIncludes, limit: parseInt(limit), offset, order: [['createdAt', 'DESC']]
    });
    return paginate(res, rows, count, parseInt(page), parseInt(limit));
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const transfer = await db.SampleTransfer.findByPk(req.params.id, { include: transferIncludes });
    if (!transfer) return error(res, 'Transfer not found', 404);
    return success(res, transfer);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getIncoming = async (req, res) => {
  try {
    const locationId = req.user.locationId;
    if (!locationId) return error(res, 'User has no location assigned', 400);
    const { status } = req.query;
    const where = { toLocationId: locationId };
    if (status) where.status = status;
    else where.status = { [Op.in]: ['REQUESTED', 'APPROVED', 'IN_TRANSIT'] };
    const transfers = await db.SampleTransfer.findAll({ where, include: transferIncludes, order: [['createdAt', 'DESC']] });
    return success(res, transfers);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getOutgoing = async (req, res) => {
  try {
    const locationId = req.user.locationId;
    if (!locationId) return error(res, 'User has no location assigned', 400);
    const { status } = req.query;
    const where = { fromLocationId: locationId };
    if (status) where.status = status;
    const transfers = await db.SampleTransfer.findAll({ where, include: transferIncludes, order: [['createdAt', 'DESC']] });
    return success(res, transfers);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { sampleId, toLocationId, reason, transportMode } = req.body;
    if (!sampleId || !toLocationId) return error(res, 'sampleId and toLocationId are required', 400);
    const sample = await db.Sample.findByPk(sampleId);
    if (!sample) return error(res, 'Sample not found', 404);
    const fromLocationId = req.user.locationId || sample.locationId;
    if (fromLocationId === parseInt(toLocationId)) return error(res, 'Cannot transfer to the same location', 400);
    const transfer = await db.SampleTransfer.create({
      sampleId, fromLocationId, toLocationId: parseInt(toLocationId),
      requestedBy: req.user.id, reason, transportMode: transportMode || 'COURIER'
    });
    const full = await db.SampleTransfer.findByPk(transfer.id, { include: transferIncludes });
    return success(res, full, 'Transfer request created', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.approve = async (req, res) => {
  try {
    const transfer = await db.SampleTransfer.findByPk(req.params.id);
    if (!transfer) return error(res, 'Transfer not found', 404);
    if (transfer.status !== 'REQUESTED') return error(res, 'Transfer is not in REQUESTED status', 400);
    await transfer.update({ status: 'APPROVED', approvedBy: req.user.id, approvedDate: new Date() });
    return success(res, transfer, 'Transfer approved');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.markInTransit = async (req, res) => {
  try {
    const { trackingNumber, transportMode } = req.body;
    const transfer = await db.SampleTransfer.findByPk(req.params.id);
    if (!transfer) return error(res, 'Transfer not found', 404);
    if (transfer.status !== 'APPROVED') return error(res, 'Transfer must be APPROVED first', 400);
    await transfer.update({ status: 'IN_TRANSIT', trackingNumber, transportMode: transportMode || transfer.transportMode });
    return success(res, transfer, 'Transfer marked as in transit');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.receive = async (req, res) => {
  try {
    const { remarks } = req.body;
    const transfer = await db.SampleTransfer.findByPk(req.params.id);
    if (!transfer) return error(res, 'Transfer not found', 404);
    if (!['APPROVED', 'IN_TRANSIT'].includes(transfer.status)) return error(res, 'Transfer must be APPROVED or IN_TRANSIT', 400);
    await transfer.update({ status: 'RECEIVED', receivedBy: req.user.id, receivedDate: new Date(), remarks: remarks || transfer.remarks });
    // Update sample location
    await db.Sample.update({ locationId: transfer.toLocationId }, { where: { id: transfer.sampleId } });
    return success(res, transfer, 'Transfer received - sample location updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.reject = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason) return error(res, 'Rejection reason is required', 400);
    const transfer = await db.SampleTransfer.findByPk(req.params.id);
    if (!transfer) return error(res, 'Transfer not found', 404);
    await transfer.update({ status: 'REJECTED', rejectionReason });
    return success(res, transfer, 'Transfer rejected');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.cancel = async (req, res) => {
  try {
    const transfer = await db.SampleTransfer.findByPk(req.params.id);
    if (!transfer) return error(res, 'Transfer not found', 404);
    if (['RECEIVED', 'REJECTED', 'CANCELLED'].includes(transfer.status)) return error(res, 'Cannot cancel this transfer', 400);
    await transfer.update({ status: 'CANCELLED' });
    return success(res, transfer, 'Transfer cancelled');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getStats = async (req, res) => {
  try {
    const locationId = req.user.locationId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [incomingPending, outgoingPending, inTransit, completedMonth] = await Promise.all([
      db.SampleTransfer.count({ where: { toLocationId: locationId, status: { [Op.in]: ['REQUESTED', 'APPROVED'] } } }),
      db.SampleTransfer.count({ where: { fromLocationId: locationId, status: { [Op.in]: ['REQUESTED', 'APPROVED', 'IN_TRANSIT'] } } }),
      db.SampleTransfer.count({ where: { [Op.or]: [{ fromLocationId: locationId }, { toLocationId: locationId }], status: 'IN_TRANSIT' } }),
      db.SampleTransfer.count({ where: { [Op.or]: [{ fromLocationId: locationId }, { toLocationId: locationId }], status: 'RECEIVED', receivedDate: { [Op.gte]: monthStart } } }),
    ]);
    return success(res, { incomingPending, outgoingPending, inTransit, completedMonth });
  } catch (err) {
    return error(res, err.message, 500);
  }
};
