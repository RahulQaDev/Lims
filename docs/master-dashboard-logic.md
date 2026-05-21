# Master Personnel Dashboard — Logic Document

**Last Updated:** 9 April 2026

---

## How Each Number on the Dashboard is Calculated

### Stats Strip (Top Bar — 5 items in header banner)

**STPs Today**
- What it shows: How many Standard Test Procedures (STPs) this user created today
- Logic: `COUNT(AuditLog) WHERE userId = currentUser AND entity = 'TestMaster' AND action = 'create' AND createdAt >= startOfToday`
- Updates: Every 60 seconds

**Analytes**
- What it shows: How many test parameters/analytes this user added today
- Logic: `COUNT(AuditLog) WHERE userId = currentUser AND entity = 'TestParameter' AND action = 'create' AND createdAt >= startOfToday`
- Updates: Every 60 seconds

**Total STPs**
- What it shows: Total number of active STPs in the system
- Logic: `COUNT(TestMaster) WHERE isActive = true`
- Updates: Every 60 seconds

**Incomplete**
- What it shows: How many active STPs are missing specification or method
- Logic: `COUNT(TestMaster) WHERE isActive = true AND (specification IS NULL OR specification = '' OR method IS NULL OR method = '')`
- Updates: Every 60 seconds

**Complete (Data Completeness %)**
- What it shows: Percentage of active test masters with all required fields filled
- Logic: Count test masters where all 5 required fields are present (`name` not empty, `code` not null, `method` not null/empty, `unit` not null/empty, `departmentId` not null), divide by total active test masters, multiply by 100
- Formula: `ROUND((completeCount / totalActiveTests) * 1000) / 10`
- If no active tests exist, returns 100%
- Updates: Every 60 seconds

---

### KPIs (5 Monthly Performance Metrics)

All KPIs are auto-computed monthly from the `AuditLog` and `TestMaster` tables. No manual input required.

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

**3. Methods Updated / Month**
- What it measures: How many STP updates (method changes) this month
- Target: 30 updates per month
- Calculation: `COUNT(AuditLog) WHERE userId = currentUser AND entity = 'TestMaster' AND action = 'update' AND createdAt >= startOfMonth`
- Inverse: No (higher is better)

**4. Pending STPs**
- What it measures: How many STPs are incomplete (missing specification or method)
- Target: 0 (ideally nothing pending)
- Calculation: `COUNT(TestMaster) WHERE isActive = true AND (specification IS NULL OR specification = '' OR method IS NULL OR method = '')`
- Inverse: Yes (lower is better)

**5. Data Completeness**
- What it measures: Percentage of test masters with all required fields
- Target: 100%
- Calculation: Same as the stats strip completeness calculation (5 required fields: name, code, method, unit, departmentId)
- Formula: `ROUND((completeCount / totalActiveTests) * 1000) / 10`
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

### KRAs (4 Key Result Areas, Weighted to 100%)

All KRAs are auto-computed from `TestMaster` records. No manual scoring.

**1. Data Quality — Weight: 35%**
- What it measures: Percentage of active test masters with complete specification, method, and limits
- Target: 98%
- Calculation: `COUNT(TestMaster WHERE isActive = true AND specification IS NOT NULL/EMPTY AND method IS NOT NULL/EMPTY AND minLimit IS NOT NULL AND maxLimit IS NOT NULL) / COUNT(all active TestMaster) * 100`
- Score: `min(100, (dataQuality / 98) * 100)`

**2. STP Throughput — Weight: 25%**
- What it measures: How much of the monthly STP creation target has been achieved
- Target: 50 STPs per month
- Calculation: `min(100, ROUND((stpsMonth / 50) * 1000) / 10)`
- Score: Same as the calculated percentage

**3. Standards Compliance — Weight: 20%**
- What it measures: Percentage of active tests linked to a standard
- Target: 100%
- Calculation: `COUNT(TestMaster WHERE isActive = true AND standardId IS NOT NULL) / COUNT(all active TestMaster) * 100`
- Score: `min(100, standardsCompliance)`

**4. Turnaround — Weight: 20%**
- What it measures: Placeholder for processing turnaround performance
- Target: 95%
- Calculation: Currently hardcoded at 95 (placeholder value)
- Score: `min(100, (95 / 95) * 100)` = 100
- Note: This is a placeholder. Real turnaround tracking is pending implementation.

**Overall KRA Score:**
- Formula: `SUM(kra.score * kra.weight / 100)` for all 4 KRAs, rounded to 1 decimal
- Example: `(DataQuality.score * 0.35) + (Throughput.score * 0.25) + (Standards.score * 0.20) + (Turnaround.score * 0.20)`

---

### Alerts (4 Types)

Alerts are auto-detected from `TestMaster` and `TestParameter` records. No manual input.

| Alert Type | Trigger Condition | Severity | Message Format |
|---|---|---|---|
| Incomplete STPs | `TestMaster.isActive = true AND (specification IS NULL/EMPTY OR method IS NULL/EMPTY)` | Amber | "X STP(s) missing specification or method" |
| Tests Without Parameters | `TestMaster.isActive = true AND has no TestParameter records` (LEFT JOIN where parameters.id IS NULL) | Amber | "X test(s) have no parameters defined" |
| Tests Not Linked to Standard | `TestMaster.isActive = true AND standardId IS NULL` | Red | "X test(s) not linked to any standard" |
| Tests Not Accredited | `TestMaster.isActive = true AND isAccredited = false` | Amber | "X test(s) not NABL accredited" |

Alert display: Conditional banners below the stats strip. Red severity uses red background/icon, amber uses amber background/icon. Hidden when no alerts exist.

---

### Data Quality Breakdown

**What it shows:** A per-field completeness table for all active test masters.

**Source:** `TestMaster` WHERE `isActive = true`

**9 Fields Tracked:**

| Field | Filled Condition |
|---|---|
| Name | `name IS NOT NULL AND name != ''` |
| Code | `code IS NOT NULL AND code != ''` |
| Method | `method IS NOT NULL AND method != ''` |
| Unit | `unit IS NOT NULL AND unit != ''` |
| Department | `departmentId IS NOT NULL` |
| Specification | `specification IS NOT NULL AND specification != ''` |
| Standard | `standardId IS NOT NULL` |
| Min Limit | `minLimit IS NOT NULL` |
| Max Limit | `maxLimit IS NOT NULL` |

**Per-field calculation:** `ROUND((filledCount / totalActiveTests) * 1000) / 10` gives percentage to 1 decimal.

**Display:** Table with columns: Field, Filled, Missing (total - filled), Completeness (progress bar with percentage).

**Color thresholds:** Same as KPI bars (Green >= 90%, Amber >= 75%, Red < 75%).

---

### Recent Activity

**Source:** `AuditLog` WHERE `userId = currentUser AND entity IN ('TestMaster', 'TestParameter', 'Standard', 'ProductType', 'Specification', 'SpecificationParameter', 'RateMaster')`

**Sort:** `createdAt DESC`, limit 15

**Description format:** `"{Action}d {Entity} #{entityId}"` where Action is capitalized (e.g., "Created Test Master #15", "Updated Test Parameter #42")

**Action icons:**
- create: green (+)
- update: blue (~)
- delete: red (-)

---

### Quick Actions (Toggle, Hidden by Default)

9 action buttons in a collapsible grid:

| Action | Path |
|---|---|
| Create STP | `/masters/tests` |
| Add Analyte | `/masters/tests` |
| Products | `/masters/products` |
| Standards | `/masters/standards` |
| Price List | `/masters/rates` |
| NABL | `/qdms/nabl` |
| Mailer | `/emails/compose` |
| Ticket | `/tickets/new` |
| Indent | `/indents/new` |

---

### What Refreshes Automatically

| Data | Refresh Interval | Stale Time | Why |
|---|---|---|---|
| Stats Strip | 60s | 30s | Activity changes throughout the day |
| Recent Activity | 60s | 30s | New actions appear frequently |
| Alerts | 60s | 30s | Data quality issues need prompt attention |
| KPIs / KRAs | 300s (5 min) | 60s | Monthly numbers change slowly |
| Data Quality Breakdown | 300s (5 min) | 60s | Field completeness changes slowly |

If the server is unavailable, the dashboard falls back to hardcoded mock data so the page does not break.

---

### Data Sources (Where Each Number Comes From)

| DB Model/Table | Used By |
|---|---|
| `AuditLog` | Stats (STPs Today, Analytes), KPIs (STPs/Month, Analytes/Month, Methods/Month), Recent Activity |
| `TestMaster` | Stats (Total STPs, Incomplete, Completeness), KPIs (Pending STPs, Completeness), KRAs (Data Quality, Standards Compliance), Alerts (all 4 types), Data Quality Breakdown |
| `TestParameter` | Alerts (tests without parameters) |
| `Department` | Data Quality Breakdown (departmentId field check) |
| `Standard` | KRA Standards Compliance (standardId field check) |

---

### Tracked Entities (MASTER_ENTITIES constant)

The following entity types are tracked in AuditLog for this dashboard:
`TestMaster`, `TestParameter`, `Standard`, `ProductType`, `Specification`, `SpecificationParameter`, `RateMaster`

---

### Pending Items (Not Yet Implemented)

**1. Turnaround KRA**
- Problem: Currently hardcoded at 95% (placeholder)
- Solution: Track actual time from STP creation request to completion and compute real turnaround metrics
- Impact: KRA score will reflect actual performance instead of static value

**2. Configurable KPI Targets**
- Problem: All targets are hardcoded (50 STPs/month, 100 analytes/month, 30 methods/month)
- Solution: Allow admin to set targets per user or per role
- Impact: More realistic performance measurement across different lab sizes

**3. Data Quality Scoring Enhancements**
- Problem: Data Quality KRA only checks 4 fields (specification, method, minLimit, maxLimit)
- Solution: Could include more fields (unit, department, standard) for stricter quality scoring
- Impact: More comprehensive quality assessment
