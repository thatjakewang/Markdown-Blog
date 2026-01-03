title: SQL Transactions
date: 2026-01-04
description: Quick notes on transactions. Use COMMIT for all-or-nothing, ROLLBACK to undo, SAVEPOINT for partial undo.

## Atomicity: All or Nothing
```sql
START TRANSACTION;

-- Step 1: Record vehicle exit
UPDATE parking_history
SET exit_time = NOW()
WHERE station_code = 'ST001'
  AND license_plate = 'ABC-1234'
  AND exit_time IS NULL;

-- Step 2: Record payment
INSERT INTO payment_history (station_code, station_name, entry_time, paid_time, payment_method, amount)
VALUES ('ST001', 'XinYi Station', '2025-12-31 10:00:00', NOW(), 'Credit Card', 120);

COMMIT;
```
START TRANSACTION + COMMIT → both steps succeed together or fail together.
Prevents inconsistent data like “car exited” but “no payment recorded”.

## Rollback (Undo All Changes)

```sql
START TRANSACTION;

-- Try deleting test data
DELETE FROM management_table
WHERE station_type = 'Test';

-- Oops, wrong rows affected?
ROLLBACK;

-- Data restored
SELECT COUNT(*) FROM management_table;
```
ROLLBACK → cancels everything since the transaction started.
Safety net for dangerous operations (DELETE, bulk UPDATE).
Always start a transaction for manual production changes — COMMIT only after verification.

## Savepoint (Partial Undo)

```sql
START TRANSACTION;

-- Important step
UPDATE management_table
SET last_audit_date = NOW()
WHERE city = 'Taipei';

SAVEPOINT audit_complete;  -- checkpoint

-- Non-critical step (log)
INSERT INTO audit_logs (event)
VALUES ('Daily audit completed');

-- If log fails, rollback only this part
ROLLBACK TO audit_complete;

COMMIT;
```
SAVEPOINT → creates a midpoint.
Later error? ROLLBACK TO savepoint undoes only after it, keeps earlier work.

## Summary
- START TRANSACTION ... COMMIT: Multi-statement atomic unit → data consistency
- ROLLBACK: Full undo → perfect for risky manual changes
- SAVEPOINT + ROLLBACK TO: Partial undo → long workflows with recoverable steps
- Best practice: Always use explicit transactions for multi-table changes
- Auto-commit: Many tools enable it by default — disable or explicitly START TRANSACTION