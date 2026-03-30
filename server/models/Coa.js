module.exports = (sequelize, DataTypes) => {
  const Coa = sequelize.define('Coa', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    bookingId: { type: DataTypes.INTEGER, allowNull: false },
    sampleId: { type: DataTypes.INTEGER, allowNull: false },
    templateId: { type: DataTypes.INTEGER },
    reportNumber: { type: DataTypes.STRING(30) },
    generatedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    pdfPath: { type: DataTypes.STRING(500) },
    emailSentTo: { type: DataTypes.STRING(200) },
    emailSentAt: { type: DataTypes.DATE },
    printedAt: { type: DataTypes.DATE },
    printedBy: { type: DataTypes.INTEGER },
    status: { type: DataTypes.ENUM('generated', 'dispatched', 'cancelled'), defaultValue: 'generated' },
    verificationCode: { type: DataTypes.STRING(50), unique: true },
  }, { tableName: 'coas' });
  return Coa;
};
