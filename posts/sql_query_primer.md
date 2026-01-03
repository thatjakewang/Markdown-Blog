title: SQL Query Primer
date: 2025-12-25
description: A practical primer on SQL SELECT statements, illustrated with real-world parking data analysis examples.
## SELECT
```sql
SELECT license_plate, entry_time
FROM parking_history;
```
The SELECT part chooses which columns to show. Using * gets everything, but listing columns clearly is better—it’s easier to read and faster.
## Column Aliases
```sql
SELECT parking_id,
       parked_hours * 40 AS estimated_fee,
       'Standard Rate' AS rate_type
FROM parking_history;
```
When you calculate something, the result column often gets a bad name. Use AS to give it a clear name.
## Removing Duplicates
```sql
SELECT DISTINCT parking_type
FROM parking_history;
```
DISTINCT makes sure the same row doesn’t appear more than once.
## FROM Clause & Table Aliases
```sql
SELECT ph.station_code, ph.station_name, py.amount_received
FROM parking_history ph
JOIN payment_history py
  ON py.parking_id = ph.parking_id;
```
FROM tells the query which table(s) to read. Short aliases (like ph, py) make the query shorter and easier to read, especially when joining tables.
## WHERE Clause
```sql
SELECT license_plate, parking_type, parked_duration
FROM parking_history
WHERE (parking_type = 'monthly' AND is_eletric = 0)
   OR (parked_duration > 24);
```
WHERE filters the rows. Use parentheses to group conditions correctly. Here it returns either monthly non-electric cars OR any car parked over 24 hours.
## ORDER BY Clause

```sql
SELECT license_plate, entry_time
FROM parking_history
ORDER BY entry_time ASC, license_plate ASC;
```
ORDER BY sorts the results. ASC means earliest first. The second column (license_plate) sorts rows that have the same entry_time.
## Summary

1. SELECT: Pick the columns you want. Use AS for better column names.
2. DISTINCT: Remove duplicate rows.
3. FROM: Choose the table(s). Use short aliases when joining.
4. WHERE: Filter rows with conditions. Use parentheses for complex logic.
5. ORDER BY: Sort the results (e.g., by time or amount).