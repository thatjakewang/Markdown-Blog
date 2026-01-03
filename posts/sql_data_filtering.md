---
title: "SQL Data Filtering"
date: 2025-12-25
description: "Quick notes on SQL WHERE filters: AND/OR, IN, LIKE, NULL, and more. Examples from parking system."
---

## Conditions with AND, OR, NOT

```sql
SELECT license_plate, payment_method, amount_received, is_electric
FROM payment_history
WHERE (payment_method = 'Credit_Card' AND amount_received > 500)
   OR (is_electric = 1);
```
WHERE filters rows using logic.

- AND: All conditions must be true.
- OR: At least one condition must be true.
- NOT: Reverses a condition.

SQL checks in this order: NOT → AND → OR.
Always use parentheses () for complex logic to avoid mistakes.

## Not Equal (<>)

```sql
SELECT parking_id, parking_type, entry_time, exit_time
FROM parking_history
WHERE parking_type <> 'monthly';
```
<> means "not equal". This returns all non-monthly parking records.
Same as:
```sql
WHERE NOT parking_type = 'monthly'
```
<> is shorter and very common.

## Date Range (BETWEEN or >= / <)
```sql
SELECT COUNT(*) AS total_cars
FROM parking_history
WHERE entry_time >= '2025-01-01'
  AND entry_time <  '2026-01-01';
```
Best way for full year: >= start AND < next_year_start.
Safe even with timestamps (hours, minutes, seconds).
BETWEEN also works:
```sql
WHERE entry_time BETWEEN '2025-01-01' AND '2025-12-31'
```
But can miss records on Dec 31 if time is not exactly 00:00:00.
## IN (Match a List)
```sql
SELECT station_code, station_name, open_date
FROM management_table
WHERE strftime('%Y', open_date) IN ('2025', '2024', '2023');
```
IN checks if value is in the list.
Cleaner than many ORs.
Same as:
```sql
WHERE strftime('%Y', open_date) = '2025'
   OR strftime('%Y', open_date) = '2024'
   OR strftime('%Y', open_date) = '2023'
```
## Pattern Matching (LIKE)
```sql
SELECT station_code, license_plate
FROM parking_history
WHERE license_plate LIKE 'E%';
```
LIKE finds text patterns.

- % = any characters (zero or more)
- _ = exactly one character
Examples:
```sql
LIKE 'E%'    -- starts with E
LIKE '%123'  -- ends with 123
LIKE '%AB%'  -- contains AB
LIKE 'A_9'   -- A, followed by any single character, then 9
```
## Check for Missing Values (IS NULL)
```sql
SELECT station_code, license_plate, entry_time
FROM parking_history
WHERE exit_time IS NULL;
```
IS NULL finds rows with no value (car still parked).
Never use = NULL or <> NULL — they don't work!
Use IS NULL or IS NOT NULL only.

## Summary
- AND/OR/NOT: Combine conditions → use () for clear logic
- <> : Not equal (exclude something)
- Date range: Best = >= start AND < end+1
- IN: Match any value in a list (better than many OR)
- LIKE: Search text patterns with % and _
- NULL: Always use IS NULL / IS NOT NULL