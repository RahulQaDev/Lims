module.exports = (sequelize, DataTypes) => {
  const RateMaster = sequelize.define('RateMaster', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    testMasterId: { type: DataTypes.INTEGER, allowNull: false },
    clientId: { type: DataTypes.INTEGER },
    standardId: { type: DataTypes.INTEGER },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    effectiveFrom: { type: DataTypes.DATEONLY },
    effectiveTo: { type: DataTypes.DATEONLY },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'rate_masters' });
  return RateMaster;
};
