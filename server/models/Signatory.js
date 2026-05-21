// signatories_master — named individuals with signing authority
module.exports = (sequelize, DataTypes) => {
  const Signatory = sequelize.define('Signatory', {
    id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'signatory_id' },
    employeeId:          { type: DataTypes.STRING(20), allowNull: false, unique: true, field: 'employee_id' },
    fullName:            { type: DataTypes.STRING(150), allowNull: false, field: 'full_name' },
    designation:         { type: DataTypes.STRING(100) },
    qualification:       { type: DataTypes.STRING(200) },
    unit:                { type: DataTypes.STRING(50), allowNull: false },
    email:               { type: DataTypes.STRING(150) },
    phone:               { type: DataTypes.STRING(20) },
    dscCertificateRef:   { type: DataTypes.STRING(200), field: 'dsc_certificate_ref' },
    signatureImagePath:  { type: DataTypes.STRING(500), field: 'signature_image_path' },
    status:              { type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'), defaultValue: 'Active' },
    dateOfJoining:       { type: DataTypes.DATEONLY, field: 'date_of_joining' },
    dateOfExit:          { type: DataTypes.DATEONLY, field: 'date_of_exit' },
    userId:              { type: DataTypes.INTEGER, field: 'user_id' }, // optional link to User
  }, {
    tableName: 'signatories_master',
    paranoid: true,
  });
  return Signatory;
};
