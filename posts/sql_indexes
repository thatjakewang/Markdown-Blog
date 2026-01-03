title: "SQL Indexes and Constraints"
date: 2026-01-05
description: "Improve performance and data quality with indexes and foreign keys in a parking system."

## Creating Indexes
```sql
ALTER TABLE parking_history
ADD INDEX idx_license_plate (license_plate);
```
Indexes speed up lookups by avoiding full table scans. With an index on license_plate, queries like WHERE license_plate = 'ABC-1234' become much faster. Trade-off: indexes improve reads (SELECT) but add overhead to writes (INSERT/UPDATE).

## Unique Indexes

```sql
ALTER TABLE management_table
ADD UNIQUE idx_unique_station_code (station_code);
```
A unique index both speeds up lookups and enforces a rule: no duplicate station_code. If someone inserts an existing code (e.g., ST001), the database rejects it.

## Multicolumn Indexes

```sql
ALTER TABLE management_table
ADD INDEX idx_city_area (city, area);
```

Multicolumn indexes help common filters like city + area. Column order matters (leftmost prefix): this index supports WHERE city = ... and WHERE city = ... AND area = ..., but usually not WHERE area = ... alone.

## Foreign Key Constraints

```sql
ALTER TABLE parking_history
ADD CONSTRAINT fk_parking_station
FOREIGN KEY (station_code)
REFERENCES management_table (station_code)
ON DELETE RESTRICT;
```

Foreign keys enforce referential integrity:

- You can’t insert a parking record with a missing station_code.
- With ON DELETE RESTRICT, you can’t delete a station that still has history rows.

## Cascading Updates

```sql
ALTER TABLE parking_history
ADD CONSTRAINT fk_parking_station_cascade
FOREIGN KEY (station_code)
REFERENCES management_table (station_code)
ON UPDATE CASCADE;
```

ON UPDATE CASCADE propagates station code changes (e.g., ST001 → TP-001) from management_table to all matching rows in parking_history, keeping data consistent without manual updates.

## Summary

- Index for speed: add indexes to columns used in WHERE/JOIN (plates, dates).
- Constrain for quality: use primary/unique keys to block duplicates.
- Link with FKs: prevent invalid references across tables.
- Use CASCADE carefully: it can simplify large updates.