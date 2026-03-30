module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define('Invoice', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoiceNumber: { type: DataTypes.STRING(30), unique: true },
    bookingId: { type: DataTypes.INTEGER },
    clientId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    dueDate: { type: DataTypes.DATEONLY },
    subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    cgst: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    sgst: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    igst: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalTax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    roundOff: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    grandTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM('draft', 'generated', 'sent', 'partially_paid', 'paid', 'cancelled', 'overdue'), defaultValue: 'draft' },
    paidAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    paymentDate: { type: DataTypes.DATEONLY },
    paymentMode: { type: DataTypes.STRING(50) },
    paymentReference: { type: DataTypes.STRING(100) },
    remarks: { type: DataTypes.TEXT },
  }, { tableName: 'invoices' });
  Invoice.beforeCreate(async (invoice) => {
    if (!invoice.invoiceNumber) {
      const today = new Date();
      const prefix = 'INV' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0');
      const count = await Invoice.count({ where: sequelize.where(sequelize.fn('LEFT', sequelize.col('invoiceNumber'), 9), prefix) });
      invoice.invoiceNumber = prefix + String(count + 1).padStart(5, '0');
    }
  });
  return Invoice;
};
