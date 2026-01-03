---
title: SQL Querying Multiple Tables
date: 2025-12-26
description: "Quick notes on SQL JOINs. Connect parking, payment, and station data. Covers inner join, multi-table join, aliases, self-join, and non-equi join."
---

## Inner Join (Most Common)
```sql
SELECT ph.license_plate,
       ph.entry_time,
       mt.bd_name,
       mt.city
FROM parking_history ph
INNER JOIN management_table mt
  ON ph.station_code = mt.station_code;
```
INNER JOIN keeps only rows with matching keys in both tables.
Here: add station name and city to parking records.
## Joining Three Tables
```sql
SELECT ph.license_plate,
       mt.area,
       pay.payment_method,
       pay.paid_time
FROM parking_history ph
INNER JOIN management_table mt
  ON ph.station_code = mt.station_code
INNER JOIN payment_history pay
  ON ph.station_code = pay.station_code
 AND ph.entry_time   = pay.entry_time;
```
Start with parking_history → add station info → add payment info.
Use multiple keys (station_code + entry_time) when no single unique ID.

## Table Aliases (Make Code Short)
Bad (too long):
```sql
SELECT parking_history.station_name, management_table.bd_team
FROM parking_history
INNER JOIN management_table
  ON parking_history.station_code = management_table.station_code;
```
Good (use short aliases):
```sql
SELECT ph.station_name, mt.bd_team
FROM parking_history ph
INNER JOIN management_table mt
  ON ph.station_code = mt.station_code;
```
Aliases help when:
- Same column names in many tables
- Joining 3+ tables
- Self-join (same table twice)

## Self-Join (Table Joins Itself)

```sql
SELECT t1.station_name AS station_a,
       t1.bd_team      AS team_a,
       t2.station_name AS station_b,
       t2.bd_team      AS team_b,
       t1.area
FROM management_table t1
INNER JOIN management_table t2
  ON t1.area    = t2.area
 AND t1.bd_team <> t2.bd_team;
```
Use two aliases (t1, t2) for the same table.
Find pairs of stations in same area but different teams.

## Non-Equi Join (Not Just =)
```sql
SELECT ph.license_plate,
       ph.entry_time,
       mt.station_name,
       mt.open_date
FROM parking_history ph
INNER JOIN management_table mt
  ON ph.station_code = mt.station_code
 AND ph.entry_time   < mt.open_date;
```
Use <, >, <=, etc. in ON clause.
Here: find parking entries before the station even opened (data error check).

## Summary

- NNER JOIN: Only matching rows from both tables
- Multiple tables: Chain JOINs one by one
- Aliases: Always use short names (ph, mt, pay) → cleaner code
- Self-join: Same table twice with different aliases
- Non-equi join: Use < > <= >= in ON (not just =)
- Real tip: Many real datasets need composite keys (multiple columns) to link correctly