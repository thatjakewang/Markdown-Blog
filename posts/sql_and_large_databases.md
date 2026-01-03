title: "SQL and Large Databases: Scaling Up"
date: 2026-01-08
description: "Learn how partitioning, sharding, and columnar storage help SQL scale from millions to billions of rows."

## Partitioning (Divide and Conquer)
```sql
CREATE TABLE parking_history (
    entry_time DATETIME,
    ...
)
PARTITION BY RANGE (YEAR(entry_time)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026)
);
```
Partitioning splits one large table into smaller physical pieces (e.g., by year).

Why it matters? A query like WHERE entry_time LIKE '2025%' scans only the 2025 partition and skips older data, greatly reducing I/O.

## Clustering and Sharding
Concept:
- Clustering: replicate data across servers for availability.
- Sharding: split data across servers for scale (e.g., Taipei on Server A, Kaohsiung on Server B).

Why it matters: analysts may need different endpoints per region. Cross-shard joins are costly and often avoided.

## Row vs. Columnar Storage

Row-Oriented (e.g., MySQL):
- Stores rows together.
- Best for OLTP.
- Example: fetch one ticket’s full record.

Column-oriented (e.g., BigQuery, Redshift):
- Stores columns together.
- Best for OLAP.
- Example: compute AVG(duration) over millions of rows by reading only the duration column.

Why it matters: analytics usually run on columnar systems. Avoid SELECT *; extra columns mean extra I/O.

## Summary
- Scale changes everything: queries that work on small data can fail on huge tables.
- Use partitions: always filter on the partition key (date, region).
- Prefer columnar for analytics: select only the columns you need.