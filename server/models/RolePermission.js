module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define('RolePermission', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    roleId: { type: DataTypes.STRING(50), allowNull: false },
    moduleKey: { type: DataTypes.STRING(50), allowNull: false },
    permissionType: {
      type: DataTypes.ENUM('view', 'edit', 'approve'),
      allowNull: false,
    },
  }, {
    tableName: 'role_permissions',
    indexes: [
      { unique: true, fields: ['roleId', 'moduleKey', 'permissionType'] },
      { fields: ['roleId'] },
    ],
  });
  return RolePermission;
};
