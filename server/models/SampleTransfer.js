const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  const SampleTransfer = sequelize.define('SampleTransfer', {
    sampleId: { type: DataTypes.INTEGER, allowNull: false },
    fromLocationId: { type: DataTypes.INTEGER, allowNull: false },
    toLocationId: { type: DataTypes.INTEGER, allowNull: false },
    requestedBy: { type: DataTypes.INTEGER, allowNull: false },
    requestedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    reason: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('REQUESTED','APPROVED','IN_TRANSIT','RECEIVED','REJECTED','CANCELLED'), defaultValue: 'REQUESTED' },
    approvedBy: { type: DataTypes.INTEGER },
    approvedDate: { type: DataTypes.DATE },
    receivedBy: { type: DataTypes.INTEGER },
    receivedDate: { type: DataTypes.DATE },
    trackingNumber: { type: DataTypes.STRING },
    transportMode: { type: DataTypes.ENUM('COURIER','HAND_CARRY','LOGISTICS','INTERNAL'), defaultValue: 'COURIER' },
    remarks: { type: DataTypes.TEXT },
    rejectionReason: { type: DataTypes.TEXT },
  }, { tableName: 'sample_transfers', timestamps: true });
  return SampleTransfer;
};
