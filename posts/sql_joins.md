---
title: "SQL Joins Revisited"
date: 2025-12-30
description: "Quick notes on Outer Joins, Cross Joins, and more. Keep missing data, build grids, avoid pitfalls."
---

## Left Join (Keep All from Left Table)

```sql
SELECT mt.station_name,
       COALESCE(SUM(pay.amount_received), 0) AS total_revenue
FROM management_table mt
LEFT JOIN payment_history pay
  ON mt.station_code = pay.station_code
 AND DATE(pay.paid_time) = CURRENT_DATE
GROUP BY mt.station_name;
```
LEFT JOIN → keep ALL stations, even if no payments today.
NULL → turn into 0 with COALESCE.
Perfect for daily reports: no station missing.

## Chain Multiple Outer Joins

```sql
SELECT mt.station_name,
       ph.entry_time,
       pay.amount_received
FROM management_table mt
LEFT JOIN parking_history ph
  ON mt.station_code = ph.station_code
LEFT JOIN payment_history pay
  ON ph.station_code = pay.station_code
 AND ph.entry_time   = pay.entry_time;

```
Start with all stations → add parking → add payments.
All stations stay, even if no cars or no payments.
Great for full pipeline reports.

## Cross Join (Every Combo)
```sql
SELECT mt.station_name, d.day_num
FROM management_table mt
CROSS JOIN (
    SELECT 1 AS day_num UNION ALL
    SELECT 2 UNION ALL
    SELECT 3 UNION ALL
    SELECT 4 UNION ALL
    SELECT 5
) d
ORDER BY mt.station_name, d.day_num;
```
CROSS JOIN → every station paired with every day_num.
Builds a "grid" (like calendar).
Later LEFT JOIN real data → show zero-activity days too.

## Natural Join (Avoid!)
```sql
-- NOT RECOMMENDED for production
SELECT *
FROM parking_history
NATURAL JOIN payment_history;
```
NATURAL JOIN auto-joins on same column names.
Looks easy, but dangerous: add new same-name column → join breaks silently.
Always use explicit ON.

## Summary
- LEFT JOIN: Keep all rows from left table → show zeros/missing
- RIGHT JOIN: Keep all from right (less common)
- FULL OUTER: Keep all from both (not all DBs support)
- Chain LEFT JOINs: Build full reports step by step
- CROSS JOIN: Make grids/combos → careful with big tables
- COALESCE(NULL, 0): Turn missing → 0 for clean reports
- Avoid NATURAL JOIN: Always write ON explicitly