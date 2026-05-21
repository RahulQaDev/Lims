// signatory_authority — the heart of the module
// Each row = one (signatory × template × discipline × unit) authorised window
module.exports = (sequelize, DataTypes) => {
  const SignatoryAuthority = sequelize.define('SignatoryAuthority', {
    id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'authority_id' },
    signatoryId:         { type: DataTypes.INTEGER, allowNull: false, field: 'signatory_id' },
    templateId:          { type: DataTypes.INTEGER, allowNull: false, field: 'template_id' },
    disciplineId:        { type: DataTypes.INTEGER, allowNull: false, field: 'discipline_id' },
    unit:                { type: DataTypes.STRING(50), allowNull: false },
    authorisedFrom:      { type: DataTypes.DATEONLY, allowNull: false, field: 'authorised_from' },
    authorisedTo:        { type: DataTypes.DATEONLY, allowNull: false, field: 'authorised_to' },
    authorisedBy:        { type: DataTypes.INTEGER, field: 'authorised_by' },
    competenceEvidence:  { type: DataTypes.STRING(500), field: 'competence_evidence' },
    authorityStatus:     { type: DataTypes.ENUM('Active', 'Withdrawn', 'Expired'), defaultValue: 'Active', field: 'authority_status' },
    withdrawnReason:     { type: DataTypes.TEXT, field: 'withdrawn_reason' },
    withdrawnOn:         { type: DataTypes.DATEONLY, field: 'withdrawn_on' },
  }, {
    tableName: 'signatory_authority',
    paranoid: true,
    indexes: [
      { fields: ['template_id', 'discipline_id', 'unit', 'authority_status'] },
      { fields: ['authorised_to', 'authority_status'] },
      { unique: true, fields: ['signatory_id', 'template_id', 'discipline_id', 'unit', 'authorised_from'] },
    ],
  });
  return SignatoryAuthority;
};
