const bcrypt = require('bcryptjs');

// We'll use the db object from models/index
const db = require('../models');

const DEFAULT_PASSWORD = 'auriga@123';

// Department mapping to match our department master
const DEPT_MAP = {
  'ADMINISTRATION': 'ADMINISTRATOR',
  'QUALITY ASSURANCE': 'QA',
  'HPLC': 'HPLC',
  'GC': 'GC',
  'MOLECULAR BIOLOGY': 'MOLECULAR BIOLOGY',
  'HPTLC/STABILITY': 'HERBAL',
  'ICP-MS': 'ICPMS',
  'WATER': 'WATER',
  'FOOD': 'FOOD',
  'CHEMICAL': 'PHARMA CHEMICAL',
  'LCMSMS/GCMSMS': 'LCMS',
  'MICROBIOLOGY': 'MICRO BIOLOGY',
  'ACCOUNTS/HR': 'ACCOUNTS',
  'IT STAFF': 'ADMIN',
  'BOOKING': 'BOOKING',
  'CUSTOMER COORDINATOR': 'CUSTOMER CORDINATOR',
  'MARKETING': 'MARKETING',
};

// Role mapping based on designation
function mapRole(designation) {
  const d = designation.toLowerCase();
  if (d.includes('executive director') || d.includes('director')) return 'LAB_DIRECTOR';
  if (d.includes('consultant')) return 'LAB_DIRECTOR';
  if (d.includes('sbu head') || d.includes('quality manager') || d.includes('person in-charge')) return 'QUALITY_MANAGER';
  if (d.includes('deputy sbu') || d.includes('deputy manager')) return 'DEPARTMENT_HEAD';
  if (d.includes('vice president') || d.includes('g.m')) return 'DEPARTMENT_HEAD';
  if (d.includes('manager')) return 'DEPARTMENT_HEAD';
  if (d.includes('sr. executive') || d.includes('executive')) return 'REVIEWER';
  if (d.includes('sr. officer') || d.includes('officer')) return 'ANALYST';
  if (d.includes('jr. officer')) return 'ANALYST';
  if (d.includes('trainee')) return 'ANALYST';
  if (d.includes('assistant') || d.includes('asst.')) return 'ANALYST';
  if (d.includes('receptionist')) return 'RECEPTIONIST';
  if (d.includes('logistics')) return 'RECEPTIONIST';
  if (d.includes('accounts') || d.includes('finance')) return 'ACCOUNTS';
  if (d.includes('hr')) return 'ACCOUNTS';
  if (d.includes('network') || d.includes('it')) return 'ADMIN';
  if (d.includes('business development')) return 'MARKETING';
  return 'ANALYST';
}

// Department role for organogram hierarchy
function mapDeptRole(designation) {
  const d = designation.toLowerCase();
  if (d.includes('executive director') || d.includes('director')) return 'head';
  if (d.includes('consultant')) return 'head';
  if (d.includes('sbu head') || d.includes('quality manager')) return 'head';
  if (d.includes('vice president') || d.includes('g.m')) return 'head';
  if (d.includes('deputy sbu') || d.includes('deputy manager')) return 'reviewer';
  if (d.includes('manager') && !d.includes('asst') && !d.includes('assistant')) return 'head';
  if (d.includes('assistant manager') || d.includes('asst. manager')) return 'head';
  if (d.includes('sr. executive') || d.includes('executive')) return 'reviewer';
  if (d.includes('sr. officer')) return 'reviewer';
  if (d.includes('officer') && !d.includes('jr.')) return 'analyst';
  if (d.includes('jr. officer')) return 'analyst';
  if (d.includes('trainee')) return 'analyst';
  if (d.includes('assistant') || d.includes('asst.')) return 'member';
  if (d.includes('receptionist')) return 'member';
  return 'analyst';
}

function generateUsername(name, existingUsernames) {
  // Remove prefix (Mr., Ms., Dr.)
  let clean = name.replace(/^(Mr\.|Ms\.|Dr\.)\s*/i, '').trim();
  // Remove suffixes like (Kolkata), roman numerals
  clean = clean.replace(/\s*\(.*?\)\s*/g, '').replace(/\s+II$/,'').trim();
  // Split into parts
  const parts = clean.split(/\s+/);
  let username;
  if (parts.length === 1) {
    username = parts[0].toLowerCase();
  } else {
    // first name + last name initial or full last name
    username = (parts[0] + '.' + parts[parts.length - 1]).toLowerCase();
  }
  // Remove special characters
  username = username.replace(/[^a-z0-9.]/g, '');

  // Handle duplicates
  let finalUsername = username;
  let counter = 2;
  while (existingUsernames.has(finalUsername)) {
    finalUsername = username + counter;
    counter++;
  }
  existingUsernames.add(finalUsername);
  return finalUsername;
}

// All employees extracted from the document
const EMPLOYEES = [
  // ADMINISTRATION (6)
  { dept: 'ADMINISTRATION', name: 'Dr. Saurabh Arora', designation: 'Executive Director', qualification: 'Ph-D. (Pharmaceutics)', experience: 18 },
  { dept: 'ADMINISTRATION', name: 'Dr. Neha S Arora', designation: 'Director', qualification: 'Ph-D. (Pharmacognosy)', experience: 17 },
  { dept: 'ADMINISTRATION', name: 'Mr. D Sanyal', designation: 'Consultant', qualification: 'B.Sc. (PCM)', experience: 48 },
  { dept: 'ADMINISTRATION', name: 'Ms. Silpi Rani Kalita', designation: 'SBU Head, Quality Manager & Person In-Charge', qualification: 'M.Pharm', experience: 16 },
  { dept: 'ADMINISTRATION', name: 'Mr. Ashu Kumar', designation: 'Deputy SBU Head & Manager- Technical (Pharma)', qualification: 'M.Sc. (Chemistry)', experience: 18 },
  { dept: 'ADMINISTRATION', name: 'Mr. Sanjeev Kumar Tiwari', designation: 'Person In-Charge & Deputy Manager-Technical', qualification: 'M.Sc. (Chemistry)', experience: 20 },

  // QUALITY ASSURANCE (8)
  { dept: 'QUALITY ASSURANCE', name: 'Mr. Padam Garg', designation: 'Asst. Manager', qualification: 'B.Sc. (CBZ)', experience: 20 },
  { dept: 'QUALITY ASSURANCE', name: 'Mr. Deepak Kumar', designation: 'Executive-QA', qualification: 'M.Pharma (Pharmaceutics)', experience: 5.4 },
  { dept: 'QUALITY ASSURANCE', name: 'Ms. Tonia', designation: 'Officer-QA', qualification: 'B.Sc. (CBZ)', experience: 9.8 },
  { dept: 'QUALITY ASSURANCE', name: 'Mr. Jaishankar Poddar', designation: 'Officer-QA', qualification: 'B.Pharm', experience: 3.6 },
  { dept: 'QUALITY ASSURANCE', name: 'Ms. Snigdha Dey', designation: 'Jr. Officer-QA', qualification: 'B.Pharm', experience: 3 },
  { dept: 'QUALITY ASSURANCE', name: 'Ms. Vartika Srivastava', designation: 'Jr. Officer-QA', qualification: 'M.Sc. (Food-Tech)', experience: 1.6 },
  { dept: 'QUALITY ASSURANCE', name: 'Ms. Masoom', designation: 'Jr. Officer-QA', qualification: 'M.Sc. (Food-Tech)', experience: 1 },
  { dept: 'QUALITY ASSURANCE', name: 'Mr. Saurabh', designation: 'Asst.-QA', qualification: 'B.A. (Pursuing)', experience: 4 },

  // HPLC (18)
  { dept: 'HPLC', name: 'Mr. Vinod Kumar', designation: 'Asst. Manager- Technical', qualification: 'M.Sc. (Bio-tech)', experience: 13 },
  { dept: 'HPLC', name: 'Mr. Mohd. Adil', designation: 'Sr. Executive-Technical', qualification: 'M.Sc. (Bio-tech)', experience: 10 },
  { dept: 'HPLC', name: 'Mr. Sandeep Kumar', designation: 'Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 8 },
  { dept: 'HPLC', name: 'Mr. Ashutosh Kumar Singh', designation: 'Executive-Technical', qualification: 'B.Pharm', experience: 8 },
  { dept: 'HPLC', name: 'Mr. Mohd. Imran', designation: 'Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 8 },
  { dept: 'HPLC', name: 'Mr. Vinod Kumar II', designation: 'Sr. Officer-Technical', qualification: 'B.Pharm', experience: 7 },
  { dept: 'HPLC', name: 'Mr. Sachin Kumar Sharma', designation: 'Sr. Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 6 },
  { dept: 'HPLC', name: 'Mr. Sonu', designation: 'Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 5 },
  { dept: 'HPLC', name: 'Mr. Gaurav Kumar', designation: 'Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 6 },
  { dept: 'HPLC', name: 'Mr. Jitendra Kumar', designation: 'Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 6 },
  { dept: 'HPLC', name: 'Mr. Ashish Chauhan', designation: 'Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 4.4 },
  { dept: 'HPLC', name: 'Ms. Pratiksha Pandey', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Organic Chemistry)', experience: 2 },
  { dept: 'HPLC', name: 'Mr. Aditya Tiwari', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (Chemistry)', experience: 2 },
  { dept: 'HPLC', name: 'Mr. Subham Chaube', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (Chemistry)', experience: 1.5 },
  { dept: 'HPLC', name: 'Ms. Vandana Chaudhary', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 1 },
  { dept: 'HPLC', name: 'Mr. Aman Bhardwaj', designation: 'Trainee-Technical', qualification: 'B.Sc. (PCM)', experience: 0 },
  { dept: 'HPLC', name: 'Mr. Bhawan Singh', designation: 'Sr. Asst.-Technical', qualification: '12th Std.', experience: 31 },
  { dept: 'HPLC', name: 'Mr. Roshan', designation: 'Trainee', qualification: '12th Std.', experience: 0 },

  // GC (5)
  { dept: 'GC', name: 'Mr. Vinod Kumar III', designation: 'Asst. Manager-Technical', qualification: 'M.Sc. (Chemistry)', experience: 16 },
  { dept: 'GC', name: 'Mr. Sagar Chand', designation: 'Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 10 },
  { dept: 'GC', name: 'Mr. Divyansh Swami', designation: 'Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 8.7 },
  { dept: 'GC', name: 'Mr. Rahul Kumar II', designation: 'Officer-Technical', qualification: 'B.Pharm', experience: 8 },
  { dept: 'GC', name: 'Mr. Ankit Sharma', designation: 'Jr. Officer-Technical', qualification: 'M.Pharm (Pharmaceutics)', experience: 1 },

  // MOLECULAR BIOLOGY (1)
  { dept: 'MOLECULAR BIOLOGY', name: 'Ms. Urvashi Chauhan', designation: 'Trainee-Technical', qualification: 'M.Sc. (Bio-tech)', experience: 0 },

  // HPTLC/STABILITY (5)
  { dept: 'HPTLC/STABILITY', name: 'Mr. Rahul Pal', designation: 'Officer-Technical', qualification: 'M.Sc. (Organic-Chemistry)', experience: 7 },
  { dept: 'HPTLC/STABILITY', name: 'Ms. Vaishali', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 2.5 },
  { dept: 'HPTLC/STABILITY', name: 'Mr. Shyam Sundar', designation: 'Trainee- Technical', qualification: 'B.Pharm', experience: 0 },
  { dept: 'HPTLC/STABILITY', name: 'Mr. Ranveer Rai', designation: 'Sr. Asst.-Technical', qualification: '12th Std.', experience: 32 },
  { dept: 'HPTLC/STABILITY', name: 'Mr. Bipin Kumar Ray', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 7 },

  // ICP-MS (5)
  { dept: 'ICP-MS', name: 'Mr. Keshav Lal Barnwal', designation: 'Sr. Executive-Technical', qualification: 'M.Sc. (Bio-Chemistry)', experience: 9.8 },
  { dept: 'ICP-MS', name: 'Ms. Minal M. Garud', designation: 'Officer-Technical', qualification: 'B.Sc. (Chemistry)', experience: 10.9 },
  { dept: 'ICP-MS', name: 'Mr. Kushagar Pawar', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 4.6 },
  { dept: 'ICP-MS', name: 'Mr. Prashant Tiwari', designation: 'Jr. Officer-Technical', qualification: 'M. Pharm', experience: 2.1 },
  { dept: 'ICP-MS', name: 'Mr. Sunil Kumar', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 10 },

  // WATER (4)
  { dept: 'WATER', name: 'Ms. Puja Kumari', designation: 'Assistant Manager-Technical', qualification: 'B.Sc. Hons. (CBZ)', experience: 12 },
  { dept: 'WATER', name: 'Ms. Ekta Rajput', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 2.3 },
  { dept: 'WATER', name: 'Mr. Ravi Kumar Maurya', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 1 },
  { dept: 'WATER', name: 'Mr. Sagar', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 1 },

  // FOOD (11)
  { dept: 'FOOD', name: 'Mr. Deepak Kumar Pant', designation: 'Assistant Manager-Technical', qualification: 'B.Sc. (Physics)', experience: 19 },
  { dept: 'FOOD', name: 'Ms. Megha', designation: 'Assistant Manager-Technical', qualification: 'M.Sc. (Food-Tech)', experience: 9 },
  { dept: 'FOOD', name: 'Mr. Rahul Negi', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Food-Tech)', experience: 4 },
  { dept: 'FOOD', name: 'Ms. Ragini Shukla', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 3.5 },
  { dept: 'FOOD', name: 'Ms. Ninku Kumari', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 3.5 },
  { dept: 'FOOD', name: 'Ms. Swati Singh', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Food-Tech)', experience: 2.4 },
  { dept: 'FOOD', name: 'Mr. Hemant Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 2.8 },
  { dept: 'FOOD', name: 'Mr. Shivam Shakya', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 2.4 },
  { dept: 'FOOD', name: 'Mr. Hariom', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Food-Tech)', experience: 1 },
  { dept: 'FOOD', name: 'Ms. Ankita Kushwaha', designation: 'Trainee-Technical', qualification: 'B.Sc. (PCM)', experience: 0 },
  { dept: 'FOOD', name: 'Mr. Manish Kumar', designation: 'Trainee-Technical', qualification: 'M.Sc. (Chemistry)', experience: 0 },

  // CHEMICAL (21)
  { dept: 'CHEMICAL', name: 'Ms. Surbhi Sharma', designation: 'Assistant Manager- Technical', qualification: 'M.Sc. (Bio-tech)', experience: 15 },
  { dept: 'CHEMICAL', name: 'Mr. Rahul Kumar', designation: 'Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 5.6 },
  { dept: 'CHEMICAL', name: 'Mr. Rajeev Pant', designation: 'Officer-Technical', qualification: 'B. Pharm', experience: 4.0 },
  { dept: 'CHEMICAL', name: 'Ms. Sonam Sachan', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Bio-tech)', experience: 4.0 },
  { dept: 'CHEMICAL', name: 'Mr. Sachin Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 3 },
  { dept: 'CHEMICAL', name: 'Mr. Dhruv Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 2.7 },
  { dept: 'CHEMICAL', name: 'Mr. Vipinder Singh', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Organic Chemistry)', experience: 2 },
  { dept: 'CHEMICAL', name: 'Ms. Mahima', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (Life science)', experience: 1 },
  { dept: 'CHEMICAL', name: 'Mr. Adarsh Sharma', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 1 },
  { dept: 'CHEMICAL', name: 'Mr. Prashant Raghav', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 1 },
  { dept: 'CHEMICAL', name: 'Ms. Kanika', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 1 },
  { dept: 'CHEMICAL', name: 'Mr. Shivam Singh', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0 },
  { dept: 'CHEMICAL', name: 'Mr. Abhishek Jaiswala', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0 },
  { dept: 'CHEMICAL', name: 'Ms. Induja Sharma', designation: 'Trainee-Technical', qualification: 'B.Sc. (PCM)', experience: 0 },
  { dept: 'CHEMICAL', name: 'Mr. Aditya Kaushik', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0 },
  { dept: 'CHEMICAL', name: 'Mr. Pankaj Kr. Yadav', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0 },
  { dept: 'CHEMICAL', name: 'Ms. Poonam', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0 },
  { dept: 'CHEMICAL', name: 'Ms. Deepti Singh', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0 },
  { dept: 'CHEMICAL', name: 'Mr. Ram Babu', designation: 'Jr. Officer-Operations', qualification: 'B.Sc.', experience: 4.6 },
  { dept: 'CHEMICAL', name: 'Mr. Dhan Singh', designation: 'Sr. Assistant-Operations', qualification: '12th Std.', experience: 22.8 },
  { dept: 'CHEMICAL', name: 'Mr. Hariom Bhanwar', designation: 'Assistant-Operations', qualification: '8th Std.', experience: 11 },

  // LCMSMS/GCMSMS (10)
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Pushpender Kumar', designation: 'Assistant Manager-Technical', qualification: 'M.Sc. (Chemistry)', experience: 22 },
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Sanjay Kumar Sharma', designation: 'Deputy Manager-Technical', qualification: 'M.Sc. (Chemistry)', experience: 17 },
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Neeraj Sharma', designation: 'Sr. Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 14 },
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Munna Kumar Singh', designation: 'Sr. Executive-Technical', qualification: 'M.Sc. (Chemistry Hons.)', experience: 12.5 },
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Ganesh', designation: 'Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 5 },
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Kuldeep Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 1 },
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Girdhar Kumar Sahu', designation: 'Jr. Officer-Technical', qualification: 'M.Pharm', experience: 1 },
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Prince Kumar Thakur', designation: 'Trainee-Technical', qualification: 'M.Sc. (Bio-Tech)', experience: 0 },
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Sachin', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 9 },
  { dept: 'LCMSMS/GCMSMS', name: 'Mr. Varun Singh', designation: 'Assistant-Operations', qualification: '10th Std.', experience: 7 },

  // MICROBIOLOGY (15)
  { dept: 'MICROBIOLOGY', name: 'Mr. Amit Shakya', designation: 'Assistant Manager-Technical', qualification: 'M.Sc. (Microbiology)', experience: 9 },
  { dept: 'MICROBIOLOGY', name: 'Mr. Vaibhav Tyagi', designation: 'Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 6 },
  { dept: 'MICROBIOLOGY', name: 'Mr. Ganga Singh', designation: 'Executive-Technical', qualification: 'B.Sc. (CBZ)', experience: 27 },
  { dept: 'MICROBIOLOGY', name: 'Ms. Surya G', designation: 'Executive-Technical', qualification: 'M.Sc. (Microbiology)', experience: 14 },
  { dept: 'MICROBIOLOGY', name: 'Mr. Deepak Kumar II', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 4 },
  { dept: 'MICROBIOLOGY', name: 'Mr. Madhav Singh', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 4 },
  { dept: 'MICROBIOLOGY', name: 'Mr. Pankaj', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Food Microbiology & Toxicology)', experience: 4 },
  { dept: 'MICROBIOLOGY', name: 'Mr. Shivam Agnihotri', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 3 },
  { dept: 'MICROBIOLOGY', name: 'Mr. Sumit Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Tech (Bio-Tech)', experience: 2.2 },
  { dept: 'MICROBIOLOGY', name: 'Ms. Deepa Tyagi', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 1.1 },
  { dept: 'MICROBIOLOGY', name: 'Ms. Kajal Sharma', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 1 },
  { dept: 'MICROBIOLOGY', name: 'Mr. Anit Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Tech (Bio-Tech)', experience: 1.4 },
  { dept: 'MICROBIOLOGY', name: 'Ms. Priyanka Thakur', designation: 'Trainee-Technical', qualification: 'M.Sc. (Bio-Tech)', experience: 0 },
  { dept: 'MICROBIOLOGY', name: 'Ms. Dipika', designation: 'Trainee-Technical', qualification: 'M.Sc. (Microbiology)', experience: 0 },
  { dept: 'MICROBIOLOGY', name: 'Mr. Vikash', designation: 'Assistant-Operations', qualification: '10th Std.', experience: 6 },

  // ACCOUNTS/HR (3)
  { dept: 'ACCOUNTS/HR', name: 'Mr. Tejpal Singh', designation: 'Accounts Officer', qualification: 'B.Com, MBA', experience: 15 },
  { dept: 'ACCOUNTS/HR', name: 'Mr. Manjesh', designation: 'Junior Officer-Finance And Accounts', qualification: 'B.A', experience: 2.6 },
  { dept: 'ACCOUNTS/HR', name: 'Mr. Bhupesh', designation: 'HR-Executive', qualification: 'MBA (HR)', experience: 3.6 },

  // IT STAFF (5)
  { dept: 'IT STAFF', name: 'Mr. Gurpreet Singh', designation: 'Manager-IT', qualification: 'GNIIT, B.Com', experience: 18 },
  { dept: 'IT STAFF', name: 'Mr. Parmesh Kumar', designation: 'Network Administrator', qualification: 'M.Sc. (IT) Mcse, Mcsa, ccna, Rhce, O-Level, Hce', experience: 17 },
  { dept: 'IT STAFF', name: 'Mr. Bhuwan Singh Bhandari', designation: 'Jr. Officer', qualification: '12th Std.', experience: 15 },
  { dept: 'IT STAFF', name: 'Mr. Ajay Prakash Srivastava', designation: 'IT-Executive', qualification: 'M.C.A', experience: 12 },
  { dept: 'IT STAFF', name: 'Mr. Deepak Maheshwari', designation: 'IT-Executive', qualification: 'B.Sc. (PCB)', experience: 16.5 },

  // BOOKING (8)
  { dept: 'BOOKING', name: 'Mr. Sanjiv Kumar', designation: 'Assistant Manager-Operations', qualification: 'B.A', experience: 17 },
  { dept: 'BOOKING', name: 'Mr. Rahul Kumar Singh', designation: 'Officer-Operations', qualification: 'B.A', experience: 13 },
  { dept: 'BOOKING', name: 'Mr. Rishesh Pradhan', designation: 'Officer-Operations', qualification: 'B.A', experience: 9 },
  { dept: 'BOOKING', name: 'Mr. Rahul Saini', designation: 'Jr. Officer-Operations', qualification: 'B.A', experience: 6 },
  { dept: 'BOOKING', name: 'Mr. Harish Singh', designation: 'Assistant-Operations', qualification: 'BBA', experience: 7 },
  { dept: 'BOOKING', name: 'Mr. Deepak kumar III', designation: 'Assistant-Operations', qualification: 'B.A', experience: 11 },
  { dept: 'BOOKING', name: 'Mr. Nitish Kumar', designation: 'Assistant-Operations', qualification: 'B.Com', experience: 2 },
  { dept: 'BOOKING', name: 'Ms. Ariba Bano', designation: 'Trainee-Operations', qualification: '12th Std.', experience: 1 },

  // CUSTOMER COORDINATOR (22)
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Kaushal Kumar', designation: 'Deputy Manager-Operations', qualification: 'M.Sc. (Chemistry), MBA', experience: 30 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Ms. Pooja Pathela', designation: 'Assistant Manager-Operations', qualification: 'M.B.A', experience: 17 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Ms. Prasanna Rajan', designation: 'Sr. Officer-Operations', qualification: '12th Std.', experience: 32 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Ms. Neha Thukral', designation: 'Officer-Operations', qualification: 'B.A', experience: 4 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Amit Kumar Rawat', designation: 'Officer-Operations', qualification: 'B.A', experience: 17 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Sudesh Kumar', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 7 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Amandeep Singh', designation: 'Officer-Operations', qualification: 'B.A. Pursuing', experience: 10 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Bunty', designation: 'Officer-Operations', qualification: 'B.A', experience: 7 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Akash Kumar Sharma', designation: 'Executive-Operations', qualification: 'B.A', experience: 11 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Ajay Kumar', designation: 'Executive-Operations', qualification: 'B.A', experience: 8 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Laxman', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 15 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Nitin', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 2 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Shivansh Sabharwal', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 3 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Nafish Ahmad', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 17 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Mangal Jha', designation: 'Sr. Assistant-Support', qualification: '8th Std.', experience: 23 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Shanker Ray', designation: 'Sr. Assistant-Operations', qualification: '8th Std.', experience: 27 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Dinesh', designation: 'Assistant-Support', qualification: '12th Std.', experience: 5 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Parvinder Kumar Shrivastava', designation: 'Assistant-Support', qualification: '12th Std.', experience: 3 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Robin Bhandari', designation: 'Jr. Officer', qualification: 'B.A', experience: 5 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Ms. Preeti Mitra', designation: 'Receptionist', qualification: 'B.A', experience: 9 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Karan', designation: 'Trainee', qualification: 'B.A', experience: 0 },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Amit', designation: 'Trainee-Operations', qualification: '10th Std.', experience: 0 },

  // MARKETING (19)
  { dept: 'MARKETING', name: 'Mr. Manish Ranjan', designation: 'Vice President-Corporate', qualification: 'MBA, PGDIT', experience: 15 },
  { dept: 'MARKETING', name: 'Mr. Ajai Dutt Sharma', designation: 'Vice President-Corporate', qualification: 'M.Sc. (Food-Tech.)', experience: 22 },
  { dept: 'MARKETING', name: 'Mr. Deepak Arora', designation: 'G.M (Sales)', qualification: 'BBA', experience: 18 },
  { dept: 'MARKETING', name: 'Mr. Sachin Kumar II', designation: 'Sr. Manager-Business Development', qualification: '12th Std.', experience: 22 },
  { dept: 'MARKETING', name: 'Mr. Abhishek Aghi', designation: 'Sr. Manager-Business Development', qualification: '12th Std.', experience: 15 },
  { dept: 'MARKETING', name: 'Mr. Budhi Nath Singh', designation: 'Business Development Officer', qualification: 'B.A', experience: 15 },
  { dept: 'MARKETING', name: 'Mr. Dilip Debnath', designation: 'Business Development Officer', qualification: 'B.A', experience: 11 },
  { dept: 'MARKETING', name: 'Ms. Sudha Singh', designation: 'Business Development Officer', qualification: 'Dip. In Civil Engg.', experience: 9 },
  { dept: 'MARKETING', name: 'Mr. Nikhil Rana', designation: 'Sr. Officer-Operations', qualification: 'B.Com', experience: 6 },
  { dept: 'MARKETING', name: 'Mr. Sandeep Kumar II', designation: 'Sr. Officer-Operations', qualification: 'B.A', experience: 6 },
  { dept: 'MARKETING', name: 'Mr. Devashish Vishwas', designation: 'Jr. Officer-Operations', qualification: 'B.A', experience: 5 },
  { dept: 'MARKETING', name: 'Ms. Jyoti Chauhan', designation: 'Business Development Officer', qualification: 'B.A', experience: 2 },
  { dept: 'MARKETING', name: 'Mr. Ankit', designation: 'Business Development Officer', qualification: 'Dip. In Mech. Engg.', experience: 2 },
  { dept: 'MARKETING', name: 'Mr. Mayank', designation: 'Jr. Officer-Operations', qualification: 'B.Com', experience: 3 },
  { dept: 'MARKETING', name: 'Mr. Chiranjit Basak', designation: 'Business Development Officer', qualification: '10th Std.', experience: 13 },
  { dept: 'MARKETING', name: 'Ms. Neha', designation: 'Senior Officer-Business Development', qualification: 'B.A', experience: 8 },
  { dept: 'MARKETING', name: 'Mr. Ajay Kumar II', designation: 'Business Development Officer', qualification: '12th Std.', experience: 3 },
  { dept: 'MARKETING', name: 'Mr. Rajesh Pal', designation: 'Sr. Assistant-Operations', qualification: '12th Std.', experience: 18 },
  { dept: 'MARKETING', name: 'Mr. Bikash Das', designation: 'Logistics Coordinator', qualification: 'B.A', experience: 3 },
];

async function seedEmployees() {
  try {
    console.log('Starting employee seeding...');
    console.log(`Total employees to seed: ${EMPLOYEES.length}`);

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const existingUsernames = new Set();

    // Get all departments
    const departments = await db.Department.findAll();
    const deptByName = {};
    departments.forEach(d => {
      deptByName[d.name] = d;
    });

    // Track stats
    let created = 0;
    let skipped = 0;
    const deptCounts = {};

    for (const emp of EMPLOYEES) {
      // Clean name - remove prefixes and suffixes for display
      const fullName = emp.name
        .replace(/^(Mr\.|Ms\.|Dr\.)\s*/i, '')
        .replace(/\s+(II|III|IV)$/g, '')
        .trim();

      const username = generateUsername(emp.name, existingUsernames);
      const role = mapRole(emp.designation);
      const deptRole = mapDeptRole(emp.designation);

      // Check if user already exists
      const existing = await db.User.findOne({ where: { username } });
      if (existing) {
        console.log(`  Skipping ${username} - already exists`);
        skipped++;
        continue;
      }

      // Create user
      const user = await db.User.create({
        username,
        password: hashedPassword,
        fullName,
        email: `${username.replace(/\./g, '')}@aurigalab.com`,
        phone: '',
        role,
        isActive: true,
      });

      // Map to department
      const deptKey = DEPT_MAP[emp.dept] || emp.dept;
      const dept = deptByName[deptKey];

      if (dept) {
        await db.DepartmentUser.create({
          userId: user.id,
          departmentId: dept.id,
          role: deptRole,
        });
        deptCounts[emp.dept] = (deptCounts[emp.dept] || 0) + 1;
      } else {
        console.log(`  Warning: No department mapping for "${emp.dept}" -> "${deptKey}"`);
      }

      // Create employee record
      await db.Employee.create({
        userId: user.id,
        employeeCode: `AUR-${String(user.id).padStart(4, '0')}`,
        fullName,
        designation: emp.designation,
        qualification: emp.qualification,
        experienceYears: emp.experience,
        department: emp.dept,
        dateOfJoining: new Date(2026 - Math.max(emp.experience, 1), 0, 1),
        status: 'active',
      });

      created++;
      console.log(`  Created: ${username} (${role}) -> ${emp.dept} [${deptRole}]`);
    }

    console.log('\n=== SEEDING COMPLETE ===');
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log('\nDepartment breakdown:');
    Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).forEach(([dept, count]) => {
      console.log(`  ${dept}: ${count}`);
    });
    console.log(`\nDefault password for all users: ${DEFAULT_PASSWORD}`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedEmployees();
