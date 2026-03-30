const db = require('../models');
const { success, error } = require('../utils/response');
const { Op, fn, col } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const locations = await db.Location.findAll({ where: { isActive: true }, order: [['isHQ', 'DESC'], ['name', 'ASC']] });
    return success(res, locations);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getById = async (req, res) => {
  try {
    const location = await db.Location.findByPk(req.params.id);
    if (!location) return error(res, 'Location not found', 404);
    const [userCount, sampleCount] = await Promise.all([
      db.User.count({ where: { locationId: location.id, isActive: true } }),
      db.Sample.count({ where: { locationId: location.id } }),
    ]);
    return success(res, { ...location.toJSON(), userCount, sampleCount });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, address, city, state, pincode, phone, email, website, nablNumber, gstNumber, labName, reportPrefix, isHQ } = req.body;
    if (!name || !code) return error(res, 'Name and code are required', 400);
    const existing = await db.Location.findOne({ where: { code: code.toUpperCase() } });
    if (existing) return error(res, 'Location code already exists', 400);
    const location = await db.Location.create({ name, code: code.toUpperCase(), address, city, state, pincode, phone, email, website, nablNumber, gstNumber, labName, reportPrefix, isHQ: isHQ || false });
    return success(res, location, 'Location created', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    const location = await db.Location.findByPk(req.params.id);
    if (!location) return error(res, 'Location not found', 404);
    await location.update(req.body);
    return success(res, location, 'Location updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.deactivate = async (req, res) => {
  try {
    const location = await db.Location.findByPk(req.params.id);
    if (!location) return error(res, 'Location not found', 404);
    if (location.isHQ) return error(res, 'Cannot deactivate HQ location', 400);
    await location.update({ isActive: false });
    return success(res, location, 'Location deactivated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const locationId = req.params.id;
    const location = await db.Location.findByPk(locationId);
    if (!location) return error(res, 'Location not found', 404);

    const mappings = await db.LocationDepartment.findAll({
      where: { locationId, isActive: true },
      include: [{ model: db.Department, as: 'department' }],
      order: [[{ model: db.Department, as: 'department' }, 'name', 'ASC']],
    });

    const departments = mappings.map(m => m.department).filter(Boolean);
    return success(res, departments);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getAllLocationDepartments = async (req, res) => {
  try {
    const mappings = await db.LocationDepartment.findAll({
      where: { isActive: true },
      attributes: ['locationId', 'departmentId'],
    });
    return success(res, mappings);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getLocationStats = async (req, res) => {
  try {
    const locations = await db.Location.findAll({ where: { isActive: true } });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const stats = [];
    for (const loc of locations) {
      const [users, samplesMonth, samplesTotal] = await Promise.all([
        db.User.count({ where: { locationId: loc.id, isActive: true } }),
        db.Sample.count({ where: { locationId: loc.id, createdAt: { [Op.gte]: monthStart } } }),
        db.Sample.count({ where: { locationId: loc.id } }),
      ]);
      stats.push({ id: loc.id, name: loc.name, code: loc.code, isHQ: loc.isHQ, users, samplesMonth, samplesTotal });
    }
    return success(res, stats);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
