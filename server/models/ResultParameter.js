module.exports = (sequelize, DataTypes) => {
  const ResultParameter = sequelize.define('ResultParameter', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    resultId: { type: DataTypes.INTEGER, allowNull: false },
    testParameterId: { type: DataTypes.INTEGER },
    parameterName: { type: DataTypes.STRING(200), allowNull: false },
    method: { type: DataTypes.STRING(200) },
    unit: { type: DataTypes.STRING(50) },
    specification: { type: DataTypes.TEXT },
    minLimit: { type: DataTypes.STRING(100) },
    maxLimit: { type: DataTypes.STRING(100) },
    observedValue: { type: DataTypes.STRING(200) },
    calculatedValue: { type: DataTypes.STRING(200) },
    passFail: { type: DataTypes.ENUM('pass', 'fail', 'na'), defaultValue: 'na' },
    remarks: { type: DataTypes.TEXT },
  }, { tableName: 'result_parameters' });
  return ResultParameter;
};
