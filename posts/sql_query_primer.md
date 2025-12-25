title: SQL Query Primer
date: 2025-12-25
description: A practical primer on SQL SELECT statements, illustrated with real-world parking data analysis examples.

## SELECT
```sql
SELECT license_plate, entry_time
FROM parking_history;
```

The SELECT clause determines which columns you want to retrieve from the database. While you can use * to select everything, explicitly listing the columns is usually easier to read and can reduce unnecessary data processing.

## Column Aliases

```sql
SELECT parking_id,
       parked_hours * 40 AS estimated_fee,
       'Standard Rate' AS rate_type
FROM parking_history;
```

When you perform calculations (or create constant fields), the default output name may be unclear. Using AS lets you assign meaningful column names to improve readability.

## Removing Duplicates

```sql
SELECT DISTINCT parking_type
FROM parking_history;
```
DISTINCT removes duplicate rows from the result set (based on the selected columns), ensuring each returned row is unique.

## The FROM Clause & Table Aliases

```sql
SELECT ph.station_code, ph.station_name, py.amount_received
FROM parking_history ph
JOIN payment_history py
  ON py.parking_id = ph.parking_id;
```

The FROM clause defines the base table(s) the query reads from. Table aliases make queries shorter and improve readability, and they help disambiguate column names when joining multiple tables.


## The WHERE Clause

```sql
SELECT license_plate, parking_type, parked_duration
FROM parking_history
WHERE (parking_type = 'monthly' AND is_eletric = 0)
   OR (parked_duration > 24);
```

The WHERE clause filters rows based on conditions. Parentheses ensure the intended logic: the first group selects monthly users who are not electric vehicles, and the second condition includes any vehicle parked longer than 24. Rows matching either group will be returned.

## The ORDER BY Clause

```sql
SELECT license_plate, entry_time
FROM parking_history
ORDER BY entry_time ASC, license_plate ASC;
```

ORDER BY controls the presentation order of the result set. Using entry_time ASC puts the earliest entry times at the top. If multiple rows share the same entry_time, license_plate ASC acts as a tiebreaker.

## Summary

1. SELECT: Chooses which columns to return from the data source (e.g., license plate, entry time). Column aliases can be used to give the output clearer, more meaningful labels (e.g., "Estimated Fee").
2. DISTINCT: Removes duplicate rows from the result set, such as retrieving a list of unique car brands without repeating the same brand multiple times.
3. FROM: Defines the base table(s) the query reads from. Table aliases simplify references, especially when joining multiple tables or cross-referencing related datasets.
4. WHERE: Filters rows based on conditions, allowing you to focus on specific cases (e.g., violations or zones) while excluding irrelevant records.
5. ORDER BY: Controls the presentation order of the final result set, such as sorting by entry time or fee amount, ensuring the data is displayed in a logical sequence.