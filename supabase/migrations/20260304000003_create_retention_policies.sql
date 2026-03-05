-- Migration: Data retention policies and automated purging via pg_cron
-- Phase 4: Observability Platform
--
-- Retention windows:
--   free tier  → 30 days
--   paid tier  → 365 days
--
-- Strategy:
--   1. A pg_cron job runs nightly and deletes expired rows from all tables.
--   2. A separate pg_cron job creates the next month's partition automatically
--      so queries never fall into the default (unpartitioned) catch-all.
--   3. Rate-limit ledger rows older than 10 minutes are purged every 5 minutes.

-- ──────────────────────────────────────────────────────────────────────────────
-- PURGE FUNCTION
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION observability.purge_expired_data()
RETURNS TABLE (
  table_name   TEXT,
  rows_deleted BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _now   TIMESTAMPTZ := NOW();
  _count BIGINT;
BEGIN
  -- Telemetry events
  DELETE FROM telemetry_events WHERE expires_at <= _now;
  GET DIAGNOSTICS _count = ROW_COUNT;
  table_name   := 'telemetry_events';
  rows_deleted := _count;
  RETURN NEXT;

  -- Health snapshots
  DELETE FROM health_snapshots WHERE expires_at <= _now;
  GET DIAGNOSTICS _count = ROW_COUNT;
  table_name   := 'health_snapshots';
  rows_deleted := _count;
  RETURN NEXT;

  -- Usage analytics
  DELETE FROM usage_analytics WHERE expires_at <= _now;
  GET DIAGNOSTICS _count = ROW_COUNT;
  table_name   := 'usage_analytics';
  rows_deleted := _count;
  RETURN NEXT;

  -- Error reports (only purge resolved or naturally expired)
  DELETE FROM error_reports WHERE expires_at <= _now;
  GET DIAGNOSTICS _count = ROW_COUNT;
  table_name   := 'error_reports';
  rows_deleted := _count;
  RETURN NEXT;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- RATE LIMIT PURGE FUNCTION
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION observability.purge_stale_rate_limit_windows()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _count BIGINT;
BEGIN
  DELETE FROM rate_limit_windows
  WHERE window_start < NOW() - INTERVAL '10 minutes';
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- PARTITION MANAGEMENT FUNCTION
-- Creates the partition for "two months from now" if it doesn't already exist.
-- Running monthly means we always stay ahead of the current window.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION observability.create_next_month_partitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Target: two months ahead so we're never caught without a partition
  _target       TIMESTAMPTZ := date_trunc('month', NOW() + INTERVAL '2 months');
  _next         TIMESTAMPTZ := _target + INTERVAL '1 month';
  _suffix       TEXT        := to_char(_target, '"y"YYYY"m"MM');
  _tables       TEXT[]      := ARRAY[
                                 'telemetry_events',
                                 'health_snapshots',
                                 'usage_analytics',
                                 'error_reports'
                               ];
  _t            TEXT;
  _partition    TEXT;
  _sql          TEXT;
BEGIN
  FOREACH _t IN ARRAY _tables
  LOOP
    _partition := _t || '_' || _suffix;
    -- Only create if absent
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = _partition
        AND n.nspname = current_schema()
    ) THEN
      _sql := format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
        _partition, _t, _target, _next
      );
      EXECUTE _sql;
      RAISE NOTICE 'Created partition: %', _partition;
    END IF;
  END LOOP;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- SCHEMA
-- pg_cron jobs are registered in the cron schema (requires pg_cron extension)
-- ──────────────────────────────────────────────────────────────────────────────

-- Ensure the observability schema exists for our helper functions
CREATE SCHEMA IF NOT EXISTS observability;

-- ──────────────────────────────────────────────────────────────────────────────
-- pg_cron JOBS
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Nightly expired-data purge at 02:00 UTC
SELECT cron.schedule(
  'observability-purge-expired',
  '0 2 * * *',
  $$SELECT * FROM observability.purge_expired_data()$$
);

-- 2. Rate-limit ledger cleanup every 5 minutes
SELECT cron.schedule(
  'observability-purge-rate-limits',
  '*/5 * * * *',
  $$SELECT observability.purge_stale_rate_limit_windows()$$
);

-- 3. Monthly partition creation — run on the 1st of each month at 00:30 UTC
SELECT cron.schedule(
  'observability-create-partitions',
  '30 0 1 * *',
  $$SELECT observability.create_next_month_partitions()$$
);
