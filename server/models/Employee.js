module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    employeeCode: { type: DataTypes.STRING(20) },
    designation: { type: DataTypes.STRING(100) },
    joiningDate: { type: DataTypes.DATEONLY },
    department: { type: DataTypes.STRING(100) },
    qualification: { type: DataTypes.STRING(200) },
    experience: { type: DataTypes.STRING(50) },
    aadharNumber: { type: DataTypes.STRING(12) },
    panNumber: { type: DataTypes.STRING(10) },
    bankAccount: { type: DataTypes.STRING(20) },
    ifscCode: { type: DataTypes.STRING(15) },
    emergencyContact: { type: DataTypes.STRING(15) },
    address: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    locationId: { type: DataTypes.INTEGER },
  }, { tableName: 'employees' });
  return Employee;
};
