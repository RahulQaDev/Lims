module.exports = (sequelize, DataTypes) => {
  const BookingTest = sequelize.define('BookingTest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookingId: { type: DataTypes.INTEGER, allowNull: false },
    testMasterId: { type: DataTypes.INTEGER, allowNull: false },
    departmentId: { type: DataTypes.INTEGER },
    assignedTo: { type: DataTypes.INTEGER },
    status: { type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'reviewed', 'approved', 'rejected'), defaultValue: 'pending' },
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    dueDate: { type: DataTypes.DATE },
    remarks: { type: DataTypes.TEXT },
  }, { tableName: 'booking_tests' });
  return BookingTest;
};
