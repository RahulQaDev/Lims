const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const db = {};

// Import all models
db.User = require('./User')(sequelize, DataTypes);
db.Department = require('./Department')(sequelize, DataTypes);
db.DepartmentUser = require('./DepartmentUser')(sequelize, DataTypes);
db.Client = require('./Client')(sequelize, DataTypes);
db.Standard = require('./Standard')(sequelize, DataTypes);
db.TestMaster = require('./TestMaster')(sequelize, DataTypes);
db.TestParameter = require('./TestParameter')(sequelize, DataTypes);
db.ProductType = require('./ProductType')(sequelize, DataTypes);
db.Sample = require('./Sample')(sequelize, DataTypes);
db.SampleReception = require('./SampleReception')(sequelize, DataTypes);
db.Booking = require('./Booking')(sequelize, DataTypes);
db.BookingTest = require('./BookingTest')(sequelize, DataTypes);
db.Result = require('./Result')(sequelize, DataTypes);
db.ResultParameter = require('./ResultParameter')(sequelize, DataTypes);
db.Review = require('./Review')(sequelize, DataTypes);
db.AuditLog = require('./AuditLog')(sequelize, DataTypes);
db.Notification = require('./Notification')(sequelize, DataTypes);
db.CoaTemplate = require('./CoaTemplate')(sequelize, DataTypes);
db.Coa = require('./Coa')(sequelize, DataTypes);
db.Invoice = require('./Invoice')(sequelize, DataTypes);
db.InvoiceItem = require('./InvoiceItem')(sequelize, DataTypes);
db.Instrument = require('./Instrument')(sequelize, DataTypes);
db.RateMaster = require('./RateMaster')(sequelize, DataTypes);
db.Specification = require('./Specification')(sequelize, DataTypes);
db.SpecificationParameter = require('./SpecificationParameter')(sequelize, DataTypes);
db.OutsourceLab = require('./OutsourceLab')(sequelize, DataTypes);
db.OutsourceTest = require('./OutsourceTest')(sequelize, DataTypes);
db.InventoryItem = require('./InventoryItem')(sequelize, DataTypes);
db.PurchaseOrder = require('./PurchaseOrder')(sequelize, DataTypes);
db.Vendor = require('./Vendor')(sequelize, DataTypes);
db.Budget = require('./Budget')(sequelize, DataTypes);
db.Employee = require('./Employee')(sequelize, DataTypes);
db.NotificationPreference = require('./NotificationPreference')(sequelize, DataTypes);
db.Location = require('./Location')(sequelize, DataTypes);
db.SampleTransfer = require('./SampleTransfer')(sequelize, DataTypes);
db.LocationDepartment = require('./LocationDepartment')(sequelize, DataTypes);

// Signatories module
db.SignatoryTemplate     = require('./SignatoryTemplate')(sequelize, DataTypes);
db.SignatoryDiscipline   = require('./SignatoryDiscipline')(sequelize, DataTypes);
db.Signatory             = require('./Signatory')(sequelize, DataTypes);
db.SignatoryAuthority    = require('./SignatoryAuthority')(sequelize, DataTypes);
db.SignatorySubstitution = require('./SignatorySubstitution')(sequelize, DataTypes);
db.SignatoryAbsence      = require('./SignatoryAbsence')(sequelize, DataTypes);
db.SignatureAuditLog     = require('./SignatureAuditLog')(sequelize, DataTypes);

// ==================== ASSOCIATIONS ====================

// User <-> Department (many-to-many via DepartmentUser)
db.User.hasMany(db.DepartmentUser, { foreignKey: 'userId', as: 'departmentAssignments' });
db.DepartmentUser.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.Department.hasMany(db.DepartmentUser, { foreignKey: 'departmentId', as: 'members' });
db.DepartmentUser.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
db.Department.belongsTo(db.User, { foreignKey: 'headUserId', as: 'head' });

// Client
db.Client.hasMany(db.Sample, { foreignKey: 'clientId', as: 'samples' });
db.Sample.belongsTo(db.Client, { foreignKey: 'clientId', as: 'client' });
db.Client.hasMany(db.Invoice, { foreignKey: 'clientId', as: 'invoices' });
db.Invoice.belongsTo(db.Client, { foreignKey: 'clientId', as: 'client' });
db.Client.hasMany(db.Specification, { foreignKey: 'clientId', as: 'specifications' });
db.Specification.belongsTo(db.Client, { foreignKey: 'clientId', as: 'client' });

// Sample
db.ProductType.hasMany(db.Sample, { foreignKey: 'productTypeId', as: 'samples' });
db.Sample.belongsTo(db.ProductType, { foreignKey: 'productTypeId', as: 'productType' });
db.Sample.belongsTo(db.User, { foreignKey: 'receivedBy', as: 'receivedByUser' });
db.Sample.hasMany(db.SampleReception, { foreignKey: 'sampleId', as: 'receptions' });
db.SampleReception.belongsTo(db.Sample, { foreignKey: 'sampleId', as: 'sample' });
db.SampleReception.belongsTo(db.User, { foreignKey: 'receivedBy', as: 'receivedByUser' });

// Booking
db.Sample.hasMany(db.Booking, { foreignKey: 'sampleId', as: 'bookings' });
db.Booking.belongsTo(db.Sample, { foreignKey: 'sampleId', as: 'sample' });
db.Booking.belongsTo(db.User, { foreignKey: 'bookedBy', as: 'bookedByUser' });
db.Booking.belongsTo(db.Standard, { foreignKey: 'standardId', as: 'standard' });
db.Booking.belongsTo(db.Specification, { foreignKey: 'specificationId', as: 'specification' });
db.Booking.hasMany(db.BookingTest, { foreignKey: 'bookingId', as: 'bookingTests' });
db.BookingTest.belongsTo(db.Booking, { foreignKey: 'bookingId', as: 'booking' });

// BookingTest
db.BookingTest.belongsTo(db.TestMaster, { foreignKey: 'testMasterId', as: 'testMaster' });
db.BookingTest.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
db.BookingTest.belongsTo(db.User, { foreignKey: 'assignedTo', as: 'assignedToUser' });

// TestMaster
db.TestMaster.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
db.Department.hasMany(db.TestMaster, { foreignKey: 'departmentId', as: 'tests' });
db.TestMaster.belongsTo(db.Standard, { foreignKey: 'standardId', as: 'standard' });
db.Standard.hasMany(db.TestMaster, { foreignKey: 'standardId', as: 'tests' });
db.TestMaster.hasMany(db.TestParameter, { foreignKey: 'testMasterId', as: 'parameters' });
db.TestParameter.belongsTo(db.TestMaster, { foreignKey: 'testMasterId', as: 'testMaster' });

// Result
db.BookingTest.hasOne(db.Result, { foreignKey: 'bookingTestId', as: 'result' });
db.Result.belongsTo(db.BookingTest, { foreignKey: 'bookingTestId', as: 'bookingTest' });
db.Result.belongsTo(db.Sample, { foreignKey: 'sampleId', as: 'sample' });
db.Result.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
db.Result.belongsTo(db.User, { foreignKey: 'enteredBy', as: 'enteredByUser' });
db.Result.belongsTo(db.Instrument, { foreignKey: 'instrumentId', as: 'instrument' });
db.Result.hasMany(db.ResultParameter, { foreignKey: 'resultId', as: 'parameters' });
db.ResultParameter.belongsTo(db.Result, { foreignKey: 'resultId', as: 'result' });
db.ResultParameter.belongsTo(db.TestParameter, { foreignKey: 'testParameterId', as: 'testParameter' });

// Review
db.Result.hasMany(db.Review, { foreignKey: 'resultId', as: 'reviews' });
db.Review.belongsTo(db.Result, { foreignKey: 'resultId', as: 'result' });
db.Review.belongsTo(db.User, { foreignKey: 'reviewerId', as: 'reviewer' });

// CoA
db.Coa.belongsTo(db.Booking, { foreignKey: 'bookingId', as: 'booking' });
db.Coa.belongsTo(db.Sample, { foreignKey: 'sampleId', as: 'sample' });
db.Coa.belongsTo(db.CoaTemplate, { foreignKey: 'templateId', as: 'template' });
db.Booking.hasMany(db.Coa, { foreignKey: 'bookingId', as: 'coas' });
db.CoaTemplate.belongsTo(db.ProductType, { foreignKey: 'productTypeId', as: 'productType' });
db.CoaTemplate.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
db.CoaTemplate.belongsTo(db.Standard, { foreignKey: 'standardId', as: 'standard' });
db.CoaTemplate.belongsTo(db.User, { foreignKey: 'createdBy', as: 'creator' });

// Invoice
db.Invoice.hasMany(db.InvoiceItem, { foreignKey: 'invoiceId', as: 'items' });
db.InvoiceItem.belongsTo(db.Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
db.Invoice.belongsTo(db.Booking, { foreignKey: 'bookingId', as: 'booking' });

// Instrument
db.Instrument.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
db.Department.hasMany(db.Instrument, { foreignKey: 'departmentId', as: 'instruments' });

// RateMaster
db.RateMaster.belongsTo(db.TestMaster, { foreignKey: 'testMasterId', as: 'testMaster' });
db.RateMaster.belongsTo(db.Client, { foreignKey: 'clientId', as: 'client' });
db.RateMaster.belongsTo(db.Standard, { foreignKey: 'standardId', as: 'standard' });

// Specification
db.Specification.hasMany(db.SpecificationParameter, { foreignKey: 'specificationId', as: 'parameters' });
db.SpecificationParameter.belongsTo(db.Specification, { foreignKey: 'specificationId', as: 'parentSpec' });
db.Specification.belongsTo(db.ProductType, { foreignKey: 'productTypeId', as: 'productType' });

// Outsource
db.BookingTest.hasOne(db.OutsourceTest, { foreignKey: 'bookingTestId', as: 'outsourceTest' });
db.OutsourceTest.belongsTo(db.BookingTest, { foreignKey: 'bookingTestId', as: 'bookingTest' });
db.OutsourceTest.belongsTo(db.OutsourceLab, { foreignKey: 'outsourceLabId', as: 'outsourceLab' });
db.OutsourceLab.hasMany(db.OutsourceTest, { foreignKey: 'outsourceLabId', as: 'tests' });

// Purchase
db.PurchaseOrder.belongsTo(db.Vendor, { foreignKey: 'vendorId', as: 'vendor' });
db.Vendor.hasMany(db.PurchaseOrder, { foreignKey: 'vendorId', as: 'purchaseOrders' });
db.PurchaseOrder.belongsTo(db.User, { foreignKey: 'requestedBy', as: 'requester' });
db.PurchaseOrder.belongsTo(db.User, { foreignKey: 'approvedBy', as: 'approver' });

// Budget
db.Budget.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
db.Department.hasMany(db.Budget, { foreignKey: 'departmentId', as: 'budgets' });

// Employee
db.Employee.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.User.hasOne(db.Employee, { foreignKey: 'userId', as: 'employee' });

// Notification & AuditLog
db.Notification.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.User.hasMany(db.Notification, { foreignKey: 'userId', as: 'notifications' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.User.hasMany(db.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
db.NotificationPreference.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.User.hasOne(db.NotificationPreference, { foreignKey: 'userId', as: 'notificationPreference' });

// Location associations
db.Location.hasMany(db.User, { foreignKey: 'locationId', as: 'users' });
db.User.belongsTo(db.Location, { foreignKey: 'locationId', as: 'location' });
db.Location.hasMany(db.Sample, { foreignKey: 'locationId', as: 'samples' });
db.Sample.belongsTo(db.Location, { foreignKey: 'locationId', as: 'location' });
db.Location.hasMany(db.Instrument, { foreignKey: 'locationId', as: 'instruments' });
db.Instrument.belongsTo(db.Location, { foreignKey: 'locationId', as: 'location' });
db.Location.hasMany(db.InventoryItem, { foreignKey: 'locationId', as: 'inventoryItems' });
db.InventoryItem.belongsTo(db.Location, { foreignKey: 'locationId', as: 'location' });

// LocationDepartment associations
db.LocationDepartment.belongsTo(db.Location, { foreignKey: 'locationId', as: 'location' });
db.LocationDepartment.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });
db.Location.hasMany(db.LocationDepartment, { foreignKey: 'locationId', as: 'locationDepartments' });
db.Department.hasMany(db.LocationDepartment, { foreignKey: 'departmentId', as: 'locationDepartments' });
db.Location.belongsToMany(db.Department, { through: db.LocationDepartment, foreignKey: 'locationId', otherKey: 'departmentId', as: 'departments' });
db.Department.belongsToMany(db.Location, { through: db.LocationDepartment, foreignKey: 'departmentId', otherKey: 'locationId', as: 'locations' });

// SampleTransfer associations
db.SampleTransfer.belongsTo(db.Sample, { foreignKey: 'sampleId', as: 'sample' });
db.SampleTransfer.belongsTo(db.Location, { foreignKey: 'fromLocationId', as: 'fromLocation' });
db.SampleTransfer.belongsTo(db.Location, { foreignKey: 'toLocationId', as: 'toLocation' });
db.SampleTransfer.belongsTo(db.User, { foreignKey: 'requestedBy', as: 'requestedByUser' });
db.SampleTransfer.belongsTo(db.User, { foreignKey: 'approvedBy', as: 'approvedByUser' });
db.SampleTransfer.belongsTo(db.User, { foreignKey: 'receivedBy', as: 'receivedByUser' });
db.Sample.hasMany(db.SampleTransfer, { foreignKey: 'sampleId', as: 'transfers' });

// ==================== SIGNATORIES MODULE ASSOCIATIONS ====================

// Signatory ↔ User (optional link for self-signing flow)
db.Signatory.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });
db.User.hasOne(db.Signatory, { foreignKey: 'userId', as: 'signatory' });

// SignatoryAuthority core relations
db.SignatoryAuthority.belongsTo(db.Signatory, { foreignKey: 'signatoryId', as: 'signatory' });
db.Signatory.hasMany(db.SignatoryAuthority, { foreignKey: 'signatoryId', as: 'authorities' });
db.SignatoryAuthority.belongsTo(db.SignatoryTemplate, { foreignKey: 'templateId', as: 'template' });
db.SignatoryTemplate.hasMany(db.SignatoryAuthority, { foreignKey: 'templateId', as: 'authorities' });
db.SignatoryAuthority.belongsTo(db.SignatoryDiscipline, { foreignKey: 'disciplineId', as: 'discipline' });
db.SignatoryDiscipline.hasMany(db.SignatoryAuthority, { foreignKey: 'disciplineId', as: 'authorities' });
db.SignatoryAuthority.belongsTo(db.Signatory, { foreignKey: 'authorisedBy', as: 'authoriser' });

// Substitution chain
db.SignatorySubstitution.belongsTo(db.SignatoryAuthority, { foreignKey: 'primaryAuthorityId', as: 'primary' });
db.SignatorySubstitution.belongsTo(db.SignatoryAuthority, { foreignKey: 'substituteAuthorityId', as: 'substitute' });
db.SignatoryAuthority.hasMany(db.SignatorySubstitution, { foreignKey: 'primaryAuthorityId', as: 'substitutes' });

// Absence
db.SignatoryAbsence.belongsTo(db.Signatory, { foreignKey: 'signatoryId', as: 'signatory' });
db.Signatory.hasMany(db.SignatoryAbsence, { foreignKey: 'signatoryId', as: 'absences' });

// Audit log
db.SignatureAuditLog.belongsTo(db.SignatoryTemplate, { foreignKey: 'templateId', as: 'template' });
db.SignatureAuditLog.belongsTo(db.SignatoryDiscipline, { foreignKey: 'disciplineId', as: 'discipline' });
db.SignatureAuditLog.belongsTo(db.Signatory, { foreignKey: 'signatoryId', as: 'signatory' });
db.SignatureAuditLog.belongsTo(db.Signatory, { foreignKey: 'signedOnBehalfOf', as: 'principal' });
db.SignatureAuditLog.belongsTo(db.SignatoryAuthority, { foreignKey: 'authorityId', as: 'authority' });

// Export
db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;
