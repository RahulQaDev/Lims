# Analyst Dashboard — Logic Document

**Last Updated:** 7 April 2026

---

## How Each Number on the Dashboard is Calculated

### Stats Strip (Top Bar)

**Assigned Today**
- What it shows: How many tests were assigned to this analyst today
- Logic: Count all BookingTest records where the test is assigned to the logged-in analyst and was created today
- Updates: Every 60 seconds

**Completed**
- What it shows: How many tests this analyst finished today
- Logic: Count all BookingTest records assigned to this analyst where status is completed, reviewed, or approved and was updated today
- Updates: Every 60 seconds

**Pending**
- What it shows: How many tests are waiting for this analyst right now
- Logic: Count all BookingTest records assigned to this analyst where status is pending or in_progress (no date filter — includes all pending work)
- Updates: Every 60 seconds

**Overdue**
- What it shows: How many tests have crossed their deadline and are still not done
- Logic: Count all BookingTest records assigned to this analyst where status is pending or in_progress AND the due date has already passed
- Updates: Every 60 seconds

**On-Time Rate**
- What it shows: What percentage of tests were finished before deadline this month
- Logic: Count tests completed before their due date this month, divide by total completed this month, multiply by 100
- Updates: Every 60 seconds

---

### KPIs (Monthly Performance Metrics)

**1. Samples Completed / Month**
- What it measures: Volume of work done this month
- Target: 120 tests per month (currently same for all analysts, will be per-department later)
- Calculation: Count all BookingTest records assigned to this analyst with status completed/reviewed/approved, updated this month
- Color: Green if >= 100, Yellow if >= 80, Red if below 80

**2. Average TAT (Turnaround Time)**
- What it measures: How long the analyst takes from receiving a test to entering the result
- Target: 24 hours
- Calculation:
  - Start point: BookingTest.createdAt — this is when the booking was done and the test landed in the department
  - End point: Result.enteredAt — this is when the analyst actually submitted the result
  - For each completed test this month: calculate (Result.enteredAt - BookingTest.createdAt) in hours
  - Average all of them
  - If a test has no Result record yet, it uses BookingTest.updatedAt as fallback
- Color: Green if <= 24h, Yellow if <= 36h, Red if above 36h
- Note: This is an inverse KPI — lower is better

**3. On-Time Delivery**
- What it measures: What percentage of results were entered before the deadline
- Target: 95%
- Calculation:
  - For each completed test this month: check if Result.enteredAt <= BookingTest.dueDate
  - Count how many were on time, divide by total, multiply by 100
  - Same fallback as TAT — uses BookingTest.updatedAt if no Result record
- Color: Green if >= 90%, Yellow if >= 70%, Red if below 70%

**4. Rejection Rate**
- What it measures: How often the reviewer sends results back to the analyst
- Target: 2% or less
- Calculation: Count of tests with status "rejected" / (completed + rejected) x 100
- Color: Green if <= 3%, Yellow if <= 7%, Red if above 7%
- Note: This is an inverse KPI — lower is better
- Current limitation: Only counts tests currently in "rejected" status. If a test was rejected and then re-submitted and approved, the rejection is not counted. This will change once we implement the ResultHistory table (see Pending section below).

**5. Pending Tasks**
- What it measures: How much work is still in the analyst's queue
- Target: 0 (ideally nothing pending)
- Calculation: Count of BookingTest records assigned to this analyst with status pending or in_progress
- Color: Green if <= 5, Yellow if <= 10, Red if above 10
- Note: This is an inverse KPI — lower is better

---

### KRAs (Key Result Areas — Weighted Performance Score)

The overall KRA score is a weighted average of 4 areas. Each area gets a score out of 100, multiplied by its weight, and all are added up.

**1. Testing Accuracy — Weight: 30%**
- What it measures: How often the analyst's results are accepted without rejection
- Target: 98%
- Calculation: (total completed tests - rejected tests) / total completed tests x 100
- Example: 100 tests done, 2 rejected = 98% accuracy
- Score: min(100, (actual / 98) x 100)

**2. TAT Compliance — Weight: 25%**
- What it measures: How often the analyst delivers results on time
- Target: 95%
- Calculation: Same as the On-Time Delivery KPI value
- Score: min(100, (actual / 95) x 100)

**3. Sample Throughput — Weight: 25%**
- What it measures: How much of the monthly target the analyst has achieved
- Target: 120 tests per month
- Calculation: min(100, (tests completed this month / 120) x 100)
- Example: 98 tests done = 81.7% throughput
- Score: Same as the percentage
- Note: 120 is currently hardcoded. Will be made configurable per department.

**4. Quality Score — Weight: 20%**
- What it measures: Overall quality of work considering rejections
- Target: 95%
- Calculation: 100 - (rejection rate x 5)
- The x5 multiplier means each 1% of rejection rate removes 5 points from quality
- Example: 2% rejection rate = 100 - 10 = 90 quality score
- Example: 0% rejection rate = 100 quality score
- Example: 5% rejection rate = 75 quality score
- Note: The x5 penalty factor is pending final confirmation

**Overall KRA Score:**
- Formula: (Accuracy Score x 0.30) + (TAT Score x 0.25) + (Throughput Score x 0.25) + (Quality Score x 0.20)
- Example: (100 x 0.30) + (98 x 0.25) + (82 x 0.25) + (96 x 0.20) = 30 + 24.5 + 20.5 + 19.2 = 94.2%

---

### Work Queue (My Assigned Tests)

**What it shows:** All tests assigned to this analyst that are pending or in progress, sorted by urgency.

**Sorting logic:**
1. Critical tests first, then Urgent, then Normal
2. Within same priority, the one with least time remaining comes first

**Auto-escalation (system does this automatically):**
- If a Normal priority test has less than 25% of its TAT time remaining, the system bumps it to Urgent
- If any test (except already Critical) has less than 10% of its TAT time remaining, the system bumps it to Critical
- Example: A test with 48-hour TAT and only 10 hours left = less than 25%, so Normal becomes Urgent
- Example: Same test with only 4 hours left = less than 10%, becomes Critical

**Time remaining color:**
- Green: More than 4 hours left
- Yellow: Between 1 and 4 hours left
- Red: Less than 1 hour or already overdue

**Due date calculation:**
- Currently: Booking date + TAT hours from the test master (e.g., if TAT is 48 hours, due date is 2 days after booking)
- Planned: Will factor in lab occupancy, machine availability, and chemical stock

---

### Alerts

**OOS (Out of Specification) Alert**
- When it triggers: When any result parameter entered by this analyst has passFail = "fail" and the result status is still "entered" or "reviewed" (not yet fully resolved)
- What it shows: Sample code, test name, parameter name, the value obtained, and the specification limit
- How often it checks: Every 30 seconds (most frequent check on the dashboard)
- Display: Red banner at the top of the dashboard

**Low Stock Alert**
- When it triggers: When any consumable item in the analyst's location has current stock at or below minimum stock level
- What it shows: Item name, current stock vs minimum, unit
- Critical flag: If stock is zero, shown in red
- How often it checks: Every 5 minutes

**Equipment Issues**
- When it triggers: When any instrument in the analyst's department is not in "active" status
- Auto-detection: If an instrument's next calibration date has passed and it's still marked "active", the system automatically flags it as "calibration due"
- PM due soon: Flagged if calibration is due within the next 7 days
- What it shows: Instrument name, code, status (Offline / Under PM / Calibration Due)
- How often it checks: Every 5 minutes
- Note: Only shows instruments with problems. If everything is fine, this section is hidden.

---

### What Refreshes Automatically (No User Action Needed)

| Data | Refresh Interval | Why |
|------|-----------------|-----|
| OOS Alerts | Every 30 seconds | Safety critical — analyst needs to respond quickly |
| Stats, Work Queue, Recent Results | Every 60 seconds | Work changes frequently during the day |
| KPIs, KRAs | Every 5 minutes | Monthly numbers don't change rapidly |
| Equipment, Consumables | Every 5 minutes | Status changes are infrequent |

If the server is unavailable, the dashboard shows the last known data or falls back to sample mock data so the page doesn't break.

---

### Data Sources (Where Each Number Comes From)

| What | Database Table |
|------|---------------|
| Test assignments, status, due dates | BookingTest |
| Sample codes, client names | Sample, Client (via Booking) |
| Test names, TAT hours | TestMaster |
| Department info | Department, DepartmentUser |
| Result entry timestamp | Result |
| Pass/fail for OOS detection | ResultParameter |
| Instrument status, calibration dates | Instrument |
| Stock levels | InventoryItem |

---

### Pending Items (Not Yet Implemented)

**1. Rejection History Tracking**
- Problem: Currently if a test is rejected and re-submitted, the rejection disappears from records
- Solution: A ResultHistory table that logs every rejection permanently
- Impact: Rejection rate will become more accurate; a new "First Pass Rate" KPI can be added
- Estimated effort: 3 hours
- Detail document: docs/rejection-tracking-implementation.md

**2. Configurable Throughput Target**
- Problem: 120 tests/month is hardcoded for all analysts
- Solution: Allow department heads to set different targets per department
- Example: HPLC department target = 150, Micro = 80

**3. Smart Due Date Scheduling**
- Problem: Due date is simply booking date + TAT hours, doesn't consider real conditions
- Solution: Factor in lab occupancy (how many tests are queued), machine availability, chemical/reagent stock
- This is a larger feature for later

**4. Quality Score Penalty Confirmation**
- Current: Each 1% rejection removes 5 points from quality score
- Need: Stakeholder to confirm if x5 is the right multiplier or if it should be adjusted
