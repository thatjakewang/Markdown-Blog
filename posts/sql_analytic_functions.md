title: "SQL Analytic Functions: The Power of OVER()"
date: 2026-01-08
description: "Use window functions to rank stations, compute percentages, and analyze time series without collapsing rows."

## The Concept: Aggregation Without Grouping
Unlike `GROUP BY`, analytic (window) functions keep every row and add calculated values based on related rows. The logic lives in the `OVER()` clause.

## Ranking Functions
```sql
SELECT station_name,
       amount,
       RANK() OVER (PARTITION BY station_name ORDER BY amount DESC) AS amount_rank
FROM payment_history
WHERE DATE(paid_time) = CURRENT_DATE;
```
Rank transactions by amount within each station.
- PARTITION BY station_name resets ranks per station.
- ORDER BY amount DESC assigns rank 1 to the highest amount. This finds top transactions per station in one query.

## Reporting Aggregates (Grand Totals)

```sql
SELECT station_name,
       amount,
       SUM(amount) OVER (PARTITION BY station_name) AS station_daily_total,
       amount / SUM(amount) OVER (PARTITION BY station_name) * 100 AS pct_of_total
FROM payment_history;
```
Compare each row to its group total. The windowed SUM puts the station total on every row, making percentage calculations trivial—no self-joins needed.

## Time Series Analysis (LAG / LEAD)

```sql
SELECT license_plate,
       entry_time,
       LAG(entry_time) OVER (PARTITION BY station_code ORDER BY entry_time) AS prev_car_entry,
       TIMESTAMPDIFF(
         MINUTE,
         LAG(entry_time) OVER (PARTITION BY station_code ORDER BY entry_time),
         entry_time
       ) AS idle_minutes
FROM parking_history;
```
LAG() reads the previous row to compute gaps between events. Here it measures idle time between consecutive entries at the same station. LEAD() works the same way, but looks forward.

## Window Frames (Moving Averages)

```sql
SELECT paid_time,
       amount,
       AVG(amount) OVER (
         PARTITION BY station_name
         ORDER BY paid_time
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS moving_avg
FROM payment_history;
```
Window frames define a sliding range. This calculates a moving average over the current and previous two transactions, smoothing short-term noise.

## Summary
- OVER(): defines the calculation window.
- PARTITION BY: groups rows without collapsing them.
- ORDER BY: required for ranking and time-based analysis.
- Efficiency: replaces self-joins and complex subqueries for advanced analytics.