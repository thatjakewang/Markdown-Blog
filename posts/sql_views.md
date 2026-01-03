title: "SQL Views: Virtual Tables"
date: 2026-01-06
description: "Use SQL views to simplify queries, limit access to sensitive parking data, and standardize reporting."

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
A view is a saved query that behaves like a virtual table. Instead of repeating the JOIN, query the view directly: SELECT * FROM v_complete_parking_log.

## Data Security (Hiding Columns)

```sql
CREATE VIEW v_analyst_safe_data AS
SELECT station_code,
       entry_time,
       exit_time,
       TIMESTAMPDIFF(MINUTE, entry_time, exit_time) AS duration_mins
FROM parking_history;
```

Views can limit exposure of sensitive fields. Analysts can study durations without access to raw license_plate data.

## Aggregated Views (Reporting)

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
Put aggregations in a view to make KPIs easy to query. Managers can read daily revenue like a table, without writing GROUP BY logic.

## Updatable Views

```sql
-- Simple view for Taipei stations
CREATE VIEW v_taipei_stations AS
SELECT *
FROM management_table
WHERE city = 'Taipei';

-- Update via the view
UPDATE v_taipei_stations
SET base_rate = 60
WHERE station_name = 'XinYi Station';
```
Some simple views are updatable (no aggregates, grouping, or complex logic). Updates run against the base table, which helps you expose a controlled interface (e.g., only Taipei rows).

## Summary

- Abstraction: hide joins and schema complexity behind a view.
- Security: restrict rows (WHERE) or columns (omit fields).
- Consistency: centralize shared metrics (e.g., revenue).
- No storage: standard views query data at runtime.