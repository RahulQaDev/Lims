/**
 * Mock data for the Analyst Dashboard (Panels 1, 2, hero).
 * Shapes mirror the KPI spec from Roles_Permision_Notification Central.xlsx so that
 * when the backend arrives, only the fetching layer changes.
 */

export interface AnalystHeroData {
  greeting: string;          // "Good morning, Riya"
  periodLabel: string;       // "Performance snapshot · April 2026"
  performanceScore: number;  // Composite: (Completion + OnTime + Accuracy + Calibration + Training) / 5
  delta: number;             // vs last month
  status: 'On Track' | 'At Risk' | 'Off Track';
  coreKpis: { completion: number; onTime: number; accuracy: number };
  discipline: { calibration: number; training: number; attendance: number };
  trendLabels: string[];     // 7 months e.g. ['Oct', ..., 'Apr']
  trendValues: number[];     // 7 scores
}

// Panel 1 — Today's To-Do (KPIs 1–5)
export interface AnalystTodayData {
  calibrationDone: boolean;
  assignedToday: number;
  completedToday: number;
  pendingToday: number;
  nearingTat: number;
}

// Panel 2 — Sample Performance (KPIs 6–12)
export interface AnalystPerformanceData {
  // Each card: current + 12-week sparkline + delta + target
  completionRate: { value: number; delta: number; target: number; series: number[] };
  onTime:         { value: number; delta: number; target: number; series: number[] };
  avgTat:         { value: number; delta: number; unit: 'days'; series: number[] };
  accuracy:       { value: number; delta: number; target: number; series: number[] };
  // Aggregate counts for the period
  assigned: number;
  completed: number;
  pending: number;
}

export const MOCK_HERO: AnalystHeroData = {
  greeting: 'Good morning, {firstName}',
  periodLabel: 'Performance snapshot · April 2026',
  performanceScore: 89.6,
  delta: 3.2,
  status: 'On Track',
  coreKpis: { completion: 88.9, onTime: 95.0, accuracy: 97.5 },
  discipline: { calibration: 100, training: 66.7, attendance: 95.5 },
  trendLabels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  trendValues: [82, 84, 85, 83, 86, 87, 89.6],
};

export const MOCK_TODAY: AnalystTodayData = {
  calibrationDone: true,
  assignedToday: 45,
  completedToday: 40,
  pendingToday: 5,
  nearingTat: 3,
};

export const MOCK_PERFORMANCE: AnalystPerformanceData = {
  completionRate: {
    value: 88.9, delta: 2.1, target: 95,
    series: [82, 85, 84, 86, 88, 87, 86, 88, 90, 89, 87, 88.9],
  },
  onTime: {
    value: 95.0, delta: -2.0, target: 99,
    series: [92, 93, 95, 94, 96, 97, 96, 95, 97, 98, 97, 95],
  },
  avgTat: {
    value: 2.3, delta: -0.3, unit: 'days',
    series: [3.1, 2.9, 2.8, 2.6, 2.5, 2.7, 2.9, 3.0, 2.8, 2.6, 2.5, 2.3],
  },
  accuracy: {
    value: 97.5, delta: 0.8, target: 98,
    series: [95, 96, 96, 97, 96, 97, 98, 97, 98, 98, 97, 97.5],
  },
  assigned: 45,
  completed: 40,
  pending: 5,
};

export const WEEK_LABELS = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
