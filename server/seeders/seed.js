require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

async function seed() {
  try {
    // ============================================================
    // Step 1: Create database if it does not exist
    // ============================================================
    console.log('--- Step 1: Ensuring database exists ---');
    const dbDialect = process.env.DB_DIALECT || 'sqlite';

    if (dbDialect === 'mysql') {
      const dbName = process.env.DB_NAME || 'lims_db';
      const dbUser = process.env.DB_USER || 'root';
      const dbPass = process.env.DB_PASSWORD || '';
      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = parseInt(process.env.DB_PORT || '3306');

      const tempSequelize = new Sequelize('', dbUser, dbPass, {
        host: dbHost,
        port: dbPort,
        dialect: 'mysql',
        logging: false,
      });

      await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      console.log(`Database '${dbName}' ensured.`);
      await tempSequelize.close();
    } else {
      console.log('Using SQLite - no database creation needed.');
    }

    // ============================================================
    // Step 2: Load models and sync (force: true)
    // ============================================================
    console.log('--- Step 2: Syncing all models (force: true) ---');
    const db = require('../models');

    await db.sequelize.sync({ force: true });
    console.log('All tables recreated successfully.');

    // ============================================================
    // Step 3: Seed data
    // ============================================================

    // ---------- 3a. Users ----------
    console.log('--- Step 3a: Seeding users ---');
    const salt = await bcrypt.genSalt(10);
    const hashAdmin = await bcrypt.hash('admin123', salt);
    const hashLabHead = await bcrypt.hash('labhead123', salt);
    const hashTest = await bcrypt.hash('test123', salt);

    const adminUser = await db.User.create({
      username: 'admin',
      email: 'admin@lims.com',
      password: hashAdmin,
      fullName: 'System Administrator',
      role: 'admin',
      isActive: true,
    });
    console.log('  Created admin user (id: ' + adminUser.id + ')');

    const labHeadUser = await db.User.create({
      username: 'labhead',
      email: 'labhead@lims.com',
      password: hashLabHead,
      fullName: 'Lab Head',
      role: 'lab_head',
      isActive: true,
    });
    console.log('  Created lab_head user (id: ' + labHeadUser.id + ')');

    const testRoles = [
      { username: 'booking_user', email: 'booking@lims.com', fullName: 'Booking User', role: 'booking' },
      { username: 'reception_user', email: 'reception@lims.com', fullName: 'Reception User', role: 'reception' },
      { username: 'analyst_user', email: 'analyst@lims.com', fullName: 'Analyst User', role: 'analyst' },
      { username: 'reviewer_user', email: 'reviewer@lims.com', fullName: 'Reviewer User', role: 'reviewer' },
      { username: 'approver_user', email: 'approver@lims.com', fullName: 'Approver User', role: 'approver' },
      { username: 'accounts_user', email: 'accounts@lims.com', fullName: 'Accounts User', role: 'accounts' },
      { username: 'qa_user', email: 'qa@lims.com', fullName: 'Quality Head', role: 'qa' },
    ];

    for (const r of testRoles) {
      const u = await db.User.create({
        ...r,
        password: hashTest,
        isActive: true,
      });
      console.log('  Created ' + r.role + ' user (id: ' + u.id + ')');
    }

    // ---------- 3b. Departments ----------
    console.log('--- Step 3b: Seeding departments ---');
    const analyticalDepts = [
      { name: 'MICRO BIOLOGY', code: 'MICRO' },
      { name: 'HERBAL', code: 'HERB' },
      { name: 'ICPMS', code: 'ICPMS' },
      { name: 'HPLC', code: 'HPLC' },
      { name: 'HPLC2', code: 'HPLC2' },
      { name: 'WATER', code: 'WATER' },
      { name: 'FOOD', code: 'FOOD' },
      { name: 'MASSPECTROSCOPY', code: 'MASS' },
      { name: 'GC', code: 'GC' },
      { name: 'XRD', code: 'XRD' },
      { name: 'MALVERN', code: 'MALV' },
      { name: 'ICPOES', code: 'ICPO' },
      { name: 'LCMS', code: 'LCMS' },
      { name: 'COSMETICS', code: 'COSM' },
      { name: 'Environmental', code: 'ENV' },
      { name: 'Validation', code: 'VAL' },
      { name: 'AAS', code: 'AAS' },
      { name: 'ION Chromatography', code: 'IONC' },
      { name: 'DSC', code: 'DSC' },
      { name: 'Radiological', code: 'RAD' },
      { name: 'PHARMA CHEMICAL', code: 'PHRM' },
      { name: 'INSTRUMENTATION', code: 'INST' },
      { name: 'MECHANICAL', code: 'MECH' },
      { name: 'MOLECULAR BIOLOGY', code: 'MOLB' },
      { name: 'GENERIC', code: 'GEN' },
    ];

    const administrativeDepts = [
      { name: 'ADMINISTRATOR', code: 'ADM' },
      { name: 'MARKETING', code: 'MKT' },
      { name: 'BOOKING', code: 'BOOK' },
      { name: 'PRINTING', code: 'PRNT' },
      { name: 'REVIEW', code: 'REV' },
      { name: 'SIGNATURE', code: 'SIG' },
      { name: 'CUSTOMER CORDINATOR', code: 'CC' },
      { name: 'APPROVED', code: 'APPR' },
      { name: 'INVOICE', code: 'INV' },
      { name: 'AREA MANAGER', code: 'AM' },
      { name: 'ACCOUNTS', code: 'ACCT' },
      { name: 'PRODUCT', code: 'PROD' },
      { name: 'OUTSOURCE', code: 'OUT' },
      { name: 'Technical', code: 'TECH' },
      { name: 'Sample Archive', code: 'ARCH' },
      { name: 'Purchase', code: 'PUR' },
      { name: 'HR', code: 'HR' },
      { name: 'QA', code: 'QA' },
    ];

    const deptMap = {};

    for (const d of analyticalDepts) {
      const dept = await db.Department.create({ ...d, type: 'analytical', isActive: true });
      deptMap[d.code] = dept.id;
    }
    console.log('  Created ' + analyticalDepts.length + ' analytical departments.');

    for (const d of administrativeDepts) {
      const dept = await db.Department.create({ ...d, type: 'administrative', isActive: true });
      deptMap[d.code] = dept.id;
    }
    console.log('  Created ' + administrativeDepts.length + ' administrative departments.');

    // ---------- 3c. Product Types ----------
    console.log('--- Step 3c: Seeding product types ---');
    const productTypes = [
      { name: 'Water Testing', code: 'WATER', category: 'water' },
      { name: 'Food Testing', code: 'FOOD', category: 'food' },
      { name: 'Pharmaceutical', code: 'PHARMA', category: 'pharma' },
      { name: 'Cosmetics Testing', code: 'COSM', category: 'cosmetics' },
      { name: 'Environmental Testing', code: 'ENV', category: 'environmental' },
      { name: 'Herbal Products', code: 'HERB', category: 'herbal' },
      { name: 'Chemical Analysis', code: 'CHEM', category: 'chemical' },
      { name: 'Mechanical Testing', code: 'MECH', category: 'mechanical' },
      { name: 'Radiological Testing', code: 'RAD', category: 'radiological' },
    ];

    for (const pt of productTypes) {
      await db.ProductType.create({ ...pt, isActive: true });
    }
    console.log('  Created ' + productTypes.length + ' product types.');

    // ---------- 3d. Standards ----------
    console.log('--- Step 3d: Seeding standards ---');
    const standards = [
      { name: 'IS 10500:2012 - Drinking Water Specification', code: 'IS10500', type: 'BIS', category: 'Water', description: 'Indian Standard for drinking water specification' },
      { name: 'IS 14543:2016 - Packaged Drinking Water', code: 'IS14543', type: 'BIS', category: 'Water', description: 'Indian Standard for packaged drinking water' },
      { name: 'FSSAI Standards', code: 'FSSAI', type: 'FSSAI', category: 'Food', description: 'Food Safety and Standards Authority of India' },
      { name: 'Indian Pharmacopoeia', code: 'IP', type: 'PHARMACOPOEIA', category: 'Pharma', description: 'Indian Pharmacopoeia standards for pharmaceuticals' },
      { name: 'IS 4011 - Cosmetics Standard', code: 'IS4011', type: 'BIS', category: 'Cosmetics', description: 'Indian Standard for cosmetics safety' },
      { name: 'ISO 17025 - Lab Accreditation', code: 'ISO17025', type: 'ISO', category: 'General', description: 'General requirements for the competence of testing and calibration laboratories' },
    ];

    const stdMap = {};
    for (const s of standards) {
      const std = await db.Standard.create({ ...s, isActive: true });
      stdMap[s.code] = std.id;
    }
    console.log('  Created ' + standards.length + ' standards.');

    // ---------- 3e. Test Masters ----------
    console.log('--- Step 3e: Seeding test masters ---');
    const testMasters = [
      // Water tests
      { name: 'pH Value', code: 'PH', departmentId: deptMap['WATER'], method: 'IS 3025 (Part 11)', unit: '-', minLimit: '6.5', maxLimit: '8.5', specification: '6.5 - 8.5', standardId: stdMap['IS10500'], sampleType: 'water', price: 200, isAccredited: true },
      { name: 'Total Dissolved Solids (TDS)', code: 'TDS', departmentId: deptMap['WATER'], method: 'IS 3025 (Part 16)', unit: 'mg/L', minLimit: '0', maxLimit: '500', specification: 'Max 500 mg/L', standardId: stdMap['IS10500'], sampleType: 'water', price: 250, isAccredited: true },
      { name: 'Total Hardness', code: 'HARD', departmentId: deptMap['WATER'], method: 'IS 3025 (Part 21)', unit: 'mg/L', minLimit: '0', maxLimit: '200', specification: 'Max 200 mg/L', standardId: stdMap['IS10500'], sampleType: 'water', price: 300, isAccredited: true },
      { name: 'Chloride', code: 'CL', departmentId: deptMap['WATER'], method: 'IS 3025 (Part 32)', unit: 'mg/L', minLimit: '0', maxLimit: '250', specification: 'Max 250 mg/L', standardId: stdMap['IS10500'], sampleType: 'water', price: 250, isAccredited: true },
      { name: 'Turbidity', code: 'TURB', departmentId: deptMap['WATER'], method: 'IS 3025 (Part 10)', unit: 'NTU', minLimit: '0', maxLimit: '1', specification: 'Max 1 NTU', standardId: stdMap['IS10500'], sampleType: 'water', price: 200, isAccredited: true },
      { name: 'E. Coli', code: 'ECOLI', departmentId: deptMap['MICRO'], method: 'IS 15185', unit: 'CFU/mL', minLimit: '0', maxLimit: '0', specification: 'Absent in 100 mL', standardId: stdMap['IS10500'], sampleType: 'water', price: 500, isAccredited: true },
      { name: 'Total Coliform', code: 'TCOLI', departmentId: deptMap['MICRO'], method: 'IS 15185', unit: 'MPN/100mL', minLimit: '0', maxLimit: '0', specification: 'Absent in 100 mL', standardId: stdMap['IS10500'], sampleType: 'water', price: 500, isAccredited: true },
      // Food tests
      { name: 'Moisture Content', code: 'MOIST', departmentId: deptMap['FOOD'], method: 'FSSAI Manual Method', unit: '%', minLimit: '0', maxLimit: '14', specification: 'As per product standard', standardId: stdMap['FSSAI'], sampleType: 'food', price: 400, isAccredited: true },
      { name: 'Ash Content', code: 'ASH', departmentId: deptMap['FOOD'], method: 'FSSAI Manual Method', unit: '%', minLimit: '0', maxLimit: '5', specification: 'As per product standard', standardId: stdMap['FSSAI'], sampleType: 'food', price: 400, isAccredited: true },
      { name: 'Protein', code: 'PROT', departmentId: deptMap['FOOD'], method: 'Kjeldahl Method', unit: '%', minLimit: '0', maxLimit: '100', specification: 'As per product standard', standardId: stdMap['FSSAI'], sampleType: 'food', price: 600, isAccredited: true },
      { name: 'Fat', code: 'FAT', departmentId: deptMap['FOOD'], method: 'Soxhlet Extraction', unit: '%', minLimit: '0', maxLimit: '100', specification: 'As per product standard', standardId: stdMap['FSSAI'], sampleType: 'food', price: 500, isAccredited: true },
      // Pharma tests
      { name: 'Assay', code: 'ASSY', departmentId: deptMap['HPLC'], method: 'HPLC Method', unit: '%', minLimit: '98', maxLimit: '102', specification: '98.0 - 102.0%', standardId: stdMap['IP'], sampleType: 'pharma', price: 1500, isAccredited: true },
      { name: 'Dissolution', code: 'DISS', departmentId: deptMap['PHRM'], method: 'USP Apparatus II', unit: '%', minLimit: '80', maxLimit: '100', specification: 'NLT 80% in 30 min', standardId: stdMap['IP'], sampleType: 'pharma', price: 1200, isAccredited: true },
      { name: 'Disintegration', code: 'DINT', departmentId: deptMap['PHRM'], method: 'IP Method', unit: 'minutes', minLimit: '0', maxLimit: '30', specification: 'NMT 30 minutes', standardId: stdMap['IP'], sampleType: 'pharma', price: 800, isAccredited: false },
    ];

    for (const t of testMasters) {
      await db.TestMaster.create({ ...t, isActive: true, tatHours: 48, calculationType: 'direct' });
    }
    console.log('  Created ' + testMasters.length + ' test masters.');

    // ---------- 3f. Clients ----------
    console.log('--- Step 3f: Seeding clients ---');
    const clients = [
      {
        name: 'ABC Pharmaceuticals',
        code: 'CLI00001',
        gstNumber: '27AABCU9603R1ZM',
        address: '123 Pharma Park, MIDC, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400093',
        contactPerson: 'Rajesh Kumar',
        email: 'rajesh@abcpharma.com',
        phone: '9876543210',
        clientType: 'regular',
        creditLimit: 500000,
        creditDays: 30,
        isActive: true,
      },
      {
        name: 'XYZ Water Industries',
        code: 'CLI00002',
        gstNumber: '27AABCU9604R1ZN',
        address: '456 Industrial Area, Bhosari',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411026',
        contactPerson: 'Sunil Patil',
        email: 'sunil@xyzwater.com',
        phone: '9876543211',
        clientType: 'regular',
        creditLimit: 300000,
        creditDays: 30,
        isActive: true,
      },
      {
        name: 'Government Water Board',
        code: 'CLI00003',
        address: 'Civic Centre, Station Road',
        city: 'Nagpur',
        state: 'Maharashtra',
        pincode: '440001',
        contactPerson: 'Dr. Anil Deshmukh',
        email: 'testing@govwaterboard.gov.in',
        phone: '9876543212',
        clientType: 'government',
        creditLimit: 1000000,
        creditDays: 60,
        isActive: true,
      },
    ];

    for (const c of clients) {
      await db.Client.create(c);
    }
    console.log('  Created ' + clients.length + ' clients.');

    // ---------- 3g. Signatories module (Delhi) ----------
    console.log('--- Step 3g: Seeding signatories module (Delhi unit) ---');
    const { seedSignatories } = require('./signatories.seed');
    const sigStats = await seedSignatories(db);

    // ============================================================
    // Done
    // ============================================================
    console.log('\n=== Seeding completed successfully! ===');
    console.log('Summary:');
    console.log('  Users:           ' + (2 + testRoles.length));
    console.log('  Departments:     ' + (analyticalDepts.length + administrativeDepts.length));
    console.log('  Product Types:   ' + productTypes.length);
    console.log('  Standards:       ' + standards.length);
    console.log('  Test Masters:    ' + testMasters.length);
    console.log('  Clients:         ' + clients.length);
    console.log('  Sig Templates:   ' + sigStats.templates);
    console.log('  Sig Disciplines: ' + sigStats.disciplines);
    console.log('  Signatories:     ' + sigStats.signatories);
    console.log('  Authority Rows:  ' + sigStats.authorities);
    console.log('  Substitutions:   ' + sigStats.substitutions);
    console.log('  Absences:        ' + sigStats.absences);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
