# LabWise LIMS -- Dashboard Intelligence Summary

**Compiled by:** Agent Q
**Date:** 2026-04-09
**Source files audited:** 17 (frontend pages, backend controllers, route files, role config)

---

## Table of Contents

1. [Default Dashboard (DashboardPage)](#1-default-dashboard)
2. [Analyst Dashboard (AnalystDashboardPage)](#2-analyst-dashboard)
3. [Booking Dashboard (BookingDashboardPage)](#3-booking-dashboard)
4. [Reception Dashboard (ReceptionDashboardPage)](#4-reception-dashboard)
5. [Master Personnel Dashboard (MasterDashboardPage)](#5-master-personnel-dashboard)
6. [Master Controller Dashboard (MasterControllerDashboardPage)](#6-master-controller-dashboard)
7. [HQ Dashboard (HQDashboardPage)](#7-hq-dashboard)
8. [Role-Level KRA/KPI Definitions](#8-role-level-krakpi-definitions)
9. [Change Log](#change-log)

---

## 1. Default Dashboard

**File:** `src/pages/dashboard/DashboardPage.tsx`
**Target roles:** All authenticated users (generic lab overview)
**Data source:** Static mock data only (no backend API calls)
**Auto-refresh:** None (static)

### Sections / Widgets

| Widget | Description |
|---|---|
| Greeting Banner | Displays user's first name and "Here is what is happening in the lab today" |
| Stat Cards (6) | Total Samples Today, Pending Booking, In Testing, Pending Review, CoA Ready, Overdue Samples |
| Quick Actions | Buttons: New Reception, New Booking, Generate CoA |
| Recent Samples Table | Last 10 samples with columns: Sample Code, Client, Name, Status, Priority, Date |
| Department Workload | Bar chart for 6 departments (HPLC, Micro Biology, ICPMS, Water, Food, GC) showing test counts against a max of 30 |
| Status Distribution | Breakdown: Received, In Testing, Pending Review, Approved, Dispatched |

### KPIs / KRAs

None -- this dashboard has no KPI/KRA tracking. It is a static overview page using hardcoded mock data.

### Automation Logic

- **Fully static.** No API calls, no auto-refresh, no computed metrics.
- All data is hardcoded in the component.

### Alert Triggers

None.

---

## 2. Analyst Dashboard

**Files:**
- Frontend: `src/pages/dashboard/AnalystDashboardPage.tsx`
- Backend controller: `server/controllers/analystDashboard.controller.js`
- Routes: `server/routes/analystDashboard.routes.js`

**Target role:** `analyst`
**API base path:** `/analyst-dashboard/*`
**Authentication:** All endpoints require JWT via `authenticate` middleware; data is auto-scoped to `req.userId`.

### Sections / Widgets (7)

| # | Widget | API Endpoint | Auto-Refresh Interval | Stale Time |
|---|---|---|---|---|
| 1 | Header Banner + Stats Strip | `GET /analyst-dashboard/stats` | 60s | 30s |
| 2 | OOS Alert Bar | `GET /analyst-dashboard/oos-alerts` | 30s | 15s |
| 3 | Low Stock Alert Bar | `GET /analyst-dashboard/consumable-alerts` | 300s (5 min) | 120s |
| 4 | Work Queue Table | `GET /analyst-dashboard/work-queue` | 60s | 30s |
| 5 | KRA Score Card + KPI Metrics | `GET /analyst-dashboard/kpis` | 300s (5 min) | 60s |
| 6 | Equipment Issues | `GET /analyst-dashboard/equipment` | 300s (5 min) | 120s |
| 7 | Recent Results Table (toggle) | `GET /analyst-dashboard/recent-results` | 60s | 30s |
| 8 | Quick Actions Grid (toggle) | N/A (static links) | N/A | N/A |

### KPIs (5 metrics)

All KPIs are **auto-computed monthly** from the `BookingTest` and `Result` tables. No manual input required.

| KPI | Key | Target | Unit | Inverse | Calculation Formula (from backend code) |
|---|---|---|---|---|---|
| Samples Completed / Month | `samples_completed` | 120 | count | No | `COUNT(BookingTest) WHERE assignedTo = userId AND status IN ('completed','reviewed','approved') AND updatedAt >= monthStart` |
| Average TAT | `avg_tat` | 24 | hrs | Yes | `SUM(Result.enteredAt - BookingTest.createdAt) / COUNT(completedTests)` -- hours between test reaching department (BookingTest created) and analyst entering result (Result.enteredAt). **Fallback:** if no Result record exists for a test, uses `BookingTest.updatedAt` instead of `Result.enteredAt`. |
| On-Time Delivery | `on_time_pct` | 95 | % | No | `COUNT(completed WHERE Result.enteredAt <= dueDate) / COUNT(completed) * 100` -- uses `Result.enteredAt` as the completion timestamp. **Fallback:** if no Result record, uses `BookingTest.updatedAt`. |
| Rejection Rate | `rejection_rate` | 2 | % | Yes | `COUNT(status='rejected') / (COUNT(completed) + COUNT(rejected)) * 100` |
| Pending Tasks | `pending_tasks` | 0 | count | Yes | `COUNT(BookingTest) WHERE assignedTo = userId AND status IN ('pending','in_progress')` |

> **Note on TAT and On-Time logic (updated 2026-04-07):** The Average TAT and On-Time Delivery KPIs now use `Result.enteredAt` as the definitive completion timestamp rather than `BookingTest.updatedAt`. This change reflects the actual moment the analyst enters the result, not when the BookingTest record was last touched (which could be a reviewer action or status update). The backend joins `BookingTest` with `Result` (LEFT JOIN, `required: false`) to retrieve `enteredAt`, falling back to `BookingTest.updatedAt` when no Result record exists.

**KPI Progress formula (frontend):**
- Normal: `min(100, (actual / target) * 100)`
- Inverse (target=0): `actual === 0 ? 100 : max(0, 100 - actual * 10)`
- Inverse (target>0): `min(100, (target / max(actual, 0.01)) * 100)`

**Color thresholds (frontend):**
- Green: progress >= 90%
- Amber: progress >= 75%
- Red: progress < 75%

**KPI Alert thresholds (from defaultRoles.ts):**

| KPI | Green Threshold | Yellow Threshold |
|---|---|---|
| Samples Completed | >= 100 | >= 80 |
| Average TAT | <= 24 hrs | <= 36 hrs |
| On-Time Delivery | >= 90% | >= 70% |
| Rejection Rate | <= 3% | <= 7% |
| Pending Tasks | <= 5 | <= 10 |

### KRAs (4 areas, weighted to 100%)

All KRAs are **auto-computed** from the same monthly data as KPIs. No manual scoring.

| KRA | Key | Target | Weight | Score Formula (backend) |
|---|---|---|---|---|
| Testing Accuracy | `testing_accuracy` | 98% | 30% | `((completedCount + rejectedCount - rejectedCount) / (completedCount + rejectedCount)) * 100` i.e. `(totalDone - rejected) / totalDone * 100` |
| TAT Compliance | `tat_compliance` | 95% | 25% | Same value as On-Time Delivery KPI (`onTimePct`) |
| Sample Throughput | `sample_throughput` | 120/month | 25% | `min(100, (samplesCompleted / 120) * 100)` -- **Note:** target is currently hardcoded at 120/month for all analysts. Planned enhancement: configurable per department (see Pending Enhancements below). |
| Quality Score | `quality_score` | 95% | 20% | `max(0, 100 - rejectionRate * 5)` -- each 1% rejection removes 5 points. **Note:** the penalty factor of 5 is pending final confirmation from stakeholder. |

**Individual KRA score:** `min(100, (actual / target) * 100)`

**Overall KRA Score:** `SUM(kra.score * kra.weight / 100)` for all 4 KRAs, rounded to 1 decimal.

### Rejection Tracking -- Current Limitations and Planned Enhancement

**Current state:** The system only tracks the **current status** of a BookingTest (pending, in_progress, completed, reviewed, approved, rejected). When a result is rejected and the analyst re-enters it, the status changes back and forth but there is **no persistent history** of individual rejection events. This means:
- If a test is rejected twice and then approved, the system currently sees it only as "approved" -- the two rejections are lost.
- Rejection Rate KPI counts only tests whose **current** status is `rejected` at query time.

**Planned enhancement (ResultHistory table):** A `result_history` table will log every status change (submitted, approved, rejected, re_submitted) permanently. Once implemented:
- Each rejection event will count against the analyst's accuracy **permanently**, even if the test is later re-approved.
- A new **First-Pass Rate** KPI will be introduced: percentage of tests approved on first review attempt with no prior rejection.
- Rejection trends over time and reviewer accountability will become reportable.

For full implementation details, see: `docs/rejection-tracking-implementation.md`

### Due Date Calculation

**Current logic:** `dueDate = bookingDate + TestMaster.tatHours`

This is a simple calendar-time addition. The TAT hours come from the `TestMaster` record (default 48 hours if not set).

**Planned enhancement:** Smart scheduling that factors in lab occupancy, machine downtime, and chemical/reagent availability. This would produce more realistic due dates that account for operational constraints. **Status: future enhancement, not yet implemented.**

### Stats Strip (Header Banner)

| Stat | Calculation |
|---|---|
| Assigned Today | `COUNT(BookingTest) WHERE assignedTo = userId AND createdAt >= startOfToday` |
| Completed Today | `COUNT(BookingTest) WHERE assignedTo = userId AND status IN ('completed','reviewed','approved') AND updatedAt >= startOfToday` |
| Pending | `COUNT(BookingTest) WHERE assignedTo = userId AND status IN ('pending','in_progress')` |
| Overdue | `COUNT(BookingTest) WHERE assignedTo = userId AND status IN ('pending','in_progress') AND dueDate < NOW()` |
| On-Time Rate | `(completedOnTimeThisMonth / completedThisMonth) * 100` -- where on-time means `updatedAt <= dueDate` (note: stats strip still uses `BookingTest.updatedAt` for on-time check, unlike the KPI endpoint which uses `Result.enteredAt`) |

### Work Queue -- Automation Logic

**Source:** `BookingTest` table joined with `Booking`, `Sample`, `Client`, `TestMaster`, `Department`

**Auto-sort order:**
1. Priority: CRITICAL (0) > URGENT (1) > NORMAL (2)
2. Within same priority: ascending by `minutesLeft`

**Auto-escalation rules (server-side):**
- If `minutesLeft < TAT * 0.25` (25% remaining) AND priority is NORMAL --> escalate to **URGENT**
- If `minutesLeft < TAT * 0.10` (10% remaining) AND priority is not CRITICAL --> escalate to **CRITICAL**
- `TAT` is sourced from `TestMaster.tatHours` (default 48 hours if not set)

**Time-left color coding (frontend):**
- Red: <= 0 min (OVERDUE) or < 60 min
- Amber: < 240 min (4 hrs)
- Green: >= 240 min

### OOS (Out-of-Specification) Alerts

**Source:** `ResultParameter` WHERE `passFail = 'fail'`, joined with `Result` (entered by this user, status in `entered` or `reviewed`)

**Data returned per alert:**
- sampleCode, testName, parameterName, observedValue, specLimit (specification or min-max range)
- `responded`: true if result status is 'reviewed' (someone has seen it), false if still 'entered'

**Auto-refresh:** Every 30 seconds (most aggressive refresh on the dashboard)

**Alert display:** Red banner at top of dashboard showing first OOS + count of additional alerts. Only unresponded (responded=false) alerts shown.

### Equipment Status

**Source:** `Instrument` table, filtered to active instruments in the analyst's assigned departments (via `DepartmentUser` join table)

**Auto-flag logic (server-side):**
- If `nextCalibrationDate <= today` AND status is `active` --> auto-set `computedStatus = 'calibration_due'`
- `pmDueSoon = true` if `nextCalibrationDate <= today + 7 days`

**Frontend display:** Only shows equipment with issues (status != 'active'). Statuses: Online, Offline, Under PM, Calibration Due.

### Consumable Alerts

**Source:** `InventoryItem` WHERE `currentStock <= minStock AND isActive = true`, filtered by analyst's location (`user.locationId`)

**Auto-flag:** `critical = true` when `currentStock === 0`

**Display:** Amber banner with scrollable list; critical items shown in red badges.

### Data Sources Summary

| DB Model/Table | Used By |
|---|---|
| `BookingTest` | Stats, Work Queue, KPIs, KRAs |
| `Booking` | Work Queue (priority, reportNumber) |
| `Sample` | Work Queue (sampleCode), Recent Results |
| `Client` | Work Queue (client name) |
| `TestMaster` | Work Queue (test name/code, TAT hours) |
| `Department` | Work Queue (dept name/code) |
| `DepartmentUser` | Equipment (dept assignment lookup) |
| `Result` | Recent Results, OOS Alerts, KPI TAT + On-Time (via LEFT JOIN from BookingTest) |
| `ResultParameter` | OOS Alerts (pass/fail, observed vs spec) |
| `Instrument` | Equipment Status |
| `InventoryItem` | Consumable Alerts |
| `User` | Consumable Alerts (locationId) |

### Pending Enhancements (Analyst Dashboard)

| Enhancement | Current State | Planned State | Status |
|---|---|---|---|
| Rejection tracking via ResultHistory | Only tracks current BookingTest status; no event history | Permanent audit trail of every rejection event; first-pass rate KPI | Planned -- see `docs/rejection-tracking-implementation.md` |
| Configurable throughput target | Hardcoded 120/month for all analysts | Configurable per department | Pending implementation |
| Smart due date scheduling | Simple `bookingDate + tatHours` | Factors lab occupancy, machine downtime, chemical availability | Future enhancement |
| Quality Score penalty factor | Penalty factor = 5 (each 1% rejection removes 5 quality points) | Awaiting stakeholder confirmation of the multiplier | Pending confirmation |
| First-Pass Rate KPI | Not available (no rejection history) | Percentage of tests approved on first attempt | Pending ResultHistory implementation |

---

## 3. Booking Dashboard

**Files:**
- Frontend: `src/pages/dashboard/BookingDashboardPage.tsx`
- Backend controller: `server/controllers/bookingKpi.controller.js`
- Routes: `server/routes/bookingKpi.routes.js`
- Logic document: `docs/booking-dashboard-logic.md`

**Target roles:** `booking`
**API base path:** `/booking-kpi/*`
**Authentication:** All endpoints require JWT via `authenticate` middleware.

### Sections / Widgets (6)

| # | Widget | API Endpoint | Auto-Refresh Interval | Stale Time |
|---|---|---|---|---|
| 1 | Header Banner + Stats Strip (5 stats) | `GET /booking-kpi/stats` | 60s | 30s |
| 2 | Alert Bar (pending queue > 5) | Uses stats data | 60s | 30s |
| 3 | Booking Queue Table (8/12 width) | `GET /booking-kpi/pending-queue` | 30s | 15s |
| 4 | KRA Score Card + KPI Metrics (4/12 sidebar) | `GET /booking-kpi/kra` + stats | 300s (5 min) / 60s | 60s / 30s |
| 5 | Today's Bookings Table | `GET /booking-kpi/my-bookings` | 60s | 30s |
| 6 | Quick Actions Grid (toggle, hidden by default) | N/A (static links) | N/A | N/A |

### Stats Strip (5 stats in header banner)

| Stat | Calculation (backend) |
|---|---|
| Booked Today | `COUNT(Booking) WHERE bookedBy = userId AND createdAt >= todayStart` |
| Pending Queue | `COUNT(Sample) WHERE status = 'received'` (global, not user-scoped) |
| Revenue | `SUM(Booking.netAmount) WHERE bookedBy = userId AND createdAt >= todayStart`, displayed as "XK" |
| On-Time Rate | `COUNT(bookings this month where (createdAt - sample.receivedDate) <= 2 hrs) / COUNT(valid bookings this month) * 100` |
| Avg Time | `SUM(Booking.createdAt - Sample.receivedDate) / COUNT(valid bookings this month)` in hours |

**Trend calculation (booked today):** `((bookedToday - bookedYesterday) / bookedYesterday) * 100`, shown as "+X%" or "-X%"

**Booking TAT definition:** Time from `Sample.receivedDate` to `Booking.createdAt`. Validity filter: hours >= 0 and < 720 (discards bad data). On-time threshold: <= 2 hours.

### KPIs (6 metrics, compact sidebar)

All KPIs use values from the `/booking-kpi/stats` endpoint. Displayed as progress bars in a sidebar card.

| KPI | Target | Unit | Inverse | Source Field |
|---|---|---|---|---|
| Booked / Day | 25 | count | No | `bookedToday` |
| Avg Booking Time | 2 | hrs | Yes | `avgBookingTime` |
| On-Time Rate | 95 | % | No | `onTimeRate` |
| Amendment Rate | 5 | % | Yes | `amendmentRate` |
| Barcode Same Day | 100 | % | No | `barcodesGeneratedSameDay` (always 100% -- placeholder) |
| Pending Queue | 0 | count | Yes | `pendingQueue` |

**KPI progress formula (frontend, same as analyst dashboard):**
- Normal: `min(100, (actual / target) * 100)`
- Inverse (target=0): `actual === 0 ? 100 : max(0, 100 - actual * 10)`
- Inverse (target>0): `min(100, (target / max(actual, 0.01)) * 100)`

**Color thresholds (frontend):** Green >= 90%, Amber >= 75%, Red < 75%

### KRAs (5 areas, fully backend-computed)

Backend endpoint `GET /booking-kpi/kra` computes all 5 KRAs from real data:

| KRA | Key | Target | Weight | Calculation (backend) |
|---|---|---|---|---|
| Booking Accuracy | `booking_accuracy` | 99% | 30% | `(1 - amendedMonth / totalMonth) * 100` -- percentage of bookings NOT amended |
| Booking Turnaround | `booking_turnaround` | 95% | 25% | `COUNT(bookings where (createdAt - sample.receivedDate) <= 2 hrs) / COUNT(valid bookings) * 100` |
| Daily Volume | `daily_volume` | 100% | 20% | `min(100, (totalMonth / (ceil((now - monthStart) / 86400000) * 25)) * 100)` -- 25 bookings/day target, calendar days |
| Amendment Rate | `amendment_rate` | <=5% | 15% | `(amendedMonth / totalMonth) * 100` -- **inverse** KRA, lower is better |
| Client Data Compliance | `client_compliance` | 100% | 10% | **NOW REAL:** checks if client has `name`, `email`, `phone`, `address` all truthy. `compliantCount / totalBookings * 100` via Booking -> Sample -> Client join |

**Weighted KRA score formula (backend):**
- For normal KRAs: `ratio = min(100, (actual / target) * 100)`
- For inverse KRAs: `actual <= target ? 100 : max(0, 100 - ((actual - target) / target) * 100)`
- Overall: `SUM(ratio * weightage / 100)`, rounded to 1 decimal

### Booking Queue

**Source:** `Sample` WHERE `status = 'received'`, joined with `Client`, ordered by `receivedDate ASC`, limit 50.

**Wait time:** `(now - receivedDate) / 3600000` in hours. Frontend display: < 1hr shown as minutes ("42m"), >= 1hr shown as hours ("2.1h").

**Wait time color coding (frontend):**
- Green: <= 2 hours
- Amber: > 2 hours and <= 4 hours
- Red: > 4 hours

### Today's Bookings

**Source:** `Booking` WHERE `bookedBy = userId AND createdAt >= todayStart`, joined with `Sample` and `Client`, ordered by `createdAt DESC`.

**Time taken:** `(Booking.createdAt - Sample.receivedDate) / 3600000` in hours, rounded to 1 decimal.

**Test count per booking:** Fetched as separate query `COUNT(BookingTest) WHERE bookingId = booking.id`.

### Alert Triggers

| Alert | Trigger | Severity | Display |
|---|---|---|---|
| Pending Queue Warning | `pendingQueue > 5` | Amber | Banner: "X samples in queue waiting to be booked" |

### Data Sources Summary

| DB Model/Table | Used By |
|---|---|
| `Booking` | Stats, KRAs, Today's Bookings |
| `Sample` | Stats (pending queue, TAT calc), Booking Queue, KRA turnaround/compliance |
| `Client` | Booking Queue (name/code), KRA Client Data Compliance (name, email, phone, address) |
| `BookingTest` | Today's Bookings (test count) |

### Pending Enhancements (Booking Dashboard)

| Enhancement | Current State | Planned State | Status |
|---|---|---|---|
| Barcode Same Day tracking | Always returns 100% (placeholder calculation) | Track real barcode generation timestamps | Pending implementation |
| Cancellation Rate KPI | Computed in backend (`cancellationRate`) but not displayed | Add KPI card or remove unused backend calculation | Pending decision |
| Revenue / Day KPI | Not shown as KPI card (revenue is in stats strip) | Determine if separate KPI card is needed | Pending decision |
| Configurable daily volume target | Hardcoded 25 bookings/day | Configurable per role or location | Pending implementation |
| Business days in volume calc | Uses calendar days (includes weekends) | Use actual business days | Pending implementation |

---

## 4. Reception Dashboard

**Files:**
- Frontend: `src/pages/dashboard/ReceptionDashboardPage.tsx`
- Backend controller: `server/controllers/receptionDashboard.controller.js`
- Routes: `server/routes/receptionDashboard.routes.js`

**Target role:** `reception`
**API base path:** `/reception-dashboard/*`
**Authentication:** All endpoints require JWT via `authenticate` middleware; data is auto-scoped to `req.userId`.

### Sections / Widgets (7)

| # | Widget | API Endpoint | Auto-Refresh Interval | Stale Time |
|---|---|---|---|---|
| 1 | Header Banner + Stats Strip | `GET /reception-dashboard/stats` | 60s | 30s |
| 2 | Alert Bars | `GET /reception-dashboard/alerts` | 30s | 15s |
| 3 | TRF Queue Table | `GET /reception-dashboard/trf-queue` | 30s | 15s |
| 4 | KRA Score Card + KPI Metrics | `GET /reception-dashboard/kpis` | 300s (5 min) | 60s |
| 5 | Recently Received Table | `GET /reception-dashboard/received-samples` | 60s | 30s |
| 6 | Recent Activity | `GET /reception-dashboard/recent-activity` | 60s | 30s |
| 7 | Quick Actions Grid (toggle) | N/A (static links) | N/A | N/A |

### KPIs (5 metrics)

All KPIs are **auto-computed** from the `Sample` and `Client` tables. No manual input required.

| KPI | Key | Target | Unit | Inverse | Calculation Formula (from backend code) |
|---|---|---|---|---|---|
| TRFs Processed / Day | `trfs_processed` | 30 | count | No | `COUNT(Sample) WHERE receivedBy = userId AND createdAt >= startOfToday` |
| Avg Processing Time | `avg_time` | 10 | mins | Yes | `AVG(Sample.createdAt - Sample.receivedDate)` in minutes for today's samples. Fallback: uses `createdAt` if `receivedDate` is null (yields 0 minutes). |
| Approval Accuracy | `approval_accuracy` | 99 | % | No | `COUNT(samples this month WHERE status != 'received') / COUNT(all samples this month) * 100` |
| Pending TRFs | `pending_trfs` | 0 | count | Yes | `COUNT(Sample) WHERE status = 'received'` -- global, not user-scoped |
| New Client Activations | `new_clients` | 0 | count | No | Count of unique Client records created this month from samples processed by this user |

**KPI Progress formula (frontend, same as Analyst dashboard):**
- Normal: `min(100, (actual / target) * 100)`
- Inverse (target=0): `actual === 0 ? 100 : max(0, 100 - actual * 10)`
- Inverse (target>0): `min(100, (target / max(actual, 0.01)) * 100)`

**Color thresholds (frontend):**
- Green: progress >= 90%
- Amber: progress >= 75%
- Red: progress < 75%

### KRAs (4 areas, weighted to 100%)

All KRAs are **auto-computed** from Sample records this month. No manual scoring.

| KRA | Key | Target | Weight | Calculation (backend) |
|---|---|---|---|---|
| Processing Accuracy | `processing_accuracy` | 99% | 30% | `COUNT(samples WHERE condition = 'intact' OR condition IS NULL) / COUNT(total samples this month) * 100` |
| Processing Speed | `processing_speed` | 95% | 25% | `COUNT(samples WHERE (createdAt - receivedDate) <= 10 min) / COUNT(total samples this month) * 100` |
| Client Verification | `client_verification` | 90% | 25% | `COUNT(samples WHERE clientId IS NOT NULL) / COUNT(total samples this month) * 100` |
| Documentation Compliance | `doc_compliance` | 100% | 20% | `COUNT(samples WHERE clientId IS NOT NULL AND description IS NOT EMPTY) / COUNT(total samples this month) * 100` |

**Individual KRA score:** `min(100, (actual / target) * 100)`

**Overall KRA Score:** `SUM(kra.score * kra.weight / 100)` for all 4 KRAs, rounded to 1 decimal.

### Stats Strip (Header Banner)

| Stat | Calculation |
|---|---|
| Processed Today | `COUNT(Sample) WHERE receivedBy = userId AND createdAt >= startOfToday` |
| Received Today | `COUNT(Sample) WHERE receivedBy = userId AND status = 'received' AND createdAt >= startOfToday` |
| Pending TRFs | `COUNT(Sample) WHERE status = 'received'` (global) |
| Avg Time | `AVG(createdAt - receivedDate)` in minutes for today's samples |
| Approval Rate | `COUNT(samples this month WHERE status != 'received') / COUNT(all samples this month) * 100` |

### TRF Queue

**Source:** `Sample` WHERE `status = 'received'`, joined with `Client` and `ProductType`, limit 30.

**Sort order:**
1. Priority: EXPRESS (0) > URGENT (1) > NORMAL (2)
2. Within same priority: ascending by `receivedDate` (oldest first)

**Wait time:** `(now - receivedDate) / 60000` in minutes. Uses `createdAt` as fallback if `receivedDate` is null.

**Wait time color coding (frontend):**
- Green: <= 30 min
- Amber: 31-60 min
- Red: > 60 min

**New Client flag:** Shown when `client.code` is null or empty.

### Alerts

| Alert Type | Trigger Condition | Severity | Display |
|---|---|---|---|
| Urgent/Express TRFs | `Sample.status = 'received' AND priority IN ('urgent','express')` | Red | Count of urgent/express TRFs awaiting action |
| Damaged/Compromised | `Sample.status = 'received' AND condition IN ('damaged','temperature_deviation','leaking')` | Amber | Count of compromised-condition samples |
| Long-Waiting TRFs | `Sample.status = 'received' AND receivedDate < (now - 2 hours)` | Amber | Count of samples waiting over 2 hours |

### Data Sources Summary

| DB Model/Table | Used By |
|---|---|
| `Sample` | Stats, TRF Queue, Received Samples, KPIs, KRAs, Alerts, Recent Activity |
| `Client` | TRF Queue (client name/code, new client flag), KPI (new client activations), Received Samples |
| `ProductType` | TRF Queue (product type name) |

### Pending Enhancements (Reception Dashboard)

| Enhancement | Current State | Planned State | Status |
|---|---|---|---|
| Client Complaints KPI | Not implemented | Track complaints linked to sample reception | Pending -- defined in defaultRoles.ts but not in backend |
| Booking Accuracy KPI alignment | Dashboard uses Approval Accuracy; role config defines Booking Accuracy | Align dashboard with role config or vice versa | Pending review |
| Configurable processing time target | Hardcoded 10 minutes | Configurable per location/role | Pending implementation |
| Location-scoped Pending TRFs | Global count (all received samples) | Filter by receptionist's assigned location | Pending multi-location scoping |
| Sample condition vs processing error separation | All non-intact conditions count against Processing Accuracy KRA | Separate arrival condition from receptionist errors | Pending design |

---

## 5. Master Personnel Dashboard

**Files:**
- Frontend: `src/pages/dashboard/MasterDashboardPage.tsx`
- Backend controller: `server/controllers/masterDashboard.controller.js`
- Routes: `server/routes/masterDashboard.routes.js`
- Logic document: `docs/master-dashboard-logic.md`

**Target role:** `master`
**API base path:** `/master-dashboard/*`
**Authentication:** All endpoints require JWT via `authenticate` middleware; data is auto-scoped to `req.userId`.

### Sections / Widgets (6)

| # | Widget | API Endpoint | Auto-Refresh Interval | Stale Time |
|---|---|---|---|---|
| 1 | Header Banner + Stats Strip (5 stats) | `GET /master-dashboard/stats` | 60s | 30s |
| 2 | Alert Bars (4 types) | `GET /master-dashboard/alerts` | 60s | 30s |
| 3 | Recent Activity Table (8/12 width) | `GET /master-dashboard/recent-activity` | 60s | 30s |
| 4 | KRA Score Card + KPI Metrics (4/12 sidebar) | `GET /master-dashboard/kpis` | 300s (5 min) | 60s |
| 5 | Data Quality Breakdown Table | `GET /master-dashboard/data-quality` | 300s (5 min) | 60s |
| 6 | Quick Actions Grid (toggle, hidden by default) | N/A (static links) | N/A | N/A |

### Stats Strip (5 stats in header banner)

| Stat | Calculation (backend) |
|---|---|
| STPs Today | `COUNT(AuditLog) WHERE userId AND entity='TestMaster' AND action='create' AND createdAt >= today` |
| Analytes | `COUNT(AuditLog) WHERE userId AND entity='TestParameter' AND action='create' AND createdAt >= today` |
| Total STPs | `COUNT(TestMaster) WHERE isActive = true` |
| Incomplete | `COUNT(TestMaster) WHERE isActive AND (specification IS NULL/EMPTY OR method IS NULL/EMPTY)` |
| Complete | `ROUND((countWith5Fields / totalActive) * 1000) / 10` -- fields: name, code, method, unit, departmentId |

### KPIs (5 metrics)

All KPIs are **auto-computed monthly** from `AuditLog` and `TestMaster` tables. No manual input required.

| KPI | Key | Target | Unit | Inverse | Calculation Formula (from backend code) |
|---|---|---|---|---|---|
| STPs Created / Month | `stps_created` | 50 | count | No | `COUNT(AuditLog) WHERE userId AND entity='TestMaster' AND action='create' AND createdAt >= monthStart` |
| Analytes Added / Month | `analytes_added` | 100 | count | No | `COUNT(AuditLog) WHERE userId AND entity='TestParameter' AND action='create' AND createdAt >= monthStart` |
| Methods Updated / Month | `methods_uploaded` | 30 | count | No | `COUNT(AuditLog) WHERE userId AND entity='TestMaster' AND action='update' AND createdAt >= monthStart` |
| Pending STPs | `pending_stps` | 0 | count | Yes | `COUNT(TestMaster) WHERE isActive AND (spec IS NULL/EMPTY OR method IS NULL/EMPTY)` |
| Data Completeness | `data_completeness` | 100 | % | No | `ROUND((countWith5Fields / totalActive) * 1000) / 10` |

**KPI Progress formula (frontend, same as Analyst/Booking/Reception dashboards):**
- Normal: `min(100, (actual / target) * 100)`
- Inverse (target=0): `actual === 0 ? 100 : max(0, 100 - actual * 10)`
- Inverse (target>0): `min(100, (target / max(actual, 0.01)) * 100)`

**Color thresholds (frontend):** Green >= 90%, Amber >= 75%, Red < 75%

### KRAs (4 areas, weighted to 100%)

All KRAs are **auto-computed** from TestMaster records. No manual scoring.

| KRA | Key | Target | Weight | Calculation (backend) |
|---|---|---|---|---|
| Data Quality | `data_quality` | 98% | 35% | `COUNT(TestMaster with spec + method + minLimit + maxLimit) / total * 100`. Score: `min(100, (actual / 98) * 100)` |
| STP Throughput | `stp_throughput` | 50/mo | 25% | `min(100, ROUND((stpsMonth / 50) * 1000) / 10)` |
| Standards Compliance | `standards_compliance` | 100% | 20% | `COUNT(TestMaster with standardId) / total * 100`. Score: `min(100, actual)` |
| Turnaround | `turnaround` | 95% | 20% | **Placeholder:** hardcoded at 95. Score: `min(100, (95/95) * 100)` = 100 |

**Overall KRA Score:** `SUM(kra.score * kra.weight / 100)`, rounded to 1 decimal.

### Alert Triggers

| Alert | Trigger | Severity | Display |
|---|---|---|---|
| Incomplete STPs | `spec IS NULL/EMPTY OR method IS NULL/EMPTY` | Amber | "X STP(s) missing specification or method" |
| Tests Without Parameters | TestMaster with no TestParameter records (LEFT JOIN) | Amber | "X test(s) have no parameters defined" |
| Tests Not Linked to Standard | `standardId IS NULL` | Red | "X test(s) not linked to any standard" |
| Tests Not Accredited | `isAccredited = false` | Amber | "X test(s) not NABL accredited" |

### Data Quality Breakdown

Per-field completeness table for 9 fields (Name, Code, Method, Unit, Department, Specification, Standard, Min Limit, Max Limit) across all active TestMaster records. Each field shows filled count, missing count, and percentage.

### Data Sources Summary

| DB Model/Table | Used By |
|---|---|
| `AuditLog` | Stats, KPIs, Recent Activity |
| `TestMaster` | Stats, KPIs, KRAs, Alerts, Data Quality Breakdown |
| `TestParameter` | Alerts (tests without parameters) |
| `Department` | Data Quality (departmentId check) |
| `Standard` | KRA Standards Compliance |

### Pending Enhancements (Master Personnel Dashboard)

| Enhancement | Current State | Planned State | Status |
|---|---|---|---|
| Turnaround KRA | Hardcoded at 95% (placeholder) | Real turnaround tracking | Pending implementation |
| Configurable KPI targets | Hardcoded (50/100/30) | Admin-configurable per user/role | Pending implementation |
| Data Quality KRA scope | Checks 4 fields only | Could include more fields | Pending review |

---

## 6. Master Controller Dashboard

**Files:**
- Frontend: `src/pages/dashboard/MasterControllerDashboardPage.tsx`
- Backend controller: `server/controllers/masterControllerDashboard.controller.js`
- Routes: `server/routes/masterControllerDashboard.routes.js`
- Logic document: `docs/master-controller-dashboard-logic.md`

**Target role:** `master_controller`
**API base path:** `/master-controller-dashboard/*`
**Authentication:** All endpoints require JWT via `authenticate` middleware; data is auto-scoped to `req.userId`.

### Key Difference from Master Personnel

This role performs BOTH creation AND approval. Stats show 6 items (adding Approved/Rejected), KPIs include Reviews Completed, and KRAs have 5 areas covering both responsibilities.

### Sections / Widgets (7)

| # | Widget | API Endpoint | Auto-Refresh Interval | Stale Time |
|---|---|---|---|---|
| 1 | Header Banner + Stats Strip (6 stats) | `GET /master-controller-dashboard/stats` | 60s | 30s |
| 2 | Alert Bars (4 types) | `GET /master-controller-dashboard/alerts` | 60s | 30s |
| 3 | STP Review Queue Table (8/12 width) | `GET /master-controller-dashboard/approval-queue` | 60s | 30s |
| 4 | KRA Score Card + KPI Metrics (4/12 sidebar) | `GET /master-controller-dashboard/kpis` | 300s (5 min) | 60s |
| 5 | Recent Reviews Table | `GET /master-controller-dashboard/recent-activity` | 60s | 30s |
| 6 | Quick Actions Grid (toggle, hidden by default) | N/A (static links) | N/A | N/A |

### Stats Strip (6 stats in header banner)

| Stat | Calculation (backend) |
|---|---|
| STPs Today | `COUNT(AuditLog) WHERE userId AND entity='TestMaster' AND action='create' AND createdAt >= today` |
| Analytes | `COUNT(AuditLog) WHERE userId AND entity='TestParameter' AND action='create' AND createdAt >= today` |
| Approved | `COUNT(AuditLog) WHERE userId AND action='approve' AND entity IN MASTER_ENTITIES AND createdAt >= today` |
| Rejected | `COUNT(AuditLog) WHERE userId AND action='reject' AND entity IN MASTER_ENTITIES AND createdAt >= today` |
| Pending | `COUNT(TestMaster) WHERE isActive AND (spec IS NULL/EMPTY OR method IS NULL/EMPTY)` |
| Complete | `ROUND((countWith5StrictFields / totalActive) * 1000) / 10` -- fields: method, spec, minLimit, maxLimit, standardId |

### Approval Queue

**Source:** `TestMaster` WHERE `isActive = true`, joined with Department, Standard, TestParameter. Limit 20, ordered by `createdAt DESC`.

**Issue detection per STP:** No method, No specification, No standard, No limits (both null), No parameters (empty array).

**Display:** Table with Approve/Reject action buttons per row.

### KPIs (5 metrics)

| KPI | Key | Target | Unit | Inverse | Calculation Formula (from backend code) |
|---|---|---|---|---|---|
| STPs Created / Month | `stps_created` | 50 | count | No | `COUNT(AuditLog) WHERE entity='TestMaster' AND action='create' AND createdAt >= monthStart` |
| Analytes Added / Month | `analytes_added` | 100 | count | No | `COUNT(AuditLog) WHERE entity='TestParameter' AND action='create' AND createdAt >= monthStart` |
| Reviews Completed / Month | `reviews_completed` | 80 | count | No | `COUNT(approve) + COUNT(reject)` from AuditLog this month |
| Pending Items | `pending_items` | 0 | count | Yes | `COUNT(TestMaster) WHERE isActive AND (spec/method missing)` |
| Data Completeness | `data_completeness` | 100 | % | No | `ROUND((fullyComplete / total) * 1000) / 10` -- 7-field strict check |

### KRAs (5 areas, weighted to 100%)

| KRA | Key | Target | Weight | Calculation (backend) |
|---|---|---|---|---|
| Data Quality | `data_quality` | 98% | 30% | Uses `dataCompleteness` from KPI calc. Score: `min(100, (actual / 98) * 100)` |
| STP Throughput | `stp_throughput` | 50/mo | 20% | `min(100, ROUND((stpsMonth / 50) * 1000) / 10)` |
| Review Throughput | `review_throughput` | 80/mo | 20% | `min(100, ROUND((totalReviewed / 80) * 1000) / 10)` |
| NABL Compliance | `nabl_compliance` | 100% | 15% | `COUNT(isAccredited=true) / total * 100`. Score: `min(100, actual)` |
| Standards Compliance | `standards_compliance` | 100% | 15% | `COUNT(standardId IS NOT NULL) / total * 100`. Score: `min(100, actual)` |

**Overall KRA Score:** `SUM(kra.score * kra.weight / 100)`, rounded to 1 decimal.

### Alert Triggers

| Alert | Trigger | Severity | Display |
|---|---|---|---|
| Incomplete STPs | `spec IS NULL/EMPTY OR method IS NULL/EMPTY` | Amber | "X STP(s) missing specification or method" |
| Tests Not Linked to Standard | `standardId IS NULL` | Red | "X test(s) not linked to any standard" |
| Tests Not NABL Accredited | `isAccredited = false` | Amber | "X test(s) not NABL accredited" |
| Tests Without Parameters | No TestParameter records (LEFT JOIN) | Amber | "X test(s) have no parameters defined" |

### Data Sources Summary

| DB Model/Table | Used By |
|---|---|
| `AuditLog` | Stats, KPIs, Recent Activity |
| `TestMaster` | Stats, KPIs, KRAs, Alerts, Approval Queue |
| `TestParameter` | Approval Queue (param count), Alerts |
| `Department` | Approval Queue (department name) |
| `Standard` | Approval Queue (standard name), KRA |

### Pending Enhancements (Master Controller Dashboard)

| Enhancement | Current State | Planned State | Status |
|---|---|---|---|
| Approval workflow wiring | Approve/Reject buttons displayed but not wired | Connect to backend approval endpoints | Pending implementation |
| Configurable KPI targets | Hardcoded (50/100/80) | Admin-configurable per user/role | Pending implementation |
| Review turnaround tracking | Not tracked | Measure time from STP submission to approval | Pending implementation |
| Rejection reason tracking | Count only, no reasons | Add rejection reason field | Pending design |

---

## 7. HQ Dashboard

**File:** `src/pages/dashboard/HQDashboardPage.tsx`
**Target roles:** HQ management, area managers, admins
**Data source:** Static mock data only (no backend API calls)
**Auto-refresh:** None (static)

### Sections / Widgets

| Widget | Description |
|---|---|
| Header | Title "HQ Dashboard" with period selector (Today/Week/Month) -- selection is non-functional |
| Summary Stat Cards (4) | Total Samples Today, Total Pending Tests, Overall TAT Compliance, Revenue This Month |
| Location Performance Cards (5) | One card per location (Delhi, Alcatec, Manesar, Bangalore, Baddi) showing: Samples Today, Pending Tests, Revenue, TAT Compliance |
| Sample Volume by Location | Horizontal bar chart comparing daily intake across 5 locations |
| Inter-Location Transfers | Transfer activity: Pending (3), In Transit (1), Completed (8); recent transfers table |
| Workforce Distribution | Analyst headcount per location (icons) |

### Summary Stats (computed from mock location data)

| Stat | Formula |
|---|---|
| Total Samples Today | `SUM(location.samplesToday)` across all 5 locations |
| Total Pending Tests | `SUM(location.pendingTests)` across all 5 locations |
| Overall TAT Compliance | `AVG(location.tatCompliance)` across all 5 locations |
| Revenue This Month | `SUM(location.revenue)` across all 5 locations, displayed as lakhs (INR) |

### Location Performance Color Coding

| TAT Compliance | Border/Background Color | Dot Color |
|---|---|---|
| >= 93% | Green | Green |
| >= 88% | Yellow | Yellow |
| < 88% | Red | Red |

### Navigation

Clicking a location card sets the global location context (via `useLocationStore`) and navigates to `/dashboard`.

### KPIs / KRAs

None -- this is a summary-level dashboard with no individual KPI/KRA tracking.

### Automation Logic

**Fully static.** All data is hardcoded in mock arrays. No API integration yet.

---

## 8. Role-Level KRA/KPI Definitions

**File:** `src/config/defaultRoles.ts`

This file defines the default KRA and KPI templates for each role. These are reference configurations used for benchmarking and role setup. The analyst and booking dashboards use their own backend-computed values that mirror these definitions.

### Analyst Role

**KRAs (4):**

| KRA | Target | Weight |
|---|---|---|
| Testing Accuracy | 98% | 30% |
| Turnaround Compliance | 95% | 25% |
| Sample Throughput | 100% | 25% |
| Quality Score | 95% | 20% |

**KPIs (5) with thresholds:**

| KPI | Target | Unit | Green Threshold | Yellow Threshold |
|---|---|---|---|---|
| Samples Completed / Month | 120 | count | 100 | 80 |
| Average TAT | 24 | hrs | 24 | 36 |
| On-Time Delivery | 95 | % | 90 | 70 |
| Rejection Rate | 2 | % | 3 | 7 |
| Pending Tasks | 0 | count | 5 | 10 |

### Reviewer Role

**KRAs (4):**

| KRA | Target | Weight |
|---|---|---|
| Review Accuracy | 99% | 35% |
| Review Turnaround | 95% | 25% |
| Rejection Identification | 90% | 20% |
| Compliance Adherence | 100% | 20% |

**KPIs (4):**

| KPI | Target | Unit | Green | Yellow |
|---|---|---|---|---|
| Reviews Completed / Month | 150 | count | 130 | 100 |
| Avg Review Time | 4 | hrs | 4 | 8 |
| First Pass Rate | 92 | % | 90 | 75 |
| Pending Reviews | 0 | count | 10 | 20 |

### Receptionist Role

**KRAs (4):**

| KRA | Target | Weight |
|---|---|---|
| Registration Accuracy | 99% | 30% |
| Processing Speed | 95% | 25% |
| Client Satisfaction | 90% | 25% |
| Documentation Compliance | 100% | 20% |

**KPIs (4):**

| KPI | Target | Unit | Green | Yellow |
|---|---|---|---|---|
| Samples Registered / Day | 30 | count | 25 | 15 |
| Avg Registration Time | 10 | mins | 10 | 20 |
| Booking Accuracy | 99 | % | 97 | 90 |
| Client Complaints | 0 | count | 2 | 5 |

### Department Head Role

**KRAs (5):**

| KRA | Target | Weight |
|---|---|---|
| Department TAT Compliance | 95% | 25% |
| Team Utilization | 90% | 20% |
| Quality Metrics | 98% | 25% |
| Cost Efficiency | 95% | 15% |
| Training Compliance | 100% | 15% |

**KPIs (5):**

| KPI | Target | Unit | Green | Yellow |
|---|---|---|---|---|
| Department Throughput / Month | 500 | count | 450 | 350 |
| Team On-Time % | 95 | % | 90 | 75 |
| Instrument Uptime | 98 | % | 95 | 85 |
| Department Rejection Rate | 2 | % | 3 | 7 |
| Budget Variance | 5 | % | 5 | 15 |

### Quality Manager Role

**KRAs (4):**

| KRA | Target | Weight |
|---|---|---|
| Audit Compliance | 100% | 30% |
| CoA Accuracy | 99% | 25% |
| Corrective Action Closure | 95% | 25% |
| Process Improvement | 90% | 20% |

**KPIs (4):**

| KPI | Target | Unit | Green | Yellow |
|---|---|---|---|---|
| CoAs Approved / Month | 200 | count | 180 | 140 |
| Open Audit Findings | 0 | count | 3 | 8 |
| CAPA Closure Rate | 95 | % | 90 | 75 |
| Deviation Rate | 1 | % | 2 | 5 |

### Roles Without KRA/KPI Definitions

The following roles have no KRA/KPI templates in `defaultRoles.ts`: `accounts`, `marketing`, `customer_coordinator`, `purchase`, `hr`, `printing`, `technical`, `area_manager`, `client`.

### Role-to-Dashboard Mapping

| Dashboard | Primary Roles | KRA/KPI Source |
|---|---|---|
| Default (DashboardPage) | All roles (fallback) | None |
| Analyst Dashboard | `analyst` | Backend auto-computed |
| Booking Dashboard | `booking` | Backend auto-computed (all 5 KRAs real, 6 KPIs from stats) |
| Reception Dashboard | `reception` | Backend auto-computed |
| Master Personnel Dashboard | `master` | Backend auto-computed (4 KRAs, 5 KPIs from AuditLog + TestMaster) |
| Master Controller Dashboard | `master_controller` | Backend auto-computed (5 KRAs, 5 KPIs from AuditLog + TestMaster) |
| HQ Dashboard | HQ management, `area_manager`, `admin` | None (mock only) |

---

## Summary of Automation vs Manual Input

| Feature | Automation Level | Notes |
|---|---|---|
| Analyst Stats | Fully automatic | Computed from BookingTest records in real-time |
| Analyst Work Queue | Fully automatic | Auto-sorted, auto-escalated priority based on TAT |
| Analyst KPIs/KRAs | Fully automatic | Monthly aggregation from BookingTest/Result tables; TAT and on-time now use Result.enteredAt |
| Analyst OOS Alerts | Fully automatic | Auto-detected from ResultParameter.passFail='fail' |
| Analyst Equipment Status | Fully automatic | Auto-flags calibration overdue from Instrument dates |
| Analyst Consumable Alerts | Fully automatic | Auto-detects low stock (currentStock <= minStock) |
| Booking Stats | Fully automatic | Computed from Booking/Sample records; TAT = Sample.receivedDate to Booking.createdAt |
| Booking KPIs | Fully automatic | 6 KPIs from stats endpoint; Barcode Same Day is placeholder (always 100%) |
| Booking KRAs | Fully automatic | All 5 KRAs computed from real data; Client Data Compliance now checks actual client field completeness |
| Booking Pending Queue | Fully automatic | Lists all received samples ordered by receivedDate ASC, limit 50 |
| Booking Today's Bookings | Fully automatic | Lists user's bookings for today with per-booking test count |
| Reception Stats | Fully automatic | Computed from Sample records in real-time |
| Reception TRF Queue | Fully automatic | Auto-sorted by priority and receivedDate; wait time auto-calculated |
| Reception KPIs/KRAs | Fully automatic | Daily/monthly aggregation from Sample and Client tables |
| Reception Alerts | Fully automatic | Auto-detected from Sample priority, condition, and wait time |
| Reception Received Samples | Fully automatic | Lists recent samples processed by this user |
| Master Personnel Stats | Fully automatic | Computed from AuditLog (user-scoped) and TestMaster records |
| Master Personnel KPIs/KRAs | Fully automatic | Monthly aggregation from AuditLog + TestMaster; Turnaround KRA is placeholder |
| Master Personnel Alerts | Fully automatic | Auto-detected from TestMaster field completeness and TestParameter presence |
| Master Personnel Data Quality | Fully automatic | Per-field completeness check across 9 fields on all active TestMaster records |
| Master Controller Stats | Fully automatic | Combines creation stats (AuditLog create) with approval stats (AuditLog approve/reject) |
| Master Controller KPIs/KRAs | Fully automatic | 5 KRAs covering creation + approval; NABL and Standards compliance from TestMaster |
| Master Controller Approval Queue | Fully automatic | Lists recent active STPs with auto-detected issues (missing fields/params) |
| Master Controller Alerts | Fully automatic | Same 4 alert types as Master Personnel |
| Default Dashboard | Fully static | All mock data, no API |
| HQ Dashboard | Fully static | All mock data, no API |

---

## Auto-Refresh Intervals Summary

| Data Type | Interval | Dashboard |
|---|---|---|
| OOS Alerts | 30s (most aggressive) | Analyst |
| Stats / Work Queue / Recent Results | 60s | Analyst |
| KPIs/KRAs | 300s (5 min) | Analyst |
| Equipment / Consumables | 300s (5 min) | Analyst |
| Booking Queue | 30s | Booking |
| Booking Stats / Today's Bookings | 60s | Booking |
| Booking KRAs | 300s (5 min) | Booking |
| Reception Alerts | 30s | Reception |
| Reception TRF Queue | 30s | Reception |
| Reception Stats / Received Samples / Activity | 60s | Reception |
| Reception KPIs/KRAs | 300s (5 min) | Reception |
| Master Personnel Stats / Activity / Alerts | 60s | Master Personnel |
| Master Personnel KPIs/KRAs / Data Quality | 300s (5 min) | Master Personnel |
| Master Controller Stats / Queue / Alerts / Activity | 60s | Master Controller |
| Master Controller KPIs/KRAs | 300s (5 min) | Master Controller |

Note: All dashboards with auto-refresh use React Query's `refetchInterval` for timed polling.

---

## Alert Triggers and Thresholds Summary

| Alert Type | Trigger Condition | Display | Dashboard |
|---|---|---|---|
| OOS (Out of Specification) | `ResultParameter.passFail = 'fail'` AND result status in ('entered','reviewed') | Red banner at top | Analyst |
| Low Stock Consumables | `InventoryItem.currentStock <= minStock` | Amber banner; red if stock = 0 | Analyst |
| Equipment Calibration Due | `Instrument.nextCalibrationDate <= today` | Status changes to 'calibration_due' in equipment list | Analyst |
| Equipment PM Due Soon | `Instrument.nextCalibrationDate <= today + 7 days` | `pmDueSoon` flag | Analyst |
| Work Queue Priority Escalation | Time remaining < 25% of TAT -> URGENT; < 10% of TAT -> CRITICAL | Priority badge changes in queue | Analyst |
| Overdue Tests | `BookingTest.dueDate < NOW()` AND status in ('pending','in_progress') | "OVERDUE" time label (red) in queue; count in stats strip | Analyst |
| Booking Pending Queue Warning | `pendingQueue > 5` (received samples) | Amber banner: "X samples in queue waiting to be booked" | Booking |
| Booking Queue Wait Time | Wait > 4 hrs | Red text/background on wait time pill | Booking |
| HQ Location TAT Warning | TAT Compliance < 88% | Red border on location card | HQ |
| Urgent/Express TRFs | `Sample.status = 'received' AND priority IN ('urgent','express')` | Red banner with count | Reception |
| Damaged/Compromised Samples | `Sample.status = 'received' AND condition IN ('damaged','temperature_deviation','leaking')` | Amber banner with count | Reception |
| Long-Waiting TRFs | `Sample.status = 'received' AND receivedDate < (now - 2 hours)` | Amber banner with count | Reception |
| Incomplete STPs | `TestMaster.isActive AND (spec IS NULL/EMPTY OR method IS NULL/EMPTY)` | Amber banner with count | Master Personnel, Master Controller |
| Tests Without Parameters | `TestMaster` with no `TestParameter` records (LEFT JOIN) | Amber banner with count | Master Personnel, Master Controller |
| Tests Not Linked to Standard | `TestMaster.isActive AND standardId IS NULL` | Red banner with count | Master Personnel, Master Controller |
| Tests Not NABL Accredited | `TestMaster.isActive AND isAccredited = false` | Amber banner with count | Master Personnel, Master Controller |

---

## Change Log

| Date | Section | Change Description |
|---|---|---|
| 2026-04-07 | Analyst KPIs -- Average TAT | Changed from `BookingTest.updatedAt - BookingTest.createdAt` to `Result.enteredAt - BookingTest.createdAt`. Fallback to `BookingTest.updatedAt` when no Result record exists. |
| 2026-04-07 | Analyst KPIs -- On-Time Delivery | Changed from `BookingTest.updatedAt <= dueDate` to `Result.enteredAt <= dueDate`. Same fallback behavior. |
| 2026-04-07 | Analyst KRAs -- Sample Throughput | Documented that 120/month target is hardcoded; per-department configurability is pending implementation. |
| 2026-04-07 | Analyst KRAs -- Quality Score | Documented that the penalty factor (x5) is pending final stakeholder confirmation. |
| 2026-04-07 | Analyst Dashboard -- Rejection Tracking | Added new section documenting current limitations (no rejection history) and planned ResultHistory table enhancement. Referenced `docs/rejection-tracking-implementation.md`. |
| 2026-04-07 | Analyst Dashboard -- Due Date Calculation | Added new section documenting current simple calculation and planned smart scheduling enhancement. |
| 2026-04-07 | Analyst Dashboard -- Pending Enhancements | Added summary table of all pending enhancements: ResultHistory, configurable throughput, smart scheduling, quality score penalty confirmation, first-pass rate KPI. |
| 2026-04-07 | Analyst Dashboard -- Data Sources | Updated `Result` row to note its use in KPI TAT and On-Time calculations via LEFT JOIN. |
| 2026-04-07 | Table of Contents | Added Change Log entry. |
| 2026-04-08 | Reception Dashboard (Section 4) | Added full Reception Dashboard section covering Stats Strip, KPIs (5), KRAs (4), TRF Queue, Alerts (3 types), data sources, pending enhancements, and auto-refresh intervals. All formulas traced from `receptionDashboard.controller.js`. |
| 2026-04-08 | Table of Contents | Renumbered sections: HQ Dashboard moved to Section 5, Role-Level definitions to Section 6. Added Reception Dashboard as Section 4. |
| 2026-04-08 | Summary Tables | Updated Automation vs Manual Input, Auto-Refresh Intervals, Alert Triggers, and Role-to-Dashboard Mapping tables with Reception Dashboard entries. Moved `reception` role from Booking Dashboard to Reception Dashboard in role mapping. |
| 2026-04-08 | Booking Dashboard (Section 3) | Full rewrite: compact layout with Stats Strip (5 items in header), 6 KPIs (sidebar), 5 KRAs (sidebar score card), Booking Queue (8/12 main area), Today's Bookings table. Added auto-refresh intervals (Queue 30s, Stats/Bookings 60s, KRAs 5min). |
| 2026-04-08 | Booking KRAs -- Client Data Compliance | Changed from hardcoded placeholder (97%) to real computation: checks `name`, `email`, `phone`, `address` fields on Client records linked via Booking -> Sample -> Client join. |
| 2026-04-08 | Booking KPIs | Reduced from 8 mock KPI cards to 6 real KPIs sourced from backend stats: Booked/Day, Avg Booking Time, On-Time Rate, Amendment Rate, Barcode Same Day, Pending Queue. Removed Cancellation Rate and Revenue/Day from KPI display. |
| 2026-04-08 | Booking Dashboard -- Pending Enhancements | Added: Barcode Same Day placeholder, unused Cancellation Rate, Revenue/Day KPI decision, configurable daily volume target, business days calculation. |
| 2026-04-08 | Summary Tables | Updated Automation, Auto-Refresh, Alert Triggers, and Role Mapping tables with corrected Booking Dashboard entries. |
| 2026-04-08 | Booking Dashboard Logic Doc | Created `docs/booking-dashboard-logic.md` with full formula tracing from `bookingKpi.controller.js`. |
| 2026-04-09 | Master Personnel Dashboard (Section 5) | Added full Master Personnel Dashboard section covering Stats Strip (5 items), KPIs (5), KRAs (4), Alerts (4 types), Data Quality Breakdown (9 fields), Recent Activity, Quick Actions. All formulas traced from `masterDashboard.controller.js`. |
| 2026-04-09 | Master Controller Dashboard (Section 6) | Added full Master Controller Dashboard section covering Stats Strip (6 items), Approval Queue with issue detection, KPIs (5), KRAs (5), Alerts (4 types), Recent Reviews. All formulas traced from `masterControllerDashboard.controller.js`. |
| 2026-04-09 | Master Personnel Logic Doc | Created `docs/master-dashboard-logic.md` with full formula tracing, all KPI/KRA calculations, alert triggers, data quality breakdown, and data sources. |
| 2026-04-09 | Master Controller Logic Doc | Created `docs/master-controller-dashboard-logic.md` with full formula tracing, approval queue issue detection, comparison table vs Master Personnel. |
| 2026-04-09 | Table of Contents | Renumbered: HQ Dashboard to Section 7, Role-Level definitions to Section 8. Added Master Personnel (Section 5) and Master Controller (Section 6). |
| 2026-04-09 | Summary Tables | Updated Automation vs Manual Input, Auto-Refresh Intervals, Alert Triggers, and Role-to-Dashboard Mapping tables with Master Personnel and Master Controller entries. |
