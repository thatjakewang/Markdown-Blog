---
title: SQL Analytic Functions
date: 2026-01-08
description: "Quick notes on window functions. Rank, percentages, time series—without GROUP BY collapsing rows."
---

## Core Idea: Aggregate Per Row (No Collapsing)
Window functions add calculations to EVERY row, based on a "window" of related rows.  
Use OVER() to define the window.  
Unlike GROUP BY: keeps all detail rows.

## Ranking (RANK, DENSE_RANK, ROW_NUMBER)
```sql
SELECT station_name,
       amount,
       RANK() OVER (PARTITION BY station_name ORDER BY amount DESC) AS amount_rank
FROM payment_history
WHERE DATE(paid_time) = CURRENT_DATE;
```
- PARTITION BY station_name: reset rank per station
- ORDER BY amount DESC: rank 1 = highest
- RANK(): ties get same rank (e.g., two #1s, next is #3)

Example output (sample data):
Station A: amounts 200(#1), 150(#2), 100(#3)
Station B: 300(#1), 50(#2)

## Running Totals & Percentages

```sql
SELECT station_name,
       amount,
       SUM(amount) OVER (PARTITION BY station_name) AS station_daily_total,
       amount * 100.0 / SUM(amount) OVER (PARTITION BY station_name) AS pct_of_total
FROM payment_history;
```
SUM over partition → total on every row.
Easy % calc: no self-joins needed.
Example: Station A total=450
- 100 → 22.22%
- 200 → 44.44%
- 150 → 33.33%

## Time Gaps (LAG / LEAD)

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
LAG(): previous row value
LEAD(): next row value
Here: minutes between consecutive entries (idle time).

## Moving Averages (Window Frames)

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
ROWS BETWEEN: sliding window size
- 2 PRECEDING: last 2 + current = 3-row average
Smooths trends, ignores future data.

## Summary
- OVER(): The window definer → PARTITION BY (groups) + ORDER BY (sequence) + ROWS (range)
- Ranking: RANK() for ties, DENSE_RANK() no gaps, ROW_NUMBER() unique
- Aggregates: SUM/AVG/COUNT over window → per-row stats
- LAG/LEAD: Peek previous/next → time series gaps, trends
- Frames: ROWS/RANGE BETWEEN → moving calcs (e.g., 3-day avg)
- Pro tip: Faster than subqueries/joins for analytics; always ORDER BY for time/rank