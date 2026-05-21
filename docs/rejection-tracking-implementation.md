# Rejection Tracking at Analyst Level — Implementation Plan

## Current State

Right now the system tracks only the **current status** of a BookingTest (pending → in_progress → completed → reviewed → approved/rejected). When a result is rejected and the analyst re-enters it, the status changes back and forth but there is **no history** of how many times it was rejected.

## What We Need

Track every rejection event so that:
- Each rejection counts against the analyst's accuracy score permanently
- We can see how many times a specific test was rejected before final approval
- We can report first-pass rate (approved on first review attempt)

## Implementation Steps

### Step 1: Create a ResultHistory Table

```
Table: result_history
- id (INTEGER, PK, auto-increment)
- resultId (INTEGER, FK to results.id)
- bookingTestId (INTEGER, FK to booking_tests.id)
- analystId (INTEGER, FK to users.id) — who entered the result
- reviewerId (INTEGER, FK to users.id) — who reviewed it
- action (ENUM: 'submitted', 'approved', 'rejected', 're_submitted')
- remarks (TEXT) — reviewer's rejection reason or approval note
- createdAt (TIMESTAMP) — when this action happened
```

Every time a result changes status, a row is inserted here. This gives us a complete audit trail.

### Step 2: Update the Result Controller

In `server/controllers/result.controller.js`, wherever the result status changes:

**When analyst submits result:**
```js
await ResultHistory.create({
  resultId: result.id,
  bookingTestId: result.bookingTestId,
  analystId: req.userId,
  action: 'submitted',
  createdAt: new Date()
});
```

**When reviewer approves:**
```js
await ResultHistory.create({
  resultId: result.id,
  bookingTestId: result.bookingTestId,
  analystId: result.enteredBy,
  reviewerId: req.userId,
  action: 'approved',
  remarks: req.body.remarks,
  createdAt: new Date()
});
```

**When reviewer rejects:**
```js
await ResultHistory.create({
  resultId: result.id,
  bookingTestId: result.bookingTestId,
  analystId: result.enteredBy,
  reviewerId: req.userId,
  action: 'rejected',
  remarks: req.body.rejectionReason,
  createdAt: new Date()
});
```

**When analyst re-submits after rejection:**
```js
await ResultHistory.create({
  resultId: result.id,
  bookingTestId: result.bookingTestId,
  analystId: req.userId,
  action: 're_submitted',
  createdAt: new Date()
});
```

### Step 3: Update KPI Calculations

**Rejection count (for accuracy KPI):**
```sql
SELECT COUNT(*) FROM result_history
WHERE analystId = :userId
AND action = 'rejected'
AND createdAt >= :monthStart
```

This counts every rejection event, even if the same test was rejected multiple times or later approved.

**First-pass rate (new KPI):**
```sql
-- Tests approved on first attempt (no rejection in history)
SELECT COUNT(DISTINCT bookingTestId) FROM result_history
WHERE analystId = :userId
AND action = 'approved'
AND createdAt >= :monthStart
AND bookingTestId NOT IN (
  SELECT bookingTestId FROM result_history
  WHERE action = 'rejected' AND analystId = :userId
)
```

**Testing accuracy with history:**
```
totalSubmissions = COUNT(action = 'submitted' OR action = 're_submitted') this month
totalRejections = COUNT(action = 'rejected') this month
accuracy = ((totalSubmissions - totalRejections) / totalSubmissions) * 100
```

### Step 4: Files to Create/Modify

| Action | File |
|--------|------|
| Create | `server/models/ResultHistory.js` — new model |
| Modify | `server/models/index.js` — register model + associations |
| Modify | `server/controllers/result.controller.js` — insert history on status change |
| Modify | `server/controllers/analystDashboard.controller.js` — use history for rejection count |
| Modify | `server/seeders/seed.js` — add table creation |

### Step 5: What This Enables

Once implemented:
- **Rejection always counts:** Even if re-entry is approved, the rejection event stays in history
- **First-pass rate KPI:** New metric showing how often analyst gets it right the first time
- **Rejection trend:** Can track if an analyst's rejection rate is improving or worsening over months
- **Reviewer accountability:** Can also track which reviewer rejected what and why
- **Re-work time:** Time between rejection and re-submission can be calculated

### Estimated Effort

| Task | Hours |
|------|-------|
| Create ResultHistory model | 0.5 |
| Update result controller with history logging | 1 |
| Update KPI calculations to use history | 1 |
| Testing and verification | 0.5 |
| **Total** | **3 hrs** |
