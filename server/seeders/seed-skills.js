const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../models');

const SKILLS = [
  // Chemistry / HPLC
  { name: 'HPLC', category: 'instrument', description: 'High-Performance Liquid Chromatography' },
  { name: 'GC-MS', category: 'instrument', description: 'Gas Chromatography Mass Spectrometry' },
  { name: 'Titration', category: 'technique', description: 'Chemical titration methods' },
  { name: 'Spectroscopy', category: 'technique', description: 'UV/Vis/IR spectroscopy' },
  { name: 'Karl Fischer', category: 'technique', description: 'Water content determination' },
  { name: 'Dissolution', category: 'technique', description: 'Dissolution testing' },
  { name: 'Method Development', category: 'expertise', description: 'Analytical method development' },

  // Microbiology
  { name: 'Sterility Testing', category: 'technique', description: 'Sterility test methods' },
  { name: 'Endotoxin', category: 'technique', description: 'Bacterial endotoxin testing (LAL)' },
  { name: 'Environmental Monitoring', category: 'technique', description: 'EM sampling and analysis' },
  { name: 'Microbial Limits', category: 'technique', description: 'Microbial enumeration and identification' },

  // Instrumentation
  { name: 'ICP-OES', category: 'instrument', description: 'Inductively Coupled Plasma' },
  { name: 'AAS', category: 'instrument', description: 'Atomic Absorption Spectroscopy' },
  { name: 'XRF', category: 'instrument', description: 'X-Ray Fluorescence' },
  { name: 'UV-Vis', category: 'instrument', description: 'UV-Visible Spectrophotometry' },
  { name: 'FTIR', category: 'instrument', description: 'Fourier-Transform Infrared' },

  // QA
  { name: 'Data Review', category: 'qa', description: 'Analytical data review' },
  { name: 'SOP Management', category: 'qa', description: 'Standard Operating Procedure control' },
  { name: 'CAPA', category: 'qa', description: 'Corrective and Preventive Actions' },
  { name: 'Audit', category: 'qa', description: 'Internal and external audits' },
  { name: 'Deviation', category: 'qa', description: 'Deviation handling' },
  { name: 'Regulatory', category: 'qa', description: 'Regulatory compliance (FDA, NABL, etc.)' },

  // Soft skills
  { name: 'Sample Management', category: 'soft-skill', description: 'Sample intake and tracking' },
  { name: 'Client Communication', category: 'soft-skill', description: 'Client coordination' },
  { name: 'Team Leadership', category: 'soft-skill', description: 'Team management and mentoring' },
];

const LEVELS = ['not_trained', 'in_training', 'trained', 'expert'];

async function seed() {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.sync();
    console.log('Connected. Seeding skills...');

    // Upsert skills
    const createdSkills = {};
    for (const s of SKILLS) {
      const [skill] = await db.Skill.findOrCreate({
        where: { name: s.name },
        defaults: s,
      });
      createdSkills[s.name] = skill;
    }
    console.log(`✓ ${Object.keys(createdSkills).length} skills seeded`);

    // Get all active users
    const users = await db.User.findAll({ where: { isActive: true } });
    console.log(`Found ${users.length} active users`);

    // For each user, assign 3-6 random skills with random levels
    let assignments = 0;
    for (const user of users) {
      const numSkills = 3 + Math.floor(Math.random() * 4);
      const skillPool = Object.values(createdSkills);
      const shuffled = skillPool.sort(() => Math.random() - 0.5).slice(0, numSkills);
      for (const skill of shuffled) {
        const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
        await db.EmployeeSkill.findOrCreate({
          where: { userId: user.id, skillId: skill.id },
          defaults: { level },
        });
        assignments++;
      }
    }
    console.log(`✓ ${assignments} employee-skill records seeded`);

    console.log('\nDone.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
