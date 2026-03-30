module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    poNumber: { type: DataTypes.STRING(30), unique: true },
    vendorId: { type: DataTypes.INTEGER, allowNull: false },
    requestedBy: { type: DataTypes.INTEGER, allowNull: false },
    approvedBy: { type: DataTypes.INTEGER },
    orderDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    expectedDelivery: { type: DataTypes.DATEONLY },
    status: { type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'), defaultValue: 'draft' },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    remarks: { type: DataTypes.TEXT },
    locationId: { type: DataTypes.INTEGER },
  }, { tableName: 'purchase_orders' });
  return PurchaseOrder;
};
