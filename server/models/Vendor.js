module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define('Vendor', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(20) },
    gstNumber: { type: DataTypes.STRING(15) },
    address: { type: DataTypes.TEXT },
    city: { type: DataTypes.STRING(50) },
    state: { type: DataTypes.STRING(50) },
    contactPerson: { type: DataTypes.STRING(100) },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(15) },
    bankName: { type: DataTypes.STRING(100) },
    bankAccount: { type: DataTypes.STRING(20) },
    ifscCode: { type: DataTypes.STRING(15) },
    rating: { type: DataTypes.INTEGER, defaultValue: 3 },
    isApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'vendors' });
  return Vendor;
};
