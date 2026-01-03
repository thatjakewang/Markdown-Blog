title: "SQL Metadata: Data about Data"
date: 2026-01-07
description: "Query information_schema to inspect tables, columns, and constraints—and generate SQL automatically."

## What is Information Schema?
```sql
SELECT table_name, table_rows, create_time
FROM information_schema.tables
WHERE table_schema = 'your_database_name'
  AND table_name LIKE '%history%';
```
INFORMATION_SCHEMA is the database’s built-in catalog. Instead of browsing manually, you can query it to list tables (e.g., parking_history, payment_history) and see details like approximate row counts and creation time.

## Working with Columns

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'your_database_name'
  AND data_type IN ('datetime', 'timestamp');
```
Use metadata to audit data types across the entire schema. This is handy before time-series work: confirm time fields are stored as DATETIME/TIMESTAMP, not strings.

## Retrieving Constraints

```sql
SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'your_database_name'
  AND table_name = 'management_table';
```
When constraint errors are unclear, this gives you a direct list of active rules (PK/FK/UNIQUE) on a table—your schema’s “rule book”.

## Dynamic SQL Generation

```sql
SELECT CONCAT(
  'SELECT "', table_name, '" AS tbl, COUNT(*) AS cnt FROM ', table_name,
  ' UNION ALL '
)
FROM information_schema.tables
WHERE table_schema = 'your_database_name';

```
SQL can generate SQL. This query reads table names from metadata and outputs a row-count statement per table. Copy the output, run it, and you get a bulk table-size report without writing 50 queries by hand.

## Summary

- Self-awareness: use information_schema to inspect tables, columns, and constraints.
- No GUI required: schema details are queryable like any other data.
- Automation: metadata enables scripts that adapt as the database evolves.