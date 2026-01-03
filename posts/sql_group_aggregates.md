---
title: SQL Grouping and Aggregates
date: 2025-12-29
description: "Quick notes on GROUP BY, aggregates (COUNT, AVG, etc.), HAVING, and ROLLUP. Summarize parking data by station, hour, etc."
---

## Basic Grouping (GROUP BY)

```sql
SELECT station_code, COUNT(*) AS total_entries
FROM parking_history
GROUP BY station_code
ORDER BY total_entries DESC;
```
GROUP BY groups rows by station_code.
COUNT(*) → how many entries per station.
Result: one row per station, sorted by busiest first.
## Aggregate Functions

```sql
SELECT station_code,
       COUNT(*) AS vehicle_count,
       AVG(TIMESTAMPDIFF(MINUTE, entry_time, exit_time)) AS avg_duration_mins,
       MAX(TIMESTAMPDIFF(MINUTE, entry_time, exit_time)) AS max_duration_mins,
       MIN(TIMESTAMPDIFF(MINUTE, entry_time, exit_time)) AS min_duration_mins
FROM parking_history
WHERE exit_time IS NOT NULL
GROUP BY station_code;
```
Per group:
- COUNT(*) → row count
- AVG() → average (e.g., parking time)
- MAX/MIN → highest/lowest value
Use WHERE first → filter data before grouping.

## Group by Multiple Columns
```sql
SELECT city, station_type, COUNT(*) AS station_count
FROM management_table
GROUP BY city, station_type
ORDER BY city, station_type;
```
GROUP BY city, THEN station_type.
Like a pivot: "Taipei - Indoor" vs "Taipei - Outdoor".

## Grouping via Expressions

```sql
SELECT HOUR(entry_time) AS entry_hour,
       COUNT(*) AS traffic_volume
FROM parking_history
GROUP BY HOUR(entry_time)
ORDER BY entry_hour;
```
GROUP BY HOUR(entry_time) → hourly buckets (0-23).
Analyze trends without extra columns.
## Add Totals (ROLLUP)
```sql
SELECT payment_method, COUNT(*) AS tx_count
FROM payment_history
GROUP BY payment_method WITH ROLLUP;
```
WITH ROLLUP → adds subtotal rows + grand total (NULL row).
Quick reports without extra queries.

## Filter Groups (HAVING)
```sql
SELECT station_code, COUNT(*) AS total_visits
FROM parking_history
GROUP BY station_code
HAVING COUNT(*) > 1000;
```
HAVING filters AFTER grouping (e.g., stations with >1000 visits).
WHERE filters BEFORE (raw rows).
Can't use HAVING on non-aggregates.

## Summary
- GROUP BY: Group rows by column(s) or expression → one row per group
- Aggregates: COUNT(*), AVG(), SUM(), MAX(), MIN() → compute per group
- Multi-group: GROUP BY col1, col2 → nested categories
- ROLLUP: Add totals/subtotals automatically
- HAVING: Filter groups (after GROUP BY) → use aggregates here
- WHERE: Filter rows (before GROUP BY) → no aggregates
- ORDER BY: Sort the final grouped results