# Master Controller Dashboard — Logic Document

**Last Updated:** 9 April 2026

---

## How Each Number on the Dashboard is Calculated

### Key Difference from Master Personnel

The Master Controller role performs BOTH creation AND approval of master data. This dashboard combines creation metrics (same as Master Personnel) with approval/review metrics. The stats strip shows 6 items instead of 5, KPIs include review throughput, and KRAs cover both creation and approval responsibilities.

---

### Stats Strip (Top Bar — 6 items in header banner)

**STPs Today**
- What it shows: How many STPs this user created today
- Logic: `COUNT(AuditLog) WHERE userId = currentUser AND entity = 'TestMaster' AND action = 'create' AND createdAt >= startOfToday`
- Updates: Every 60 seconds

**Analytes**
- What it shows: How many test parameters this user added today
- Logic: `COUNT(AuditLog) WHERE userId = currentUser AND entity = 'TestParameter' AND action = 'create' AND createdAt >= startOfToday`
- Updates: Every 60 seconds

**Approved**
- What it shows: How many master data items this user approved today
- Logic: `COUNT(AuditLog) WHERE userId = currentUser AND action = 'approve' AND entity IN ('TestMaster', 'TestParameter', 'Standard', 'ProductType', 'Specification') AND createdAt >= startOfToday`
- Updates: Every 60 seconds

**Rejected**
- What it shows: How many master data items this user rejected today
- Logic: `COUNT(AuditLog) WHERE userId = currentUser AND action = 'reject' AND entity IN ('TestMaster', 'TestParameter', 'Standard', 'ProductType', 'Specification') AND createdAt >= startOfToday`
- Updates: Every 60 seconds

**Pending**
- What it shows: How many STPs are incomplete (missing specification or method)
- Logic: `COUNT(TestMaster) WHERE isActive = true AND (specification IS NULL OR specification = '' OR method IS NULL OR method = '')`
- Updates: Every 60 seconds

**Complete (Data Completeness %)**
- What it shows: Percentage of active test masters with full data for approval readiness
- Logic: Count test masters where 5 fields are present (`method` not null/empty, `specification` not null/empty, `minLimit` not null, `maxLimit` not null, `standardId` not null), divide by total active test masters, multiply by 100
- Formula: `ROUND((completeCount / totalActiveTests) * 1000) / 10`
- Note: This uses a stricter completeness check than Master Personnel (requires specification, limits, and standard link instead of name/code/method/unit/department)
- If no active tests exist, returns 100%
- Updates: Every 60 seconds

---

### Approval Queue

**What it shows:** The 20 most recently created active STPs with their completeness status and detected issues.

**Source:** `TestMaster` WHERE `isActive = true`, joined with `Department`, `Standard`, `TestParameter`, ordered by `createdAt DESC`, limit 20.

**Per-item data:**
- id, name, code
- department name (from Department join)
- standard name (from Standard join, "Not linked" if null)
- paramCount (count of TestParameter records)
- hasMethod: `method IS NOT NULL AND method != ''`
- hasSpec: `specification IS NOT NULL AND specification != ''`
- hasLimits: `minLimit IS NOT NULL OR maxLimit IS NOT NULL`
- isAccredited: `TestMaster.isAccredited`

**Issue detection (server-side):**
Issues array is populated by checking each STP for missing data:

| Issue | Condition |
|---|---|
| "No method" | `method IS NULL OR method = ''` |
| "No specification" | `specification IS NULL OR specification = ''` |
| "No standard" | `standardId IS NULL` |
| "No limits" | `minLimit IS NULL AND maxLimit IS NULL` (both must be missing) |
| "No parameters" | `parameters` array is empty or null |

**Display:** Table with columns: Test/Dept, Standard, Params (count), Issues (red badges, max 3 shown + overflow count), Action (Approve/Reject buttons).

**Issue badge color:** Red background with red text for all issues.

---

### KPIs (5 Monthly Performance Metrics)

All KPIs are auto-computed monthly from `AuditLog` and `TestMaster` tables. No manual input required.

**1. STPs Created / Month**
- What it measures: Volume of STPs created this month
- Target: 50 STPs per month
- Calculation: `COUNT(AuditLog) WHERE userId = currentUser AND entity = 'TestMaster' AND action = 'create' AND createdAt >= startOfMonth`
- Inverse: No (higher is better)

**2. Analytes Added / Month**
- What it measures: Volume of test parameters added this month
- Target: 100 analytes per month
- Calculation: `COUNT(AuditLog) WHERE userId = currentUser AND entity = 'TestParameter' AND action = 'create' AND createdAt >= startOfMonth`
- Inverse: No (higher is better)

**3. Reviews Completed / Month**
- What it measures: Total approvals + rejections performed this month
- Target: 80 reviews per month
- Calculation: `COUNT(AuditLog WHERE action = 'approve') + COUNT(AuditLog WHERE action = 'reject')` both filtered by `userId = currentUser AND entity IN MASTER_ENTITIES AND createdAt >= startOfMonth`
- Inverse: No (higher is better)

**4. Pending Items**
- What it measures: How many STPs are incomplete
- Target: 0 (ideally nothing pending)
- Calculation: `COUNT(TestMaster) WHERE isActive = true AND (specification IS NULL/EMPTY OR method IS NULL/EMPTY)`
- Inverse: Yes (lower is better)

**5. Data Completeness**
- What it measures: Percentage of test masters with all required fields for approval
- Target: 100%
- Calculation: Stricter check requiring 7 fields: `name` not empty, `code` not null, `method` not null/empty, `specification` not null/empty, `minLimit` not null, `maxLimit` not null, `standardId` not null
- Formula: `ROUND((fullyComplete / totalActiveTests) * 1000) / 10`
- Inverse: No (higher is better)

**KPI Progress formula (frontend):**
- Normal: `min(100, (actual / target) * 100)`
- Inverse (target=0): `actual === 0 ? 100 : max(0, 100 - actual * 10)`
- Inverse (target>0): `min(100, (target / max(actual, 0.01)) * 100)`

**Color thresholds (frontend):**
- Green: progress >= 90%
- Amber: progress >= 75%
- Red: progress < 75%

---

### KRAs (5 Key Result Areas, Weighted to 100%)

All KRAs are auto-computed. No manual scoring. This role has 5 KRAs (one more than Master Personnel) to cover both creation and approval responsibilities.

**1. Data Quality — Weight: 30%**
- What it measures: Percentage of test masters with complete data (same strict check as KPI Data Completeness)
- Target: 98%
- Calculation: Uses the `dataCompleteness` value from KPI calculation (7-field check)
- Score: `min(100, (dataCompleteness / 98) * 100)`

**2. STP Throughput — Weight: 20%**
- What it measures: How much of the monthly STP creation target has been achieved
- Target: 50 STPs per month
- Calculation: `min(100, ROUND((stpsMonth / 50) * 1000) / 10)`
- Score: Same as the calculated percentage

**3. Review Throughput — Weight: 20%**
- What it measures: How much of the monthly review target has been achieved
- Target: 80 reviews per month
- Calculation: `min(100, ROUND((totalReviewed / 80) * 1000) / 10)` where `totalReviewed = approvedMonth + rejectedMonth`
- Score: Same as the calculated percentage

**4. NABL Compliance — Weight: 15%**
- What it measures: Percentage of active tests that are NABL accredited
- Target: 100%
- Calculation: `COUNT(TestMaster WHERE isActive = true AND isAccredited = true) / COUNT(all active TestMaster) * 100`
- Formula: `ROUND((accredited / totalTests) * 1000) / 10`
- Score: `min(100, nablPct)`

**5. Standards Compliance — Weight: 15%**
- What it measures: Percentage of active tests linked to a standard
- Target: 100%
- Calculation: `COUNT(TestMaster WHERE isActive = true AND standardId IS NOT NULL) / COUNT(all active TestMaster) * 100`
- Formula: `ROUND((withStandard / totalTests) * 1000) / 10`
- Score: `min(100, standardsPct)`

**Overall KRA Score:**
- Formula: `SUM(kra.score * kra.weight / 100)` for all 5 KRAs, rounded to 1 decimal
- Example: `(DataQuality.score * 0.30) + (STPThroughput.score * 0.20) + (ReviewThroughput.score * 0.20) + (NABL.score * 0.15) + (Standards.score * 0.15)`

---

### Alerts (4 Types)

Alerts are auto-detected from `TestMaster` and `TestParameter` records. Same 4 alert types as Master Personnel but in a slightly different order.

| Alert Type | Trigger Condition | Severity | Message Format |
|---|---|---|---|
| Incomplete STPs | `TestMaster.isActive = true AND (specification IS NULL/EMPTY OR method IS NULL/EMPTY)` | Amber | "X STP(s) missing specification or method" |
| Tests Not Linked to Standard | `TestMaster.isActive = true AND standardId IS NULL` | Red | "X test(s) not linked to any standard" |
| Tests Not NABL Accredited | `TestMaster.isActive = true AND isAccredited = false` | Amber | "X test(s) not NABL accredited" |
| Tests Without Parameters | `TestMaster.isActive = true AND has no TestParameter records` (LEFT JOIN where parameters.id IS NULL) | Amber | "X test(s) have no parameters defined" |

Alert display: Same as Master Personnel -- conditional banners below stats strip.

---

### Recent Activity (Reviews + Creation Combined)

**Source:** `AuditLog` WHERE `userId = currentUser AND entity IN ('TestMaster', 'TestParameter', 'Standard', 'ProductType', 'Specification')`

**Note:** The MASTER_ENTITIES list for Master Controller is slightly different from Master Personnel -- it does NOT include `SpecificationParameter` or `RateMaster`.

**Sort:** `createdAt DESC`, limit 15

**Description format:** `"{Action}d {Entity} #{entityId}"` (e.g., "Approved Test Master #15", "Created Standard #7")

**Action icons:**
- approve: green checkmark
- reject: red X
- update: blue (~)
- create: violet (+)

---

### Quick Actions (Toggle, Hidden by Default)

9 action buttons in a collapsible grid:

| Action | Path |
|---|---|
| Review STPs | `/masters/tests` |
| Standards | `/masters/standards` |
| Products | `/masters/products` |
| NABL | `/qdms/nabl` |
| Price List | `/masters/rates` |
| TRF Table | `/samples/tracking` |
| Mailer | `/emails/compose` |
| Ticket | `/tickets/new` |
| Indent | `/indents/new` |

---

### What Refreshes Automatically

| Data | Refresh Interval | Stale Time | Why |
|---|---|---|---|
| Stats Strip | 60s | 30s | Creation and approval activity changes throughout the day |
| Approval Queue | 60s | 30s | New STPs arrive frequently for review |
| Alerts | 60s | 30s | Data quality issues need prompt attention |
| KPIs / KRAs | 300s (5 min) | 60s | Monthly numbers change slowly |
| Recent Activity | 60s | 30s | Review actions happen frequently |

If the server is unavailable, the dashboard falls back to hardcoded mock data so the page does not break.

---

### Data Sources (Where Each Number Comes From)

| DB Model/Table | Used By |
|---|---|
| `AuditLog` | Stats (STPs Today, Analytes, Approved, Rejected), KPIs (STPs/Month, Analytes/Month, Reviews/Month), Recent Activity |
| `TestMaster` | Stats (Pending, Completeness), KPIs (Pending Items, Completeness), KRAs (Data Quality, STP Throughput, NABL Compliance, Standards Compliance), Alerts (all 4 types), Approval Queue |
| `TestParameter` | Approval Queue (param count), Alerts (tests without parameters) |
| `Department` | Approval Queue (department name/code) |
| `Standard` | Approval Queue (standard name/code), KRA Standards Compliance |

---

### Tracked Entities (MASTER_ENTITIES constant)

The following entity types are tracked in AuditLog for this dashboard:
`TestMaster`, `TestParameter`, `Standard`, `ProductType`, `Specification`

Note: This is a smaller set than Master Personnel (which also tracks `SpecificationParameter` and `RateMaster`).

---

### Differences from Master Personnel Dashboard

| Aspect | Master Personnel | Master Controller |
|---|---|---|
| Stats strip items | 5 (STPs Today, Analytes, Total STPs, Incomplete, Complete) | 6 (STPs Today, Analytes, Approved, Rejected, Pending, Complete) |
| Approval metrics | None | Approved/Rejected today, Reviews/Month KPI |
| Main content area | Recent Activity table | Approval Queue table with issue detection |
| KRA count | 4 (Data Quality 35%, Throughput 25%, Standards 20%, Turnaround 20%) | 5 (Data Quality 30%, STP Throughput 20%, Review Throughput 20%, NABL 15%, Standards 15%) |
| KPI count | 5 (STPs, Analytes, Methods Updated, Pending, Completeness) | 5 (STPs, Analytes, Reviews Completed, Pending, Completeness) |
| Completeness check | 5 fields (name, code, method, unit, dept) | 7 fields (name, code, method, spec, minLimit, maxLimit, standard) |
| NABL Compliance KRA | Not tracked | 15% weight |
| Turnaround KRA | 20% weight (placeholder at 95%) | Not tracked |
| MASTER_ENTITIES | 7 entities | 5 entities |
| Header gradient | Emerald-to-teal | Purple-to-indigo |
| Data Quality Breakdown | Full 9-field table | Not present (uses approval queue instead) |

---

### Pending Items (Not Yet Implemented)

**1. Approval Workflow Integration**
- Problem: Approve/Reject buttons in the queue are displayed but not yet wired to backend approval actions
- Solution: Connect buttons to AuditLog-based approve/reject endpoints
- Impact: Will enable real approval workflow from the dashboard

**2. Configurable KPI Targets**
- Problem: All targets are hardcoded (50 STPs/month, 100 analytes/month, 80 reviews/month)
- Solution: Allow admin to set targets per user or per role
- Impact: More realistic performance measurement

**3. Review Turnaround Time**
- Problem: No turnaround tracking for how long reviews take
- Solution: Track time from STP submission to approval/rejection
- Impact: Can measure review efficiency and SLA compliance

**4. Rejection Reason Tracking**
- Problem: Rejections are counted but reasons are not recorded
- Solution: Add rejection reason field to approval workflow
- Impact: Better insight into data quality patterns and training needs
