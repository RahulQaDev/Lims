const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LocationDepartment = sequelize.define('LocationDepartment', {
    locationId: { type: DataTypes.INTEGER, allowNull: false },
    departmentId: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'location_departments',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['locationId', 'departmentId'] },
    ],
  });
  return LocationDepartment;
};
