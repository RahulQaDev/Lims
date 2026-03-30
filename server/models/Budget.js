module.exports = (sequelize, DataTypes) => {
  const Budget = sequelize.define('Budget', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    departmentId: { type: DataTypes.INTEGER, allowNull: false },
    financialYear: { type: DataTypes.STRING(10), allowNull: false },
    category: { type: DataTypes.ENUM('chemicals', 'consumables', 'glassware', 'instruments', 'maintenance', 'amc', 'manpower', 'other'), defaultValue: 'other' },
    allocatedAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    spentAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('draft', 'proposed', 'approved', 'active', 'closed'), defaultValue: 'draft' },
    approvedBy: { type: DataTypes.INTEGER },
    remarks: { type: DataTypes.TEXT },
    locationId: { type: DataTypes.INTEGER },
  }, { tableName: 'budgets' });
  return Budget;
};
