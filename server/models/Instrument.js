module.exports = (sequelize, DataTypes) => {
  const Instrument = sequelize.define('Instrument', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(20) },
    departmentId: { type: DataTypes.INTEGER },
    make: { type: DataTypes.STRING(100) },
    model: { type: DataTypes.STRING(100) },
    serialNumber: { type: DataTypes.STRING(50) },
    calibrationDate: { type: DataTypes.DATEONLY },
    nextCalibrationDate: { type: DataTypes.DATEONLY },
    calibrationCertificate: { type: DataTypes.STRING(500) },
    status: { type: DataTypes.ENUM('active', 'under_maintenance', 'calibration_due', 'out_of_service'), defaultValue: 'active' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    locationId: { type: DataTypes.INTEGER },
  }, { tableName: 'instruments' });
  return Instrument;
};
