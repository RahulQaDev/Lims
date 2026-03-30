module.exports = (sequelize, DataTypes) => {
  const NotificationPreference = sequelize.define('NotificationPreference', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        sample: { inApp: true, email: true },
        booking: { inApp: true, email: false },
        result: { inApp: true, email: true },
        review: { inApp: true, email: true },
        coa: { inApp: true, email: true },
        invoice: { inApp: true, email: false },
        inventory: { inApp: true, email: false },
        system: { inApp: true, email: false },
      },
    },
  }, { tableName: 'notification_preferences' });
  return NotificationPreference;
};
