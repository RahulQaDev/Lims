// signatory_absence — formal leave or manual "out today" toggle
module.exports = (sequelize, DataTypes) => {
  const SignatoryAbsence = sequelize.define('SignatoryAbsence', {
    id:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'absence_id' },
    signatoryId:        { type: DataTypes.INTEGER, allowNull: false, field: 'signatory_id' },
    absentFrom:         { type: DataTypes.DATEONLY, allowNull: false, field: 'absent_from' },
    absentTo:           { type: DataTypes.DATEONLY, allowNull: false, field: 'absent_to' },
    reason:             { type: DataTypes.STRING(80) },
    source:             { type: DataTypes.ENUM('HR_SYNC', 'MANUAL', 'AUTO'), allowNull: false },
    notificationSent:   { type: DataTypes.BOOLEAN, defaultValue: false, field: 'notification_sent' },
  }, {
    tableName: 'signatory_absence',
    paranoid: true,
    indexes: [{ fields: ['signatory_id', 'absent_from', 'absent_to'] }],
    validate: {
      datesOrdered() {
        if (this.absentFrom && this.absentTo && this.absentFrom > this.absentTo) {
          throw new Error('absent_to must be on or after absent_from');
        }
      },
    },
  });
  return SignatoryAbsence;
};
