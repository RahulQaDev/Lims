# Reception Dashboard -- Logic Document

**Last Updated:** 8 April 2026

---

## How Each Number on the Dashboard is Calculated

### Stats Strip (Top Bar)

**Processed Today**
- What it shows: How many samples this receptionist processed (received into the system) today
- Logic: Count all Sample records where receivedBy equals the logged-in user and createdAt is today
- Updates: Every 60 seconds

**Received Today**
- What it shows: How many samples this receptionist received that are still in "received" status today
- Logic: Count all Sample records where receivedBy equals the logged-in user, status is "received", and createdAt is today
- Updates: Every 60 seconds

**Pending TRFs**
- What it shows: How many TRFs (Test Request Forms) are globally waiting to be booked
- Logic: Count all Sample records where status is "received" (no user filter -- this is a global count across the entire location)
- Updates: Every 60 seconds

**Avg Time**
- What it shows: Average time in minutes between a sample arriving and the receptionist logging it into the system today
- Logic: For each sample processed today by this user, calculate (Sample.createdAt minus Sample.receivedDate) in minutes. If receivedDate is missing, createdAt is used as fallback (resulting in zero minutes). Average all values. Rounded to one decimal place.
- Updates: Every 60 seconds

**Approval Rate**
- What it shows: What percentage of samples received this month have moved past the "received" status
- Logic: Count samples processed by this user this month where status is NOT "received", divide by total samples processed this month, multiply by 100. If no samples were processed this month, defaults to 100%.
- Updates: Every 60 seconds

---

### KPIs (Monthly/Daily Performance Metrics)

**1. TRFs Processed / Day**
- What it measures: Volume of samples this receptionist logged into the system today
- Target: 30 samples per day
- Calculation: Count all Sample records where receivedBy equals this user and createdAt is today
- Color: Green if progress >= 90%, Amber if >= 75%, Red if below 75%

**2. Avg Processing Time**
- What it measures: How long on average it takes from a sample physically arriving to the receptionist entering it in the system (today only)
- Target: 10 minutes
- Calculation: For each sample processed today, calculate (Sample.createdAt minus Sample.receivedDate) in minutes. If receivedDate is null, createdAt is used as fallback. Average all values, rounded to one decimal place.
- Color: Green if progress >= 90%, Amber if >= 75%, Red if below 75%
- Note: This is an inverse KPI -- lower is better. Progress is calculated as (target / actual) so a faster time yields higher progress.

**3. Approval Accuracy**
- What it measures: What percentage of this month's samples have moved beyond "received" status (i.e., successfully progressed to booking or testing)
- Target: 99%
- Calculation: Count samples processed by this user this month where status is NOT "received", divide by total samples processed this month, multiply by 100. Rounded to one decimal place.
- Color: Green if >= 90%, Amber if >= 75%, Red if below 75%

**4. Pending TRFs**
- What it measures: How many samples are sitting in "received" status system-wide, waiting to be booked
- Target: 0 (ideally nothing pending)
- Calculation: Count all Sample records with status "received" (global, not user-scoped)
- Color: This is an inverse KPI -- lower is better. With target of 0, progress is calculated as: if actual is 0 then 100%, otherwise max(0, 100 minus actual times 10)
- Note: This is a system-wide metric, not personal. Every receptionist sees the same number.

**5. New Client Activations**
- What it measures: How many brand-new clients were onboarded this month through samples processed by this receptionist
- Target: 0 (informational, no target threshold)
- Calculation: Collect all unique clientId values from samples processed by this user this month. Then count how many of those Client records have a createdAt date within this month (meaning they are newly created clients).
- Color: No target-based coloring since target is 0 and it is not inverse. Displays as informational.

---

### KRAs (Key Result Areas -- Weighted Performance Score)

The overall KRA score is a weighted average of 4 areas. Each area gets a score out of 100, multiplied by its weight, and all are added up. Rounded to one decimal place.

**1. Processing Accuracy -- Weight: 30%**
- What it measures: How many samples were received in acceptable condition (intact or no condition recorded)
- Target: 99%
- Calculation: Count samples this month where condition is "intact" OR condition is null/empty, divide by total samples this month, multiply by 100
- Score: min(100, (actual / 99) times 100)
- Example: 200 samples this month, 195 intact = 97.5% actual, score = min(100, 97.5/99 times 100) = 98.5

**2. Processing Speed -- Weight: 25%**
- What it measures: What percentage of samples were processed within the 10-minute target
- Target: 95%
- Calculation: For each sample this month, calculate processing time as (createdAt minus receivedDate) in minutes. Count how many were 10 minutes or less. Divide by total, multiply by 100.
- Score: min(100, (actual / 95) times 100)
- Example: 200 samples, 184 processed within 10 min = 92% actual, score = min(100, 92/95 times 100) = 96.8

**3. Client Verification -- Weight: 25%**
- What it measures: What percentage of samples have a valid client assigned
- Target: 90%
- Calculation: Count samples this month where clientId is not null/empty, divide by total samples this month, multiply by 100
- Score: min(100, (actual / 90) times 100)
- Example: 200 samples, 200 with clientId = 100% actual, score = min(100, 100/90 times 100) = 100 (capped)

**4. Documentation Compliance -- Weight: 20%**
- What it measures: What percentage of samples have all required fields filled in (client assigned AND description provided)
- Target: 100%
- Calculation: Count samples this month where clientId is present AND description is present and not empty, divide by total samples this month, multiply by 100
- Score: min(100, (actual / 100) times 100), which simplifies to min(100, actual)
- Example: 200 samples, 191 fully documented = 95.5% actual, score = 95.5

**Overall KRA Score:**
- Formula: (Processing Accuracy Score times 0.30) + (Processing Speed Score times 0.25) + (Client Verification Score times 0.25) + (Documentation Compliance Score times 0.20)
- Example: (98.5 times 0.30) + (96.8 times 0.25) + (100 times 0.25) + (95.5 times 0.20) = 29.55 + 24.2 + 25.0 + 19.1 = 97.9%

---

### TRF Queue (Pending Samples Awaiting Booking)

**What it shows:** All samples in "received" status that have not yet been booked, sorted by urgency. Limited to 30 records.

**Sorting logic:**
1. Express priority first, then Urgent, then Normal
2. Within same priority, the one that was received earliest comes first (receivedDate ascending)

**Wait time calculation:**
- For each sample: (current time minus receivedDate) in minutes
- If receivedDate is missing, createdAt is used as fallback

**Wait time color coding (frontend):**
- Green: 30 minutes or less
- Amber: Between 31 and 60 minutes
- Red: Over 60 minutes

**New Client flag:**
- If a sample's client has no client code (code is null or empty), the sample is flagged as "New Client" with a purple badge

**Columns shown:** Sample code, client name (with new client badge if applicable), description, product type, priority badge, wait time, Approve/Reject action buttons

---

### Recently Received Samples

**What it shows:** The last 15 samples processed by this receptionist, sorted newest first.

**Columns shown:** Sample code, client name, description, priority badge, status badge, received date

**Status colors:**
- Received: Yellow
- Booked: Purple
- In Testing: Blue
- Under Review: Cyan
- Approved: Green
- CoA Generated: Teal
- Dispatched: Gray

---

### Recent Activity

**What it shows:** The last 10 samples handled by this receptionist, sorted newest first. Includes sample code, client, description, status, priority, condition, and timestamp.

---

### Alerts

**Urgent/Express TRFs Alert**
- When it triggers: When any sample in "received" status has a priority of "urgent" or "express"
- What it shows: Count of urgent/express TRFs awaiting action
- Severity: Red
- How often it checks: Every 30 seconds

**Damaged/Compromised Samples Alert**
- When it triggers: When any sample in "received" status has a condition of "damaged", "temperature_deviation", or "leaking"
- What it shows: Count of samples received in compromised condition
- Severity: Amber
- How often it checks: Every 30 seconds

**Long-Waiting TRFs Alert**
- When it triggers: When any sample in "received" status has a receivedDate more than 2 hours ago
- What it shows: Count of samples waiting over 2 hours for processing
- Severity: Amber
- How often it checks: Every 30 seconds

---

### Quick Actions

Seven shortcut buttons, toggled by a show/hide control:

| Action | Navigates To |
|---|---|
| Receive Sample | /samples/reception |
| View Clients | /masters/clients |
| Track Samples | /samples/tracking |
| Transfer | /samples/transfers |
| Mailer | /emails/compose |
| Ticket | /tickets/new |
| Indent | /indents/new |

---

### What Refreshes Automatically (No User Action Needed)

| Data | Refresh Interval | Stale Time | Why |
|---|---|---|---|
| Alerts | Every 30 seconds | 15s | Urgent/express TRFs and damaged samples need fast response |
| TRF Queue | Every 30 seconds | 15s | Queue changes rapidly as samples arrive and get booked |
| Stats Strip | Every 60 seconds | 30s | Work volume changes during the day |
| Received Samples | Every 60 seconds | 30s | Status of recently received samples updates |
| Recent Activity | Every 60 seconds | 30s | New activity throughout the day |
| KPIs and KRAs | Every 5 minutes | 60s | Monthly/daily metrics do not change rapidly |

If the server is unavailable, the dashboard falls back to mock sample data so the page does not break.

---

### Data Sources (Where Each Number Comes From)

| What | Database Table |
|---|---|
| Sample counts, status, receivedDate, condition | Sample |
| Client names, client codes, new client detection | Client |
| Product type names | ProductType |
| User identity for scoping | User (via JWT req.userId) |

---

### Pending Items (Not Yet Implemented)

**1. Sample Condition Tracking Improvement**
- Problem: Processing Accuracy KRA treats any non-"intact" condition as an issue against the receptionist, but sample condition is determined before the receptionist receives it
- Solution: Separate "condition at arrival" (not the receptionist's fault) from "processing errors" (receptionist mistakes)
- Impact: Processing Accuracy KRA would become more meaningful

**2. Client Complaints KPI**
- Problem: The defaultRoles.ts file defines a "Client Complaints" KPI with target 0 for the receptionist role, but the dashboard does not implement it
- Solution: Add a complaint tracking mechanism linked to sample reception
- Current state: Not available in the backend controller

**3. Booking Accuracy KPI**
- Problem: The defaultRoles.ts file defines a "Booking Accuracy" KPI at 99% for the receptionist role, but the dashboard uses "Approval Accuracy" instead, which measures a different thing (samples moving past received status)
- Solution: Align the dashboard KPI with the role configuration or update the role configuration to match

**4. Configurable Processing Time Target**
- Problem: The 10-minute target for average processing time is hardcoded in the backend
- Solution: Make it configurable per location or per role

**5. User-Scoped Pending TRFs**
- Problem: Pending TRFs count is global (all received samples), not scoped to the receptionist's location
- Solution: Filter by the receptionist's assigned location once multi-location scoping is implemented
