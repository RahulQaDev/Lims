const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const Location = sequelize.define('Location', {
    name: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    address: { type: DataTypes.TEXT },
    city: { type: DataTypes.STRING },
    state: { type: DataTypes.STRING },
    pincode: { type: DataTypes.STRING(10) },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    website: { type: DataTypes.STRING },
    nablNumber: { type: DataTypes.STRING, comment: 'Location-specific NABL accreditation number' },
    nablCertificate: { type: DataTypes.STRING, comment: 'Path to NABL certificate file' },
    gstNumber: { type: DataTypes.STRING },
    labName: { type: DataTypes.STRING, comment: 'Full lab name for CoA header' },
    reportPrefix: { type: DataTypes.STRING(10), comment: 'Prefix for report numbers at this location' },
    isHQ: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'locations', timestamps: true });
  return Location;
};
