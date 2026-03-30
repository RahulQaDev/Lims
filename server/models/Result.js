module.exports = (sequelize, DataTypes) => {
  const Result = sequelize.define('Result', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookingTestId: { type: DataTypes.INTEGER, allowNull: false },
    sampleId: { type: DataTypes.INTEGER, allowNull: false },
    departmentId: { type: DataTypes.INTEGER },
    enteredBy: { type: DataTypes.INTEGER, allowNull: false },
    enteredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    instrumentId: { type: DataTypes.INTEGER },
    rawData: { type: DataTypes.TEXT },
    remarks: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('entered', 'reviewed', 'approved', 'rejected'), defaultValue: 'entered' },
  }, { tableName: 'results' });
  return Result;
};
