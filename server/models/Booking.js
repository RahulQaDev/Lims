module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sampleId: { type: DataTypes.INTEGER, allowNull: false },
    reportNumber: { type: DataTypes.STRING(30), unique: true },
    bookingDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    bookedBy: { type: DataTypes.INTEGER, allowNull: false },
    standardId: { type: DataTypes.INTEGER },
    specificationId: { type: DataTypes.INTEGER },
    testingType: { type: DataTypes.ENUM('regulatory', 'non_regulatory', 'inhouse'), defaultValue: 'regulatory' },
    priority: { type: DataTypes.ENUM('normal', 'urgent', 'express'), defaultValue: 'normal' },
    dueDate: { type: DataTypes.DATE },
    remarks: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('booked', 'in_progress', 'completed', 'cancelled'), defaultValue: 'booked' },
    totalAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    discountPercent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    netAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    isAmended: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: 'bookings' });
  Booking.beforeCreate(async (booking) => {
    if (!booking.reportNumber) {
      const today = new Date();
      const prefix = 'RPT' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0');
      const count = await Booking.count({ where: sequelize.where(sequelize.fn('LEFT', sequelize.col('reportNumber'), 9), prefix) });
      booking.reportNumber = prefix + String(count + 1).padStart(5, '0');
    }
  });
  return Booking;
};
