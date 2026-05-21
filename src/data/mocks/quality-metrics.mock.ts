/**
 * Mock data for Quality Metrics page (Panel 3 — KPIs 13–18).
 * Formula source: Roles_Permision_Notification Central.xlsx
 */

export interface RedoReason {
  label: string;
  value: number;
  color: string;
}

export interface QualityMetrics {
  // KPI 13
  redoCount: number;
  redoDelta: number;            // vs last period

  // KPI 14
  redoRatePct: number;
  redoRateDelta: number;
  redoRateTarget: number;       // target ≤ 2%
  redoRateSeries: number[];     // 12-week trend

  // KPI 15
  redoReasons: RedoReason[];

  // KPI 16
  deviationCount: number;
  deviationFailToPass: number;
  deviationPassToFail: number;

  // KPI 17
  customerComplaints: number;
  complaintsDelta: number;

  // KPI 18
  labIncidents: number;
  incidentStreakDays: number;
}

export const MOCK_QUALITY: QualityMetrics = {
  redoCount: 3,
  redoDelta: 1,
  redoRatePct: 7.5,
  redoRateDelta: 1.5,
  redoRateTarget: 2,
  redoRateSeries: [8, 7, 9, 8, 6, 7, 8, 6, 5, 4, 6, 7.5],
  redoReasons: [
    { label: 'Wrong Quantity', value: 4, color: '#dc2626' },
    { label: 'Wrong Chemical', value: 3, color: '#f59e0b' },
    { label: 'Wrong Sample',   value: 2, color: '#2563eb' },
    { label: 'Method Error',   value: 1, color: '#0b1c3d' },
    { label: 'Other',          value: 1, color: '#94a3b8' },
  ],
  deviationCount: 2,
  deviationFailToPass: 1,
  deviationPassToFail: 1,
  customerComplaints: 1,
  complaintsDelta: 1,
  labIncidents: 0,
  incidentStreakDays: 45,
};
