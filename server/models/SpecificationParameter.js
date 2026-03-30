module.exports = (sequelize, DataTypes) => {
  const SpecificationParameter = sequelize.define('SpecificationParameter', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    specificationId: { type: DataTypes.INTEGER, allowNull: false },
    parameterName: { type: DataTypes.STRING(200), allowNull: false },
    method: { type: DataTypes.STRING(200) },
    unit: { type: DataTypes.STRING(50) },
    minLimit: { type: DataTypes.STRING(100) },
    maxLimit: { type: DataTypes.STRING(100) },
    specValue: { type: DataTypes.TEXT },
    testMasterId: { type: DataTypes.INTEGER },
  }, { tableName: 'specification_parameters' });
  return SpecificationParameter;
};
