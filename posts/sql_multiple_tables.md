title: "SQL Joins: Querying Multiple Tables"
date: 2025-12-26
description: Learn how to connect parking, payment, and management data using SQL joins. Covers inner joins, self-joins, and non-equi joins with practical examples using real parking datasets.

## Inner Join
```sql
SELECT ph.license_plate,
       ph.entry_time,
       mt.bd_name,
       mt.city
FROM parking_history ph
INNER JOIN management_table mt
  ON ph.station_code = mt.station_code;
```

This query selects the vehicle’s license_plate and entry_time from parking_history, then joins management_table on the shared key station_code to bring in station metadata such as bd_name and city. Because this is an INNER JOIN, only rows with matching station_code values in both tables are returned.

## Joining Three Tables
```sql
SELECT ph.license_plate,
       mt.area,
       pay.payment_method,
       pay.paid_time
FROM parking_history ph
INNER JOIN management_table mt
  ON ph.station_code = mt.station_code
INNER JOIN payment_history pay
  ON ph.station_code = pay.station_code
 AND ph.entry_time   = pay.entry_time;
```

The query starts from parking_history, joins management_table to attach location information, and then joins payment_history to bring in payment details. The payment join uses station_code plus entry_time to align each payment record with the corresponding parking session.

## Using Table Aliases
```sql
SELECT parking_history.station_name, management_table.bd_team
FROM parking_history
INNER JOIN management_table
  ON parking_history.station_code = management_table.station_code;

SELECT ph.station_name, mt.bd_team
FROM parking_history ph
INNER JOIN management_table mt
  ON ph.station_code = mt.station_code;
```

In the first query, columns are referenced using full table names. This is explicit but becomes verbose as queries grow. The second query uses aliases (ph, mt) to keep the SQL shorter and easier to read, while still making column origins clear.

Aliases are especially helpful when:
- multiple tables share column names (e.g., station_code, created_at)
- joining more than two tables
- joining the same table more than once (self-join)

## Self-Joins

```sql
SELECT t1.station_name AS station_a,
       t1.bd_team      AS team_a,
       t2.station_name AS station_b,
       t2.bd_team      AS team_b,
       t1.area
FROM management_table t1
INNER JOIN management_table t2
  ON t1.area    = t2.area
 AND t1.bd_team <> t2.bd_team;
```

A self-join joins a table to itself. Here, t1 and t2 represent two different “views” of management_table, allowing the query to pair stations in the same area but owned by different BD teams.

- ON t1.area = t2.area matches stations located in the same area.
- AND t1.bd_team <> t2.bd_team keeps only pairs where the stations belong to different BD teams.

## Non-Equi-Joins

```sql
SELECT ph.license_plate,
       ph.entry_time,
       mt.station_name,
       mt.open_date
FROM parking_history ph
INNER JOIN management_table mt
  ON ph.station_code = mt.station_code
 AND ph.entry_time   < mt.open_date;
```

A non-equi join uses comparison operators (e.g., <, >, <=) in the join condition. This query returns rows where entry_time is earlier than the station’s open_date, which can be useful for detecting data quality issues such as incorrect timestamps or misconfigured station metadata.

## Summary

- Data is distributed: parking behavior is stored in parking_history, station ownership/location in management_table, and revenue in payment_history.
- JOIN is the bridge: station_code links these datasets into a unified view.
- Real-world complexity: without a unique ticket_id, joining parking sessions to payments may require a composite key (e.g., station_code + entry_time), highlighting why careful join design matters in real datasets.