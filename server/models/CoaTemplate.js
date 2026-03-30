module.exports = (sequelize, DataTypes) => {
  const CoaTemplate = sequelize.define('CoaTemplate', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    productTypeId: { type: DataTypes.INTEGER },
    departmentId: { type: DataTypes.INTEGER },
    standardId: { type: DataTypes.INTEGER },
    templateData: { type: DataTypes.JSON },
    headerConfig: { type: DataTypes.JSON },
    footerConfig: { type: DataTypes.JSON },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    version: { type: DataTypes.INTEGER, defaultValue: 1 },
    createdBy: { type: DataTypes.INTEGER },
  }, { tableName: 'coa_templates' });
  return CoaTemplate;
};
