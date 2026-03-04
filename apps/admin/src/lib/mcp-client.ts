/**
 * Reusable MCP client for wc-tools.
 * Spawns a single MCP session (handshake + multiple tool calls), then kills.
 * Includes 5-minute in-memory cache and typed wrappers for health tools.
 * Gracefully degrades — returns null when binary missing or process fails.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { WC_TOOLS_ROOT, WC_TOOLS_BINARY, getMcpProcessEnv } from './mcp-constants';

// ── Types (local mirrors of wc-tools types — no cross-project imports) ──

export interface McpToolResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export interface McpComponentHealth {
  tagName: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: Record<string, number>;
  issues: string[];
  timestamp: string;
}

export interface McpHealthTrend {
  tagName: string;
  days: number;
  dataPoints: Array<{ date: string; score: number; grade: string }>;
  trend: 'improving' | 'declining' | 'stable';
  changePercent: number;
}

export interface McpHealthDiff {
  tagName: string;
  base: McpComponentHealth;
  current: McpComponentHealth;
  improved: boolean;
  regressed: boolean;
  scoreDelta: number;
  changedDimensions: Array<{
    dimension: string;
    before: number;
    after: number;
    delta: number;
  }>;
}

export interface McpAccessibilityDimension {
  name: string;
  score: number;
  details: string;
}

export interface McpAccessibilityProfile {
  tagName: string;
  score: number;
  grade: string;
  dimensions: McpAccessibilityDimension[];
  summary: string;
}

// ── JSON-RPC primitives ─────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string; data?: unknown };
}

let requestIdCounter = 0;

// ── Cache ───────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearMcpCache(): void {
  cache.clear();
}

// ── McpSession ──────────────────────────────────────────────────────────

export interface McpSession {
  callTool<T = unknown>(
    toolName: string,
    args?: Record<string, unknown>,
  ): Promise<McpToolResult<T>>;
  close(): void;
}

export async function createMcpSession(): Promise<McpSession | null> {
  if (!existsSync(WC_TOOLS_BINARY)) {
    return null;
  }

  let child: ChildProcess;
  try {
    child = spawn('node', [WC_TOOLS_BINARY], {
      cwd: WC_TOOLS_ROOT,
      env: getMcpProcessEnv(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }

  let buffer = '';
  const pendingRequests = new Map<
    number,
    {
      resolve: (response: JsonRpcResponse) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  child.stdout?.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const msg = JSON.parse(trimmed) as JsonRpcResponse;
        if (msg.id !== undefined && pendingRequests.has(msg.id)) {
          const pending = pendingRequests.get(msg.id);
          if (pending) {
            clearTimeout(pending.timer);
            pendingRequests.delete(msg.id);
            pending.resolve(msg);
          }
        }
      } catch {
        // Not valid JSON, skip
      }
    }
  });

  // Consume stderr to prevent backpressure
  child.stderr?.on('data', () => {});

  function sendRequest(
    method: string,
    params?: Record<string, unknown>,
    timeout: number = 5000,
  ): Promise<JsonRpcResponse> {
    return new Promise((resolve, reject) => {
      const id = ++requestIdCounter;
      const req: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        ...(params ? { params } : {}),
      };
      const timer = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out after ${timeout}ms`));
      }, timeout);

      pendingRequests.set(id, { resolve, reject, timer });
      child.stdin?.write(JSON.stringify(req) + '\n');
    });
  }

  // Perform MCP handshake
  try {
    const initResponse = await withTimeout(
      sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'admin-mcp-client', version: '1.0.0' },
      }),
      5000,
      'MCP handshake timed out',
    );

    if (initResponse.error) {
      kill(child);
      return null;
    }

    // Send initialized notification
    const notif = { jsonrpc: '2.0' as const, method: 'notifications/initialized' };
    child.stdin?.write(JSON.stringify(notif) + '\n');
  } catch {
    kill(child);
    return null;
  }

  const session: McpSession = {
    async callTool<T>(toolName: string, args?: Record<string, unknown>): Promise<McpToolResult<T>> {
      try {
        const response = await sendRequest('tools/call', {
          name: toolName,
          arguments: args ?? {},
        });

        if (response.error) {
          return { data: null, error: response.error.message };
        }

        const content = response.result?.content as
          | Array<{ type: string; text?: string }>
          | undefined;
        const text = content?.[0]?.text;
        if (!text) {
          return { data: null, error: 'Empty response from tool' };
        }

        try {
          const parsed = JSON.parse(text) as T;
          return { data: parsed, error: null };
        } catch {
          // Return raw text wrapped — caller can handle
          return { data: text as unknown as T, error: null };
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { data: null, error: message };
      }
    },

    close() {
      kill(child);
    },
  };

  return session;
}

// ── Typed wrappers (with caching) ───────────────────────────────────────

async function withSession<T>(fn: (session: McpSession) => Promise<T>): Promise<T | null> {
  const session = await createMcpSession();
  if (!session) return null;
  try {
    return await fn(session);
  } finally {
    session.close();
  }
}

export async function mcpScoreComponent(tagName: string): Promise<McpComponentHealth | null> {
  const cacheKey = `score:${tagName}`;
  const cached = getCached<McpComponentHealth>(cacheKey);
  if (cached) return cached;

  const result = await withSession(async (s) => {
    const res = await s.callTool<McpComponentHealth>('score_component', { tagName });
    return res.data;
  });

  if (result) setCache(cacheKey, result);
  return result;
}

export async function mcpScoreAllComponents(): Promise<McpComponentHealth[] | null> {
  const cacheKey = 'score:all';
  const cached = getCached<McpComponentHealth[]>(cacheKey);
  if (cached) return cached;

  const result = await withSession(async (s) => {
    const res = await s.callTool<McpComponentHealth[]>('score_all_components', {});
    return res.data;
  });

  if (result) setCache(cacheKey, result);
  return result;
}

export async function mcpGetHealthTrend(
  tagName: string,
  days: number = 7,
): Promise<McpHealthTrend | null> {
  const cacheKey = `trend:${tagName}:${days}`;
  const cached = getCached<McpHealthTrend>(cacheKey);
  if (cached) return cached;

  const result = await withSession(async (s) => {
    const res = await s.callTool<McpHealthTrend>('get_health_trend', { tagName, days });
    return res.data;
  });

  if (result) setCache(cacheKey, result);
  return result;
}

export async function mcpGetHealthDiff(
  tagName: string,
  baseBranch: string = 'main',
): Promise<McpHealthDiff | null> {
  const cacheKey = `diff:${tagName}:${baseBranch}`;
  const cached = getCached<McpHealthDiff>(cacheKey);
  if (cached) return cached;

  const result = await withSession(async (s) => {
    const res = await s.callTool<McpHealthDiff>('get_health_diff', { tagName, baseBranch });
    return res.data;
  });

  if (result) setCache(cacheKey, result);
  return result;
}

export async function mcpAnalyzeAccessibility(
  tagName?: string,
): Promise<McpAccessibilityProfile | McpAccessibilityProfile[] | null> {
  const cacheKey = `a11y:${tagName ?? 'all'}`;
  const cached = getCached<McpAccessibilityProfile | McpAccessibilityProfile[]>(cacheKey);
  if (cached) return cached;

  const result = await withSession(async (s) => {
    const args: Record<string, unknown> = {};
    if (tagName) args.tagName = tagName;
    const res = await s.callTool<McpAccessibilityProfile | McpAccessibilityProfile[]>(
      'analyze_accessibility',
      args,
    );
    return res.data;
  });

  if (result) setCache(cacheKey, result);
  return result;
}

// ── Utilities ───────────────────────────────────────────────────────────

function kill(child: ChildProcess): void {
  if (!child.killed) {
    child.kill('SIGTERM');
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, 500);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
