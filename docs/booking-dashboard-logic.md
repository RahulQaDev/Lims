# Booking Dashboard -- Logic Document

**Last Updated:** 8 April 2026

---

## How Each Number on the Dashboard is Calculated

### Stats Strip (Top Bar)

**Booked Today**
- What it shows: How many samples this booking person booked today
- Logic: Count Booking records where bookedBy = this user AND createdAt = today
- Trend: Shows % change vs yesterday's count
- Updates: Every 60 seconds

**Pending Queue**
- What it shows: Samples received but not yet booked (lab-wide)
- Logic: Count Sample records where status = "received"
- Updates: Every 60 seconds

**Revenue**
- What it shows: Total net amount from today's bookings by this user
- Logic: SUM(Booking.netAmount) where bookedBy = this user AND createdAt = today
- Displayed in thousands (e.g., "42K")
- Updates: Every 60 seconds

**On-Time Rate**
- What it shows: Percentage of bookings completed within 2 hours of sample receipt this month
- Logic: For each booking this month, calculate hours = (Booking.createdAt - Sample.receivedDate). Count bookings where hours <= 2. Divide by total valid bookings. Multiply by 100.
- Only counts bookings where the time difference is between 0 and 720 hours (reasonable range)
- Updates: Every 60 seconds

**Avg Time**
- What it shows: Average booking time in hours this month
- Logic: For each booking this month with a valid sample receivedDate, calculate (Booking.createdAt - Sample.receivedDate) in hours. Average all values.
- This is the Booking TAT: from when the sample was received at the lab to when the booking was created
- Updates: Every 60 seconds

---

### KPIs (6 Metrics)

**1. Booked / Day**
- Target: 25 bookings per day
- Calculation: Same as Booked Today stat
- Color: Green >= 90%, Amber >= 75%, Red < 75%

**2. Avg Booking Time**
- Target: 2 hours
- Calculation: Average of (Booking.createdAt - Sample.receivedDate) this month
- Inverse KPI -- lower is better

**3. On-Time Rate**
- Target: 95%
- Calculation: % of bookings done within 2 hours of sample receipt
- On-time = booked within 2 hours

**4. Amendment Rate**
- Target: 5% or less
- Calculation: COUNT(Booking WHERE isAmended = true) / total bookings this month x 100
- Inverse KPI -- lower is better

**5. Barcode Same Day**
- Target: 100%
- Calculation: Currently approximated -- all bookings today assumed to have barcodes
- Planned: Track actual barcode generation timestamp

**6. Pending Queue**
- Target: 0
- Calculation: Global count of received samples
- Inverse KPI -- lower is better

---

### KRAs (5 Weighted Areas)

**1. Booking Accuracy -- Weight: 30%**
- Target: 99%
- Calculation: (1 - amended bookings / total bookings) x 100 this month
- Score: min(100, (actual / 99) x 100)

**2. Booking Turnaround -- Weight: 25%**
- Target: 95%
- Calculation: Same as On-Time Rate -- % of bookings done within 2 hours
- Score: min(100, (actual / 95) x 100)

**3. Daily Volume -- Weight: 20%**
- Target: 100%
- Calculation: min(100, (total month / (working days x 25)) x 100)
- Score: Same as the percentage

**4. Amendment Rate -- Weight: 15%**
- Target: 5% or less
- Inverse KRA -- lower is better
- Score: If actual <= target, score = 100. Otherwise: max(0, 100 - ((actual - target) / target) x 100)

**5. Client Data Compliance -- Weight: 10%**
- Target: 100%
- Calculation: For each booking this month, check if linked client has name, email, phone, and address filled. Count compliant / total x 100.
- Previously hardcoded at 97% -- now computed from actual client data
- Score: min(100, actual)

**Overall KRA Score:**
- Formula: SUM(each KRA score x weight / 100)

---

### Booking Queue

Samples in "received" status waiting to be booked. Sorted by receivedDate ascending. Limited to 50.

**Wait time colors:**
- Green: <= 2 hours
- Amber: 2 to 4 hours
- Red: Over 4 hours

---

### Today's Bookings

All bookings created today by this user with report number, sample code, client, test count, amount, priority, status, and time taken.

**Time taken:** (Booking.createdAt - Sample.receivedDate) in hours

---

### Alerts

Queue Alert triggers when pending queue exceeds 5 samples.

---

### Auto-Refresh Schedule

| Data | Refresh | Stale Time |
|------|---------|------------|
| Booking Queue | 30 seconds | 15s |
| Stats, Bookings | 60 seconds | 30s |
| KRAs | 5 minutes | 60s |

---

### Data Sources

| What | Database Table |
|------|---------------|
| Booking counts, amounts, dates, amendments | Booking |
| Sample receivedDate, status, priority | Sample |
| Client name, billing info | Client |
| Test count per booking | BookingTest |

---

### Pending Items

1. **Barcode Tracking** -- Track actual barcode generation timestamp
2. **Quotation Reference** -- Add quotation module integration
3. **PO Consumption** -- Add purchase order tracking widget
4. **Cancellation Rate** -- Calculated but not displayed in compact KPI sidebar
