module.exports = (sequelize, DataTypes) => {
  const InventoryItem = sequelize.define('InventoryItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(20) },
    category: { type: DataTypes.ENUM('chemical', 'reagent', 'consumable', 'glassware', 'reference_standard', 'media', 'solvent', 'gas', 'other'), defaultValue: 'other' },
    unit: { type: DataTypes.STRING(20) },
    hsnCode: { type: DataTypes.STRING(20) },
    gstRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18 },
    minStock: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    maxStock: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    currentStock: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    storageCondition: { type: DataTypes.ENUM('ambient', 'refrigerated', 'freezer', 'desiccator'), defaultValue: 'ambient' },
    msdsPath: { type: DataTypes.STRING(500) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    locationId: { type: DataTypes.INTEGER },
  }, { tableName: 'inventory_items' });
  return InventoryItem;
};
