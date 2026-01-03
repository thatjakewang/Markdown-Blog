title: SQL Metadata: Data about Data
date: 2026-01-07
description: Quick notes on information_schema. Query database catalog to list tables, columns, constraints—and generate SQL.

## List Tables (Basic Info)
```sql
SELECT table_name, table_rows, create_time
FROM information_schema.tables
WHERE table_schema = 'your_database_name'
  AND table_name LIKE '%history%';
```
information_schema = built-in catalog.
Query it like normal table → get table list, row count (approx), create time.
Great for quick schema overview.

## List Columns & Data Types

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'your_database_name'
  AND data_type IN ('datetime', 'timestamp');
```
Find all datetime columns across schema.
Audit before time-series work → avoid string dates.

## List Constraints (PK/FK/UNIQUE)

```sql
SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'your_database_name'
  AND table_name = 'management_table';
```
See active rules on a table.
Debug "constraint violation" errors → know exact PK/FK names.

## Generate SQL from Metadata

```sql
SELECT CONCAT(
  'SELECT ''', table_name, ''' AS tbl, COUNT(*) AS cnt FROM ', table_name,
  ' UNION ALL '
) AS generated_sql
FROM information_schema.tables
WHERE table_schema = 'your_database_name';
```
Output → ready-to-run query counting rows in every table.
Copy result → run → instant size report for all tables.
Tip: Remove last "UNION ALL " in app code.
## Summary
- information_schema: Standard views for metadata (all DBs)
- tables: List tables + row counts + create time
- columns: Column names, types, nullable → schema audit
- table_constraints: PK, FK, UNIQUE, CHECK rules
- key_column_usage: See which columns in constraints
- Generate SQL: CONCAT + metadata → automate reports/scripts
- No GUI needed: Everything queryable → script-friendly