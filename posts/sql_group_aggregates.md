title: "SQL Grouping and Aggregates"
date: 2025-12-29
description: Master the art of summarizing data. Learn how to group parking records, calculate averages and totals, and filter grouped results using GROUP BY and HAVING.

## Basic Grouping (GROUP BY)

```sql
SELECT station_code, COUNT(*) AS total_entries
FROM parking_history
GROUP BY station_code
ORDER BY total_entries DESC;
```

Databases store data row-by-row, but analysis often needs summaries by category. GROUP BY collapses rows that share the same station_code into a single group. COUNT(*) then counts how many records fall into each group, helping you quickly identify the busiest stations.

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
Aggregate functions compute a single value per group:
- COUNT() counts rows.
- AVG() calculates an average (e.g., average parking duration).
- MAX() / MIN() find the highest or lowest value.

This helps interpret behavior patterns: longer average durations may indicate commuter/residential usage, while shorter durations suggest quick stops.

## Multicolumn Grouping
```sql
SELECT city, station_type, COUNT(*) AS station_count
FROM management_table
GROUP BY city, station_type
ORDER BY city, station_type;
```
You can group by multiple dimensions simultaneously. This works like a Pivot Table: the database groups by city, then within each city groups by station_type, producing a structured summary such as “Taipei - Indoor” vs “Taipei - Outdoor”.

## Grouping via Expressions

```sql
SELECT HOUR(entry_time) AS entry_hour,
       COUNT(*) AS traffic_volume
FROM parking_history
GROUP BY HOUR(entry_time)
ORDER BY entry_hour;
```
You can group by expressions (function results), not just raw columns. Here, HOUR(entry_time) creates hourly buckets (0–23) so you can analyze daily traffic trends without adding an extra “hour” column.

## Generating Rollups (Totals/Subtotals)

```sql
SELECT payment_method, COUNT(*) AS tx_count
FROM payment_history
GROUP BY payment_method WITH ROLLUP;
```

WITH ROLLUP adds extra rows for subtotals and a grand total. In the result, a row where payment_method is NULL represents the grand total across all payment methods. This is useful for reporting without extra SQL or Excel work.

## Group Filter Conditions (HAVING)
```sql
SELECT station_code, COUNT(*) AS total_visits
FROM parking_history
GROUP BY station_code
HAVING COUNT(*) > 1000;
```

A common mistake is confusing WHERE and HAVING:
- WHERE filters rows before grouping.
- HAVING filters groups after aggregation.

Since COUNT(*) is an aggregated result, you must use HAVING to filter for stations with more than 1,000 visits.

## Summary
1. GROUP BY is the core: it collapses detailed rows into summary categories.
2. Aggregates provide insights: functions like AVG, SUM, MAX turn raw data into KPIs.
3. WHERE vs HAVING: filter raw rows with WHERE, filter aggregated groups with HAVING.
4. ROLLUP for reporting: WITH ROLLUP automatically adds totals and subtotals.