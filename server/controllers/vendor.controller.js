const db = require('../models');
const { success, error } = require('../utils/response');

exports.getAll = async (req, res) => {
  try {
    const vendors = await db.Vendor.findAll({ order: [['name', 'ASC']] });
    return success(res, vendors, 'Vendors retrieved.');
  } catch (err) {
    console.error('Get vendors error:', err);
    return error(res, 'Failed to fetch vendors.', 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const vendor = await db.Vendor.findByPk(req.params.id);
    if (!vendor) return error(res, 'Vendor not found.', 404);
    return success(res, vendor, 'Vendor retrieved.');
  } catch (err) {
    console.error('Get vendor error:', err);
    return error(res, 'Failed to fetch vendor.', 500);
  }
};

exports.create = async (req, res) => {
  try {
    const vendor = await db.Vendor.create(req.body);
    return success(res, vendor, 'Vendor created.', 201);
  } catch (err) {
    console.error('Create vendor error:', err);
    return error(res, 'Failed to create vendor.', 500);
  }
};

exports.update = async (req, res) => {
  try {
    const vendor = await db.Vendor.findByPk(req.params.id);
    if (!vendor) return error(res, 'Vendor not found.', 404);
    await vendor.update(req.body);
    return success(res, vendor, 'Vendor updated.');
  } catch (err) {
    console.error('Update vendor error:', err);
    return error(res, 'Failed to update vendor.', 500);
  }
};

exports.remove = async (req, res) => {
  try {
    const vendor = await db.Vendor.findByPk(req.params.id);
    if (!vendor) return error(res, 'Vendor not found.', 404);
    await vendor.destroy();
    return success(res, null, 'Vendor deleted.');
  } catch (err) {
    console.error('Delete vendor error:', err);
    return error(res, 'Failed to delete vendor.', 500);
  }
};
