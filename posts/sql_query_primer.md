title: SQL Query Primer
date: 2025-12-25
description: A practical primer on SQL SELECT statements, illustrated with real-world parking data analysis examples.

## SELECT
```sql
SELECT license_plate, entry_time
FROM entry_tickets;
```

The SELECT clause determines which columns you want to retrieve from the database. While you can use * to select everything, explicitly listing the columns makes data processing more efficient and easier to read.

This code retrieves only the license_plate and entry_time from the entry_tickets table, ignoring other unnecessary information so you can quickly monitor the status of vehicles in the lot.

## Column Aliases

```sql
SELECT ticket_id,
       parked_hours * 40 AS estimated_fee,
       'Standard Rate' AS rate_type
FROM parking_records;
```

When you perform calculations on columns (like addition or multiplication), the resulting column name is often the formula itself, which is hard to read. Using the AS keyword allows you to give that result a meaningful name.

## Removing Duplicates

```sql
SELECT DISTINCT car_brand
FROM vehicle_log;
```
The DISTINCT keyword is used to remove duplicate entries from the result set, ensuring that every row returned is unique.

The database checks all car_brand entries in the vehicle_log. It filters out duplicates (e.g., if "Toyota" appears 50 times) and returns "Toyota" only once. The result is a clean list of unique brands.

## The FROM Clause & Table Aliases

```sql
SELECT f.floor_name, s.spot_number, s.status
FROM floors f
INNER JOIN parking_spots s
ON f.floor_id = s.floor_id;
```

The FROM clause specifies the source of the data. Giving tables a short "Alias" makes the code cleaner, especially when joining multiple tables, as it clearly indicates which table a column belongs to.

We alias floors as f and parking_spots as s. This makes selecting f.floor_name and s.spot_number very concise and makes it easy to distinguish where each column comes from.

## The WHERE Clause

```sql
SELECT license_plate, spot_type, parked_duration
FROM current_parking
WHERE (spot_type = 'Disability' AND has_permit = 0)
   OR (parked_duration > 24);
```

The WHERE clause acts as a filter. Only data that meets the specified conditions is returned. You can combine complex conditions using AND and OR.

Parentheses ensure the logic is correct: the first part ( ... AND ... ) targets illegal use of disability spots, while the second part OR (...) captures all vehicles exceeding the time limit. Both types of vehicles will appear in the list.

## The ORDER BY Clause

```sql
SELECT license_plate, entry_time
FROM entry_tickets
ORDER BY entry_time ASC, license_plate ASC;
```

ORDER BY determines the sequence of the data presentation. ASC sorts from smallest to largest (default), and DESC sorts from largest to smallest.

Using entry_time ASC puts the vehicles that entered earliest (parked the longest) at the top. If two cars entered at the exact same second, the license_plate sort decides their order.

## Summary

1. SELECT: Decides which information to pull from the surveillance feed (e.g., license plates, time), and uses Aliases to label columns clearly (e.g., "Estimated Fee").
2. DISTINCT: Filters out repetitive noise, such as getting a list of unique car brands without repeating every single car.
3. FROM: Specifies which logbook (Table) to read from, using Aliases to simplify names when cross-referencing floor plans and spot lists.
4. WHERE: The most crucial filter, allowing you to pinpoint "violations" or "specific zones" and exclude irrelevant data.
5. ORDER BY: Organizes your final report, whether you need to sort by entry time or fee amount, ensuring the data is presented logically.