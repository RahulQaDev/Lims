module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    fullName: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(15) },
    role: {
      type: DataTypes.ENUM('admin', 'lab_head', 'dept_head', 'analyst', 'reviewer', 'approver',
        'booking', 'reception', 'customer_coordinator', 'area_manager', 'accounts',
        'marketing', 'purchase', 'hr', 'qa', 'client', 'printing', 'technical'),
      allowNull: false, defaultValue: 'analyst',
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    locationId: { type: DataTypes.INTEGER },
    lastLogin: { type: DataTypes.DATE },
    profileImage: { type: DataTypes.STRING(255) },
    signatureImage: { type: DataTypes.STRING(255) },
  }, { tableName: 'users' });
  return User;
};
