module.exports = (sequelize, DataTypes) => {
  const SampleReception = sequelize.define('SampleReception', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sampleId: { type: DataTypes.INTEGER, allowNull: false },
    receivedBy: { type: DataTypes.INTEGER, allowNull: false },
    receivedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    temperature: { type: DataTypes.STRING(20) },
    humidity: { type: DataTypes.STRING(20) },
    sealCondition: { type: DataTypes.STRING(50) },
    numberOfContainers: { type: DataTypes.INTEGER, defaultValue: 1 },
    remarks: { type: DataTypes.TEXT },
    acknowledgementSent: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: 'sample_receptions' });
  return SampleReception;
};
