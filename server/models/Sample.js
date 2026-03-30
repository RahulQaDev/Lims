module.exports = (sequelize, DataTypes) => {
  const Sample = sequelize.define('Sample', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sampleCode: { type: DataTypes.STRING(30), unique: true },
    clientId: { type: DataTypes.INTEGER, allowNull: false },
    productTypeId: { type: DataTypes.INTEGER },
    description: { type: DataTypes.TEXT, allowNull: false },
    batchNumber: { type: DataTypes.STRING(50) },
    lotNumber: { type: DataTypes.STRING(50) },
    mfgDate: { type: DataTypes.DATEONLY },
    expDate: { type: DataTypes.DATEONLY },
    quantity: { type: DataTypes.STRING(50) },
    quantityUnit: { type: DataTypes.STRING(20) },
    brandName: { type: DataTypes.STRING(100) },
    manufacturer: { type: DataTypes.STRING(200) },
    sampleSource: { type: DataTypes.ENUM('client_delivered', 'sampler_collected', 'logistics'), defaultValue: 'client_delivered' },
    collectedBy: { type: DataTypes.STRING(100) },
    collectionDate: { type: DataTypes.DATE },
    collectionLocation: { type: DataTypes.TEXT },
    receivedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    receivedBy: { type: DataTypes.INTEGER },
    condition: { type: DataTypes.ENUM('intact', 'damaged', 'temperature_deviation', 'leaking', 'other'), defaultValue: 'intact' },
    conditionRemarks: { type: DataTypes.TEXT },
    storageLocation: { type: DataTypes.STRING(100) },
    status: { type: DataTypes.ENUM('received', 'booked', 'in_testing', 'under_review', 'approved', 'coa_generated', 'dispatched', 'archived'), defaultValue: 'received' },
    priority: { type: DataTypes.ENUM('normal', 'urgent', 'express'), defaultValue: 'normal' },
    dueDate: { type: DataTypes.DATE },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    locationId: { type: DataTypes.INTEGER },
  }, { tableName: 'samples' });
  Sample.beforeCreate(async (sample) => {
    if (!sample.sampleCode) {
      const today = new Date();
      const prefix = 'SMP' + today.getFullYear().toString().slice(2) + String(today.getMonth() + 1).padStart(2, '0');
      const count = await Sample.count({ where: sequelize.where(sequelize.fn('LEFT', sequelize.col('sampleCode'), 7), prefix) });
      sample.sampleCode = prefix + String(count + 1).padStart(5, '0');
    }
  });
  return Sample;
};
