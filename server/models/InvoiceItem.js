module.exports = (sequelize, DataTypes) => {
  const InvoiceItem = sequelize.define('InvoiceItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoiceId: { type: DataTypes.INTEGER, allowNull: false },
    testMasterId: { type: DataTypes.INTEGER },
    description: { type: DataTypes.STRING(300) },
    hsnCode: { type: DataTypes.STRING(20) },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    rate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    cgstRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 9 },
    cgstAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    sgstRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 9 },
    sgstAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    igstRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    igstAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  }, { tableName: 'invoice_items' });
  return InvoiceItem;
};
