title: "SQL Set Operators: Union, Intersect, Except"
date: 2025-12-27
description: Master SQL Set Operators (UNION, INTERSECT, EXCEPT) to combine and compare datasets. Includes practical examples like auditing unpaid parking sessions and merging event logs.

## The UNION Operator

```sql
SELECT station_code FROM Parking_history
UNION
SELECT station_code FROM Payment_history;
```

UNION combines the results of two queries into a single result set. By default, it also removes duplicates—so each station_code will appear only once, even if it exists in both tables.

Important rules for UNION:
- Each SELECT must return the same number of columns.
- Corresponding columns should have compatible data types.
- The output column names come from the first SELECT.

## The UNION ALL Operator

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

UNION ALL stacks results vertically without removing duplicates. Here, the first SELECT returns entry events labeled as 'Vehicle Entry', and the second returns payment events labeled as 'Payment Made'.

Because both queries output the same two columns (event_time, event_type), they can be combined and then sorted. The final ORDER BY event_time creates a unified, chronological event timeline for station ST001.

## The INTERSECT Operator
```sql
SELECT station_code, entry_time
FROM parking_history
INTERSECT
SELECT station_code, entry_time
FROM payment_history;
```
INTERSECT returns only rows that appear in both result sets.

In this example, it finds (station_code, entry_time) pairs that exist in both parking_history and payment_history. This can be used to identify parking sessions that have a corresponding payment record (based on the same station and entry time).

Important notes:
- Both queries must return the same number of columns, in the same order, with compatible data types.
- Like UNION, INTERSECT returns distinct rows by default (duplicates are removed).

## The EXCEPT Operator

```sql
SELECT station_code, entry_time
FROM parking_history
EXCEPT
SELECT station_code, entry_time
FROM payment_history;
```

EXCEPT returns rows that appear in the first query but not in the second.

In this example, it finds (station_code, entry_time) pairs that exist in parking_history but have no matching record in payment_history. This is commonly used to identify parking sessions that have not yet been paid or are missing a payment record.

Key points:

- Both queries must return the same number of columns, in the same order, with compatible data types.
- EXCEPT also returns distinct rows by default.

## Sorting Set Results

```sql
SELECT station_code
FROM parking_history
UNION
SELECT station_code
FROM payment_history
ORDER BY station_code;
```

ORDER BY applies to the entire set result, so it must appear at the end of the statement (as shown). This query returns a deduplicated station list and sorts it in ascending order.

## Summary

- Vertical combination: joins combine tables horizontally (adding columns), while set operators combine results vertically (adding rows).
- UNION vs. UNION ALL: UNION removes duplicates (best for distinct lists), while UNION ALL keeps all rows and is typically faster (best for event logs and counting).
- INTERSECT: returns rows present in both result sets (Entry set ∩ Payment set), useful for identifying “paid entries” when keys match.
- EXCEPT: returns rows present in the first result set but not the second (Entry set − Payment set), useful for finding “unpaid entries” or missing records.