module.exports = (sequelize, DataTypes) => {
  const TestParameter = sequelize.define('TestParameter', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    testMasterId: { type: DataTypes.INTEGER, allowNull: false },
    parameterName: { type: DataTypes.STRING(200), allowNull: false },
    method: { type: DataTypes.STRING(200) },
    unit: { type: DataTypes.STRING(50) },
    minLimit: { type: DataTypes.STRING(100) },
    maxLimit: { type: DataTypes.STRING(100) },
    specification: { type: DataTypes.TEXT },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    isRequired: { type: DataTypes.BOOLEAN, defaultValue: true },
    formula: { type: DataTypes.TEXT },
  }, { tableName: 'test_parameters' });
  return TestParameter;
};
