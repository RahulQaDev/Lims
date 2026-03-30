module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('info', 'warning', 'error', 'success', 'task', 'reminder', 'escalation'), defaultValue: 'info' },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT },
    link: { type: DataTypes.STRING(500) },
    isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
    readAt: { type: DataTypes.DATE },
    category: { type: DataTypes.ENUM('sample', 'booking', 'result', 'review', 'coa', 'invoice', 'inventory', 'system'), defaultValue: 'system' },
  }, { tableName: 'notifications' });
  return Notification;
};
