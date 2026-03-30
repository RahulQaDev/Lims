const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const Client = db.Client;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, clientType, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
      ];
    }
    if (clientType) where.clientType = clientType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await Client.findAndCountAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['name', 'ASC']],
    });

    return paginated(res, rows, page, limit, count, 'Clients retrieved successfully.');
  } catch (err) {
    console.error('Get clients error:', err);
    return error(res, 'Failed to retrieve clients.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return error(res, 'Client not found.', 404);
    }
    return success(res, client, 'Client retrieved successfully.');
  } catch (err) {
    console.error('Get client error:', err);
    return error(res, 'Failed to retrieve client.', 500);
  }
};

// POST /
const create = async (req, res) => {
  try {
    const client = await Client.create(req.body);
    return success(res, client, 'Client created successfully.', 201);
  } catch (err) {
    console.error('Create client error:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return error(res, 'Client code already exists.', 400);
    }
    return error(res, 'Failed to create client.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return error(res, 'Client not found.', 404);
    }
    await client.update(req.body);
    return success(res, client, 'Client updated successfully.');
  } catch (err) {
    console.error('Update client error:', err);
    return error(res, 'Failed to update client.', 500);
  }
};

// DELETE /:id
const remove = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return error(res, 'Client not found.', 404);
    }
    await client.update({ isActive: false });
    return success(res, null, 'Client deactivated successfully.');
  } catch (err) {
    console.error('Delete client error:', err);
    return error(res, 'Failed to deactivate client.', 500);
  }
};

// GET /:id/samples
const getClientSamples = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Sample.findAndCountAll({
      where: { clientId: req.params.id },
      include: [{ model: db.ProductType, as: 'productType' }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return paginated(res, rows, page, limit, count, 'Client samples retrieved successfully.');
  } catch (err) {
    console.error('Get client samples error:', err);
    return error(res, 'Failed to retrieve client samples.', 500);
  }
};

// GET /:id/invoices
const getClientInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Invoice.findAndCountAll({
      where: { clientId: req.params.id },
      include: [{ model: db.InvoiceItem, as: 'items' }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
    });

    return paginated(res, rows, page, limit, count, 'Client invoices retrieved successfully.');
  } catch (err) {
    console.error('Get client invoices error:', err);
    return error(res, 'Failed to retrieve client invoices.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove, getClientSamples, getClientInvoices };
