// templates_master — regulatory templates that carry a digital signature
module.exports = (sequelize, DataTypes) => {
  const SignatoryTemplate = sequelize.define('SignatoryTemplate', {
    id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'template_id' },
    templateCode:     { type: DataTypes.STRING(20), allowNull: false, unique: true, field: 'template_code' },
    templateName:     { type: DataTypes.STRING(150), allowNull: false, field: 'template_name' },
    regulatoryBody:   { type: DataTypes.STRING(50), allowNull: false, field: 'regulatory_body' },
    templateVersion:  { type: DataTypes.STRING(30), field: 'template_version' },
    effectiveFrom:    { type: DataTypes.DATEONLY, allowNull: false, field: 'effective_from' },
    effectiveTo:      { type: DataTypes.DATEONLY, field: 'effective_to' },
    status:           { type: DataTypes.ENUM('Active', 'Inactive', 'Retired'), defaultValue: 'Active' },
    remarks:          { type: DataTypes.TEXT },
  }, {
    tableName: 'templates_master',
    paranoid: true,
  });
  return SignatoryTemplate;
};
