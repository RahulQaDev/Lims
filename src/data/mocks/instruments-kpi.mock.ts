/**
 * Mock data for Instruments page KPI strip (KPIs 19, 20, 22, 23, 24).
 * Formula source: Roles_Permision_Notification Central.xlsx
 */

export interface InstrumentsKpi {
  // KPI 19
  calibrationCompliancePct: number;
  calibrationDays: { done: number; total: number };

  // KPI 20
  pmCompliancePct: number;
  pmCounts: { done: number; total: number };

  // KPI 22 — Machine Utilization
  machineUtilizationPct: number;
  machineUtilizationDelta: number;
  machineUtilizationTarget: number;       // 65% FY27 target
  machineUtilizationSeries: number[];     // 12-week

  // KPI 23
  downtimeHours: number;
  downtimeDelta: number;

  // KPI 24
  instrumentBreakdowns: number;
}

export const MOCK_INSTRUMENTS_KPI: InstrumentsKpi = {
  calibrationCompliancePct: 100,
  calibrationDays: { done: 22, total: 22 },

  pmCompliancePct: 100,
  pmCounts: { done: 4, total: 4 },

  machineUtilizationPct: 81,
  machineUtilizationDelta: 5,
  machineUtilizationTarget: 65,
  machineUtilizationSeries: [58, 62, 65, 68, 70, 72, 69, 73, 75, 78, 76, 81],

  downtimeHours: 3,
  downtimeDelta: -1.5,

  instrumentBreakdowns: 1,
};
