module.exports = (sequelize, DataTypes) => {
  const ProductType = sequelize.define('ProductType', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(20) },
    category: { type: DataTypes.ENUM('food', 'water', 'pharma', 'cosmetics', 'environmental', 'herbal', 'chemical', 'mechanical', 'radiological', 'other'), defaultValue: 'other' },
    description: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'product_types' });
  return ProductType;
};
