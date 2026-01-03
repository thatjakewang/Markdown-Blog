title: "SQL Transactions: Atomicity and Rollback"
date: 2026-01-04
description: "Manage data integrity with SQL transactions: bundle related changes with COMMIT, undo mistakes with ROLLBACK, and handle partial failures with SAVEPOINT."

## Atomicity: All or Nothing
```sql
START TRANSACTION;

-- Step 1: Mark the vehicle as exited
UPDATE parking_history
SET exit_time = NOW()
WHERE station_code = 'ST001'
  AND license_plate = 'ABC-1234'
  AND exit_time IS NULL;

-- Step 2: Record the payment
INSERT INTO payment_history (station_code, station_name, entry_time, paid_time, payment_method, amount)
VALUES ('ST001', 'XinYi Station', '2025-12-31 10:00:00', NOW(), 'Credit Card', 120);

COMMIT;
```

A transaction groups multiple SQL statements into one unit. In this parking flow, exit processing has two steps: update the parking status and record revenue. Wrapping them in START TRANSACTION and COMMIT makes the change atomic. 

If the payment insert fails (e.g., card error), the exit_time update should not be persisted either—avoiding “car left” records with no payment.

## Rollback: Undoing Changes

```sql
START TRANSACTION;

-- Attempt to delete test data
DELETE FROM management_table
WHERE station_type = 'Test';

-- Whoops! If the affected rows look wrong:
ROLLBACK;

-- Verify data is still there
SELECT COUNT(*) FROM management_table;
```

ROLLBACK undoes all changes since the transaction started. Use it as a safety net for risky operations like DELETE or bulk UPDATE. When editing production data manually, start a transaction first—then COMMIT only after you validate the impact.

## Savepoints

```sql
START TRANSACTION;

-- Step 1: Expensive but valid work
UPDATE management_table
SET last_audit_date = NOW()
WHERE city = 'Taipei';

SAVEPOINT audit_complete; -- checkpoint

-- Step 2: Non-critical write
INSERT INTO audit_logs (event)
VALUES ('Daily audit completed');

-- If Step 2 fails, rollback only the later part
ROLLBACK TO audit_complete;

COMMIT;
```

For long or multi-step workflows, you may not want to restart everything after a minor failure. SAVEPOINT creates a checkpoint. If a later step fails (like a non-critical log insert), ROLLBACK TO reverts only to the checkpoint while keeping earlier successful work.

## Summary

- Atomicity & Consistency: Transactions prevent partial writes across related tables.
- Golden rule: Use START TRANSACTION + COMMIT for multi-table changes (e.g., Parking + Payment).
- Safety net: ROLLBACK undoes accidental deletes/updates.
- Partial recovery: SAVEPOINT + ROLLBACK TO handles step-level failures without discarding the whole transaction.