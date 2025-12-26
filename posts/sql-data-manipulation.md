title: "SQL Data Manipulation: Strings, Dates, and Math"
date: 2025-12-28
description: Learn how to manipulate data in SQL. Covers string functions for masking, date math for duration analysis, and numeric functions for fee calculation, using parking management examples.

## String Manipulation (Masking for Privacy)

```sql
SELECT license_plate,
       CONCAT(SUBSTRING(license_plate, 1, 3), REPEAT('*', 4)) AS masked_plate
FROM parking_history;
```
This query demonstrates privacy-friendly formatting. It keeps only the first three characters of license_plate using SUBSTRING, then uses CONCAT plus REPEAT to append asterisks. This helps analysts identify patterns (e.g., region or plate type) without exposing the full license plate number.

## Temporal Manipulation (Duration + Fee Calculation)
```sql
SELECT license_plate,
       TIMESTAMPDIFF(MINUTE, entry_time, exit_time) AS total_minutes,
       CEIL(TIMESTAMPDIFF(MINUTE, entry_time, exit_time) / 60.0) * 40 AS parking_fee
FROM parking_history
WHERE exit_time IS NOT NULL;
```
This query calculates parking fees using a “round up to the next hour” rule:
1. TIMESTAMPDIFF calculates the total duration in minutes.
2. Divide by 60.0 to convert minutes to hours (e.g., 75 mins → 1.25 hours).
3. CEIL rounds up to the next whole hour (1.25 → 2).
4. Multiply by the hourly rate (40) to get the final fee.

## Timestamp Granularity (Hourly Traffic Breakdown)
```sql
SELECT HOUR(entry_time) AS entry_hour,
       COUNT(*) AS vehicle_count
FROM parking_history
GROUP BY HOUR(entry_time)
ORDER BY vehicle_count DESC;
```
This query breaks down traffic by hour. HOUR(entry_time) extracts the hour component (0–23), and COUNT(*) aggregates how many vehicles entered in each hour. Sorting by vehicle_count helps identify peak entry times.

## Conversion Functions (Type-Safe Formatting)
```sql
SELECT station_code,
       CONCAT('Station: ', station_name, ' - Opened on ', CAST(open_date AS CHAR)) AS info_text
FROM management_table;
```
CAST converts open_date into a string so it can be safely concatenated with other text. Some databases may perform implicit conversion, but using CAST makes the query more reliable and avoids unexpected type errors.

## Summary
- Privacy & formatting: SUBSTRING and CONCAT can sanitize and format sensitive text fields for reporting.
- Duration & fee rules: TIMESTAMPDIFF + CEIL are a practical combination for time-based billing l
- Granularity: HOUR() helps transform timestamps into analysis-friendly buckets (e.g., peak hours).
- Type safety: CAST ensures data types align correctly during string assembly.