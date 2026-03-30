module.exports = (sequelize, DataTypes) => {
  const Specification = sequelize.define('Specification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    clientId: { type: DataTypes.INTEGER },
    productTypeId: { type: DataTypes.INTEGER },
    description: { type: DataTypes.TEXT },
    version: { type: DataTypes.STRING(20) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'specifications' });
  return Specification;
};
