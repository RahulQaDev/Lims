module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    resultId: { type: DataTypes.INTEGER, allowNull: false },
    reviewerId: { type: DataTypes.INTEGER, allowNull: false },
    reviewDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('approved', 'rejected', 'on_hold'), allowNull: false },
    remarks: { type: DataTypes.TEXT },
    level: { type: DataTypes.ENUM('review', 'approval'), allowNull: false },
  }, { tableName: 'reviews' });
  return Review;
};
