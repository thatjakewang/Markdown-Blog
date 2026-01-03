title: "SQL Subqueries"
date: 2025-12-29
description: Quick notes on SQL subqueries. Nest queries for dynamic filters, lists, checks, and derived tables.

## Basic Subquery (Scalar)
```sql
SELECT station_code, station_name, open_date
FROM management_table
WHERE open_date = (SELECT MAX(open_date) FROM management_table);
```
Inner query runs first → finds latest open_date.
Outer query → gets stations opened on that date.
No need to hardcode values.

## IN Subquery (Filter by List)
```sql
SELECT mt.station_name, ph.license_plate, ph.entry_time
FROM parking_history ph
JOIN management_table mt
  ON mt.station_code = ph.station_code
WHERE ph.station_code IN (
    SELECT station_code
    FROM management_table
    WHERE area = 'Xinyi Dist'
);

```
Subquery → list of station_codes in Xinyi.
Outer → only parking records from those stations.
Non-correlated (subquery runs once).

## NOT EXISTS (Find Unmatched Rows)

```sql
SELECT ph.license_plate, ph.station_code, ph.entry_time
FROM parking_history ph
WHERE NOT EXISTS (
    SELECT 1
    FROM payment_history pay
    WHERE pay.station_code = ph.station_code
      AND pay.entry_time   = ph.entry_time
);
```
Correlated: checks each parking row.
If no matching payment → return it (unpaid sessions).
Great for auditing missing records.

## Derived Table (Subquery in FROM)

```sql
SELECT station_code, day_of_record, daily_total
FROM (
    SELECT station_code,
           DATE(paid_time) AS day_of_record,
           SUM(amount_received) AS daily_total
    FROM payment_history
    GROUP BY station_code, DATE(paid_time)
) AS daily_stats
WHERE daily_total > 10000;
```
Inner → aggregate daily revenue per station.
Outer → filter high-revenue days (>10,000).
Perfect for "group first, then filter".

## Scalar Subquery in SELECT

```sql
SELECT mt.station_name,
       mt.city,
       (SELECT COUNT(*)
        FROM parking_history ph
        WHERE ph.station_code = mt.station_code) AS total_visits
FROM management_table mt;
```
Subquery returns one value per row → total visits per station.
Simple, but can be slow on big data (JOIN often faster).

## Summary
- Scalar (=, > etc.): Compare to single value (e.g., MAX, AVG)
- IN / NOT IN: Filter by list from subquery
- EXISTS / NOT EXISTS: Check if match exists (no duplicate rows)
- Correlated: Subquery uses outer row values (runs many times)
- Non-correlated: Runs once only
- Derived table: Subquery in FROM → multi-step logic
- Scalar in SELECT: Add calculated column per row