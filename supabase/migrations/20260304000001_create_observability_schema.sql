-- Migration: Create observability schema
-- Phase 4: Observability Platform
-- Tables: telemetry_events, health_snapshots, usage_analytics, error_reports

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ──────────────────────────────────────────────────────────────────────────────
-- ENUM TYPES
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TYPE subscription_tier AS ENUM ('free', 'paid');

CREATE TYPE telemetry_event_type AS ENUM (
  'component_render',
  'component_interaction',
  'component_error',
  'page_load',
  'custom'
);

CREATE TYPE error_severity AS ENUM ('debug', 'info', 'warning', 'error', 'critical');

-- ──────────────────────────────────────────────────────────────────────────────
-- TELEMETRY EVENTS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS telemetry_events (
  id            UUID          NOT NULL DEFAULT uuid_generate_v4(),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  project_id    UUID          NOT NULL,
  session_id    UUID,
  event_type    telemetry_event_type NOT NULL DEFAULT 'custom',
  component_tag TEXT,                         -- e.g. "hx-button"
  component_version TEXT,
  payload       JSONB         NOT NULL DEFAULT '{}',
  tier          subscription_tier NOT NULL DEFAULT 'free',
  -- Partitioning anchor (matches retention window)
  expires_at    TIMESTAMPTZ   NOT NULL GENERATED ALWAYS AS (
    CASE tier
      WHEN 'paid' THEN created_at + INTERVAL '365 days'
      ELSE              created_at + INTERVAL '30 days'
    END
  ) STORED,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions (current month + 2 forward months)
CREATE TABLE IF NOT EXISTS telemetry_events_y2026m03
  PARTITION OF telemetry_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS telemetry_events_y2026m04
  PARTITION OF telemetry_events
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS telemetry_events_y2026m05
  PARTITION OF telemetry_events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX IF NOT EXISTS idx_telemetry_events_project_id
  ON telemetry_events (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_component
  ON telemetry_events (component_tag, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_expires_at
  ON telemetry_events (expires_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- HEALTH SNAPSHOTS
-- Component health scoring snapshots (Admin Dashboard integration)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS health_snapshots (
  id              UUID          NOT NULL DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  project_id      UUID          NOT NULL,
  component_tag   TEXT          NOT NULL,
  component_version TEXT,
  score           SMALLINT      NOT NULL CHECK (score BETWEEN 0 AND 100),
  gates           JSONB         NOT NULL DEFAULT '{}',
  -- gates shape: { typescript: bool, tests: bool, a11y: bool, storybook: bool,
  --               cem: bool, bundle_size: bool, code_review: bool }
  metadata        JSONB         NOT NULL DEFAULT '{}',
  tier            subscription_tier NOT NULL DEFAULT 'free',
  expires_at      TIMESTAMPTZ   NOT NULL GENERATED ALWAYS AS (
    CASE tier
      WHEN 'paid' THEN created_at + INTERVAL '365 days'
      ELSE              created_at + INTERVAL '30 days'
    END
  ) STORED,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS health_snapshots_y2026m03
  PARTITION OF health_snapshots
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS health_snapshots_y2026m04
  PARTITION OF health_snapshots
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS health_snapshots_y2026m05
  PARTITION OF health_snapshots
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX IF NOT EXISTS idx_health_snapshots_project_component
  ON health_snapshots (project_id, component_tag, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_expires_at
  ON health_snapshots (expires_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- USAGE ANALYTICS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_analytics (
  id              UUID          NOT NULL DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  project_id      UUID          NOT NULL,
  -- Bucketed by hour for efficient aggregation
  bucket_hour     TIMESTAMPTZ   NOT NULL GENERATED ALWAYS AS (
    date_trunc('hour', created_at)
  ) STORED,
  component_tag   TEXT,
  event_name      TEXT          NOT NULL,
  count           INTEGER       NOT NULL DEFAULT 1 CHECK (count > 0),
  dimensions      JSONB         NOT NULL DEFAULT '{}',
  -- dimensions: arbitrary key-value pairs for slicing (e.g. variant, page, user_agent_class)
  tier            subscription_tier NOT NULL DEFAULT 'free',
  expires_at      TIMESTAMPTZ   NOT NULL GENERATED ALWAYS AS (
    CASE tier
      WHEN 'paid' THEN created_at + INTERVAL '365 days'
      ELSE              created_at + INTERVAL '30 days'
    END
  ) STORED,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS usage_analytics_y2026m03
  PARTITION OF usage_analytics
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS usage_analytics_y2026m04
  PARTITION OF usage_analytics
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS usage_analytics_y2026m05
  PARTITION OF usage_analytics
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX IF NOT EXISTS idx_usage_analytics_project_bucket
  ON usage_analytics (project_id, bucket_hour DESC);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_component
  ON usage_analytics (component_tag, bucket_hour DESC);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_expires_at
  ON usage_analytics (expires_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- ERROR REPORTS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS error_reports (
  id              UUID          NOT NULL DEFAULT uuid_generate_v4(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  project_id      UUID          NOT NULL,
  session_id      UUID,
  severity        error_severity NOT NULL DEFAULT 'error',
  component_tag   TEXT,
  component_version TEXT,
  message         TEXT          NOT NULL,
  stack_trace     TEXT,
  context         JSONB         NOT NULL DEFAULT '{}',
  -- context: { url, user_agent, viewport, component_props, … }
  fingerprint     TEXT,         -- deduplication hash (caller-computed)
  resolved_at     TIMESTAMPTZ,
  tier            subscription_tier NOT NULL DEFAULT 'free',
  expires_at      TIMESTAMPTZ   NOT NULL GENERATED ALWAYS AS (
    CASE tier
      WHEN 'paid' THEN created_at + INTERVAL '365 days'
      ELSE              created_at + INTERVAL '30 days'
    END
  ) STORED,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS error_reports_y2026m03
  PARTITION OF error_reports
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS error_reports_y2026m04
  PARTITION OF error_reports
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS error_reports_y2026m05
  PARTITION OF error_reports
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX IF NOT EXISTS idx_error_reports_project_severity
  ON error_reports (project_id, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_reports_fingerprint
  ON error_reports (fingerprint, created_at DESC)
  WHERE fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_error_reports_unresolved
  ON error_reports (project_id, created_at DESC)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_error_reports_expires_at
  ON error_reports (expires_at);

-- ──────────────────────────────────────────────────────────────────────────────
-- API RATE LIMITING LEDGER
-- Tracks request counts per project per window for the edge-function rate limiter
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limit_windows (
  project_id      UUID          NOT NULL,
  window_start    TIMESTAMPTZ   NOT NULL,
  -- Window granularity: 1 minute
  request_count   INTEGER       NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, window_start)
);

-- Auto-purge rate limit rows older than 10 minutes (handled by pg_cron; see migration 3)
CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_start
  ON rate_limit_windows (window_start);
