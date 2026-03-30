const db = require('../models');

// Department mappings per location from Excel "Department & Group.xlsx"
const locationDepts = {
  'Delhi': [
    'FOOD', 'MOLECULAR BIOLOGY', 'MICROBIOLOGY', 'HERBAL', 'ADMINISTRATION',
    'PHARMA CHEMICAL', 'QUALITY ASSURANCE', 'MARKETING', 'HPLC', 'GC',
    'WATER', 'MASS SPECTROSCOPY', 'ACCOUNTS & HR', 'BOOKING',
    'CUSTOMER COORDINATOR', 'PRINTING', 'ICP-MS', 'MALVERN', 'OUTSOURCE',
    'HPTLC / STABILITY',
  ],
  'Manesar': [
    'BOOKING', 'GC', 'HPLC', 'RADIOLOGICAL', 'PHARMA CHEMICAL',
    'MASS SPECTROSCOPY', 'MALVERN', 'AAS', 'ADMINISTRATION', 'MECHANICAL',
    'MARKETING', 'QUALITY ASSURANCE', 'TECHNICAL', 'DSC', 'ACCOUNTS & HR',
  ],
  'Alcatec': [
    'HPLC', 'MARKETING', 'GC', 'AAS', 'MICROBIOLOGY', 'TECHNICAL',
    'ACCOUNTS & HR', 'PHARMA CHEMICAL', 'ICP-MS', 'BOOKING',
    'QUALITY ASSURANCE', 'ADMINISTRATION', 'ENVIRONMENTAL', 'PURCHASE',
    'HERBAL',
  ],
  'Baddi': [
    'MARKETING', 'ACCOUNTS & HR', 'ADMINISTRATION', 'PHARMA CHEMICAL',
    'ICP-MS', 'QUALITY ASSURANCE', 'MICROBIOLOGY', 'GC', 'HPLC',
    'BOOKING', 'REVIEW', 'OUTSOURCE', 'XRD',
  ],
  'Bangalore': [
    'PRINTING', 'FOOD', 'HPLC', 'PHARMA CHEMICAL', 'MICROBIOLOGY',
    'QUALITY ASSURANCE', 'HERBAL', 'LCMS/GCMS', 'ADMINISTRATION',
    'MARKETING', 'GC', 'ICP-MS', 'ION CHROMATOGRAPHY', 'VALIDATION',
    'CUSTOMER COORDINATOR', 'MASS SPECTROSCOPY', 'ICP-OES',
    'ACCOUNTS & HR', 'SAMPLE ARCHIVE', 'PURCHASE', 'BOOKING', 'OUTSOURCE',
  ],
};

async function seedLocations() {
  try {
    console.log('Seeding locations and department mappings...\n');

    // Sync LocationDepartment table
    await db.LocationDepartment.sync({ force: false, alter: true });

    // Create or find locations
    const locations = {};
    const locationData = [
      { name: 'Delhi', code: 'DEL', city: 'New Delhi', state: 'Delhi', isHQ: true, address: 'E-40, Okhla Industrial Area Phase-II, New Delhi - 110020', phone: '011-41412345', email: 'delhi@aurigalab.com' },
      { name: 'Manesar', code: 'MAN', city: 'Manesar', state: 'Haryana', isHQ: false, address: 'Plot No. 45, IMT Manesar, Gurgaon - 122051', phone: '0124-4567890', email: 'manesar@aurigalab.com' },
      { name: 'Alcatec', code: 'ALC', city: 'Noida', state: 'Uttar Pradesh', isHQ: false, address: 'B-15, Sector 63, Noida - 201301', phone: '0120-3456789', email: 'alcatec@aurigalab.com' },
      { name: 'Baddi', code: 'BDD', city: 'Baddi', state: 'Himachal Pradesh', isHQ: false, address: 'Village Thana, Baddi, Solan - 173205', phone: '01795-234567', email: 'baddi@aurigalab.com' },
      { name: 'Bangalore', code: 'BLR', city: 'Bangalore', state: 'Karnataka', isHQ: false, address: '12, Electronic City Phase-I, Bangalore - 560100', phone: '080-45678901', email: 'bangalore@aurigalab.com' },
    ];

    for (const loc of locationData) {
      const [created] = await db.Location.findOrCreate({
        where: { code: loc.code },
        defaults: loc,
      });
      locations[loc.name] = created;
      console.log(`Location: ${loc.name} (ID: ${created.id}) ${created.isNewRecord === false ? '(existing)' : '(created)'}`);
    }

    // Get all departments
    const departments = await db.Department.findAll();
    const deptNameMap = {};
    for (const d of departments) {
      deptNameMap[d.name.toUpperCase()] = d.id;
    }
    console.log(`\nFound ${departments.length} departments in DB`);

    // Map departments to locations
    let totalMappings = 0;
    for (const [locName, deptNames] of Object.entries(locationDepts)) {
      const location = locations[locName];
      if (!location) { console.log(`WARNING: Location ${locName} not found`); continue; }

      let mapped = 0;
      const notFound = [];
      for (const deptName of deptNames) {
        const deptId = deptNameMap[deptName.toUpperCase()];
        if (!deptId) {
          notFound.push(deptName);
          continue;
        }
        await db.LocationDepartment.findOrCreate({
          where: { locationId: location.id, departmentId: deptId },
          defaults: { isActive: true },
        });
        mapped++;
      }
      totalMappings += mapped;
      console.log(`${locName}: ${mapped} departments mapped`);
      if (notFound.length > 0) {
        console.log(`  ⚠ Not found in DB: ${notFound.join(', ')}`);
      }
    }

    // Tag all existing users to Delhi (HQ)
    const delhiId = locations['Delhi'].id;
    const usersUpdated = await db.User.update(
      { locationId: delhiId },
      { where: { locationId: null } }
    );
    console.log(`\nTagged ${usersUpdated[0]} users to Delhi`);

    // Tag existing samples to Delhi
    const samplesUpdated = await db.Sample.update(
      { locationId: delhiId },
      { where: { locationId: null } }
    );
    console.log(`Tagged ${samplesUpdated[0]} samples to Delhi`);

    // Tag instruments to Delhi
    const instrUpdated = await db.Instrument.update(
      { locationId: delhiId },
      { where: { locationId: null } }
    );
    console.log(`Tagged ${instrUpdated[0]} instruments to Delhi`);

    // Tag inventory to Delhi
    const invUpdated = await db.InventoryItem.update(
      { locationId: delhiId },
      { where: { locationId: null } }
    );
    console.log(`Tagged ${invUpdated[0]} inventory items to Delhi`);

    console.log(`\n=== LOCATION SEEDING COMPLETE ===`);
    console.log(`Locations: ${Object.keys(locations).length}`);
    console.log(`Department mappings: ${totalMappings}`);

    // Print summary table
    console.log('\n--- Department Count per Location ---');
    for (const [locName, loc] of Object.entries(locations)) {
      const count = await db.LocationDepartment.count({ where: { locationId: loc.id } });
      console.log(`  ${locName}: ${count} departments`);
    }

    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exit(1);
  }
}

seedLocations();
