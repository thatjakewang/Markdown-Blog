title: SQL Data Filtering
date: 2025-12-25
description: Essential notes on SQL filtering techniques including AND/OR logic, IN operators, and NULL handling, applied to practical parking management problems.

## Condition Evaluation (AND, OR, NOT)

```sql
SELECT license_plate, payment_method, amount_received, is_electric
FROM payment_history
WHERE (payment_method = 'Credit_Card' AND amount_received > 500)
   OR (is_electric = 1);
```

The WHERE clause filters rows based on logical conditions. Multiple conditions can be combined using logical operators, and understanding their evaluation order is essential for correct results.

- AND : All combined conditions must be true for a row to be included.
- OR : A row is included if at least one condition is true.
- NOT: Negates a condition, selecting rows that do not satisfy it.

Without parentheses, SQL evaluates conditions based on operator precedence (NOT → AND → OR), which may lead to unintended results.

## Equality & Inequality Conditions

```sql
SELECT parking_id, parking_type, entry_time, exit_time
FROM parking_history
WHERE parking_type <> 'monthly';
```

The condition parking_type <> 'monthly' means “not equal to”, so the query returns only records where the parking type is not monthly. In other words, it excludes all monthly subscribers and keeps only non-monthly parking entries.

This is functionally equivalent to using the NOT operator:

```sql
WHERE NOT parking_type = 'monthly'
```

Both expressions produce the same result, but <> is often more concise and commonly used in SQL queries.

## Range Conditions (BETWEEN)
```sql
SELECT COUNT(*) AS total_cars
FROM parking_history
WHERE entry_time >= '2025-01-01'
  AND entry_time <  '2026-01-01';
```

To filter by a time range, a common best practice is using a half-open interval: include the start boundary and exclude the end boundary. This avoids missing records due to time precision (seconds/milliseconds) and reliably includes the entire year of 2025.

You may also see the BETWEEN form:

```sql
WHERE entry_time BETWEEN '2025-01-01' AND '2025-12-31'
```

However, if entry_time stores timestamps, the end date may exclude entries on 2025-12-31 after 00:00:00.

## Membership Conditions (IN)
```sql
SELECT station_code, station_name, open_date
FROM management_table
WHERE strftime('%Y', open_date) IN ('2025', '2024', '2023');
```

The IN operator checks whether a value matches any value in a given list. This is useful when filtering against multiple discrete values without writing multiple OR conditions.

This is equivalent to:

```sql
WHERE strftime('%Y', open_date) = '2025'
   OR strftime('%Y', open_date) = '2024'
   OR strftime('%Y', open_date) = '2023'
```

Using IN makes queries more concise and easier to maintain as the list grows.

## Matching Conditions (LIKE)
```sql
SELECT station_code, license_plate
FROM parking_history
WHERE license_plate LIKE 'E%';
```
The LIKE operator performs pattern matching on text values. Here, license_plate LIKE 'E%' returns rows where the license plate starts with E. The percent sign (%) matches any sequence of characters, including zero characters.

Common wildcards:
- % : matches zero or more characters
- _ : matches exactly one character

```sql
LIKE 'E%'    -- starts with E
LIKE '%123'  -- ends with 123
LIKE '%AB%'  -- contains AB
LIKE 'A_9'   -- A, followed by any single character, then 9
```

## Handling Null Values (IS NULL)

```sql
SELECT station_code, license_plate, entry_time
FROM parking_history
WHERE exit_time IS NULL;
```

IS NULL checks for missing or undefined values. This query returns records where exit_time is NULL, which typically indicates vehicles that have entered but not yet exited.

Note that NULL cannot be compared using = or <>. Use IS NULL / IS NOT NULL instead.

## Summary

- AND / OR / NOT: Combine conditions; remember precedence (NOT → AND → OR) and use parentheses to control logic.
- <>: “Not equal to” for excluding specific values.
- Date ranges: Prefer half-open intervals (>= start AND < end) for timestamp safety.
- IN: Match against a list of values (cleaner than multiple OR).
- LIKE: Pattern matching using % and _.
- IS NULL: Correct way to test missing values.