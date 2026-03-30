const bcrypt = require('bcryptjs');
const db = require('../models');

const DEFAULT_PASSWORD = 'auriga@123';

// Department IDs from the database
const DEPT = {
  HPLC: 44,
  'HPLC-2': 45,
  GC: 46,
  'LCMS/GCMS': 47,
  'ICP-MS': 48,
  'ICP-OES': 49,
  AAS: 50,
  XRD: 51,
  DSC: 52,
  'ION CHROMATOGRAPHY': 53,
  MALVERN: 54,
  'MASS SPECTROSCOPY': 55,
  MICROBIOLOGY: 56,
  'MOLECULAR BIOLOGY': 57,
  FOOD: 58,
  WATER: 59,
  CHEMICAL: 60,
  'PHARMA CHEMICAL': 61,
  'HPTLC/STABILITY': 62,
  HERBAL: 63,
  COSMETICS: 64,
  ENVIRONMENTAL: 65,
  INSTRUMENTATION: 66,
  MECHANICAL: 67,
  RADIOLOGICAL: 68,
  VALIDATION: 69,
  GENERIC: 70,
  ADMINISTRATION: 71,
  'QUALITY ASSURANCE': 72,
  BOOKING: 73,
  'CUSTOMER COORDINATOR': 74,
  MARKETING: 75,
  'ACCOUNTS & HR': 76,
  IT: 77,
  REVIEW: 78,
  PRINTING: 79,
  INVOICE: 80,
  PURCHASE: 81,
  OUTSOURCE: 82,
  'SAMPLE ARCHIVE': 83,
  TECHNICAL: 84,
};

// Map designation to system role (matches existing seeder pattern)
function mapRole(designation) {
  const d = designation.toLowerCase();
  if (d.includes('managing director') || d.includes('director')) return 'LAB_DIRECTOR';
  if (d.includes('zonal head') || d.includes('sbu head')) return 'LAB_DIRECTOR';
  if (d.includes('person in charge') || d.includes('quality manager')) return 'QUALITY_MANAGER';
  if (d.includes('general manager') || d.includes('asst. general manager')) return 'DEPARTMENT_HEAD';
  if (d.includes('deputy manager') || d.includes('dy. manager')) return 'DEPARTMENT_HEAD';
  if (d.includes('asst. manager') || d.includes('assistant manager')) return 'DEPARTMENT_HEAD';
  if (d.includes('zonal manager')) return 'DEPARTMENT_HEAD';
  if (d.includes('manager') && !d.includes('network')) return 'DEPARTMENT_HEAD';
  if (d.includes('technical manager')) return 'DEPARTMENT_HEAD';
  if (d.includes('sr. executive') || d.includes('executive')) return 'REVIEWER';
  if (d.includes('sr. officer') || d.includes('officer')) return 'ANALYST';
  if (d.includes('jr. officer')) return 'ANALYST';
  if (d.includes('trainee')) return 'ANALYST';
  if (d.includes('assistant') || d.includes('lab assistant')) return 'ANALYST';
  if (d.includes('network administrator')) return 'ADMIN';
  if (d.includes('business dev')) return 'MARKETING';
  return 'ANALYST';
}

// Map designation to department role
function mapDeptRole(designation) {
  const d = designation.toLowerCase();
  if (d.includes('managing director') || d.includes('director')) return 'head';
  if (d.includes('zonal head') || d.includes('sbu head')) return 'head';
  if (d.includes('person in charge') || d.includes('quality manager')) return 'head';
  if (d.includes('general manager')) return 'head';
  if (d.includes('manager') && !d.includes('asst') && !d.includes('dy') && !d.includes('deputy') && !d.includes('network')) return 'head';
  if (d.includes('asst. manager') || d.includes('assistant manager')) return 'head';
  if (d.includes('deputy manager') || d.includes('dy. manager')) return 'reviewer';
  if (d.includes('zonal manager') || d.includes('technical manager')) return 'head';
  if (d.includes('sr. executive') || d.includes('executive')) return 'reviewer';
  if (d.includes('sr. officer')) return 'reviewer';
  if (d.includes('officer') && !d.includes('jr.')) return 'analyst';
  if (d.includes('jr. officer')) return 'analyst';
  if (d.includes('trainee')) return 'analyst';
  if (d.includes('assistant') || d.includes('lab assistant')) return 'member';
  if (d.includes('network administrator')) return 'head';
  if (d.includes('business dev')) return 'analyst';
  return 'analyst';
}

// Special role overrides for operations/admin/accounts/IT/marketing staff
function getSpecialRole(designation, dept) {
  const d = designation.toLowerCase();
  if (d.includes('network administrator') || d.includes('it')) return 'ADMIN';
  if (d.includes('business dev') || dept === 'MARKETING') return 'MARKETING';
  if (d.includes('finance') || d.includes('accounts') || d.includes('hr')) return 'ACCOUNTS';
  if (dept === 'BOOKING' || dept === 'CUSTOMER COORDINATOR' || dept === 'OPERATIONS' || dept === 'CUSTOMER SUPPORT') {
    if (d.includes('manager')) return 'DEPARTMENT_HEAD';
    return 'RECEPTIONIST';
  }
  return null;
}

function generateUsername(name, locationCode, existingUsernames) {
  // Remove prefix (Mr., Ms., Mrs., Dr.)
  let clean = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, '').trim();
  // Split into parts
  const parts = clean.split(/\s+/);
  let username;
  if (parts.length === 1) {
    username = parts[0].toLowerCase();
  } else {
    username = (parts[0] + '.' + parts[parts.length - 1]).toLowerCase();
  }
  // Remove special characters
  username = username.replace(/[^a-z0-9.]/g, '');

  // Try without location code first
  let finalUsername = username;
  if (existingUsernames.has(finalUsername)) {
    // Try with location code
    finalUsername = username + '.' + locationCode.toLowerCase();
  }
  let counter = 2;
  while (existingUsernames.has(finalUsername)) {
    finalUsername = username + '.' + locationCode.toLowerCase() + counter;
    counter++;
  }
  existingUsernames.add(finalUsername);
  return finalUsername;
}

// ========================================================================
// MANESAR (locationId: 3) - 31 employees
// ========================================================================
const MANESAR_EMPLOYEES = [
  { name: 'Dr. Saurabh Arora', designation: 'Managing Director', dept: 'ADMINISTRATION', qualification: 'Ph.D. Pharmaceutics', experience: 18.4 },
  { name: 'Dr. Awdhesh Sarayoo Nishad', designation: 'Asst. General Manager', dept: 'ADMINISTRATION', qualification: 'Ph.D. Chemistry', experience: 22.4 },
  { name: 'Mr. Puspendar Kumar Maithil', designation: 'Dy. Manager Technical', dept: 'TECHNICAL', qualification: 'M.Sc Biotechnology', experience: 11.6 },
  { name: 'Mr. Mahipal Singh', designation: 'Dy. Manager Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Pharmaceutical Chemistry', experience: 14.4 },
  { name: 'Mr. Krishna Kant Singh', designation: 'Asst. Manager QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Tech Biotech', experience: 10.7 },
  { name: 'Mrs. Anju Rautela', designation: 'Jr. Officer QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Pharma', experience: 5.5 },
  { name: 'Mrs. Sushree Sangita Rana', designation: 'Sr. Officer Technical', dept: 'TECHNICAL', qualification: 'M.Sc Biotechnology', experience: 9.1 },
  { name: 'Mr. Pawan Kumar', designation: 'Sr. Officer Technical', dept: 'HPLC', qualification: 'M.Sc Analytical Chemistry', experience: 7.11 },
  { name: 'Mr. Amit Kumar', designation: 'Jr. Officer Technical', dept: 'TECHNICAL', qualification: 'B.Sc PCM', experience: 3.1 },
  { name: 'Ms. Sapna Kumari', designation: 'Jr. Officer Technical', dept: 'TECHNICAL', qualification: 'M.Sc Biotechnology', experience: 3.3 },
  { name: 'Mrs. Anshu Gupta', designation: 'Sr. Officer Technical', dept: 'TECHNICAL', qualification: 'B.Pharma', experience: 7.11 },
  { name: 'Mr. Lav Kumar', designation: 'Jr. Officer Technical', dept: 'TECHNICAL', qualification: 'B.Sc Chemistry', experience: 4.6 },
  { name: 'Mr. Ashvani', designation: 'Jr. Officer Technical', dept: 'TECHNICAL', qualification: 'B.Sc Organic Chemistry', experience: 3.8 },
  { name: 'Mr. Harsh Chaudhary', designation: 'Jr. Officer QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Pharma', experience: 3.5 },
  { name: 'Mr. Reyaz Faisal', designation: 'Sr. Executive Technical', dept: 'TECHNICAL', qualification: 'B.Sc Biotech', experience: 15.9 },
  { name: 'Mr. Abhishek Singh', designation: 'Jr. Officer Technical', dept: 'TECHNICAL', qualification: 'B.Sc Chemistry', experience: 4.11 },
  { name: 'Mr. Lalit Kumar', designation: 'Jr. Officer Technical', dept: 'TECHNICAL', qualification: 'M.Sc Organic Chemistry', experience: 5.11 },
  { name: 'Mr. Ambesh Rai', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'B.Pharma', experience: 1.3 },
  { name: 'Ms. Prachi Maurya', designation: 'Jr. Officer Technical', dept: 'TECHNICAL', qualification: 'M.Sc Chemistry', experience: 3.9 },
  { name: 'Mr. Rajat Jangid', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Pharma', experience: 4.7 },
  { name: 'Ms. Nancy Chaurasiya', designation: 'Jr. Officer Technical', dept: 'TECHNICAL', qualification: 'M.Sc Chemistry', experience: 2.2 },
  { name: 'Mr. Subhash Chand', designation: 'Jr. Officer Technical', dept: 'TECHNICAL', qualification: 'M.Sc Chemistry', experience: 5.5 },
  { name: 'Mr. Suresh Kumar', designation: 'Manager Operations', dept: 'BOOKING', qualification: 'B.A', experience: 15.7 },
  { name: 'Mr. Parmesh Kumar', designation: 'Network Administrator', dept: 'IT', qualification: 'M.Sc', experience: 14.11 },
  { name: 'Mr. Bhola Nath Bhandari', designation: 'Executive IT', dept: 'IT', qualification: 'Diploma CS', experience: 5.6 },
  { name: 'Mr. Pavneet', designation: 'Jr. Officer Operations', dept: 'BOOKING', qualification: 'ITI', experience: 4.9 },
  { name: 'Mr. Pawan Verma', designation: 'Jr. Officer Operations', dept: 'BOOKING', qualification: 'B.A', experience: 3.7 },
  { name: 'Mr. Dheerendra Nahar', designation: 'Officer Operations', dept: 'BOOKING', qualification: 'B.Com', experience: 1.5 },
  { name: 'Mr. Chandan', designation: 'Assistant Operations', dept: 'BOOKING', qualification: 'Diploma ECE', experience: 4.44 },
  { name: 'Mr. Anil Kumar', designation: 'Lab Assistant', dept: 'TECHNICAL', qualification: 'High School', experience: 19.6 },
  { name: 'Mr. Aman', designation: 'Lab Assistant', dept: 'TECHNICAL', qualification: 'Intermediate', experience: 0.2 },
];

// ========================================================================
// ALCATEC (locationId: 2) - 25 employees
// ========================================================================
const ALCATEC_EMPLOYEES = [
  // QA Division
  { name: 'Dr. Sanju Kumari', designation: 'Manager QA', dept: 'QUALITY ASSURANCE', qualification: 'Ph.D. Chemistry', experience: 15.5 },
  { name: 'Ms. Neha Bhardwaj', designation: 'Executive QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Microbial Biotechnology', experience: 6.5 },
  { name: 'Mr. Sumit', designation: 'Officer QA', dept: 'QUALITY ASSURANCE', qualification: 'B.A. Pursuing', experience: 6.0 },
  // Person In Charge
  { name: 'Mr. S.C. Awasthi', designation: 'Person In Charge', dept: 'ADMINISTRATION', qualification: 'B.Sc ZBC', experience: 29.0 },
  // HPLC Division
  { name: 'Mr. Kaluwa Singh', designation: 'Asst. Manager Technical', dept: 'HPLC', qualification: 'B.Sc PCM', experience: 14.0 },
  { name: 'Dr. Hafizur Rahman', designation: 'Executive Technical', dept: 'HPLC', qualification: 'PhD M.Sc Chemistry', experience: 9.0 },
  { name: 'Mr. Yogesh', designation: 'Sr. Officer Technical', dept: 'HPLC', qualification: 'B.Sc PCM', experience: 6.6 },
  { name: 'Mr. Mohd Rauf', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'BSc PCM', experience: 6.0 },
  { name: 'Mr. Mukesh Kumar', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'B.Sc PCM', experience: 3.0 },
  { name: 'Mr. Kamal Kumar', designation: 'Officer Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 5.5 },
  { name: 'Mr. Amandeep', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'B.Pharma', experience: 1.0 },
  // GC
  { name: 'Ms. Anjali Kumari', designation: 'Executive Technical', dept: 'GC', qualification: 'M.Sc Chemistry', experience: 9.0 },
  // Pharma Chemical
  { name: 'Mr. Sachin Kumar', designation: 'Executive Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 6.0 },
  { name: 'Ms. Reena', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Biotech', experience: 1.5 },
  { name: 'Mr. Sandesh Kumar', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Organic Chemistry', experience: 1.0 },
  { name: 'Mr. Satyam Singh', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 1.0 },
  // Environment
  { name: 'Mr. Jitendra Mohan', designation: 'Sr. Officer Technical', dept: 'ENVIRONMENTAL', qualification: 'B.Sc ZBC', experience: 13.5 },
  { name: 'Mr. Deepak Kumar', designation: 'Jr. Officer Technical', dept: 'ENVIRONMENTAL', qualification: 'B.Sc Biology', experience: 6.5 },
  // ICP/AAS
  { name: 'Ms. Neha Saini', designation: 'Officer Technical', dept: 'ICP-MS', qualification: 'M.Sc Environment Science', experience: 4.0 },
  // Ayush/Herbal
  { name: 'Ms. Shalu Sharma', designation: 'Officer Technical', dept: 'HERBAL', qualification: 'B.Sc Zoology', experience: 6.5 },
  // Microbiology
  { name: 'Mr. Ashwani Kumar', designation: 'Executive Technical Biological', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 6.2 },
  { name: 'Mr. Arvind Kumar', designation: 'Officer Technical Biological', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 5.4 },
  { name: 'Ms. Megha Sengar', designation: 'Jr. Officer Technical Biological', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 4.0 },
  { name: 'Ms. Shrishty Pandey', designation: 'Trainee Technical Biological', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 0.75 },
  { name: 'Mr. Tarun Kumar', designation: 'Officer Technical Biological', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 5.0 },
];

// ========================================================================
// BANGALORE (locationId: 4) - 172 employees
// ========================================================================
const BANGALORE_EMPLOYEES = [
  // ADMINISTRATION (2)
  { name: 'Pasupuleti Venkata Vidya Sagar', designation: 'Zonal Head', dept: 'ADMINISTRATION', qualification: 'M.Sc Analytical Chemistry', experience: 22 },
  { name: 'Kishor Kumar K.R', designation: 'SBU Head', dept: 'ADMINISTRATION', qualification: 'M.Sc Chemistry', experience: 32 },
  // MICROBIOLOGY (15)
  { name: 'Anitha G', designation: 'Manager Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Applied Microbiology', experience: 17 },
  { name: 'Kiran H R', designation: 'Asst. Manager Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 14 },
  { name: 'Naveen L Kogale', designation: 'Officer Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 6 },
  { name: 'Shravani S', designation: 'Officer Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 3 },
  { name: 'Navyashree E', designation: 'Jr. Officer Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 1 },
  { name: 'Manjunathan C', designation: 'Jr. Officer Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 1 },
  { name: 'Aishwarya S', designation: 'Jr. Officer Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 2 },
  { name: 'Chaithra', designation: 'Trainee Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 0 },
  { name: 'Hency Nishel Pinto', designation: 'Trainee Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 0 },
  { name: 'Chaithra D', designation: 'Trainee Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 0 },
  { name: 'Preethi G N', designation: 'Trainee Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Biotechnology', experience: 0 },
  { name: 'Varun H S', designation: 'Trainee Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 0 },
  { name: 'Sharath S Narayan', designation: 'Trainee Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 0 },
  { name: 'Sagar B', designation: 'Trainee Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 0 },
  { name: 'Monica C', designation: 'Trainee Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 0 },
  // ICP-OES/ICP-MS (6)
  { name: 'Pappuri Sunil Kumar', designation: 'Asst. Manager Technical', dept: 'ICP-OES', qualification: 'M.Pharma', experience: 13 },
  { name: 'Manoj N', designation: 'Jr. Officer Technical', dept: 'ICP-OES', qualification: 'B.Sc PCM', experience: 3 },
  { name: 'Madhu M', designation: 'Jr. Officer Technical', dept: 'ICP-OES', qualification: 'B.Sc PCM', experience: 2 },
  { name: 'T Hariharan', designation: 'Officer Technical', dept: 'ICP-MS', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Sathishkumar S', designation: 'Trainee Technical', dept: 'ICP-MS', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Naveen Kumar T G', designation: 'Trainee Technical', dept: 'ICP-MS', qualification: 'M.Sc Chemistry', experience: 0 },
  // VALIDATION (3)
  { name: 'Prashanth S V', designation: 'Sr. Executive Technical', dept: 'VALIDATION', qualification: 'M.Sc Biochemistry', experience: 7 },
  { name: 'Mahesha T D', designation: 'Sr. Executive Technical', dept: 'VALIDATION', qualification: 'M.Sc Chemistry', experience: 6 },
  { name: 'Santosh G', designation: 'Trainee Technical', dept: 'VALIDATION', qualification: 'M.Sc Chemistry', experience: 0 },
  // HPLC (18)
  { name: 'Sunil Kumar K.V', designation: 'Technical Manager', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 17 },
  { name: 'Mahesh K R', designation: 'Asst. Manager Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 12 },
  { name: 'Hanumanthappa K.S', designation: 'Sr. Executive Technical', dept: 'HPLC', qualification: 'M.Sc Zoology', experience: 18 },
  { name: 'Sudharshan L', designation: 'Sr. Executive Technical', dept: 'HPLC', qualification: 'M.Sc Industrial Chemistry', experience: 14 },
  { name: 'Rajesh Kumar Maurya', designation: 'Sr. Executive Technical', dept: 'HPLC', qualification: 'B.Pharma', experience: 6 },
  { name: 'Megha T H', designation: 'Executive Technical', dept: 'HPLC', qualification: 'M.Sc Inorganic Chemistry', experience: 6 },
  { name: 'Nirmala J', designation: 'Executive Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 8 },
  { name: 'Mohith G', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'B.Com', experience: 3 },
  { name: 'Manoj', designation: 'Executive Technical', dept: 'HPLC', qualification: 'B.Sc', experience: 4 },
  { name: 'Krithi K S', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'M.Sc Analytical Chemistry', experience: 3 },
  { name: 'Pavan Kumar N S', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 3 },
  { name: 'Raghu B G', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'B.Sc Paramedical', experience: 3 },
  { name: 'Megha T S', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 3 },
  { name: 'Gangadhar', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 2 },
  { name: 'Gokulakrishnan E', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'B.Tech Pharma', experience: 2 },
  { name: 'Manu V R', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 1 },
  { name: 'Sathishkumar V', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 0 },
  // GC (5) - note: only 4 additional, last one listed separately
  { name: 'Siva Krishna M', designation: 'Deputy Manager Technical', dept: 'GC', qualification: 'M.Sc Biotechnology', experience: 15 },
  { name: 'M. Gopi', designation: 'Asst. Manager Technical', dept: 'GC', qualification: 'M.Sc Applied Microbiology', experience: 10 },
  { name: 'K R Sharma', designation: 'Sr. Officer Technical', dept: 'GC', qualification: 'M.Sc Organic Chemistry', experience: 10 },
  { name: 'Rahul Shridhar Gunjal', designation: 'Jr. Officer Technical', dept: 'GC', qualification: 'M.Sc Analytical Chemistry', experience: 4 },
  { name: 'Madhusudana Reddy KN', designation: 'Jr. Officer Technical', dept: 'GC', qualification: 'M.Sc', experience: 2 },
  // HERBAL (18)
  { name: 'Suresh Babu L', designation: 'Deputy Manager Technical', dept: 'HERBAL', qualification: 'M.Sc Biochemistry', experience: 18 },
  { name: 'Veersh C Kuppast', designation: 'Jr. Officer Technical', dept: 'HERBAL', qualification: 'BAMS', experience: 18 },
  { name: 'Surakshitha S', designation: 'Officer Technical', dept: 'HERBAL', qualification: 'M.Sc Industrial Chemistry', experience: 5 },
  { name: 'L Thirumalai', designation: 'Jr. Officer Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 3 },
  { name: 'Vasantha Lakshmi R', designation: 'Jr. Officer Technical', dept: 'HERBAL', qualification: 'M.Sc Organic Chemistry', experience: 3 },
  { name: 'Ramyashree T', designation: 'Jr. Officer Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 1 },
  { name: 'Ranjitha D R', designation: 'Jr. Officer Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 1 },
  { name: 'P Nishmita Swamy', designation: 'Jr. Officer Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 1 },
  { name: 'Naveen Prasad S', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'M.Sc Industrial Chemistry', experience: 0 },
  { name: 'Sivakumar S', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'M.Sc Industrial Chemistry', experience: 0 },
  { name: 'Veerasamy V', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Shiddalingesh B Angadi', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Shashank M P', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Pramoda V', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Shivakumara H K', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'M.Sc Industrial Chemistry', experience: 0 },
  { name: 'Sachin R M', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Durugesh', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Cheluva Anil Kumar', designation: 'Trainee Technical', dept: 'HERBAL', qualification: 'B.Pharma', experience: 0 },
  // FOOD & WATER (6)
  { name: 'Pravin Shashikant Gavhane', designation: 'Jr. Officer Technical', dept: 'FOOD', qualification: 'M.Sc Analytical Chemistry', experience: 4 },
  { name: 'Prajwal N K', designation: 'Jr. Officer Technical', dept: 'FOOD', qualification: 'B.Voc', experience: 2 },
  { name: 'Pavithra Vetriselvan', designation: 'Jr. Officer Technical', dept: 'FOOD', qualification: 'B.Tech Food Technology', experience: 2 },
  { name: 'Samarth Niranjan Paingankar', designation: 'Jr. Officer Technical', dept: 'FOOD', qualification: 'M.Voc Food Technology', experience: 1 },
  { name: 'Karthik N S', designation: 'Trainee Technical', dept: 'FOOD', qualification: 'M.Sc Food Technology', experience: 0 },
  { name: 'Madhuri C', designation: 'Trainee Technical', dept: 'FOOD', qualification: 'M.Sc Chemistry', experience: 0 },
  // LCMS/GCMS (11)
  { name: 'Mithun Arvind Chougule', designation: 'Deputy Manager Technical', dept: 'LCMS/GCMS', qualification: 'M.Sc Agrochemicals', experience: 17 },
  { name: 'Harish Kumar V', designation: 'Deputy Manager Technical', dept: 'LCMS/GCMS', qualification: 'B.Sc Chemistry', experience: 13 },
  { name: 'Soumya Asangi', designation: 'Jr. Officer Technical', dept: 'LCMS/GCMS', qualification: 'M.Sc Chemistry', experience: 2 },
  { name: 'Shubha N', designation: 'Officer Technical', dept: 'LCMS/GCMS', qualification: 'M.Sc Biochemistry', experience: 3 },
  { name: 'Elsa Jossy J', designation: 'Jr. Officer Technical', dept: 'LCMS/GCMS', qualification: 'M.Sc Food Science', experience: 3 },
  { name: 'Pragathi Pawar', designation: 'Jr. Officer Technical', dept: 'LCMS/GCMS', qualification: 'M.Sc Chemistry', experience: 3 },
  { name: 'Elayaraja E', designation: 'Officer Technical', dept: 'LCMS/GCMS', qualification: 'B.Pharma', experience: 3 },
  { name: 'Sahithya T', designation: 'Jr. Officer Technical', dept: 'LCMS/GCMS', qualification: 'M.Sc', experience: 2 },
  { name: 'Shobha U Kadaramandalagi', designation: 'Jr. Officer Technical', dept: 'LCMS/GCMS', qualification: 'M.Sc Organic Chemistry', experience: 2 },
  { name: 'Amith Kumar K R', designation: 'Jr. Officer Technical', dept: 'LCMS/GCMS', qualification: 'M.Sc Organic Chemistry', experience: 1 },
  { name: 'Likith Kumar M U', designation: 'Trainee Technical', dept: 'LCMS/GCMS', qualification: 'M.Sc Industrial Chemistry', experience: 0 },
  // PHARMA CHEMICAL (28)
  { name: 'Manoj Kumar', designation: 'Deputy Manager Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 15 },
  { name: 'Greeshma S.E', designation: 'Sr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Pharmacy', experience: 7 },
  { name: 'Harish H S', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 4 },
  { name: 'Pavan B', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 3 },
  { name: 'Samprith', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Organic Chemistry', experience: 2 },
  { name: 'Sunil Kumar N S', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Organic Chemistry', experience: 1 },
  { name: 'Shashank Sharma M', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Pharma', experience: 1 },
  { name: 'Raju B Margankop', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 1 },
  { name: 'Omkar Shivanand Vasedar', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 1 },
  { name: 'Karthik S', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Biochemistry', experience: 0 },
  { name: 'Abhilash', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Industrial Chemistry', experience: 0 },
  { name: 'Manoj H', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Organic Chemistry', experience: 0 },
  { name: 'Chandrasekhar Gari Laluprasad', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Biochemistry', experience: 0 },
  { name: 'Ajay B S', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Organic Chemistry', experience: 0 },
  { name: 'Chethan D M', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Hemanth Kumar V', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Organic Chemistry', experience: 0 },
  { name: 'Vishwanath Shetty', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Gururaja Yalavatti', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Shreepad', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Chaithra M', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Chethan D N', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Organic Chemistry', experience: 0 },
  { name: 'Abhinav A P', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'H R Abhisheka', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Industrial Chemistry', experience: 0 },
  { name: 'Pavan H R', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Chandan Kumar Ayli', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Industrial Chemistry', experience: 0 },
  { name: 'Sarojit Mandal', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Venu Gopala K S', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  { name: 'Nagaraja', designation: 'Trainee Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 0 },
  // QA (16)
  { name: 'BalaKumar Thope Sekaran', designation: 'Deputy Manager QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Microbiology', experience: 14 },
  { name: 'Radhika N.T', designation: 'Asst. Manager QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Chemistry', experience: 15 },
  { name: 'Gayathri K', designation: 'Sr. Executive QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Chemistry', experience: 11 },
  { name: 'Ravi Kumar K', designation: 'Sr. Executive QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Chemistry', experience: 13 },
  { name: 'Nagaraj Koteppa Kumbar', designation: 'Sr. Executive QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Biochemistry', experience: 8 },
  { name: 'Arun Kumar K P', designation: 'Executive QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Microbiology', experience: 4 },
  { name: 'Swathi S', designation: 'Sr. Officer QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Sc', experience: 7 },
  { name: 'Nataraju D', designation: 'Officer Technical', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Chemistry', experience: 6 },
  { name: 'Dhanush M R', designation: 'Jr. Officer QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Sc CS', experience: 3 },
  { name: 'Manjunath R', designation: 'Jr. Officer QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Chemistry', experience: 4 },
  { name: 'Naveen Kumar Naika C', designation: 'Jr. Officer QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Sc CBZ', experience: 3 },
  { name: 'Snega G S', designation: 'Officer QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Tech Biotechnology', experience: 2 },
  { name: 'Bhuvan Kumar S J', designation: 'Trainee QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Sc', experience: 0 },
  { name: 'Narendragowda N', designation: 'Trainee QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Sc', experience: 0 },
  { name: 'Prashanth K S', designation: 'Trainee QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Sc', experience: 0 },
  { name: 'Shrikantha N', designation: 'Trainee QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Chemistry', experience: 0 },
  // LAB ASSISTANTS (3)
  { name: 'Jeevan Kumar G.H', designation: 'Assistant Technical', dept: 'ADMINISTRATION', qualification: 'B.Com', experience: 8 },
  { name: 'Raghu N C', designation: 'Jr. Assistant Technical', dept: 'ADMINISTRATION', qualification: 'SSLC', experience: 16 },
  { name: 'Vijay B R', designation: 'Trainee Technical', dept: 'ADMINISTRATION', qualification: 'BA', experience: 0 },
  // OPERATIONS (15)
  { name: 'Chandrashekar B', designation: 'Sr. Assistant QA', dept: 'BOOKING', qualification: 'ITI', experience: 9 },
  { name: 'Maneesh Krishnan', designation: 'Jr. Assistant QA', dept: 'BOOKING', qualification: 'PUC', experience: 5 },
  { name: 'Sudeep R', designation: 'Trainee Operations', dept: 'BOOKING', qualification: 'B.Sc', experience: 1 },
  { name: 'Sandeep D K', designation: 'Trainee Operations', dept: 'BOOKING', qualification: 'B.Com', experience: 0 },
  { name: 'Karthik R', designation: 'Sr. Assistant QA', dept: 'BOOKING', qualification: 'ITI Fitter', experience: 8 },
  { name: 'Karthik A.R', designation: 'Officer Operations', dept: 'BOOKING', qualification: 'B.Sc PCM', experience: 8 },
  { name: 'Raghavendra Rama Naik', designation: 'Jr. Officer QA', dept: 'BOOKING', qualification: 'B.Sc PCM', experience: 4 },
  { name: 'Devakoti Shivalingam', designation: 'Officer Operations', dept: 'BOOKING', qualification: 'B.Com', experience: 16 },
  { name: 'Sunil S', designation: 'Sr. Assistant Operations', dept: 'BOOKING', qualification: 'SSLC', experience: 11 },
  { name: 'Aaron', designation: 'Assistant Operations', dept: 'BOOKING', qualification: 'SSLC', experience: 15 },
  { name: 'Naveen S R', designation: 'Assistant Operations', dept: 'BOOKING', qualification: 'ITI', experience: 12 },
  { name: 'Amith Kumar B', designation: 'Assistant Operations', dept: 'BOOKING', qualification: 'PUC', experience: 23 },
  { name: 'J Arul Kumar', designation: 'Jr. Assistant Operations', dept: 'BOOKING', qualification: 'Diploma', experience: 10 },
  { name: 'Pavan Kumar D', designation: 'Jr. Assistant Operations', dept: 'BOOKING', qualification: 'B.Sc PCM', experience: 1 },
  { name: 'Prashantha R', designation: 'Jr. Assistant Operations', dept: 'BOOKING', qualification: 'B.Com', experience: 0 },
  // CUSTOMER SUPPORT (10)
  { name: 'Raja Kumara S', designation: 'Asst. Manager Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'Diploma', experience: 11 },
  { name: 'Ramya D B', designation: 'Officer Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'PUC', experience: 8 },
  { name: 'Varsha M Naika', designation: 'Jr. Officer Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'M.Com', experience: 4 },
  { name: 'Ravikiran', designation: 'Trainee Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'B.Com', experience: 2 },
  { name: 'Akash S D', designation: 'Trainee Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'B.Sc', experience: 1 },
  { name: 'U Sindhu', designation: 'Trainee Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'B.Sc', experience: 1 },
  { name: 'Kirana K J', designation: 'Trainee Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'BBA', experience: 1 },
  { name: 'Vinod Raj J', designation: 'Trainee Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'B.Sc', experience: 1 },
  { name: 'Sujan Naika M', designation: 'Trainee Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'B.Sc', experience: 1 },
  { name: 'Pavithra R', designation: 'Trainee Operations', dept: 'CUSTOMER COORDINATOR', qualification: 'B.Sc', experience: 0 },
  // MARKETING (10)
  { name: 'Megharaj D', designation: 'Zonal Manager', dept: 'MARKETING', qualification: 'B.Com', experience: 10 },
  { name: 'Pradeep G.S', designation: 'Business Dev Executive', dept: 'MARKETING', qualification: 'M.A', experience: 16 },
  { name: 'Sharath M', designation: 'Business Dev Executive', dept: 'MARKETING', qualification: 'BBA', experience: 4 },
  { name: 'PushpaKumar M', designation: 'Business Dev Executive', dept: 'MARKETING', qualification: 'M.Sc Biotechnology', experience: 4 },
  { name: 'Dilid Davis Tharakan', designation: 'Business Dev Executive', dept: 'MARKETING', qualification: 'MMS Marketing', experience: 6 },
  { name: 'Marra Pavan Kumar', designation: 'Business Dev Executive', dept: 'MARKETING', qualification: 'MBA', experience: 4 },
  { name: 'Prateek Koujalagi', designation: 'Business Dev Executive', dept: 'MARKETING', qualification: 'B.Sc', experience: 4 },
  { name: 'Mohan Kumar P', designation: 'Business Dev Officer', dept: 'MARKETING', qualification: 'MBA', experience: 1 },
  { name: 'Darshan N S', designation: 'Business Dev Officer', dept: 'MARKETING', qualification: 'B.Com', experience: 1 },
  { name: 'Metri Anand', designation: 'Business Dev Officer', dept: 'MARKETING', qualification: 'BBA', experience: 0 },
  // FEASIBILITY (1)
  { name: 'Sudharani S', designation: 'Executive Operations', dept: 'BOOKING', qualification: 'M.Sc Analytical Chemistry', experience: 10 },
  // IT (2)
  { name: 'Chethan B.N', designation: 'Executive IT', dept: 'IT', qualification: 'Diploma', experience: 12 },
  { name: 'Bharathkumar', designation: 'Officer IT', dept: 'IT', qualification: 'B.E EandC', experience: 3 },
  // FINANCE & ACCOUNTS (3)
  { name: 'Girish Kumar V', designation: 'Deputy Manager Finance', dept: 'ACCOUNTS & HR', qualification: 'M.Com', experience: 14 },
  { name: 'Suresh S.R', designation: 'Executive Finance', dept: 'ACCOUNTS & HR', qualification: 'B.Com', experience: 8 },
  { name: 'Vishnu T M', designation: 'Executive Finance', dept: 'ACCOUNTS & HR', qualification: 'M.Com', experience: 2 },
  // HR (1)
  { name: 'Manjunath K', designation: 'Sr. Executive HR', dept: 'ACCOUNTS & HR', qualification: 'MBA HR', experience: 8 },
];

// ========================================================================
// BADDI (locationId: 5) - Placeholder employees
// ========================================================================
const BADDI_EMPLOYEES = [
  // HPLC
  { name: 'Mr. Vikram Thakur', designation: 'Asst. Manager Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 12 },
  { name: 'Mr. Rohit Chauhan', designation: 'Officer Technical', dept: 'HPLC', qualification: 'M.Sc Chemistry', experience: 5 },
  { name: 'Ms. Pooja Sharma', designation: 'Jr. Officer Technical', dept: 'HPLC', qualification: 'B.Pharma', experience: 2 },
  // GC
  { name: 'Mr. Sandeep Verma', designation: 'Sr. Officer Technical', dept: 'GC', qualification: 'M.Sc Chemistry', experience: 8 },
  { name: 'Ms. Anita Rana', designation: 'Jr. Officer Technical', dept: 'GC', qualification: 'M.Sc Organic Chemistry', experience: 3 },
  // PHARMA CHEMICAL
  { name: 'Mr. Deepak Thakur', designation: 'Asst. Manager Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 10 },
  { name: 'Mr. Rajesh Pathania', designation: 'Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'B.Pharma', experience: 6 },
  { name: 'Ms. Meena Kumari', designation: 'Jr. Officer Technical', dept: 'PHARMA CHEMICAL', qualification: 'M.Sc Chemistry', experience: 2 },
  // ICP-MS
  { name: 'Mr. Ajay Negi', designation: 'Officer Technical', dept: 'ICP-MS', qualification: 'M.Sc Chemistry', experience: 5 },
  { name: 'Ms. Sunita Devi', designation: 'Jr. Officer Technical', dept: 'ICP-MS', qualification: 'M.Sc Environmental Science', experience: 3 },
  // MICROBIOLOGY
  { name: 'Ms. Kavita Sharma', designation: 'Sr. Officer Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 7 },
  { name: 'Mr. Pankaj Thakur', designation: 'Jr. Officer Technical', dept: 'MICROBIOLOGY', qualification: 'M.Sc Microbiology', experience: 3 },
  // QA
  { name: 'Mr. Naresh Kumar', designation: 'Asst. Manager QA', dept: 'QUALITY ASSURANCE', qualification: 'M.Sc Chemistry', experience: 10 },
  { name: 'Ms. Ritu Sharma', designation: 'Jr. Officer QA', dept: 'QUALITY ASSURANCE', qualification: 'B.Pharma', experience: 4 },
  // XRD
  { name: 'Mr. Sunil Dogra', designation: 'Officer Technical', dept: 'XRD', qualification: 'M.Sc Physics', experience: 6 },
  // MARKETING
  { name: 'Mr. Ramesh Chand', designation: 'Business Dev Officer', dept: 'MARKETING', qualification: 'MBA', experience: 5 },
  { name: 'Mr. Prem Singh', designation: 'Business Dev Officer', dept: 'MARKETING', qualification: 'BBA', experience: 3 },
  // ACCOUNTS & HR
  { name: 'Mr. Mohan Lal', designation: 'Officer Finance', dept: 'ACCOUNTS & HR', qualification: 'B.Com', experience: 8 },
  // ADMINISTRATION
  { name: 'Mr. Surender Singh', designation: 'Manager Operations', dept: 'ADMINISTRATION', qualification: 'B.A', experience: 12 },
  // BOOKING
  { name: 'Mr. Rakesh Kumar', designation: 'Officer Operations', dept: 'BOOKING', qualification: 'B.A', experience: 5 },
  // REVIEW
  { name: 'Mr. Arun Thakur', designation: 'Sr. Officer Technical', dept: 'REVIEW', qualification: 'M.Sc Chemistry', experience: 9 },
  // OUTSOURCE
  { name: 'Ms. Neelam Kumari', designation: 'Officer Operations', dept: 'OUTSOURCE', qualification: 'B.Sc', experience: 4 },
];

// Location code mapping for username generation
const LOCATION_CODES = {
  2: 'alc',
  3: 'man',
  4: 'blr',
  5: 'bdd',
};

async function seedLocationEmployees() {
  const transaction = await db.sequelize.transaction();

  try {
    console.log('=============================================================');
    console.log('  SEEDING EMPLOYEES FOR NON-DELHI LOCATIONS');
    console.log('=============================================================\n');

    const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

    // Get all existing usernames to avoid conflicts
    const existingUsers = await db.User.findAll({ attributes: ['username'], transaction });
    const existingUsernames = new Set(existingUsers.map(u => u.username));
    console.log(`Found ${existingUsernames.size} existing usernames in database.\n`);

    const allLocations = [
      { id: 2, name: 'Alcatec', code: 'ALC', employees: ALCATEC_EMPLOYEES },
      { id: 3, name: 'Manesar', code: 'MAN', employees: MANESAR_EMPLOYEES },
      { id: 4, name: 'Bangalore', code: 'BLR', employees: BANGALORE_EMPLOYEES },
      { id: 5, name: 'Baddi', code: 'BDD', employees: BADDI_EMPLOYEES },
    ];

    const summary = {};
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const location of allLocations) {
      console.log(`\n--- ${location.name.toUpperCase()} (locationId: ${location.id}) ---`);
      console.log(`Employees to seed: ${location.employees.length}`);

      let locCreated = 0;
      let locSkipped = 0;
      const deptCounts = {};

      for (const emp of location.employees) {
        // Clean name - remove prefixes
        const fullName = emp.name
          .replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, '')
          .trim();

        const locCode = LOCATION_CODES[location.id];
        const username = generateUsername(emp.name, locCode, existingUsernames);
        const email = `${username.replace(/\./g, '')}@aurigalab.com`;

        // Determine role
        const specialRole = getSpecialRole(emp.designation, emp.dept);
        const role = specialRole || mapRole(emp.designation);
        const deptRole = mapDeptRole(emp.designation);

        // Check if user already exists by email
        const existingByEmail = await db.User.findOne({ where: { email }, transaction });
        if (existingByEmail) {
          console.log(`  SKIP (email exists): ${fullName} -> ${email}`);
          locSkipped++;
          continue;
        }

        // Create user
        const user = await db.User.create({
          username,
          password: hashedPassword,
          fullName,
          email,
          phone: '',
          role,
          locationId: location.id,
          isActive: true,
        }, { transaction });

        // Map department
        const deptId = DEPT[emp.dept];
        if (deptId) {
          await db.DepartmentUser.create({
            userId: user.id,
            departmentId: deptId,
            role: deptRole,
          }, { transaction });
          deptCounts[emp.dept] = (deptCounts[emp.dept] || 0) + 1;
        } else {
          console.log(`  WARNING: No department ID found for "${emp.dept}"`);
        }

        // Create employee record if model exists
        if (db.Employee) {
          await db.Employee.create({
            userId: user.id,
            employeeCode: `AUR-${location.code}-${String(user.id).padStart(4, '0')}`,
            fullName,
            designation: emp.designation,
            qualification: emp.qualification,
            experienceYears: emp.experience,
            department: emp.dept,
            dateOfJoining: new Date(2026 - Math.max(emp.experience, 1), 0, 1),
            status: 'active',
          }, { transaction });
        }

        locCreated++;
        console.log(`  + ${username} (${role}) -> ${emp.dept} [${deptRole}]`);
      }

      summary[location.name] = { created: locCreated, skipped: locSkipped, deptCounts };
      totalCreated += locCreated;
      totalSkipped += locSkipped;
    }

    // Commit transaction
    await transaction.commit();

    // Print summary
    console.log('\n=============================================================');
    console.log('  SEEDING COMPLETE - SUMMARY');
    console.log('=============================================================');
    console.log(`Total created: ${totalCreated}`);
    console.log(`Total skipped: ${totalSkipped}`);

    for (const [locName, stats] of Object.entries(summary)) {
      console.log(`\n${locName}: ${stats.created} created, ${stats.skipped} skipped`);
      if (Object.keys(stats.deptCounts).length > 0) {
        console.log('  Department breakdown:');
        Object.entries(stats.deptCounts)
          .sort((a, b) => b[1] - a[1])
          .forEach(([dept, count]) => {
            console.log(`    ${dept}: ${count}`);
          });
      }
    }

    console.log(`\nDefault password for all users: ${DEFAULT_PASSWORD}`);
    console.log('=============================================================');

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('\nSEEDING FAILED - Transaction rolled back.');
    console.error(error);
    process.exit(1);
  }
}

seedLocationEmployees();
