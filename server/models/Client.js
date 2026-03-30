module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    code: { type: DataTypes.STRING(20), unique: true },
    gstNumber: { type: DataTypes.STRING(15) },
    pan: { type: DataTypes.STRING(10) },
    address: { type: DataTypes.TEXT },
    city: { type: DataTypes.STRING(50) },
    state: { type: DataTypes.STRING(50) },
    pincode: { type: DataTypes.STRING(10) },
    country: { type: DataTypes.STRING(50), defaultValue: 'India' },
    contactPerson: { type: DataTypes.STRING(100) },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(15) },
    alternatePhone: { type: DataTypes.STRING(15) },
    clientType: { type: DataTypes.ENUM('regular', 'walk_in', 'government', 'corporate'), defaultValue: 'regular' },
    creditLimit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    creditDays: { type: DataTypes.INTEGER, defaultValue: 30 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    notes: { type: DataTypes.TEXT },
  }, { tableName: 'clients' });
  Client.beforeCreate(async (client) => {
    if (!client.code) {
      const count = await Client.count();
      client.code = 'CLI' + String(count + 1).padStart(5, '0');
    }
  });
  return Client;
};
