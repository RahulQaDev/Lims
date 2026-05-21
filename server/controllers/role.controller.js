const db = require('../models');
const { success, error } = require('../utils/response');

const Role = db.Role;
const RolePermission = db.RolePermission;
const User = db.User;

// Helper: transform RolePermission rows into { [moduleKey]: ['view','edit',...] }
function buildPermissionMap(permRows) {
  const map = {};
  for (const rp of permRows) {
    const key = rp.moduleKey;
    if (!map[key]) map[key] = [];
    map[key].push(rp.permissionType);
  }
  return map;
}

// GET /api/roles
const getAll = async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: { isActive: true },
      include: [{ model: RolePermission, as: 'permissions' }],
      order: [['createdAt', 'ASC']],
    });

    // Get user counts per role
    const userCounts = await User.findAll({
      attributes: [
        'role',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      where: { isActive: true },
      group: ['role'],
      raw: true,
    });
    const countMap = {};
    for (const uc of userCounts) countMap[uc.role] = parseInt(uc.count);

    const data = roles.map((r) => {
      const json = r.toJSON();
      return {
        id: json.id,
        label: json.label,
        description: json.description,
        isSystem: json.isSystem,
        isActive: json.isActive,
        kras: json.kras,
        kpiBenchmarks: json.kpiBenchmarks,
        permissions: buildPermissionMap(json.permissions),
        userCount: countMap[json.id] || 0,
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
      };
    });

    return success(res, data, 'Roles retrieved successfully.');
  } catch (err) {
    console.error('Get roles error:', err);
    return error(res, 'Failed to retrieve roles.', 500);
  }
};

// GET /api/roles/:id
const getById = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id, {
      include: [{ model: RolePermission, as: 'permissions' }],
    });

    if (!role || !role.isActive) {
      return error(res, 'Role not found.', 404);
    }

    const json = role.toJSON();
    const userCount = await User.count({ where: { role: json.id, isActive: true } });

    return success(res, {
      id: json.id,
      label: json.label,
      description: json.description,
      isSystem: json.isSystem,
      isActive: json.isActive,
      kras: json.kras,
      kpiBenchmarks: json.kpiBenchmarks,
      permissions: buildPermissionMap(json.permissions),
      userCount,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }, 'Role retrieved successfully.');
  } catch (err) {
    console.error('Get role error:', err);
    return error(res, 'Failed to retrieve role.', 500);
  }
};

// POST /api/roles
const create = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id, label, description, permissions, kras, kpiBenchmarks } = req.body;

    if (!id || !label) {
      await t.rollback();
      return error(res, 'Role ID and label are required.', 400);
    }

    if (!/^[a-z0-9_]+$/.test(id)) {
      await t.rollback();
      return error(res, 'Role ID must contain only lowercase letters, numbers, and underscores.', 400);
    }

    const existing = await Role.findByPk(id, { transaction: t });
    if (existing) {
      await t.rollback();
      return error(res, 'A role with this ID already exists.', 409);
    }

    const role = await Role.create({
      id,
      label,
      description: description || '',
      isSystem: false,
      isActive: true,
      kras: kras || [],
      kpiBenchmarks: kpiBenchmarks || [],
    }, { transaction: t });

    // Insert permissions
    if (permissions && typeof permissions === 'object') {
      const permRows = [];
      for (const [moduleKey, types] of Object.entries(permissions)) {
        for (const permissionType of types) {
          permRows.push({ roleId: id, moduleKey, permissionType });
        }
      }
      if (permRows.length > 0) {
        await RolePermission.bulkCreate(permRows, { transaction: t });
      }
    }

    await t.commit();

    return success(res, {
      id: role.id,
      label: role.label,
      description: role.description,
      isSystem: role.isSystem,
      permissions: permissions || {},
      kras: role.kras,
      kpiBenchmarks: role.kpiBenchmarks,
      userCount: 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }, 'Role created successfully.', 201);
  } catch (err) {
    await t.rollback();
    console.error('Create role error:', err);
    return error(res, 'Failed to create role.', 500);
  }
};

// PUT /api/roles/:id
const update = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const role = await Role.findByPk(req.params.id, { transaction: t });
    if (!role || !role.isActive) {
      await t.rollback();
      return error(res, 'Role not found.', 404);
    }

    const { label, description, permissions, kras, kpiBenchmarks } = req.body;

    // Update role fields
    const updates = {};
    if (label !== undefined) updates.label = label;
    if (description !== undefined) updates.description = description;
    if (kras !== undefined) updates.kras = kras;
    if (kpiBenchmarks !== undefined) updates.kpiBenchmarks = kpiBenchmarks;

    if (Object.keys(updates).length > 0) {
      await role.update(updates, { transaction: t });
    }

    // Update permissions if provided
    if (permissions && typeof permissions === 'object') {
      await RolePermission.destroy({ where: { roleId: req.params.id }, transaction: t });
      const permRows = [];
      for (const [moduleKey, types] of Object.entries(permissions)) {
        for (const permissionType of types) {
          permRows.push({ roleId: req.params.id, moduleKey, permissionType });
        }
      }
      if (permRows.length > 0) {
        await RolePermission.bulkCreate(permRows, { transaction: t });
      }
    }

    await t.commit();

    // Reload with permissions
    const updated = await Role.findByPk(req.params.id, {
      include: [{ model: RolePermission, as: 'permissions' }],
    });
    const json = updated.toJSON();
    const userCount = await User.count({ where: { role: json.id, isActive: true } });

    return success(res, {
      id: json.id,
      label: json.label,
      description: json.description,
      isSystem: json.isSystem,
      isActive: json.isActive,
      kras: json.kras,
      kpiBenchmarks: json.kpiBenchmarks,
      permissions: buildPermissionMap(json.permissions),
      userCount,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }, 'Role updated successfully.');
  } catch (err) {
    await t.rollback();
    console.error('Update role error:', err);
    return error(res, 'Failed to update role.', 500);
  }
};

// DELETE /api/roles/:id
const remove = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return error(res, 'Role not found.', 404);
    }

    if (role.isSystem) {
      return error(res, 'System roles cannot be deleted.', 403);
    }

    const userCount = await User.count({ where: { role: req.params.id, isActive: true } });
    if (userCount > 0) {
      return error(res, `Cannot delete role — ${userCount} user(s) are still assigned to it.`, 409);
    }

    await role.update({ isActive: false });
    return success(res, null, 'Role deleted successfully.');
  } catch (err) {
    console.error('Delete role error:', err);
    return error(res, 'Failed to delete role.', 500);
  }
};

// PUT /api/roles/matrix — bulk-save permission matrix
const saveMatrix = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { roles: roleUpdates } = req.body;

    if (!Array.isArray(roleUpdates)) {
      await t.rollback();
      return error(res, 'Expected an array of role permission updates.', 400);
    }

    for (const item of roleUpdates) {
      const { id, permissions } = item;
      if (!id || !permissions) continue;

      const role = await Role.findByPk(id, { transaction: t });
      if (!role || !role.isActive) continue;

      await RolePermission.destroy({ where: { roleId: id }, transaction: t });

      const permRows = [];
      for (const [moduleKey, types] of Object.entries(permissions)) {
        for (const permissionType of types) {
          permRows.push({ roleId: id, moduleKey, permissionType });
        }
      }
      if (permRows.length > 0) {
        await RolePermission.bulkCreate(permRows, { transaction: t });
      }
    }

    await t.commit();
    return success(res, null, 'Permission matrix saved successfully.');
  } catch (err) {
    await t.rollback();
    console.error('Save matrix error:', err);
    return error(res, 'Failed to save permission matrix.', 500);
  }
};

module.exports = { getAll, getById, create, update, remove, saveMatrix };
