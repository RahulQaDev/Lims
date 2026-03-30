const { Op } = require('sequelize');
const db = require('../models');
const { success, error, paginated } = require('../utils/response');

const ProductType = db.ProductType;

// GET /
const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
      ];
    }
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await ProductType.findAndCountAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['name', 'ASC']],
    });

    return paginated(res, rows, page, limit, count, 'Product types retrieved successfully.');
  } catch (err) {
    console.error('Get product types error:', err);
    return error(res, 'Failed to retrieve product types.', 500);
  }
};

// GET /:id
const getById = async (req, res) => {
  try {
    const productType = await ProductType.findByPk(req.params.id);
    if (!productType) {
      return error(res, 'Product type not found.', 404);
    }
    return success(res, productType, 'Product type retrieved successfully.');
  } catch (err) {
    console.error('Get product type error:', err);
    return error(res, 'Failed to retrieve product type.', 500);
  }
};

// POST /
const create = async (req, res) => {
  try {
    const productType = await ProductType.create(req.body);
    return success(res, productType, 'Product type created successfully.', 201);
  } catch (err) {
    console.error('Create product type error:', err);
    return error(res, 'Failed to create product type.', 500);
  }
};

// PUT /:id
const update = async (req, res) => {
  try {
    const productType = await ProductType.findByPk(req.params.id);
    if (!productType) {
      return error(res, 'Product type not found.', 404);
    }
    await productType.update(req.body);
    return success(res, productType, 'Product type updated successfully.');
  } catch (err) {
    console.error('Update product type error:', err);
    return error(res, 'Failed to update product type.', 500);
  }
};

// DELETE /:id
const remove = async (req, res) => {
  try {
    const productType = await ProductType.findByPk(req.params.id);
    if (!productType) {
      return error(res, 'Product type not found.', 404);
    }
    await productType.update({ isActive: false });
    return success(res, null, 'Product type deactivated successfully.');
  } catch (err) {
    console.error('Delete product type error:', err);
    return error(res, 'Failed to deactivate product type.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove };
