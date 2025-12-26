title: SQL Conditional Logic
date: 2025-12-31
description: Master the CASE expression in SQL. Learn how to categorize data dynamically, pivot result sets from rows to columns, and handle edge cases like division-by-zero in parking data analysis.

## Searched CASE Expressions
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

A searched CASE supports ranges and complex conditions. Here, we compute parking duration and dynamically assign a category (Short-term, Medium, Long-term) to each record. This enables segmentation without altering the table schema.

## Simple CASE Expressions

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

A simple CASE is ideal for direct equality mapping. It translates system codes (1, 2, 3) into human-readable labels directly in the query output.

## Result Set Transformations (Pivoting)

```sql
SELECT station_code,
       COUNT(*) AS total_txns,
       SUM(CASE WHEN payment_method = 'Cash'       THEN 1 ELSE 0 END) AS cash_txns,
       SUM(CASE WHEN payment_method = 'Electronic' THEN 1 ELSE 0 END) AS electronic_txns
FROM payment_history
GROUP BY station_code;
```
One of the most practical uses of CASE is pivoting. By combining SUM with CASE, you can count categories into separate columns in a single row—turning long-format transaction logs into dashboard-ready summaries.

## Handling Division-by-Zero (When Zero-Activity Rows Exist)

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
Division-by-zero usually happens when your report includes entities with zero activity (e.g., stations with no payments). Using a LEFT JOIN keeps all stations, and the CASE expression protects the division:
- If txn_count = 0, return 0
- Otherwise, compute total_revenue / txn_count

This makes KPI outputs stable for reporting.

## Conditional Updates

```sql
UPDATE management_table
SET base_rate = CASE
    WHEN area = 'Downtown' THEN base_rate * 1.10
    WHEN area = 'Suburb'   THEN base_rate * 0.95
    ELSE base_rate
END;
```
CASE can also drive bulk updates with different rules in a single statement. Here, stations in Downtown get a 10% increase, Suburb gets a 5% discount, and all other areas remain unchanged via ELSE base_rate.

Practical note: in production, consider adding a WHERE clause (or running a SELECT preview first) to avoid unintended full-table updates.

## Summary
- SQL’s IF-THEN: CASE brings conditional logic into declarative queries.
- Two flavors: use searched CASE for ranges/complex rules, and simple CASE for direct mapping.
- Pivoting reports: SUM(CASE ...) turns categories into columns for dashboard-ready summaries.
- Data safety: guard calculations (e.g., division) when zero-activity rows can exist.