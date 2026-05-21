module.exports = (sequelize, DataTypes) => {
  const EmployeeSkill = sequelize.define('EmployeeSkill', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    skillId: { type: DataTypes.INTEGER, allowNull: false },
    level: {
      type: DataTypes.ENUM('not_trained', 'in_training', 'trained', 'expert'),
      allowNull: false,
      defaultValue: 'not_trained',
    },
    certifiedDate: { type: DataTypes.DATE },
    expiresAt: { type: DataTypes.DATE },
    notes: { type: DataTypes.TEXT },
    updatedBy: { type: DataTypes.INTEGER }, // userId of who last updated this record
  }, {
    tableName: 'employee_skills',
    indexes: [
      { unique: true, fields: ['userId', 'skillId'] },
      { fields: ['skillId'] },
    ],
  });
  return EmployeeSkill;
};
