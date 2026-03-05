-- Migration: Rate limiting RPC function
-- Phase 4: Observability Platform
--
-- Called by the ingest-telemetry edge function via supabase.rpc().
-- Uses an upsert on rate_limit_windows to atomically increment the counter
-- and return whether the request is within the allowed limit.

CREATE OR REPLACE FUNCTION observability_rate_limit_check(
  p_project_id   UUID,
  p_window_start TIMESTAMPTZ,
  p_limit        INTEGER DEFAULT 120
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _new_count INTEGER;
BEGIN
  INSERT INTO rate_limit_windows (project_id, window_start, request_count)
  VALUES (p_project_id, p_window_start, 1)
  ON CONFLICT (project_id, window_start)
  DO UPDATE SET request_count = rate_limit_windows.request_count + 1
  RETURNING request_count INTO _new_count;

  RETURN _new_count <= p_limit;
END;
$$;
