---
title: SQL and Large Databases
date: 2026-01-08
description: "Quick notes on scaling SQL. Partitioning, sharding, columnar storage for millions/billions rows."
---

## Partitioning (Split Table by Key)
```sql
CREATE TABLE parking_history (
    entry_time DATETIME,
    -- other columns
    ...
)
PARTITION BY RANGE (YEAR(entry_time)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026)
);
```
Partition → physically split table (e.g., by year).
Query WHERE entry_time >= '2025-01-01' → scans only 2025 partition.
Fast + easy maintenance (drop old partitions).

## Clustering vs Sharding
- Clustering: Replicate same data across servers → high availability, failover.
- Sharding: Split data across servers (e.g., station_code A-M on Server 1, N-Z on Server 2).
Sharding pros: huge scale.
Cons: cross-shard JOINs slow/expensive → design queries to stay in one shard.
## Row vs Columnar Storage
Row-oriented (MySQL, PostgreSQL):
- Stores full rows together.
- Great for OLTP (insert/update one ticket).
Column-oriented (BigQuery, Redshift, ClickHouse):
- Stores each column separately.
- Great for OLAP (analytics).
- Example: SUM(duration) over billions → reads only duration column.
Tip: In columnar → never SELECT *; pick only needed columns.

## Summary
- Partition: Split by date/region → queries prune unused parts
- Always filter on partition key → max speed
- Sharding: Horizontal scale → avoid cross-shard operations
- Clustering: For HA/read replicas, not scale-out
- Row store: OLTP (transactions)
- Column store: OLAP (analytics) → select minimal columns
- Big data rule: Test queries on full-size data; small tests lie