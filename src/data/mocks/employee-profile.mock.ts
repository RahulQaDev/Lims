/**
 * Mock data for Employee Profile page widgets (KPIs 21, 26–33).
 * Formula source: Roles_Permision_Notification Central.xlsx
 */

export interface EmployeeKpiData {
  // KPI 21 — Attendance
  attendancePct: number;
  attendanceDays: { present: number; total: number };

  // KPIs 26–30 — Training
  trainingsAssigned: number;
  trainingsCompleted: number;
  trainingsPending: number;
  trainingCompletionPct: number;
  trainingHoursYtd: number;
  trainingHoursTarget: number;
  completedTrainingNames: string[];
  pendingTrainingNames: string[];

  // KPI 31 — Personal Skill Matrix (1–4)
  skills: { label: string; level: number }[];
  skillsAverage: number;
  skillsTargetLevel: number;

  // KPI 32 — Growth Path
  growthCurrentRole: string;
  growthNextRole: string;
  growthPercent: number;
  growthDelta: 'AHEAD' | 'ON_TRACK' | 'BEHIND';
  growthLabels: string[];          // 12 months
  growthActual: (number | null)[]; // actual curve (nulls for future months)
  growthTarget: number[];          // target curve

  // KPI 33 — Next Milestone
  milestoneTitle: string;
  milestoneItems: string[];
}

export const MOCK_EMPLOYEE_KPIS: EmployeeKpiData = {
  attendancePct: 95.5,
  attendanceDays: { present: 21, total: 22 },

  trainingsAssigned: 6,
  trainingsCompleted: 4,
  trainingsPending: 2,
  trainingCompletionPct: 66.7,
  trainingHoursYtd: 18,
  trainingHoursTarget: 24,
  completedTrainingNames: ['HPLC', 'UV', 'SOP', 'FTIR'],
  pendingTrainingNames: ['GC', 'Method Valid.'],

  skills: [
    { label: 'HPLC',           level: 3 },
    { label: 'GC',             level: 2 },
    { label: 'UV-Vis',         level: 4 },
    { label: 'FTIR',           level: 3 },
    { label: 'Titration',      level: 4 },
    { label: 'Sample Prep',    level: 3 },
    { label: 'Method Valid.',  level: 2 },
    { label: 'SOP',            level: 3 },
    { label: 'LIMS',           level: 3 },
    { label: 'Troubleshoot',   level: 2 },
  ],
  skillsAverage: 3.0,
  skillsTargetLevel: 3,

  growthCurrentRole: 'Analyst',
  growthNextRole: 'Senior Analyst',
  growthPercent: 78,
  growthDelta: 'AHEAD',
  growthLabels: ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
  growthActual: [7, 14, 22, 35, 44, 54, 62, 70, 78, null, null, null],
  growthTarget: [8.3, 16.7, 25, 33.3, 41.7, 50, 58.3, 66.7, 75, 83.3, 91.7, 100],

  milestoneTitle: 'Senior Analyst — 78% complete',
  milestoneItems: [
    'Complete HPLC Level 3 training (2 hrs remaining)',
    'Pass 50 more samples with ≥98% accuracy',
    'Raise GC skill from Level 2 to Level 3',
  ],
};
