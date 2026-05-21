// disciplines_master — NABL/Statutory disciplines that a person can be authorised in
module.exports = (sequelize, DataTypes) => {
  const SignatoryDiscipline = sequelize.define('SignatoryDiscipline', {
    id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'discipline_id' },
    disciplineCode:  { type: DataTypes.STRING(40), allowNull: false, unique: true, field: 'discipline_code' },
    disciplineName:  { type: DataTypes.STRING(250), allowNull: false, field: 'discipline_name' },
    groupType:       { type: DataTypes.ENUM('Chemical', 'Biological', 'Mechanical', 'Statutory'), allowNull: false, field: 'group_type' },
    nablScopeCode:   { type: DataTypes.STRING(50), field: 'nabl_scope_code' },
    status:          { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' },
  }, {
    tableName: 'disciplines_master',
    paranoid: true,
  });
  return SignatoryDiscipline;
};
