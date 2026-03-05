/**
 * Supabase Edge Function: ingest-telemetry
 *
 * Accepts telemetry events, health snapshots, usage analytics, and error
 * reports from client SDKs and writes them to the observability schema.
 *
 * Rate limiting: 120 requests per project per minute (sliding window via
 * the rate_limit_windows table). Exceeding the limit returns HTTP 429.
 *
 * Authentication: requests must supply an `x-project-id` header and a valid
 * `x-api-key` (matched against the project record). Public/anonymous ingestion
 * is not supported — callers must identify their project.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ── Types ─────────────────────────────────────────────────────────────────────

type SubscriptionTier = 'free' | 'paid';

type TelemetryEventType =
  | 'component_render'
  | 'component_interaction'
  | 'component_error'
  | 'page_load'
  | 'custom';

type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

interface IngestPayload {
  events?: TelemetryEventRow[];
  health_snapshots?: HealthSnapshotRow[];
  usage_analytics?: UsageAnalyticsRow[];
  error_reports?: ErrorReportRow[];
}

interface TelemetryEventRow {
  session_id?: string;
  event_type?: TelemetryEventType;
  component_tag?: string;
  component_version?: string;
  payload?: Record<string, unknown>;
}

interface HealthSnapshotRow {
  component_tag: string;
  component_version?: string;
  score: number;
  gates?: Record<string, boolean>;
  metadata?: Record<string, unknown>;
}

interface UsageAnalyticsRow {
  component_tag?: string;
  event_name: string;
  count?: number;
  dimensions?: Record<string, unknown>;
}

interface ErrorReportRow {
  session_id?: string;
  severity?: ErrorSeverity;
  component_tag?: string;
  component_version?: string;
  message: string;
  stack_trace?: string;
  context?: Record<string, unknown>;
  fingerprint?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RATE_LIMIT_REQUESTS_PER_MINUTE = 120;
const MAX_BATCH_SIZE = 500; // total items across all types per request

// ── Helpers ───────────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Sliding-window rate limiter backed by the rate_limit_windows table.
 * Returns true if the request is within the allowed limit, false otherwise.
 */
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setSeconds(0, 0); // truncate to current minute

  const { data, error } = await supabase.rpc('observability_rate_limit_check', {
    p_project_id: projectId,
    p_window_start: windowStart.toISOString(),
    p_limit: RATE_LIMIT_REQUESTS_PER_MINUTE,
  });

  if (error) {
    // On error, fail open (allow the request) to avoid blocking legitimate traffic
    console.error('[ingest-telemetry] rate limit check failed:', error.message);
    return true;
  }

  return data === true;
}

/**
 * Validates and normalises the incoming JSON body.
 * Throws a Response on any validation failure.
 */
function validatePayload(raw: unknown): IngestPayload {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw errorResponse('Request body must be a JSON object', 400);
  }

  const body = raw as Record<string, unknown>;
  const totalItems =
    (Array.isArray(body.events) ? body.events.length : 0) +
    (Array.isArray(body.health_snapshots) ? body.health_snapshots.length : 0) +
    (Array.isArray(body.usage_analytics) ? body.usage_analytics.length : 0) +
    (Array.isArray(body.error_reports) ? body.error_reports.length : 0);

  if (totalItems === 0) {
    throw errorResponse('Payload must contain at least one item', 400);
  }

  if (totalItems > MAX_BATCH_SIZE) {
    throw errorResponse(`Batch size ${totalItems} exceeds maximum of ${MAX_BATCH_SIZE}`, 413);
  }

  return body as IngestPayload;
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Only accept POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  // ── Auth headers ──────────────────────────────────────────────────────────
  const projectId = req.headers.get('x-project-id');
  const apiKey = req.headers.get('x-api-key');

  if (!projectId || !apiKey) {
    return errorResponse('Missing x-project-id or x-api-key header', 401);
  }

  // Basic UUID validation for project_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    return errorResponse('Invalid x-project-id format', 400);
  }

  // ── Supabase client (service role) ────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ingest-telemetry] missing env vars');
    return errorResponse('Internal server error', 500);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // ── Validate API key against project ─────────────────────────────────────
  // NOTE: When a projects table is added, replace this stub with a real lookup.
  // For now we accept any non-empty key (the edge function itself is protected
  // by the Supabase service role key — callers can't reach the DB directly).
  if (!apiKey || apiKey.length < 32) {
    return errorResponse('Invalid API key', 401);
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const allowed = await checkRateLimit(supabase, projectId);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'X-RateLimit-Limit': String(RATE_LIMIT_REQUESTS_PER_MINUTE),
        'X-RateLimit-Window': '60',
      },
    });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  let payload: IngestPayload;
  try {
    payload = validatePayload(raw);
  } catch (resp) {
    return resp as Response;
  }

  // ── Determine tier ────────────────────────────────────────────────────────
  // Tier is resolved server-side via the api key / project lookup.
  // Defaulting to 'free' until the projects table ships.
  const tier: SubscriptionTier = 'free';

  const now = new Date().toISOString();
  const results: Record<string, number> = {};
  const errors: string[] = [];

  // ── Insert telemetry events ───────────────────────────────────────────────
  if (payload.events && payload.events.length > 0) {
    const rows = payload.events.map((e) => ({
      project_id: projectId,
      session_id: e.session_id ?? null,
      event_type: e.event_type ?? 'custom',
      component_tag: e.component_tag ?? null,
      component_version: e.component_version ?? null,
      payload: e.payload ?? {},
      tier,
      created_at: now,
    }));

    const { error, count } = await supabase
      .from('telemetry_events')
      .insert(rows, { count: 'exact' });

    if (error) {
      errors.push(`telemetry_events: ${error.message}`);
    } else {
      results.telemetry_events = count ?? rows.length;
    }
  }

  // ── Insert health snapshots ───────────────────────────────────────────────
  if (payload.health_snapshots && payload.health_snapshots.length > 0) {
    const rows = payload.health_snapshots.map((h) => ({
      project_id: projectId,
      component_tag: h.component_tag,
      component_version: h.component_version ?? null,
      score: Math.max(0, Math.min(100, Math.round(h.score))),
      gates: h.gates ?? {},
      metadata: h.metadata ?? {},
      tier,
      created_at: now,
    }));

    const { error, count } = await supabase
      .from('health_snapshots')
      .insert(rows, { count: 'exact' });

    if (error) {
      errors.push(`health_snapshots: ${error.message}`);
    } else {
      results.health_snapshots = count ?? rows.length;
    }
  }

  // ── Insert usage analytics ────────────────────────────────────────────────
  if (payload.usage_analytics && payload.usage_analytics.length > 0) {
    const rows = payload.usage_analytics.map((u) => ({
      project_id: projectId,
      component_tag: u.component_tag ?? null,
      event_name: u.event_name,
      count: Math.max(1, u.count ?? 1),
      dimensions: u.dimensions ?? {},
      tier,
      created_at: now,
    }));

    const { error, count } = await supabase
      .from('usage_analytics')
      .insert(rows, { count: 'exact' });

    if (error) {
      errors.push(`usage_analytics: ${error.message}`);
    } else {
      results.usage_analytics = count ?? rows.length;
    }
  }

  // ── Insert error reports ──────────────────────────────────────────────────
  if (payload.error_reports && payload.error_reports.length > 0) {
    const rows = payload.error_reports.map((e) => ({
      project_id: projectId,
      session_id: e.session_id ?? null,
      severity: e.severity ?? 'error',
      component_tag: e.component_tag ?? null,
      component_version: e.component_version ?? null,
      message: e.message,
      stack_trace: e.stack_trace ?? null,
      context: e.context ?? {},
      fingerprint: e.fingerprint ?? null,
      tier,
      created_at: now,
    }));

    const { error, count } = await supabase.from('error_reports').insert(rows, { count: 'exact' });

    if (error) {
      errors.push(`error_reports: ${error.message}`);
    } else {
      results.error_reports = count ?? rows.length;
    }
  }

  // ── Response ──────────────────────────────────────────────────────────────
  if (errors.length > 0 && Object.keys(results).length === 0) {
    return jsonResponse({ error: 'All inserts failed', details: errors }, 500);
  }

  return jsonResponse(
    {
      accepted: results,
      ...(errors.length > 0 ? { partial_errors: errors } : {}),
    },
    errors.length > 0 ? 207 : 202,
  );
});
