module.exports = (sequelize, DataTypes) => {
  const OutsourceLab = sequelize.define('OutsourceLab', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    address: { type: DataTypes.TEXT },
    contactPerson: { type: DataTypes.STRING(100) },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(15) },
    nablNumber: { type: DataTypes.STRING(50) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'outsource_labs' });
  return OutsourceLab;
};
