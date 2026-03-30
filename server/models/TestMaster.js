module.exports = (sequelize, DataTypes) => {
  const TestMaster = sequelize.define('TestMaster', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(20) },
    departmentId: { type: DataTypes.INTEGER },
    method: { type: DataTypes.STRING(200) },
    unit: { type: DataTypes.STRING(50) },
    minLimit: { type: DataTypes.STRING(100) },
    maxLimit: { type: DataTypes.STRING(100) },
    specification: { type: DataTypes.TEXT },
    standardId: { type: DataTypes.INTEGER },
    sampleType: { type: DataTypes.STRING(100) },
    tatHours: { type: DataTypes.INTEGER, defaultValue: 48 },
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    isAccredited: { type: DataTypes.BOOLEAN, defaultValue: false },
    formula: { type: DataTypes.TEXT },
    calculationType: { type: DataTypes.ENUM('direct', 'formula', 'average'), defaultValue: 'direct' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'test_masters' });
  return TestMaster;
};
