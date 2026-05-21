// signatory_substitution — three-deep substitute chain (priority 1, 2, 3)
module.exports = (sequelize, DataTypes) => {
  const SignatorySubstitution = sequelize.define('SignatorySubstitution', {
    id:                     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'substitution_id' },
    primaryAuthorityId:     { type: DataTypes.INTEGER, allowNull: false, field: 'primary_authority_id' },
    substituteAuthorityId:  { type: DataTypes.INTEGER, allowNull: false, field: 'substitute_authority_id' },
    priority:               { type: DataTypes.SMALLINT, allowNull: false, validate: { min: 1, max: 3 } },
  }, {
    tableName: 'signatory_substitution',
    paranoid: true,
    indexes: [{ unique: true, fields: ['primary_authority_id', 'priority'] }],
    validate: {
      notSelf() {
        if (this.primaryAuthorityId === this.substituteAuthorityId) {
          throw new Error('Substitute cannot be the same as the primary authority');
        }
      },
    },
  });
  return SignatorySubstitution;
};
