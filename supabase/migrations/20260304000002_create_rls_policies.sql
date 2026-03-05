-- Migration: Row Level Security policies for observability tables
-- Phase 4: Observability Platform

-- ──────────────────────────────────────────────────────────────────────────────
-- Enable RLS on all tables
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE telemetry_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_snapshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_windows    ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────────
-- HELPER: project ownership check
-- Projects are identified by their UUID. Authenticated users may only access
-- rows belonging to projects they own. The project<->user mapping is managed
-- externally; here we use a thin helper function that can be replaced when
-- a projects table is added in a future migration.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION auth.owns_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  -- Placeholder: replace with a JOIN to a projects table once it exists.
  -- For now: authenticated users can only read rows where project_id matches
  -- a claim they carry in their JWT (custom claim: project_ids[]).
  SELECT
    auth.uid() IS NOT NULL
    AND (
      -- Service-role callers bypass RLS entirely (Supabase default behaviour).
      -- For JWT callers, require the project_id to be listed in their claims.
      (auth.jwt() -> 'app_metadata' -> 'project_ids') @> to_jsonb(p_project_id::text)
    );
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- TELEMETRY EVENTS
-- ──────────────────────────────────────────────────────────────────────────────

-- Ingestion: anonymous callers may INSERT via the edge function (which uses the
-- service role key internally). Direct anon INSERT is intentionally disallowed.
-- Only the service-role (edge function) writes; authenticated users read.

CREATE POLICY "telemetry_events: authenticated users read own projects"
  ON telemetry_events
  FOR SELECT
  TO authenticated
  USING (auth.owns_project(project_id));

CREATE POLICY "telemetry_events: service role full access"
  ON telemetry_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- HEALTH SNAPSHOTS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE POLICY "health_snapshots: authenticated users read own projects"
  ON health_snapshots
  FOR SELECT
  TO authenticated
  USING (auth.owns_project(project_id));

CREATE POLICY "health_snapshots: service role full access"
  ON health_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- USAGE ANALYTICS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE POLICY "usage_analytics: authenticated users read own projects"
  ON usage_analytics
  FOR SELECT
  TO authenticated
  USING (auth.owns_project(project_id));

CREATE POLICY "usage_analytics: service role full access"
  ON usage_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- ERROR REPORTS
-- ──────────────────────────────────────────────────────────────────────────────

CREATE POLICY "error_reports: authenticated users read own projects"
  ON error_reports
  FOR SELECT
  TO authenticated
  USING (auth.owns_project(project_id));

-- Allow authenticated project members to mark errors as resolved
CREATE POLICY "error_reports: authenticated users resolve own project errors"
  ON error_reports
  FOR UPDATE
  TO authenticated
  USING (auth.owns_project(project_id))
  WITH CHECK (auth.owns_project(project_id));

CREATE POLICY "error_reports: service role full access"
  ON error_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- RATE LIMIT WINDOWS
-- Only the service role (edge function) reads/writes rate limit state.
-- ──────────────────────────────────────────────────────────────────────────────

CREATE POLICY "rate_limit_windows: service role only"
  ON rate_limit_windows
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
