module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    type: { type: DataTypes.ENUM('analytical', 'administrative'), defaultValue: 'analytical' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    description: { type: DataTypes.TEXT },
    headUserId: { type: DataTypes.INTEGER, references: { model: 'users', key: 'id' } },
    tatDays: { type: DataTypes.INTEGER, defaultValue: 7 },
  }, { tableName: 'departments' });
  return Department;
};
