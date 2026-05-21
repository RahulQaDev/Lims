/**
 * Mock data for the Booking Personnel Dashboard.
 * Mirrors the structure of analyst-dashboard.mock.ts so that when the backend
 * arrives, only the fetching layer changes.
 *
 * Panels (per Auriga_Booking_Dashboard.html):
 *  - Hero: Performance Score composite
 *  - Panel 1: Today's To-Do strip
 *  - Panel 2: Booking Performance (4 sparkline cards + SLA counters)
 *  - Panel 3: Quality & Rework (count, rate, reason donut, barcode acc, errors, complaints)
 *  - Panel 4: Daily Discipline (3 gauges)
 *  - Panel 5: Learning & Growth (training tiles + skill matrix + growth path + milestone)
 */

// ── Hero ──────────────────────────────────────────────────
export interface BookingHeroData {
  periodLabel: string;
  performanceScore: number;
  delta: number;
  status: 'On Track' | 'At Risk' | 'Off Track';
  coreKpis: { completion: number; onTime: number; accuracy: number };
  discipline: { logBook: number; training: number; attendance: number };
  trendLabels: string[];
  trendValues: number[];
}

// ── Panel 1 — Today ───────────────────────────────────────
export interface BookingTodayData {
  logBookDone: boolean;
  assignedToday: number;
  bookedToday: number;
  pendingToday: number;
  awaitingBarcode: number;
  rebookingsToday: number;
}

// ── Panel 2 — Booking Performance ─────────────────────────
export interface BookingPerformanceData {
  completionRate:   { value: number; delta: number; target: number; series: number[] };
  onTimeBooking:    { value: number; delta: number; target: number; series: number[] };
  avgBookingTat:    { value: number; delta: number; unit: 'hrs'; series: number[] };
  bookingAccuracy:  { value: number; delta: number; target: number; series: number[] };
  // Aggregate counts for the period
  samplesAssigned: number;
  samplesBooked: number;
  samplesPending: number;
  slaBreached: number;
  severelyLate: number; // samples > 8 hrs late
}

// ── Panel 3 — Quality & Rework ────────────────────────────
export interface BookingQualityData {
  rebookingCount:  { value: number; delta: number };
  rebookingRate:   { value: number; delta: number; target: number; series: number[] };
  rebookingReasons: { label: string; value: number; color: string }[];
  barcodeAccuracy: { value: number; delta: number; target: number };
  bookingErrorsQa: number;
  customerComplaints: number;
}

// ── Panel 4 — Daily Discipline ────────────────────────────
export interface BookingDisciplineData {
  logBookCompliance: { pct: number; sub: string };
  barcodeSameDay:    { pct: number; sub: string };
  attendance:        { pct: number; sub: string };
}

// ── Panel 5 — Learning & Growth ───────────────────────────
export interface BookingGrowthData {
  training: {
    assigned: number;
    completed: number;
    pending: number;
    completedNames: string;
    pendingNames: string;
    completionPct: number;
    hoursYtd: number;
    hoursTarget: number;
  };
  skills: { label: string; level: number }[];
  growthPath: {
    currentRole: string;
    nextRole: string;
    progressPct: number;
    labels: string[];
    actual: (number | null)[];
    target: number[];
  };
  milestone: { title: string; description: string; items: string[] };
}

// ─── Mock values ───────────────────────────────────────────

export const B_MOCK_HERO: BookingHeroData = {
  periodLabel: 'Booking performance · April 2026',
  performanceScore: 87.4,
  delta: 2.1,
  status: 'On Track',
  coreKpis:   { completion: 93.3, onTime: 94.2, accuracy: 96.5 },
  discipline: { logBook: 100, training: 60.0, attendance: 95.5 },
  trendLabels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  trendValues: [81, 83, 82, 84, 85, 86, 87.4],
};

export const B_MOCK_TODAY: BookingTodayData = {
  logBookDone: true,
  assignedToday: 60,
  bookedToday: 56,
  pendingToday: 4,
  awaitingBarcode: 3,
  rebookingsToday: 2,
};

export const B_MOCK_PERFORMANCE: BookingPerformanceData = {
  completionRate: {
    value: 93.3, delta: 1.8, target: 95,
    series: [88, 90, 89, 91, 92, 91, 92, 93, 92, 94, 93, 93.3],
  },
  onTimeBooking: {
    value: 94.2, delta: -1.3, target: 99,
    series: [92, 94, 95, 96, 95.5, 95, 96, 95, 96, 95.5, 94.5, 94.2],
  },
  avgBookingTat: {
    value: 1.8, delta: -0.4, unit: 'hrs',
    series: [2.8, 2.5, 2.4, 2.3, 2.1, 2.2, 2.3, 2.0, 2.1, 1.9, 2.0, 1.8],
  },
  bookingAccuracy: {
    value: 96.5, delta: 0.5, target: 98,
    series: [94, 94.5, 95, 95.2, 95.8, 96, 95.5, 96, 96.2, 96.5, 96.3, 96.5],
  },
  samplesAssigned: 1248,
  samplesBooked: 1164,
  samplesPending: 84,
  slaBreached: 12,
  severelyLate: 3,
};

export const B_MOCK_QUALITY: BookingQualityData = {
  rebookingCount: { value: 18, delta: 4 },
  rebookingRate: {
    value: 1.5, delta: 0.4, target: 1,
    series: [0.9, 1.0, 1.1, 1.0, 1.2, 1.1, 1.3, 1.2, 1.4, 1.3, 1.4, 1.5],
  },
  rebookingReasons: [
    { label: 'Wrong Parameters', value: 7, color: '#dc2626' },
    { label: 'Wrong Pricing',    value: 5, color: '#f59e0b' },
    { label: 'Customer Change',  value: 3, color: '#2563eb' },
    { label: 'Wrong Template',   value: 2, color: '#0b1c3d' },
    { label: 'Other',            value: 1, color: '#94a3b8' },
  ],
  barcodeAccuracy: { value: 99.1, delta: 0.3, target: 99 },
  bookingErrorsQa: 5,
  customerComplaints: 2,
};

export const B_MOCK_DISCIPLINE: BookingDisciplineData = {
  logBookCompliance: { pct: 100, sub: '22 of 22 days' },
  barcodeSameDay:    { pct: 94.1, sub: '1,095 of 1,164' },
  attendance:        { pct: 95.5, sub: '21 of 22 days' },
};

export const B_MOCK_GROWTH: BookingGrowthData = {
  training: {
    assigned: 5,
    completed: 3,
    pending: 2,
    completedNames: 'YLIMS · Pricing · SOP',
    pendingNames: 'Parameters · Templates',
    completionPct: 60,
    hoursYtd: 14,
    hoursTarget: 24,
  },
  skills: [
    { label: 'YLIMS Booking',        level: 4 },
    { label: 'Price List',           level: 3 },
    { label: 'Parameter Selection',  level: 2 },
    { label: 'Template Selection',   level: 2 },
    { label: 'Customer Comm.',       level: 3 },
    { label: 'Barcode System',       level: 4 },
    { label: 'Pharma Knowledge',     level: 3 },
    { label: 'Food Knowledge',       level: 2 },
    { label: 'SOP Adherence',        level: 3 },
    { label: 'Data Entry Speed',     level: 3 },
  ],
  growthPath: {
    currentRole: 'Executive',
    nextRole: 'Sr. Booking Executive',
    progressPct: 65,
    labels: ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
    actual: [6, 12, 18, 26, 34, 42, 50, 58, 65, null, null, null],
    target: [8.3, 16.7, 25, 33.3, 41.7, 50, 58.3, 66.7, 75, 83.3, 91.7, 100],
  },
  milestone: {
    title: 'Senior Booking Executive — 65% complete',
    description: 'Steady progress. To unlock:',
    items: [
      'Complete Parameters & Templates training',
      'Reduce rebooking rate below 1% (currently 1.5%)',
      'Raise Customer Communication skill from L2 → L3',
      'Process 500 more bookings with ≥98% accuracy',
    ],
  },
};

export const B_WEEK_LABELS = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
