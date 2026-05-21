module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
      validate: { is: /^[a-z0-9_]+$/ },
    },
    label: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    isSystem: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    kras: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('kras');
        try { return JSON.parse(raw); } catch { return []; }
      },
      set(val) { this.setDataValue('kras', JSON.stringify(val || [])); },
    },
    kpiBenchmarks: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const raw = this.getDataValue('kpiBenchmarks');
        try { return JSON.parse(raw); } catch { return []; }
      },
      set(val) { this.setDataValue('kpiBenchmarks', JSON.stringify(val || [])); },
    },
  }, { tableName: 'roles' });
  return Role;
};
