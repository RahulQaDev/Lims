const db = require('../models');

async function seedDemoData() {
  try {
    console.log('Starting demo data seeding...');

    const users = await db.User.findAll({ where: { isActive: true } });
    const departments = await db.Department.findAll();
    const standards = await db.Standard.findAll();

    // Build dept map
    const deptMap = {};
    for (const d of departments) deptMap[d.name.toUpperCase()] = d.id;
    console.log(`Found ${users.length} users, ${departments.length} depts`);

    // --- CLIENTS ---
    const clientList = await db.Client.bulkCreate([
      { name: 'ABC Pharmaceuticals Pvt. Ltd.', code: 'ABC-PHARMA', clientType: 'regular', address: '45, Industrial Area Phase-II, Gurgaon', city: 'Gurgaon', state: 'Haryana', pincode: '122002', gstNumber: '06AABCA1234F1Z5', contactPerson: 'Mr. Rajesh Gupta', email: 'rajesh@abcpharma.com', phone: '9876543210' },
      { name: 'XYZ Water Industries', code: 'XYZ-WATER', clientType: 'regular', address: '12, Sector 18, Noida', city: 'Noida', state: 'UP', pincode: '201301', gstNumber: '09AABCX5678G1Z3', contactPerson: 'Ms. Priya Sharma', email: 'priya@xyzwater.com', phone: '9876543211' },
      { name: 'Government Water Board', code: 'GWB', clientType: 'government', address: 'Jal Bhawan, New Delhi', city: 'New Delhi', state: 'Delhi', pincode: '110001', contactPerson: 'Mr. Anil Kumar', email: 'anil@gwb.gov.in', phone: '9876543212' },
      { name: 'Dhanvantari Ayurvedic Products', code: 'DAP', clientType: 'regular', address: '78, Haridwar Road, Rishikesh', city: 'Rishikesh', state: 'Uttarakhand', pincode: '249201', gstNumber: '05AABCD9876H1Z1', contactPerson: 'Dr. Suresh Joshi', email: 'suresh@dhanvantari.com', phone: '9876543213' },
      { name: 'FreshBite Foods Pvt. Ltd.', code: 'FBF', clientType: 'regular', address: '34, Food Park, Manesar', city: 'Manesar', state: 'Haryana', pincode: '122051', gstNumber: '06AABCF4567I1Z2', contactPerson: 'Mr. Vikram Singh', email: 'vikram@freshbite.com', phone: '9876543214' },
      { name: 'Metro Municipal Corporation', code: 'MMC', clientType: 'government', address: 'Civic Centre, New Delhi', city: 'New Delhi', state: 'Delhi', pincode: '110002', contactPerson: 'Ms. Seema Rao', email: 'seema@mmc.gov.in', phone: '9876543215' },
      { name: 'GreenLeaf Cosmetics', code: 'GLC', clientType: 'regular', address: '90, Beauty Park, Noida', city: 'Noida', state: 'UP', pincode: '201304', gstNumber: '09AABCG7890J1Z4', contactPerson: 'Ms. Nisha Kapoor', email: 'nisha@greenleaf.com', phone: '9876543216' },
      { name: 'SafeWater Solutions', code: 'SWS', clientType: 'regular', address: '56, Industrial Estate, Faridabad', city: 'Faridabad', state: 'Haryana', pincode: '121003', gstNumber: '06AABCS3456K1Z6', contactPerson: 'Mr. Amit Verma', email: 'amit@safewater.com', phone: '9876543217' },
      { name: 'Bharat Chemical Works', code: 'BCW', clientType: 'regular', address: '23, GIDC Estate, Vadodara', city: 'Vadodara', state: 'Gujarat', pincode: '390003', gstNumber: '24AABCB6789L1Z7', contactPerson: 'Mr. Patel Dinesh', email: 'dinesh@bharatchemical.com', phone: '9876543218' },
      { name: 'National Food Safety Lab', code: 'NFSL', clientType: 'government', address: 'FDA Complex, Ghaziabad', city: 'Ghaziabad', state: 'UP', pincode: '201001', contactPerson: 'Dr. Meena Kumari', email: 'meena@nfsl.gov.in', phone: '9876543219' },
    ]);
    console.log(`Created ${clientList.length} clients`);

    // --- TESTS ---
    const W = deptMap['WATER'];
    const MB = deptMap['MICROBIOLOGY'];
    const F = deptMap['FOOD'];
    const H = deptMap['HPLC'];
    const G = deptMap['GC'];
    const IC = deptMap['ICP-MS'] || deptMap['ICPMS'];
    const PC = deptMap['PHARMA CHEMICAL'] || deptMap['CHEMICAL'];
    const LC = deptMap['LCMS/GCMS'] || deptMap['LCMS'];

    console.log('Dept IDs - Water:', W, 'Micro:', MB, 'Food:', F, 'HPLC:', H, 'GC:', G, 'ICPMS:', IC, 'Chemical:', PC, 'LCMS:', LC);

    const testList = await db.TestMaster.bulkCreate([
      { name: 'pH Value', method: 'IS 3025 (Part 11)', departmentId: W, unit: 'pH', minLimit: 6.5, maxLimit: 8.5, tatDays: 1, price: 200 },
      { name: 'TDS', method: 'IS 3025 (Part 16)', departmentId: W, unit: 'mg/L', minLimit: 0, maxLimit: 500, tatDays: 1, price: 250 },
      { name: 'Total Hardness', method: 'IS 3025 (Part 21)', departmentId: W, unit: 'mg/L', minLimit: 0, maxLimit: 200, tatDays: 1, price: 300 },
      { name: 'Chloride', method: 'IS 3025 (Part 32)', departmentId: W, unit: 'mg/L', minLimit: 0, maxLimit: 250, tatDays: 1, price: 250 },
      { name: 'Turbidity', method: 'IS 3025 (Part 10)', departmentId: W, unit: 'NTU', minLimit: 0, maxLimit: 1, tatDays: 1, price: 200 },
      { name: 'Iron', method: 'IS 3025 (Part 53)', departmentId: W, unit: 'mg/L', minLimit: 0, maxLimit: 0.3, tatDays: 2, price: 350 },
      { name: 'Fluoride', method: 'IS 3025 (Part 60)', departmentId: W, unit: 'mg/L', minLimit: 0, maxLimit: 1.0, tatDays: 2, price: 400 },
      { name: 'E.Coli Count', method: 'IS 5887 (Part 1)', departmentId: MB, unit: 'CFU/mL', minLimit: 0, maxLimit: 0, tatDays: 3, price: 500 },
      { name: 'Total Coliform', method: 'IS 5401 (Part 1)', departmentId: MB, unit: 'MPN/100mL', minLimit: 0, maxLimit: 0, tatDays: 3, price: 500 },
      { name: 'Total Plate Count', method: 'IS 5402', departmentId: MB, unit: 'CFU/mL', minLimit: 0, maxLimit: 100, tatDays: 3, price: 450 },
      { name: 'Salmonella', method: 'IS 5887 (Part 3)', departmentId: MB, unit: 'Per 25g', minLimit: 0, maxLimit: 0, tatDays: 5, price: 800 },
      { name: 'Yeast & Mould Count', method: 'IS 5403', departmentId: MB, unit: 'CFU/g', minLimit: 0, maxLimit: 50, tatDays: 5, price: 600 },
      { name: 'Moisture Content', method: 'IS 1479', departmentId: F, unit: '%', minLimit: 0, maxLimit: 14, tatDays: 2, price: 300 },
      { name: 'Ash Content', method: 'IS 1479', departmentId: F, unit: '%', minLimit: 0, maxLimit: 5, tatDays: 2, price: 350 },
      { name: 'Protein Content', method: 'IS 7219', departmentId: F, unit: '%', minLimit: 10, maxLimit: 100, tatDays: 3, price: 500 },
      { name: 'Fat Content', method: 'IS 1479', departmentId: F, unit: '%', minLimit: 0, maxLimit: 30, tatDays: 2, price: 400 },
      { name: 'Crude Fibre', method: 'IS 11062', departmentId: F, unit: '%', minLimit: 0, maxLimit: 10, tatDays: 3, price: 450 },
      { name: 'Acid Value', method: 'IS 548 (Part 1)', departmentId: F, unit: 'mg KOH/g', minLimit: 0, maxLimit: 2, tatDays: 2, price: 350 },
      { name: 'Assay by HPLC', method: 'IP/BP/USP', departmentId: H, unit: '%', minLimit: 98, maxLimit: 102, tatDays: 3, price: 1500 },
      { name: 'Related Substances', method: 'IP/BP/USP', departmentId: H, unit: '%', minLimit: 0, maxLimit: 0.5, tatDays: 3, price: 2000 },
      { name: 'Dissolution by HPLC', method: 'USP', departmentId: H, unit: '%', minLimit: 80, maxLimit: 120, tatDays: 4, price: 2500 },
      { name: 'Content Uniformity', method: 'IP/USP', departmentId: H, unit: '%', minLimit: 85, maxLimit: 115, tatDays: 3, price: 2000 },
      { name: 'Residual Solvents', method: 'USP <467>', departmentId: G, unit: 'ppm', minLimit: 0, maxLimit: 5000, tatDays: 3, price: 2000 },
      { name: 'Organic Volatile Impurities', method: 'USP', departmentId: G, unit: 'ppm', minLimit: 0, maxLimit: 600, tatDays: 3, price: 1800 },
      { name: 'Heavy Metals (Pb,Cd,As,Hg)', method: 'USP <233>', departmentId: IC, unit: 'ppm', minLimit: 0, maxLimit: 10, tatDays: 5, price: 3000 },
      { name: 'Elemental Impurities', method: 'ICH Q3D', departmentId: IC, unit: 'ppm', minLimit: 0, maxLimit: 1, tatDays: 5, price: 3500 },
      { name: 'Loss on Drying', method: 'IP/BP', departmentId: PC, unit: '%', minLimit: 0, maxLimit: 2, tatDays: 1, price: 300 },
      { name: 'Sulphated Ash', method: 'IP/BP', departmentId: PC, unit: '%', minLimit: 0, maxLimit: 0.1, tatDays: 2, price: 400 },
      { name: 'Disintegration Time', method: 'IP', departmentId: PC, unit: 'minutes', minLimit: 0, maxLimit: 30, tatDays: 1, price: 350 },
      { name: 'Friability', method: 'IP', departmentId: PC, unit: '%', minLimit: 0, maxLimit: 1, tatDays: 1, price: 300 },
      { name: 'Hardness Test', method: 'IP', departmentId: PC, unit: 'kg/cm2', minLimit: 4, maxLimit: 10, tatDays: 1, price: 250 },
      { name: 'Pesticide Residues', method: 'AOAC 2007.01', departmentId: LC, unit: 'ppb', minLimit: 0, maxLimit: 10, tatDays: 7, price: 5000 },
      { name: 'Aflatoxin (B1,B2,G1,G2)', method: 'IS 1656', departmentId: LC, unit: 'ppb', minLimit: 0, maxLimit: 15, tatDays: 5, price: 3000 },
    ]);
    console.log(`Created ${testList.length} tests`);

    // --- Build dept user maps ---
    const deptUsers = await db.DepartmentUser.findAll({ include: [{ model: db.User, as: 'user' }, { model: db.Department, as: 'department' }] });
    const deptAnalysts = {};
    for (const du of deptUsers) {
      if (!du.user || !du.user.isActive) continue;
      const did = du.departmentId;
      if (du.role === 'analyst' || du.role === 'member') {
        if (!deptAnalysts[did]) deptAnalysts[did] = [];
        deptAnalysts[did].push(du.user);
      }
    }

    // --- SAMPLES ---
    const descriptions = [
      'Packaged Drinking Water - 1L Bottle', 'Paracetamol Tablets IP 500mg', 'Amoxicillin Capsules IP 250mg',
      'Groundwater Sample - Borewell', 'Wheat Flour (Atta) - 5kg Pack', 'Basmati Rice Premium Grade',
      'Herbal Face Cream - 50g tube', 'Mustard Oil - 1L Tin', 'Metformin Tablets IP 500mg',
      'Municipal Tap Water Sample', 'Honey - Pure Organic 500g', 'Turmeric Powder - 200g Pack',
      'Ibuprofen Tablets IP 400mg', 'Swimming Pool Water', 'Milk - Full Cream Pasteurized',
      'Aspirin Tablets IP 325mg', 'RO Water Plant Output', 'Coconut Oil - Extra Virgin 200ml',
      'Atenolol Tablets IP 50mg', 'Sewage Treatment Plant Effluent', 'Biscuit - Glucose 100g Pack',
      'Omeprazole Capsules IP 20mg', 'Borewell Water - Industrial Area', 'Vitamin C Tablets 500mg',
      'Ghee - Pure Cow 500g', 'Sunscreen Lotion SPF 50', 'Diclofenac Sodium Tablets IP 50mg',
      'Packaged Water - 20L Can', 'Protein Powder - Whey 1kg', 'Cetirizine Tablets IP 10mg',
      'Hand Sanitizer - 500ml', 'Tomato Ketchup - 500g', 'Azithromycin Tablets IP 500mg',
      'River Water Sample - Yamuna', 'Mixed Pickle - 1kg', 'Face Wash Gel - 100ml',
      'Ciprofloxacin Tablets IP 500mg', 'Well Water - Village Sample', 'Bread - Whole Wheat 400g',
      'Shampoo - Anti Dandruff 200ml', 'Ranitidine Tablets IP 150mg', 'Fruit Juice - Mixed 1L',
      'Moisturizing Cream - 100g', 'Doxycycline Capsules IP 100mg', 'Bottled Mineral Water 500ml',
      'Instant Noodles - 70g Pack', 'Toothpaste - Herbal 100g', 'Pantoprazole Tablets IP 40mg',
      'Effluent Water - Pharma Unit', 'Spice Mix - Garam Masala 100g',
    ];
    const priorities = ['NORMAL','NORMAL','NORMAL','NORMAL','URGENT','NORMAL','EXPRESS','NORMAL'];
    const sampleStatuses = ['RECEIVED','BOOKED','IN_TESTING','IN_TESTING','IN_TESTING','UNDER_REVIEW','APPROVED','COMPLETED','COMPLETED'];
    const now = new Date();

    const samplesData = [];
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const received = new Date(now.getTime() - daysAgo * 86400000);
      samplesData.push({
        sampleCode: `AUR-2603-${String(i+1).padStart(4,'0')}`,
        description: descriptions[i],
        clientId: clientList[i % clientList.length].id,
        status: sampleStatuses[i % sampleStatuses.length],
        priority: priorities[i % priorities.length],
        quantity: Math.floor(Math.random()*5)+1,
        unit: ['pcs','mL','g','L','kg'][i%5],
        batchNumber: `BATCH-${1000+i}`,
        condition: 'INTACT',
        receivedDate: received,
        receivedBy: users[i % Math.min(users.length,8)].id,
        dueDate: new Date(received.getTime() + (7+Math.floor(Math.random()*7))*86400000),
        createdAt: received,
        updatedAt: received,
      });
    }
    const createdSamples = await db.Sample.bulkCreate(samplesData);
    console.log(`Created ${createdSamples.length} samples`);

    // --- BOOKINGS + TESTS + RESULTS ---
    let bCount=0, btCount=0, rCount=0;
    for (let i = 0; i < createdSamples.length; i++) {
      const sample = createdSamples[i];
      if (sample.status === 'RECEIVED') continue;

      const numTests = 2 + Math.floor(Math.random()*4);
      const usedIdx = new Set();
      const selTests = [];
      for (let t=0; t<numTests; t++) {
        let idx; do { idx = Math.floor(Math.random()*testList.length); } while (usedIdx.has(idx));
        usedIdx.add(idx);
        if (testList[idx].departmentId) selTests.push(testList[idx]);
      }
      if (selTests.length === 0) continue;

      const total = selTests.reduce((s,t) => s+(t.price||500), 0);
      const booking = await db.Booking.create({
        sampleId: sample.id, clientId: sample.clientId,
        reportNumber: `RPT-2603-${String(i+1).padStart(4,'0')}`,
        testingType: ['REGULATORY','NON_REGULATORY','IN_HOUSE'][i%3],
        standardId: standards.length>0 ? standards[i%standards.length].id : null,
        priority: sample.priority,
        status: ['COMPLETED','APPROVED'].includes(sample.status)?'COMPLETED': sample.status==='BOOKED'?'BOOKED':'IN_PROGRESS',
        totalAmount: total, discount:0, netAmount: total,
        bookedBy: users[i%Math.min(users.length,8)].id,
        createdAt: sample.receivedDate,
      });
      bCount++;

      for (const test of selTests) {
        const btStatus = ['COMPLETED','APPROVED'].includes(sample.status)?'APPROVED':
          sample.status==='UNDER_REVIEW'?'COMPLETED':
          sample.status==='IN_TESTING'?['PENDING','IN_PROGRESS','COMPLETED'][Math.floor(Math.random()*3)]:'PENDING';

        const analysts = deptAnalysts[test.departmentId] || [];
        const analyst = analysts.length>0 ? analysts[Math.floor(Math.random()*analysts.length)] : null;

        const bt = await db.BookingTest.create({
          bookingId: booking.id, testMasterId: test.id, departmentId: test.departmentId,
          assignedTo: analyst?analyst.id:null, status: btStatus, rate: test.price||500,
          createdAt: sample.receivedDate,
        });
        btCount++;

        if (['IN_PROGRESS','COMPLETED','APPROVED'].includes(btStatus)) {
          const range = (test.maxLimit||10) - (test.minLimit||0);
          const val = (test.minLimit||0) + Math.random() * range;
          const pf = val >= (test.minLimit||0) && val <= (test.maxLimit||999999) ? 'PASS' : 'FAIL';

          await db.Result.create({
            bookingTestId: bt.id, sampleId: sample.id, enteredBy: analyst?analyst.id:users[0].id,
            status: btStatus==='APPROVED'?'APPROVED':btStatus==='COMPLETED'?'COMPLETED':'IN_PROGRESS',
            observedValue: String(Math.round(val*100)/100), result: pf,
            remarks: pf==='FAIL'?'Outside specification limits':'',
            createdAt: new Date(sample.receivedDate.getTime()+2*86400000),
          });
          rCount++;
        }
      }
    }
    console.log(`Created ${bCount} bookings, ${btCount} booking tests, ${rCount} results`);

    // --- INVOICES ---
    const completedBookings = await db.Booking.findAll({ where: { status: 'COMPLETED' }, include: [{ model: db.Sample, as: 'sample' }] });
    let invCount = 0;
    for (const b of completedBookings) {
      const cId = b.sample ? b.sample.clientId : null;
      if (!cId) continue;
      const sub = b.netAmount||5000;
      const cgst = sub*0.09, sgst = sub*0.09;
      const grand = Math.round(sub+cgst+sgst);
      const paid = Math.random()>0.4;
      await db.Invoice.create({
        invoiceNumber: `INV-2603-${String(++invCount).padStart(4,'0')}`,
        bookingId: b.id, clientId: cId,
        subtotal: sub, discount:0, taxableAmount: sub,
        cgst, sgst, igst:0, grandTotal: grand,
        status: paid?'PAID':(Math.random()>0.5?'SENT':'GENERATED'),
        paidAmount: paid?grand:0,
        dueDate: new Date(now.getTime()+30*86400000),
        generatedBy: users[0].id,
      });
    }
    console.log(`Created ${invCount} invoices`);

    // --- INSTRUMENTS ---
    const instruments = [
      { name:'HPLC System - Agilent 1260', serialNumber:'HPLC-AG-001', departmentId:H, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+45*86400000) },
      { name:'HPLC System - Waters Alliance', serialNumber:'HPLC-WT-002', departmentId:H, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+10*86400000) },
      { name:'HPLC System - Shimadzu LC-2040', serialNumber:'HPLC-SH-003', departmentId:H, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+35*86400000) },
      { name:'GC System - Agilent 7890B', serialNumber:'GC-AG-001', departmentId:G, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+60*86400000) },
      { name:'GC-MS - Shimadzu QP2020', serialNumber:'GCMS-SH-001', departmentId:G, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+30*86400000) },
      { name:'ICP-MS - Agilent 7800', serialNumber:'ICPMS-AG-001', departmentId:IC, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+90*86400000) },
      { name:'LC-MS/MS - AB Sciex 4500', serialNumber:'LCMS-AB-001', departmentId:LC, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+55*86400000) },
      { name:'UV-Vis Spectrophotometer', serialNumber:'UV-SH-001', departmentId:PC, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+20*86400000) },
      { name:'Dissolution Apparatus', serialNumber:'DISS-EL-001', departmentId:PC, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+75*86400000) },
      { name:'Autoclave - Equitron', serialNumber:'AC-EQ-001', departmentId:MB, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+40*86400000) },
      { name:'Laminar Air Flow', serialNumber:'LAF-TC-001', departmentId:MB, status:'MAINTENANCE', calibrationDueDate:new Date(now.getTime()+5*86400000) },
      { name:'Karl Fischer Titrator', serialNumber:'KF-MT-001', departmentId:PC, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+50*86400000) },
      { name:'pH Meter - Mettler Toledo', serialNumber:'PH-MT-001', departmentId:W, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+15*86400000) },
      { name:'Analytical Balance - Sartorius', serialNumber:'BAL-SR-001', departmentId:PC, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+25*86400000) },
      { name:'Colony Counter - Digital', serialNumber:'CC-DG-001', departmentId:MB, status:'ACTIVE', calibrationDueDate:new Date(now.getTime()+80*86400000) },
    ];
    await db.Instrument.bulkCreate(instruments);
    console.log(`Created ${instruments.length} instruments`);

    // --- INVENTORY ---
    await db.InventoryItem.bulkCreate([
      { name:'Acetonitrile HPLC Grade', category:'SOLVENT', unit:'L', currentStock:25, minStock:10, maxStock:50, price:3500, expiryDate:new Date(now.getTime()+365*86400000), storageCondition:'AMBIENT' },
      { name:'Methanol HPLC Grade', category:'SOLVENT', unit:'L', currentStock:30, minStock:10, maxStock:50, price:1200, expiryDate:new Date(now.getTime()+365*86400000), storageCondition:'AMBIENT' },
      { name:'Hydrochloric Acid AR', category:'CHEMICAL', unit:'L', currentStock:5, minStock:3, maxStock:15, price:800, expiryDate:new Date(now.getTime()+730*86400000), storageCondition:'AMBIENT' },
      { name:'Sodium Hydroxide Pellets', category:'CHEMICAL', unit:'kg', currentStock:2, minStock:1, maxStock:10, price:600, expiryDate:new Date(now.getTime()+730*86400000), storageCondition:'AMBIENT' },
      { name:'Nutrient Agar', category:'MEDIA', unit:'kg', currentStock:3, minStock:2, maxStock:10, price:2500, expiryDate:new Date(now.getTime()+180*86400000), storageCondition:'REFRIGERATED' },
      { name:'Petri Dishes (90mm)', category:'CONSUMABLE', unit:'pcs', currentStock:500, minStock:200, maxStock:2000, price:15, storageCondition:'AMBIENT' },
      { name:'HPLC Column C18 (250x4.6mm)', category:'CONSUMABLE', unit:'pcs', currentStock:8, minStock:3, maxStock:15, price:25000, storageCondition:'AMBIENT' },
      { name:'Syringe Filters 0.45um', category:'CONSUMABLE', unit:'pcs', currentStock:150, minStock:50, maxStock:500, price:35, storageCondition:'AMBIENT' },
      { name:'Buffer pH 4.0', category:'REAGENT', unit:'L', currentStock:4, minStock:2, maxStock:10, price:350, expiryDate:new Date(now.getTime()+90*86400000), storageCondition:'AMBIENT' },
      { name:'Buffer pH 7.0', category:'REAGENT', unit:'L', currentStock:1, minStock:2, maxStock:10, price:350, expiryDate:new Date(now.getTime()+90*86400000), storageCondition:'AMBIENT' },
      { name:'Potassium Dichromate AR', category:'CHEMICAL', unit:'kg', currentStock:0.5, minStock:0.5, maxStock:2, price:1800, expiryDate:new Date(now.getTime()+365*86400000), storageCondition:'AMBIENT' },
      { name:'Silver Nitrate AR', category:'CHEMICAL', unit:'g', currentStock:50, minStock:25, maxStock:200, price:4500, expiryDate:new Date(now.getTime()+365*86400000), storageCondition:'AMBIENT' },
    ]);
    console.log('Created 12 inventory items');

    // --- NOTIFICATIONS ---
    const notifs = [
      { type:'SAMPLE_RECEIVED', title:'New Sample Received', message:'Sample AUR-2603-0045 received from ABC Pharmaceuticals', category:'SAMPLES' },
      { type:'SAMPLE_ASSIGNED', title:'Test Assigned to You', message:'pH Value test for AUR-2603-0012 assigned to you', category:'SAMPLES' },
      { type:'RESULTS_ENTERED', title:'Results Ready for Review', message:'Heavy Metals results for AUR-2603-0033 pending review', category:'RESULTS' },
      { type:'TAT_WARNING', title:'TAT Warning - 4 hours remaining', message:'Sample AUR-2603-0008 at risk of TAT breach', category:'SYSTEM' },
      { type:'COA_READY', title:'CoA Generated', message:'CoA for RPT-2603-0015 ready for dispatch', category:'SYSTEM' },
      { type:'REVIEW_COMPLETE', title:'Results Approved', message:'Assay by HPLC results for AUR-2603-0022 approved', category:'REVIEWS' },
    ];
    for (let i=0; i<30; i++) {
      const n = notifs[i%notifs.length];
      await db.Notification.create({
        userId: users[Math.floor(Math.random()*Math.min(users.length,20))].id,
        type: n.type, title: n.title, message: n.message, category: n.category,
        isRead: Math.random()>0.6,
        createdAt: new Date(now.getTime()-Math.floor(Math.random()*7)*86400000),
      });
    }
    console.log('Created 30 notifications');

    console.log('\n=== DEMO DATA COMPLETE ===');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message || err);
    process.exit(1);
  }
}
seedDemoData();
