title: SQL Data Manipulation
date: 2025-12-28
description: Quick notes on SQL string, date, and math functions. Examples: mask plates, calculate fees, count by hour.

## Mask License Plate (Privacy)

```sql
SELECT license_plate,
       CONCAT(SUBSTRING(license_plate, 1, 3), REPEAT('*', 4)) AS masked_plate
FROM parking_history;
```
Keep first 3 characters → add ****.
Good for reports: hide full plate but still see prefix (region/type).

## Calculate Parking Duration & Fee
```sql
SELECT license_plate,
       TIMESTAMPDIFF(MINUTE, entry_time, exit_time) AS total_minutes,
       CEIL(TIMESTAMPDIFF(MINUTE, entry_time, exit_time) / 60.0) * 40 AS parking_fee
FROM parking_history
WHERE exit_time IS NOT NULL;
```
Steps:
1. TIMESTAMPDIFF → minutes parked
2. Divide by 60.0 → hours (decimal)
3. CEIL → round up to next full hour
4. 40 → fee (hourly rate)
Common "ceiling billing" rule.
## Count Entries by Hour
```sql
SELECT HOUR(entry_time) AS entry_hour,
       COUNT(*) AS vehicle_count
FROM parking_history
GROUP BY HOUR(entry_time)
ORDER BY vehicle_count DESC;
```
HOUR() gets hour (0-23).
GROUP BY + COUNT → how many cars enter each hour.
ORDER DESC → see peak hours first.

## Safe String Concat (CAST)
```sql
SELECT station_code,
       CONCAT('Station: ', station_name, ' - Opened on ', CAST(open_date AS CHAR)) AS info_text
FROM management_table;
```
CAST(date AS CHAR) → turn date into text safely.
Prevents type errors when mixing text + date.

## Summary
- Mask text: SUBSTRING + CONCAT + REPEAT('*')
- Duration: TIMESTAMPDIFF(MINUTE, start, end)
- Round up: CEIL(value) for ceiling billing
- Extract hour: HOUR(timestamp) → good for hourly stats
- Safe concat: CAST(non-text AS CHAR) before mixing with strings
- Other common: FLOOR (round down), ROUND (normal round)