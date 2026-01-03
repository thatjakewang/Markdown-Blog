---
title: "SQL Views"
date: 2026-01-06
description: "Quick notes on SQL views. Virtual tables to simplify queries, hide sensitive data, standardize reports."
---

## Creating Views

```sql
CREATE VIEW v_complete_parking_log AS
SELECT ph.license_plate,
       mt.station_name,
       mt.city,
       ph.entry_time,
       ph.exit_time
FROM parking_history ph
JOIN management_table mt
  ON ph.station_code = mt.station_code;
```
View = saved query, acts like a table.
Use: SELECT * FROM v_complete_parking_log
No need to rewrite JOIN every time.

## Security View (Hide Columns)

```sql
CREATE VIEW v_analyst_safe_data AS
SELECT station_code,
       entry_time,
       exit_time,
       TIMESTAMPDIFF(MINUTE, entry_time, exit_time) AS duration_mins
FROM parking_history;
```
Hide sensitive columns (e.g., license_plate).
Analysts get only what they need → better privacy.

## Aggregated View (Ready Reports)

```sql
CREATE VIEW v_daily_revenue_report AS
SELECT mt.station_name,
       DATE(pay.paid_time) AS report_date,
       COUNT(*)            AS txn_count,
       SUM(pay.amount)     AS total_revenue
FROM payment_history pay
JOIN management_table mt
  ON pay.station_code = mt.station_code
GROUP BY mt.station_name, DATE(pay.paid_time);
```
Pre-build GROUP BY logic.
Managers query view like a table → instant daily KPI.

## Updatable Views

```sql
CREATE VIEW v_taipei_stations AS
SELECT *
FROM management_table
WHERE city = 'Taipei';

-- Update through view
UPDATE v_taipei_stations
SET base_rate = 60
WHERE station_name = 'XinYi Station';
```
Simple views (no GROUP BY, JOIN, DISTINCT) can be updated.
Changes go directly to base table.
Good for controlled access (e.g., only Taipei rows).

## Summary
- CREATE VIEW: Save query as virtual table
- Simplify: Hide complex JOINs/filters
- Security: Select only safe columns/rows
- Reports: Pre-aggregate for fast dashboards
- Updatable: Simple views only (single table, no aggregates)
- No extra storage: Views run query live (except materialized views in some DBs)
- DROP VIEW v_name: Remove when no longer needed