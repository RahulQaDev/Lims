module.exports = (sequelize, DataTypes) => {
  const Standard = sequelize.define('Standard', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(50), unique: true },
    type: { type: DataTypes.ENUM('BIS', 'FSSAI', 'PHARMACOPOEIA', 'ISO', 'ASTM', 'INHOUSE', 'OTHER'), allowNull: false },
    category: { type: DataTypes.STRING(100) },
    description: { type: DataTypes.TEXT },
    version: { type: DataTypes.STRING(20) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'standards' });
  return Standard;
};
