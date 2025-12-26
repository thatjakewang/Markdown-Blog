title: "SQL Subqueries"
date: 2025-12-29
description: Learn how to nest queries within queries. Covers scalar subqueries, IN, correlated subqueries with EXISTS, and using subqueries as derived tables for complex logic.

## What is a Subquery?
```sql
SELECT station_code, station_name, open_date
FROM management_table
WHERE open_date = (SELECT MAX(open_date) FROM management_table);
```

A subquery is a query nested inside another query (enclosed in parentheses). Here, the inner query runs first to find the most recent open_date. The outer query then returns the station(s) that opened on that latest date—so the filter stays dynamic without hardcoding dates.

## Noncorrelated Subqueries (IN)
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

A noncorrelated subquery can run independently of the outer query. In this example:

1. The subquery produces a list of station_code values in "Xinyi Dist".
2. The outer query returns parking records only for stations in that list.
This is often more intuitive than a join when your goal is simply “filter by a list”.

## Correlated Subqueries (NOT EXISTS)

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

A correlated subquery depends on values from the outer query, so it is evaluated for each row in the outer table. Here, NOT EXISTS is used for auditing unpaid parking sessions:

- For each record in parking_history, the database checks whether a matching payment exists.
- If no match is found, that parking record is returned.

This is a common pattern for data integrity checks.

## Subqueries as Data Sources (Derived Tables)

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
A subquery in the FROM clause creates a temporary derived table:
1. The inner query aggregates raw payments into daily totals per station_code.
2. The outer query filters the aggregated result to find high-revenue days (daily total > 10,000).
This “aggregate first, then filter” structure keeps complex logic readable.

## Subqueries as Expression Generators (Scalar Subquery in SELECT)

```sql
SELECT mt.station_name,
       mt.city,
       (SELECT COUNT(*)
        FROM parking_history ph
        WHERE ph.station_code = mt.station_code) AS total_visits
FROM management_table mt;
```
A subquery can also appear in the SELECT list to generate a single value per row (a scalar subquery). Here, for each station, the subquery counts how many parking records exist.

This is convenient for quick analysis, but can be slower on large datasets compared to a JOIN + GROUP BY.

## Summary
- Dynamic filtering: scalar subqueries (e.g., MAX, AVG) let you compare against calculated benchmarks.
- Set filtering: IN / NOT IN filters rows based on a list returned by another query.
- Existence checks: EXISTS / NOT EXISTS are ideal for match/non-match auditing without duplicating rows.
- Derived tables: subqueries in FROM enable multi-step logic (e.g., aggregate first, then query the summarized result).