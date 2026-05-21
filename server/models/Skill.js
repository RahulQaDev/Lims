module.exports = (sequelize, DataTypes) => {
  const Skill = sequelize.define('Skill', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    code: { type: DataTypes.STRING(50) },
    description: { type: DataTypes.STRING(255) },
    departmentId: { type: DataTypes.INTEGER }, // optional: ties skill to a department
    category: { type: DataTypes.STRING(50) }, // e.g. 'instrument', 'technique', 'soft-skill'
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'skills' });
  return Skill;
};
