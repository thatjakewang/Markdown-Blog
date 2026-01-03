---
title: "SQL Indexes and Constraints"
date: 2026-01-05
description: "Quick notes on indexes and constraints. Speed up queries, enforce data rules in parking system."
---

## Basic Index (Faster Lookups)
```sql
ALTER TABLE parking_history
ADD INDEX idx_license_plate (license_plate);
```
Index → speeds up WHERE license_plate = 'ABC-1234'
No more full table scans.
Trade-off: faster SELECT, slower INSERT/UPDATE.

## Unique Index (No Duplicates + Speed)

```sql
ALTER TABLE management_table
ADD UNIQUE idx_unique_station_code (station_code);
```
UNIQUE → blocks duplicate station_code inserts.
Also fast for lookups on station_code.

## Multi-Column Index

```sql
ALTER TABLE management_table
ADD INDEX idx_city_area (city, area);
```
Good for WHERE city = 'Taipei' AND area = 'Xinyi'
Order matters: supports city alone, or city+area.
Rarely helps area alone.

## Foreign Key (Referential Integrity)

```sql
ALTER TABLE parking_history
ADD CONSTRAINT fk_parking_station
FOREIGN KEY (station_code)
REFERENCES management_table (station_code)
ON DELETE RESTRICT;
```
Foreign keys rules:
- Can't insert parking record with unknown station_code
- ON DELETE RESTRICT: can't delete station if parking records exist
Prevents orphan/invalid data.

## Cascading Updates

```sql
ALTER TABLE parking_history
ADD CONSTRAINT fk_parking_station_cascade
FOREIGN KEY (station_code)
REFERENCES management_table (station_code)
ON UPDATE CASCADE;
```
If station_code changes in management_table → auto-update all parking_history rows.
Saves manual work, keeps consistency.
Use carefully (big data → many rows affected).

## Summary
- INDEX: Speed WHERE/JOIN columns (plates, codes, dates)
- UNIQUE INDEX: Prevent duplicates + fast lookup
- Multi-column: Match common filter order (leftmost first)
- FOREIGN KEY: Link tables → no invalid references
- ON DELETE RESTRICT: Safe default (block delete if used)
- ON UPDATE/DELETE CASCADE: Auto-propagate changes (use wisely)
- PRIMARY KEY: Auto unique + index (every table needs one)
- Check existing: SHOW INDEX FROM table_name;