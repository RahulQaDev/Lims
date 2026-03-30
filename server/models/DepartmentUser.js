module.exports = (sequelize, DataTypes) => {
  const DepartmentUser = sequelize.define('DepartmentUser', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    departmentId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    role: { type: DataTypes.ENUM('head', 'analyst', 'reviewer', 'approver', 'member'), defaultValue: 'member' },
  }, { tableName: 'department_users' });
  return DepartmentUser;
};
