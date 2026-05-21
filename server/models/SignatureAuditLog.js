// signature_audit_log — Part 11 evidence trail for every signing attempt
module.exports = (sequelize, DataTypes) => {
  const SignatureAuditLog = sequelize.define('SignatureAuditLog', {
    id:                  { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, field: 'log_id' },
    reportId:            { type: DataTypes.STRING(60), allowNull: false, field: 'report_id' },
    templateId:          { type: DataTypes.INTEGER, allowNull: false, field: 'template_id' },
    disciplineId:        { type: DataTypes.INTEGER, allowNull: false, field: 'discipline_id' },
    signatoryId:         { type: DataTypes.INTEGER, field: 'signatory_id' },
    authorityId:         { type: DataTypes.INTEGER, field: 'authority_id' },
    signedOnBehalfOf:    { type: DataTypes.INTEGER, field: 'signed_on_behalf_of' },
    signedAt:            { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false, field: 'signed_at' },
    signatureMethod:     { type: DataTypes.ENUM('AADHAAR_ESIGN', 'INTERNAL_HASH', 'DSC_TOKEN'), field: 'signature_method' },
    signatureHash:       { type: DataTypes.STRING(256), field: 'signature_hash' },
    ipAddress:           { type: DataTypes.STRING(45), field: 'ip_address' },
    userAgent:           { type: DataTypes.STRING(300), field: 'user_agent' },
    result:              { type: DataTypes.ENUM('SUCCESS', 'REJECTED'), allowNull: false },
    rejectReason:        { type: DataTypes.TEXT, field: 'reject_reason' },
  }, {
    tableName: 'signature_audit_log',
    indexes: [
      { fields: ['report_id'] },
      { fields: ['signatory_id', 'signed_at'] },
    ],
  });
  return SignatureAuditLog;
};
