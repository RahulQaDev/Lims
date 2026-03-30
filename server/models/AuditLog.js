module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    action: { type: DataTypes.ENUM('create', 'update', 'delete', 'login', 'logout', 'view', 'print', 'email', 'approve', 'reject'), allowNull: false },
    entity: { type: DataTypes.STRING(50) },
    entityId: { type: DataTypes.STRING(20) },
    oldValues: { type: DataTypes.JSON },
    newValues: { type: DataTypes.JSON },
    ipAddress: { type: DataTypes.STRING(45) },
    userAgent: { type: DataTypes.TEXT },
  }, { tableName: 'audit_logs', updatedAt: false });
  return AuditLog;
};
