const bcrypt = require('bcryptjs');
const db = require('../models');

const DEFAULT_PASSWORD = 'auriga@123';

// ═══════════════════════════════════════════════════════════════
// CLEAN DEPARTMENT LIST - matches your actual lab structure
// ═══════════════════════════════════════════════════════════════
const DEPARTMENTS = [
  // ── ANALYTICAL DEPARTMENTS (from employee list + original list) ──
  { name: 'HPLC', code: 'HPLC', type: 'analytical' },
  { name: 'HPLC-2', code: 'HPLC2', type: 'analytical' },
  { name: 'GC', code: 'GC', type: 'analytical' },
  { name: 'LCMS/GCMS', code: 'LCMS', type: 'analytical' },
  { name: 'ICP-MS', code: 'ICPMS', type: 'analytical' },
  { name: 'ICP-OES', code: 'ICPOES', type: 'analytical' },
  { name: 'AAS', code: 'AAS', type: 'analytical' },
  { name: 'XRD', code: 'XRD', type: 'analytical' },
  { name: 'DSC', code: 'DSC', type: 'analytical' },
  { name: 'ION CHROMATOGRAPHY', code: 'IC', type: 'analytical' },
  { name: 'MALVERN', code: 'MLV', type: 'analytical' },
  { name: 'MASS SPECTROSCOPY', code: 'MS', type: 'analytical' },
  { name: 'MICROBIOLOGY', code: 'MICRO', type: 'analytical' },
  { name: 'MOLECULAR BIOLOGY', code: 'MOLBIO', type: 'analytical' },
  { name: 'FOOD', code: 'FOOD', type: 'analytical' },
  { name: 'WATER', code: 'WATER', type: 'analytical' },
  { name: 'CHEMICAL', code: 'CHEM', type: 'analytical' },
  { name: 'PHARMA CHEMICAL', code: 'PCHEM', type: 'analytical' },
  { name: 'HPTLC / STABILITY', code: 'HPTLC', type: 'analytical' },
  { name: 'HERBAL', code: 'HERB', type: 'analytical' },
  { name: 'COSMETICS', code: 'COSM', type: 'analytical' },
  { name: 'ENVIRONMENTAL', code: 'ENV', type: 'analytical' },
  { name: 'INSTRUMENTATION', code: 'INST', type: 'analytical' },
  { name: 'MECHANICAL', code: 'MECH', type: 'analytical' },
  { name: 'RADIOLOGICAL', code: 'RAD', type: 'analytical' },
  { name: 'VALIDATION', code: 'VAL', type: 'analytical' },
  { name: 'GENERIC', code: 'GEN', type: 'analytical' },

  // ── ADMINISTRATIVE / OPERATIONS DEPARTMENTS ──
  { name: 'ADMINISTRATION', code: 'ADMIN', type: 'administrative' },
  { name: 'QUALITY ASSURANCE', code: 'QA', type: 'administrative' },
  { name: 'BOOKING', code: 'BOOK', type: 'administrative' },
  { name: 'CUSTOMER COORDINATOR', code: 'CC', type: 'administrative' },
  { name: 'MARKETING', code: 'MKT', type: 'administrative' },
  { name: 'ACCOUNTS & HR', code: 'ACCHR', type: 'administrative' },
  { name: 'IT', code: 'IT', type: 'administrative' },
  { name: 'REVIEW', code: 'REV', type: 'administrative' },
  { name: 'PRINTING', code: 'PRT', type: 'administrative' },
  { name: 'INVOICE', code: 'INV', type: 'administrative' },
  { name: 'PURCHASE', code: 'PUR', type: 'administrative' },
  { name: 'OUTSOURCE', code: 'OUT', type: 'administrative' },
  { name: 'SAMPLE ARCHIVE', code: 'ARCH', type: 'administrative' },
];

// ═══════════════════════════════════════════════════════════════
// EMPLOYEE DATA - Cleaned, structured, role-accurate
// ═══════════════════════════════════════════════════════════════
const EMPLOYEES = [
  // ══════════════════════ ADMINISTRATION (6) ══════════════════════
  { dept: 'ADMINISTRATION', name: 'Dr. Saurabh Arora', designation: 'Executive Director', qualification: 'Ph.D. (Pharmaceutics)', experience: 18, sysRole: 'LAB_DIRECTOR', deptRole: 'head' },
  { dept: 'ADMINISTRATION', name: 'Dr. Neha S Arora', designation: 'Director', qualification: 'Ph.D. (Pharmacognosy)', experience: 17, sysRole: 'LAB_DIRECTOR', deptRole: 'head' },
  { dept: 'ADMINISTRATION', name: 'Mr. D Sanyal', designation: 'Consultant', qualification: 'B.Sc. (PCM)', experience: 48, sysRole: 'LAB_DIRECTOR', deptRole: 'head' },
  { dept: 'ADMINISTRATION', name: 'Ms. Silpi Rani Kalita', designation: 'SBU Head, Quality Manager & Person In-Charge', qualification: 'M.Pharm', experience: 16, sysRole: 'QUALITY_MANAGER', deptRole: 'head' },
  { dept: 'ADMINISTRATION', name: 'Mr. Ashu Kumar', designation: 'Deputy SBU Head & Manager-Technical (Pharma)', qualification: 'M.Sc. (Chemistry)', experience: 18, sysRole: 'QUALITY_MANAGER', deptRole: 'reviewer' },
  { dept: 'ADMINISTRATION', name: 'Mr. Sanjeev Kumar Tiwari', designation: 'Person In-Charge & Deputy Manager-Technical', qualification: 'M.Sc. (Chemistry)', experience: 20, sysRole: 'QUALITY_MANAGER', deptRole: 'reviewer' },

  // ══════════════════════ QUALITY ASSURANCE (8) ══════════════════════
  { dept: 'QUALITY ASSURANCE', name: 'Mr. Padam Garg', designation: 'Asst. Manager', qualification: 'B.Sc. (CBZ)', experience: 20, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'QUALITY ASSURANCE', name: 'Mr. Deepak Kumar', designation: 'Executive-QA', qualification: 'M.Pharma (Pharmaceutics)', experience: 5.4, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'QUALITY ASSURANCE', name: 'Ms. Tonia', designation: 'Officer-QA', qualification: 'B.Sc. (CBZ)', experience: 9.8, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'QUALITY ASSURANCE', name: 'Mr. Jaishankar Poddar', designation: 'Officer-QA', qualification: 'B.Pharm', experience: 3.6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'QUALITY ASSURANCE', name: 'Ms. Snigdha Dey', designation: 'Jr. Officer-QA', qualification: 'B.Pharm', experience: 3, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'QUALITY ASSURANCE', name: 'Ms. Vartika Srivastava', designation: 'Jr. Officer-QA', qualification: 'M.Sc. (Food-Tech)', experience: 1.6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'QUALITY ASSURANCE', name: 'Ms. Masoom', designation: 'Jr. Officer-QA', qualification: 'M.Sc. (Food-Tech)', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'QUALITY ASSURANCE', name: 'Mr. Saurabh', designation: 'Asst.-QA', qualification: 'B.A. (Pursuing)', experience: 4, sysRole: 'ANALYST', deptRole: 'member' },

  // ══════════════════════ HPLC (18) ══════════════════════
  { dept: 'HPLC', name: 'Mr. Vinod Kumar', designation: 'Asst. Manager-Technical', qualification: 'M.Sc. (Bio-tech)', experience: 13, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'HPLC', name: 'Mr. Mohd. Adil', designation: 'Sr. Executive-Technical', qualification: 'M.Sc. (Bio-tech)', experience: 10, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'HPLC', name: 'Mr. Sandeep Kumar', designation: 'Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 8, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'HPLC', name: 'Mr. Ashutosh Kumar Singh', designation: 'Executive-Technical', qualification: 'B.Pharm', experience: 8, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'HPLC', name: 'Mr. Mohd. Imran', designation: 'Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 8, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'HPLC', name: 'Mr. Vinod Kumar (B.Pharm)', designation: 'Sr. Officer-Technical', qualification: 'B.Pharm', experience: 7, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Mr. Sachin Kumar Sharma', designation: 'Sr. Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Mr. Sonu', designation: 'Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 5, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Mr. Gaurav Kumar', designation: 'Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Mr. Jitendra Kumar', designation: 'Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Mr. Ashish Chauhan', designation: 'Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 4.4, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Ms. Pratiksha Pandey', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Organic Chemistry)', experience: 2, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Mr. Aditya Tiwari', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (Chemistry)', experience: 2, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Mr. Subham Chaube', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (Chemistry)', experience: 1.5, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Ms. Vandana Chaudhary', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Mr. Aman Bhardwaj', designation: 'Trainee-Technical', qualification: 'B.Sc. (PCM)', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPLC', name: 'Mr. Bhawan Singh', designation: 'Sr. Asst.-Technical', qualification: '12th Std.', experience: 31, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'HPLC', name: 'Mr. Roshan', designation: 'Trainee', qualification: '12th Std.', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },

  // ══════════════════════ GC (5) ══════════════════════
  { dept: 'GC', name: 'Mr. Vinod Kumar (GC)', designation: 'Asst. Manager-Technical', qualification: 'M.Sc. (Chemistry)', experience: 16, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'GC', name: 'Mr. Sagar Chand', designation: 'Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 10, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'GC', name: 'Mr. Divyansh Swami', designation: 'Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 8.7, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'GC', name: 'Mr. Rahul Kumar (GC)', designation: 'Officer-Technical', qualification: 'B.Pharm', experience: 8, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'GC', name: 'Mr. Ankit Sharma', designation: 'Jr. Officer-Technical', qualification: 'M.Pharm (Pharmaceutics)', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },

  // ══════════════════════ MOLECULAR BIOLOGY (1) ══════════════════════
  { dept: 'MOLECULAR BIOLOGY', name: 'Ms. Urvashi Chauhan', designation: 'Trainee-Technical', qualification: 'M.Sc. (Bio-tech)', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },

  // ══════════════════════ HPTLC / STABILITY (5) ══════════════════════
  { dept: 'HPTLC / STABILITY', name: 'Mr. Rahul Pal', designation: 'Officer-Technical', qualification: 'M.Sc. (Organic-Chemistry)', experience: 7, sysRole: 'ANALYST', deptRole: 'head' },
  { dept: 'HPTLC / STABILITY', name: 'Ms. Vaishali', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 2.5, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPTLC / STABILITY', name: 'Mr. Shyam Sundar', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'HPTLC / STABILITY', name: 'Mr. Ranveer Rai', designation: 'Sr. Asst.-Technical', qualification: '12th Std.', experience: 32, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'HPTLC / STABILITY', name: 'Mr. Bipin Kumar Ray', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 7, sysRole: 'ANALYST', deptRole: 'member' },

  // ══════════════════════ ICP-MS (5) ══════════════════════
  { dept: 'ICP-MS', name: 'Mr. Keshav Lal Barnwal', designation: 'Sr. Executive-Technical', qualification: 'M.Sc. (Bio-Chemistry)', experience: 9.8, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'ICP-MS', name: 'Ms. Minal M. Garud', designation: 'Officer-Technical', qualification: 'B.Sc. (Chemistry)', experience: 10.9, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'ICP-MS', name: 'Mr. Kushagar Pawar', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 4.6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'ICP-MS', name: 'Mr. Prashant Tiwari', designation: 'Jr. Officer-Technical', qualification: 'M. Pharm', experience: 2.1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'ICP-MS', name: 'Mr. Sunil Kumar', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 10, sysRole: 'ANALYST', deptRole: 'member' },

  // ══════════════════════ WATER (4) ══════════════════════
  { dept: 'WATER', name: 'Ms. Puja Kumari', designation: 'Assistant Manager-Technical', qualification: 'B.Sc. Hons. (CBZ)', experience: 12, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'WATER', name: 'Ms. Ekta Rajput', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 2.3, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'WATER', name: 'Mr. Ravi Kumar Maurya', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'WATER', name: 'Mr. Sagar', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },

  // ══════════════════════ FOOD (11) ══════════════════════
  { dept: 'FOOD', name: 'Mr. Deepak Kumar Pant', designation: 'Assistant Manager-Technical', qualification: 'B.Sc. (Physics)', experience: 19, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'FOOD', name: 'Ms. Megha', designation: 'Assistant Manager-Technical', qualification: 'M.Sc. (Food-Tech)', experience: 9, sysRole: 'DEPARTMENT_HEAD', deptRole: 'reviewer' },
  { dept: 'FOOD', name: 'Mr. Rahul Negi', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Food-Tech)', experience: 4, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'FOOD', name: 'Ms. Ragini Shukla', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 3.5, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'FOOD', name: 'Ms. Ninku Kumari', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 3.5, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'FOOD', name: 'Ms. Swati Singh', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Food-Tech)', experience: 2.4, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'FOOD', name: 'Mr. Hemant Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 2.8, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'FOOD', name: 'Mr. Shivam Shakya', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 2.4, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'FOOD', name: 'Mr. Hariom', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Food-Tech)', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'FOOD', name: 'Ms. Ankita Kushwaha', designation: 'Trainee-Technical', qualification: 'B.Sc. (PCM)', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'FOOD', name: 'Mr. Manish Kumar', designation: 'Trainee-Technical', qualification: 'M.Sc. (Chemistry)', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },

  // ══════════════════════ CHEMICAL (21) ══════════════════════
  { dept: 'CHEMICAL', name: 'Ms. Surbhi Sharma', designation: 'Assistant Manager-Technical', qualification: 'M.Sc. (Bio-tech)', experience: 15, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'CHEMICAL', name: 'Mr. Rahul Kumar (Chem)', designation: 'Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 5.6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Rajeev Pant', designation: 'Officer-Technical', qualification: 'B. Pharm', experience: 4.0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Ms. Sonam Sachan', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Bio-tech)', experience: 4.0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Sachin Kumar (Chem)', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 3, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Dhruv Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (PCM)', experience: 2.7, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Vipinder Singh', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Organic Chemistry)', experience: 2, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Ms. Mahima', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (Life Science)', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Adarsh Sharma', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Prashant Raghav', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Ms. Kanika', designation: 'Jr. Officer-Technical', qualification: 'B.Pharm', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Shivam Singh', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Abhishek Jaiswal', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Ms. Induja Sharma', designation: 'Trainee-Technical', qualification: 'B.Sc. (PCM)', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Aditya Kaushik', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Pankaj Kr. Yadav', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Ms. Poonam', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Ms. Deepti Singh', designation: 'Trainee-Technical', qualification: 'B.Pharm', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CHEMICAL', name: 'Mr. Ram Babu', designation: 'Jr. Officer-Operations', qualification: 'B.Sc.', experience: 4.6, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CHEMICAL', name: 'Mr. Dhan Singh', designation: 'Sr. Assistant-Operations', qualification: '12th Std.', experience: 22.8, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CHEMICAL', name: 'Mr. Hariom Bhanwar', designation: 'Assistant-Operations', qualification: '8th Std.', experience: 11, sysRole: 'ANALYST', deptRole: 'member' },

  // ══════════════════════ LCMS/GCMS (10) ══════════════════════
  { dept: 'LCMS/GCMS', name: 'Mr. Pushpender Kumar', designation: 'Assistant Manager-Technical', qualification: 'M.Sc. (Chemistry)', experience: 22, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'LCMS/GCMS', name: 'Mr. Sanjay Kumar Sharma', designation: 'Deputy Manager-Technical', qualification: 'M.Sc. (Chemistry)', experience: 17, sysRole: 'DEPARTMENT_HEAD', deptRole: 'reviewer' },
  { dept: 'LCMS/GCMS', name: 'Mr. Neeraj Sharma', designation: 'Sr. Executive-Technical', qualification: 'M.Sc. (Chemistry)', experience: 14, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'LCMS/GCMS', name: 'Mr. Munna Kumar Singh', designation: 'Sr. Executive-Technical', qualification: 'M.Sc. (Chemistry Hons.)', experience: 12.5, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'LCMS/GCMS', name: 'Mr. Ganesh', designation: 'Officer-Technical', qualification: 'M.Sc. (Chemistry)', experience: 5, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'LCMS/GCMS', name: 'Mr. Kuldeep Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Sc. (CBZ)', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'LCMS/GCMS', name: 'Mr. Girdhar Kumar Sahu', designation: 'Jr. Officer-Technical', qualification: 'M.Pharm', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'LCMS/GCMS', name: 'Mr. Prince Kumar Thakur', designation: 'Trainee-Technical', qualification: 'M.Sc. (Bio-Tech)', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'LCMS/GCMS', name: 'Mr. Sachin (LCMS)', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 9, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'LCMS/GCMS', name: 'Mr. Varun Singh', designation: 'Assistant-Operations', qualification: '10th Std.', experience: 7, sysRole: 'ANALYST', deptRole: 'member' },

  // ══════════════════════ MICROBIOLOGY (15) ══════════════════════
  { dept: 'MICROBIOLOGY', name: 'Mr. Amit Shakya', designation: 'Assistant Manager-Technical', qualification: 'M.Sc. (Microbiology)', experience: 9, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'MICROBIOLOGY', name: 'Mr. Ganga Singh', designation: 'Executive-Technical', qualification: 'B.Sc. (CBZ)', experience: 27, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'MICROBIOLOGY', name: 'Ms. Surya G', designation: 'Executive-Technical', qualification: 'M.Sc. (Microbiology)', experience: 14, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'MICROBIOLOGY', name: 'Mr. Vaibhav Tyagi', designation: 'Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Mr. Deepak Kumar (Micro)', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 4, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Mr. Madhav Singh', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 4, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Mr. Pankaj', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Food Microbiology & Toxicology)', experience: 4, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Mr. Shivam Agnihotri', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 3, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Mr. Sumit Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Tech (Bio-Tech)', experience: 2.2, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Ms. Deepa Tyagi', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 1.1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Ms. Kajal Sharma', designation: 'Jr. Officer-Technical', qualification: 'M.Sc. (Microbiology)', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Mr. Anit Kumar', designation: 'Jr. Officer-Technical', qualification: 'B.Tech (Bio-Tech)', experience: 1.4, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Ms. Priyanka Thakur', designation: 'Trainee-Technical', qualification: 'M.Sc. (Bio-Tech)', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Ms. Dipika', designation: 'Trainee-Technical', qualification: 'M.Sc. (Microbiology)', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MICROBIOLOGY', name: 'Mr. Vikash', designation: 'Assistant-Operations', qualification: '10th Std.', experience: 6, sysRole: 'ANALYST', deptRole: 'member' },

  // ══════════════════════ ACCOUNTS & HR (3) ══════════════════════
  { dept: 'ACCOUNTS & HR', name: 'Mr. Tejpal Singh', designation: 'Accounts Officer', qualification: 'B.Com, MBA', experience: 15, sysRole: 'ACCOUNTS', deptRole: 'head' },
  { dept: 'ACCOUNTS & HR', name: 'Mr. Manjesh', designation: 'Junior Officer-Finance & Accounts', qualification: 'B.A', experience: 2.6, sysRole: 'ACCOUNTS', deptRole: 'analyst' },
  { dept: 'ACCOUNTS & HR', name: 'Mr. Bhupesh', designation: 'HR-Executive', qualification: 'MBA (HR)', experience: 3.6, sysRole: 'ACCOUNTS', deptRole: 'analyst' },

  // ══════════════════════ IT (5) ══════════════════════
  { dept: 'IT', name: 'Mr. Gurpreet Singh', designation: 'Manager-IT', qualification: 'GNIIT, B.Com', experience: 18, sysRole: 'ADMIN', deptRole: 'head' },
  { dept: 'IT', name: 'Mr. Parmesh Kumar', designation: 'Network Administrator', qualification: 'M.Sc. (IT), MCSE, MCSA, CCNA, RHCE', experience: 17, sysRole: 'ADMIN', deptRole: 'reviewer' },
  { dept: 'IT', name: 'Mr. Bhuwan Singh Bhandari', designation: 'Jr. Officer', qualification: '12th Std.', experience: 15, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'IT', name: 'Mr. Ajay Prakash Srivastava', designation: 'IT-Executive', qualification: 'M.C.A', experience: 12, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'IT', name: 'Mr. Deepak Maheshwari', designation: 'IT-Executive', qualification: 'B.Sc. (PCB)', experience: 16.5, sysRole: 'ANALYST', deptRole: 'analyst' },

  // ══════════════════════ BOOKING (8) ══════════════════════
  { dept: 'BOOKING', name: 'Mr. Sanjiv Kumar', designation: 'Assistant Manager-Operations', qualification: 'B.A', experience: 17, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'BOOKING', name: 'Mr. Rahul Kumar Singh', designation: 'Officer-Operations', qualification: 'B.A', experience: 13, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'BOOKING', name: 'Mr. Rishesh Pradhan', designation: 'Officer-Operations', qualification: 'B.A', experience: 9, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'BOOKING', name: 'Mr. Rahul Saini', designation: 'Jr. Officer-Operations', qualification: 'B.A', experience: 6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'BOOKING', name: 'Mr. Harish Singh', designation: 'Assistant-Operations', qualification: 'BBA', experience: 7, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'BOOKING', name: 'Mr. Deepak Kumar (Booking)', designation: 'Assistant-Operations', qualification: 'B.A', experience: 11, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'BOOKING', name: 'Mr. Nitish Kumar', designation: 'Assistant-Operations', qualification: 'B.Com', experience: 2, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'BOOKING', name: 'Ms. Ariba Bano', designation: 'Trainee-Operations', qualification: '12th Std.', experience: 1, sysRole: 'ANALYST', deptRole: 'analyst' },

  // ══════════════════════ CUSTOMER COORDINATOR (22) ══════════════════════
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Kaushal Kumar', designation: 'Deputy Manager-Operations', qualification: 'M.Sc. (Chemistry), MBA', experience: 30, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Ms. Pooja Pathela', designation: 'Assistant Manager-Operations', qualification: 'M.B.A', experience: 17, sysRole: 'DEPARTMENT_HEAD', deptRole: 'reviewer' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Ms. Prasanna Rajan', designation: 'Sr. Officer-Operations', qualification: '12th Std.', experience: 32, sysRole: 'ANALYST', deptRole: 'reviewer' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Akash Kumar Sharma', designation: 'Executive-Operations', qualification: 'B.A', experience: 11, sysRole: 'ANALYST', deptRole: 'reviewer' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Ajay Kumar (CC)', designation: 'Executive-Operations', qualification: 'B.A', experience: 8, sysRole: 'ANALYST', deptRole: 'reviewer' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Ms. Neha Thukral', designation: 'Officer-Operations', qualification: 'B.A', experience: 4, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Amit Kumar Rawat', designation: 'Officer-Operations', qualification: 'B.A', experience: 17, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Amandeep Singh', designation: 'Officer-Operations', qualification: 'B.A. Pursuing', experience: 10, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Bunty', designation: 'Officer-Operations', qualification: 'B.A', experience: 7, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Robin Bhandari', designation: 'Jr. Officer', qualification: 'B.A', experience: 5, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Sudesh Kumar', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 7, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Laxman', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 15, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Nitin', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 2, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Shivansh Sabharwal', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 3, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Nafish Ahmad', designation: 'Assistant-Operations', qualification: '12th Std.', experience: 17, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Mangal Jha', designation: 'Sr. Assistant-Support', qualification: '8th Std.', experience: 23, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Shanker Ray', designation: 'Sr. Assistant-Operations', qualification: '8th Std.', experience: 27, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Dinesh', designation: 'Assistant-Support', qualification: '12th Std.', experience: 5, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Parvinder Kumar Shrivastava', designation: 'Assistant-Support', qualification: '12th Std.', experience: 3, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Ms. Preeti Mitra', designation: 'Receptionist', qualification: 'B.A', experience: 9, sysRole: 'RECEPTIONIST', deptRole: 'member' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Karan', designation: 'Trainee', qualification: 'B.A', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'CUSTOMER COORDINATOR', name: 'Mr. Amit (CC)', designation: 'Trainee-Operations', qualification: '10th Std.', experience: 0, sysRole: 'ANALYST', deptRole: 'analyst' },

  // ══════════════════════ MARKETING (19) ══════════════════════
  { dept: 'MARKETING', name: 'Mr. Manish Ranjan', designation: 'Vice President-Corporate', qualification: 'MBA, PGDIT', experience: 15, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'MARKETING', name: 'Mr. Ajai Dutt Sharma', designation: 'Vice President-Corporate', qualification: 'M.Sc. (Food-Tech.)', experience: 22, sysRole: 'DEPARTMENT_HEAD', deptRole: 'head' },
  { dept: 'MARKETING', name: 'Mr. Deepak Arora', designation: 'G.M. (Sales)', qualification: 'BBA', experience: 18, sysRole: 'DEPARTMENT_HEAD', deptRole: 'reviewer' },
  { dept: 'MARKETING', name: 'Mr. Sachin Kumar (Mkt)', designation: 'Sr. Manager-Business Development', qualification: '12th Std.', experience: 22, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'MARKETING', name: 'Mr. Abhishek Aghi', designation: 'Sr. Manager-Business Development', qualification: '12th Std.', experience: 15, sysRole: 'REVIEWER', deptRole: 'reviewer' },
  { dept: 'MARKETING', name: 'Mr. Budhi Nath Singh', designation: 'Business Development Officer', qualification: 'B.A', experience: 15, sysRole: 'MARKETING', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Mr. Dilip Debnath', designation: 'Business Development Officer', qualification: 'B.A', experience: 11, sysRole: 'MARKETING', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Ms. Sudha Singh', designation: 'Business Development Officer', qualification: 'Dip. In Civil Engg.', experience: 9, sysRole: 'MARKETING', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Mr. Nikhil Rana', designation: 'Sr. Officer-Operations', qualification: 'B.Com', experience: 6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Mr. Sandeep Kumar (Mkt)', designation: 'Sr. Officer-Operations', qualification: 'B.A', experience: 6, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Mr. Devashish Vishwas', designation: 'Jr. Officer-Operations', qualification: 'B.A', experience: 5, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Ms. Jyoti Chauhan', designation: 'Business Development Officer', qualification: 'B.A', experience: 2, sysRole: 'MARKETING', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Mr. Ankit (Mkt)', designation: 'Business Development Officer', qualification: 'Dip. In Mech. Engg.', experience: 2, sysRole: 'MARKETING', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Mr. Mayank', designation: 'Jr. Officer-Operations', qualification: 'B.Com', experience: 3, sysRole: 'ANALYST', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Mr. Chiranjit Basak', designation: 'Business Development Officer (Kolkata)', qualification: '10th Std.', experience: 13, sysRole: 'MARKETING', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Ms. Neha (Mkt)', designation: 'Senior Officer-Business Development', qualification: 'B.A', experience: 8, sysRole: 'MARKETING', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Mr. Ajay Kumar (Mkt)', designation: 'Business Development Officer', qualification: '12th Std.', experience: 3, sysRole: 'MARKETING', deptRole: 'analyst' },
  { dept: 'MARKETING', name: 'Mr. Rajesh Pal', designation: 'Sr. Assistant-Operations', qualification: '12th Std.', experience: 18, sysRole: 'ANALYST', deptRole: 'member' },
  { dept: 'MARKETING', name: 'Mr. Bikash Das', designation: 'Logistics Coordinator', qualification: 'B.A', experience: 3, sysRole: 'ANALYST', deptRole: 'member' },
];

// ═══════════════════════════════════════════════════════════════
// USERNAME GENERATOR
// ═══════════════════════════════════════════════════════════════
function generateUsername(name, existingUsernames) {
  let clean = name
    .replace(/^(Mr\.|Ms\.|Dr\.)\s*/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')  // remove (GC), (Chem), etc.
    .trim();

  const parts = clean.split(/\s+/);
  let username;
  if (parts.length === 1) {
    username = parts[0].toLowerCase();
  } else {
    username = (parts[0] + '.' + parts[parts.length - 1]).toLowerCase();
  }
  username = username.replace(/[^a-z0-9.]/g, '');

  let finalUsername = username;
  let counter = 2;
  while (existingUsernames.has(finalUsername)) {
    finalUsername = username + counter;
    counter++;
  }
  existingUsernames.add(finalUsername);
  return finalUsername;
}

// ═══════════════════════════════════════════════════════════════
// MAIN SEEDER
// ═══════════════════════════════════════════════════════════════
async function cleanReseed() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('  CLEAN RESEED - Starting fresh');
    console.log('═══════════════════════════════════════════\n');

    // Step 1: Clear old data (preserve structure)
    console.log('Step 1: Clearing old data...');
    // Disable FK checks for SQLite
    await db.sequelize.query('PRAGMA foreign_keys = OFF;');
    await db.DepartmentUser.destroy({ where: {}, force: true });
    await db.Employee.destroy({ where: {}, force: true });
    // Clear other tables that reference users
    await db.AuditLog.destroy({ where: {}, force: true });
    await db.Notification.destroy({ where: {}, force: true });
    await db.Review.destroy({ where: {}, force: true });
    await db.Result.destroy({ where: {}, force: true });
    await db.ResultParameter.destroy({ where: {}, force: true });
    await db.BookingTest.destroy({ where: {}, force: true });
    await db.Booking.destroy({ where: {}, force: true });
    await db.Sample.destroy({ where: {}, force: true });
    await db.SampleReception.destroy({ where: {}, force: true });
    await db.User.destroy({ where: {}, force: true });
    await db.Department.destroy({ where: {}, force: true });
    await db.sequelize.query('PRAGMA foreign_keys = ON;');
    console.log('  ✓ Cleared users, employees, departments, assignments\n');

    // Step 2: Create clean departments
    console.log('Step 2: Creating departments...');
    const deptMap = {};
    for (const d of DEPARTMENTS) {
      const dept = await db.Department.create({
        name: d.name,
        code: d.code,
        type: d.type,
        isActive: true,
        tatDays: d.type === 'analytical' ? 7 : 3,
      });
      deptMap[d.name] = dept;
      console.log(`  ✓ ${d.name} (${d.type})`);
    }
    console.log(`  Total: ${DEPARTMENTS.length} departments\n`);

    // Step 3: Create admin user
    console.log('Step 3: Creating system admin user...');
    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const adminUser = await db.User.create({
      username: 'admin',
      password: hashedAdmin,
      fullName: 'System Administrator',
      email: 'admin@aurigalab.com',
      role: 'ADMIN',
      isActive: true,
    });
    console.log('  ✓ admin / admin123\n');

    // Step 4: Create all employees
    console.log('Step 4: Creating employees...');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const existingUsernames = new Set(['admin']);
    const deptCounts = {};
    let created = 0;

    for (const emp of EMPLOYEES) {
      // Clean display name
      const fullName = emp.name
        .replace(/^(Mr\.|Ms\.|Dr\.)\s*/i, '')
        .replace(/\s*\(.*?\)\s*/g, '')
        .trim();

      const username = generateUsername(emp.name, existingUsernames);

      // Create user
      const user = await db.User.create({
        username,
        password: hashedPassword,
        fullName,
        email: `${username.replace(/\./g, '')}@aurigalab.com`,
        phone: '',
        role: emp.sysRole,
        isActive: true,
      });

      // Assign to department
      const dept = deptMap[emp.dept];
      if (dept) {
        await db.DepartmentUser.create({
          userId: user.id,
          departmentId: dept.id,
          role: emp.deptRole,
        });
        deptCounts[emp.dept] = (deptCounts[emp.dept] || 0) + 1;
      } else {
        console.log(`  ⚠ No department: "${emp.dept}" for ${username}`);
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
    }

    console.log(`\n  Total employees created: ${created}\n`);

    // Step 5: Summary
    console.log('═══════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`\n  Departments: ${DEPARTMENTS.length}`);
    console.log(`  Users: ${created + 1} (${created} employees + 1 admin)`);
    console.log(`\n  Department breakdown:`);

    const analyticalDepts = [];
    const adminDepts = [];

    Object.entries(deptCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([dept, count]) => {
        const d = DEPARTMENTS.find(dd => dd.name === dept);
        const line = `    ${dept}: ${count} members`;
        if (d?.type === 'analytical') analyticalDepts.push(line);
        else adminDepts.push(line);
      });

    console.log('\n  ANALYTICAL:');
    analyticalDepts.forEach(l => console.log(l));
    console.log('\n  ADMINISTRATIVE:');
    adminDepts.forEach(l => console.log(l));

    console.log(`\n  ─────────────────────────────────────`);
    console.log(`  Credentials:`);
    console.log(`    Admin:     admin / admin123`);
    console.log(`    Everyone:  <username> / ${DEFAULT_PASSWORD}`);
    console.log(`  ─────────────────────────────────────\n`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

cleanReseed();
