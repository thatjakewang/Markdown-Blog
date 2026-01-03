title: SQL Conditional Logic
date: 2025-12-31
description: Quick notes on CASE. Categorize data, pivot rows to columns, safe calculations, conditional updates.

## Searched CASE (Ranges & Complex Rules)
```sql
SELECT ticket_id,
       TIMESTAMPDIFF(HOUR, entry_time, exit_time) AS duration_hours,
       CASE
           WHEN TIMESTAMPDIFF(HOUR, entry_time, exit_time) < 2 THEN 'Short-term'
           WHEN TIMESTAMPDIFF(HOUR, entry_time, exit_time) BETWEEN 2 AND 8 THEN 'Medium'
           ELSE 'Long-term'
       END AS duration_category
FROM parking_history
WHERE exit_time IS NOT NULL;
```
Searched CASE → check conditions freely (ranges, >, <, AND/OR).
Here: tag parking as Short/Medium/Long based on hours.

## Simple CASE (Exact Match Mapping)

```sql
SELECT station_name,
       CASE station_type
           WHEN 1 THEN 'Indoor Garage'
           WHEN 2 THEN 'Outdoor Lot'
           WHEN 3 THEN 'Street Parking'
           ELSE 'Unknown'
       END AS type_description
FROM management_table;
```
Simple CASE → match exact values only.
Great for turning codes (1,2,3) into readable text.

## Pivot with CASE (Rows → Columns)

```sql
SELECT station_code,
       COUNT(*) AS total_txns,
       SUM(CASE WHEN payment_method = 'Cash'       THEN 1 ELSE 0 END) AS cash_txns,
       SUM(CASE WHEN payment_method = 'Electronic' THEN 1 ELSE 0 END) AS electronic_txns
FROM payment_history
GROUP BY station_code;
```
SUM(CASE ...) → count each category in separate column.
Turns long list into wide summary (perfect for dashboards).

## Safe Division (Avoid Divide-by-Zero)

```sql
SELECT mt.station_name,
       COALESCE(SUM(pay.amount_received), 0) AS total_revenue,
       COUNT(pay.amount_received)            AS txn_count,
       CASE
           WHEN COUNT(pay.amount_received) = 0 THEN 0
           ELSE COALESCE(SUM(pay.amount_received), 0) / COUNT(pay.amount_received)
       END AS avg_ticket_size
FROM management_table mt
LEFT JOIN payment_history pay
  ON mt.station_code = pay.station_code
GROUP BY mt.station_name;
```
LEFT JOIN → keep stations with zero payments.
CASE → return 0 instead of error when txn_count = 0.
Clean, safe KPI reports.

## Conditional UPDATE

```sql
UPDATE management_table
SET base_rate = CASE
    WHEN area = 'Downtown' THEN base_rate * 1.10
    WHEN area = 'Suburb'   THEN base_rate * 0.95
    ELSE base_rate
END;
```
One UPDATE → apply different rules by area.
Tip: add WHERE or test with SELECT first in production.

## Summary
- CASE: SQL 的 if-then-else
- Searched CASE: Complex conditions, ranges → flexible
- Simple CASE: Exact matches → code → text
- Pivot: SUM/COUNT(CASE ...) → rows to columns
- Safe math: CASE guard division-by-zero (especially with LEFT JOIN)
- UPDATE with CASE: Bulk conditional changes in one statement
- Always add ELSE → avoid unexpected NULL