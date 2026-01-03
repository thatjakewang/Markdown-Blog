---
title: "SQL Set Operators"
date: 2025-12-27
description: "Quick notes on UNION, INTERSECT, EXCEPT. Combine or compare query results. Examples: find unpaid parking, merge event logs."
---

## The UNION Operator

```sql
SELECT station_code FROM Parking_history
UNION
SELECT station_code FROM Payment_history;
```
UNION stacks two query results and removes duplicates.
Here: get unique station_codes from both tables.

Rules:
- Same number of columns
- Compatible data types
- Column names from first query

## UNION ALL (Combine + Keep All Rows)

```sql
SELECT *
FROM (
    SELECT entry_time AS event_time, 'Vehicle Entry' AS event_type
    FROM parking_history
    WHERE station_code = 'ST001'

    UNION ALL

    SELECT paid_time AS event_time, 'Payment Made' AS event_type
    FROM payment_history
    WHERE station_code = 'ST001'
)
ORDER BY event_time;
```
UNION ALL keeps everything (faster, no dedupe).
Here: build a timeline of entries + payments, then sort by time.

## INTERSECT (Rows in Both Queries)
```sql
SELECT station_code, entry_time
FROM parking_history
INTERSECT
SELECT station_code, entry_time
FROM payment_history;
```
INTERSECT returns only rows that appear in BOTH results.
Here: find parking sessions that HAVE a matching payment (paid ones).
Same rules as UNION (columns, types).

## EXCEPT (Rows in First but Not Second)

```sql
SELECT station_code, entry_time
FROM parking_history
EXCEPT
SELECT station_code, entry_time
FROM payment_history;
```
EXCEPT returns rows only in the FIRST query.
Here: find parking sessions with NO payment (unpaid ones).
Great for finding missing records.

## Sorting the Final Result

```sql
SELECT station_code
FROM parking_history
UNION
SELECT station_code
FROM payment_history
ORDER BY station_code;
```
ORDER BY must go at the very end (after all set operators).
## Summary
- UNION: Combine + remove duplicates → unique lists
- UNION ALL: Combine + keep all → event logs, faster
- INTERSECT: Rows in BOTH → find matches (e.g., paid parking)
- EXCEPT: Rows in first ONLY → find missing (e.g., unpaid parking)
- Rules: Same columns count + compatible types
- ORDER BY: Put at the end only
- Difference from JOIN: Set operators stack rows vertically; JOIN adds columns horizontally