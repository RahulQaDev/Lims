module.exports = (sequelize, DataTypes) => {
  const OutsourceTest = sequelize.define('OutsourceTest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookingTestId: { type: DataTypes.INTEGER, allowNull: false },
    outsourceLabId: { type: DataTypes.INTEGER, allowNull: false },
    sentDate: { type: DataTypes.DATEONLY },
    receivedDate: { type: DataTypes.DATEONLY },
    cost: { type: DataTypes.DECIMAL(10, 2) },
    results: { type: DataTypes.JSON },
    status: { type: DataTypes.ENUM('sent', 'received', 'cancelled'), defaultValue: 'sent' },
    remarks: { type: DataTypes.TEXT },
  }, { tableName: 'outsource_tests' });
  return OutsourceTest;
};
