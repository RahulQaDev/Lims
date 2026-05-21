/**
 * Mock data for Chemical Consumption vs SOP (KPI 25).
 * Formula source: Roles_Permision_Notification Central.xlsx
 */

export interface ConsumptionRow {
  chemical: string;
  actual: number;
  sop: number;
  unit: string;
  /** Variance % — positive = over SOP */
  variancePct: number;
}

export const MOCK_CONSUMPTION: {
  summary: { topOverage: string; overagePct: number };
  rows: ConsumptionRow[];
} = {
  summary: {
    topOverage: 'Methanol',
    overagePct: 6,
  },
  rows: [
    { chemical: 'Methanol',     actual: 5.3, sop: 5.0, unit: 'ml/sample', variancePct: 6.0 },
    { chemical: 'Acetonitrile', actual: 4.1, sop: 4.0, unit: 'ml/sample', variancePct: 2.5 },
    { chemical: 'Water',        actual: 8.0, sop: 8.0, unit: 'ml/sample', variancePct: 0.0 },
    { chemical: 'Buffer',       actual: 3.2, sop: 3.0, unit: 'ml/sample', variancePct: 6.7 },
    { chemical: 'DMSO',         actual: 2.5, sop: 2.5, unit: 'ml/sample', variancePct: 0.0 },
    { chemical: 'IPA',          actual: 1.8, sop: 2.0, unit: 'ml/sample', variancePct: -10.0 },
  ],
};
