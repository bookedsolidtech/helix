import { spawn } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { WC_TOOLS_ROOT, WC_TOOLS_BINARY, CEM_PATH, getMcpProcessEnv } from './mcp-constants';

// ── Types ────────────────────────────────────────────────────────────────

export type McpProbeStatus = 'healthy' | 'degraded' | 'unreachable';

export interface McpToolInfo {
  name: string;
  description: string;
  category: string;
  requiredArgs: string[];
  optionalArgs: string[];
}

export interface McpToolCategory {
  name: string;
  description: string;
  expectedCount: number;
  actualCount: number;
  tools: McpToolInfo[];
}

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  discovery: 'Enumerate components, search by name, list events/slots/CSS parts',
  component: 'Inspect individual components — metadata, usage, narratives, constraints',
  health: 'Score component quality, track trends, diff between branches, audit a11y',
  safety: 'Detect breaking changes and diff CEM across branches',
  typescript: 'Run TypeScript diagnostics on files or the full project',
  composition: 'Generate HTML snippets showing how to compose components together',
  cdn: 'Fetch and cache CEM from CDN registries (jsDelivr, UNPKG)',
  validate: 'Validate proposed HTML usage against the CEM spec',
  framework: 'Detect which web component framework the project uses',
  story: 'Generate Storybook CSF3 story files from CEM declarations',
  bundle: 'Estimate bundle size (minified + gzipped) via bundlephobia',
  tokens: 'Query and search design tokens (requires tokensPath config)',
};

export interface McpSmokeTestResult {
  tool: string;
  category: string;
  args: Record<string, unknown>;
  passed: boolean;
  latencyMs: number;
  summary: string;
  error?: string;
}

export interface CemApiSurface {
  attributes: number;
  events: number;
  slots: number;
  cssProperties: number;
  cssParts: number;
  methods: number;
}

export interface CemComponentSummary {
  tagName: string;
  attributes: number;
  events: number;
  slots: number;
  cssProperties: number;
  cssParts: number;
  methods: number;
  superclass: string;
}

export interface McpProbeResult {
  status: McpProbeStatus;
  timestamp: string;
  phases: McpPhaseResult[];

  // Binary check
  binaryExists: boolean;
  binaryPath: string;

  // Server info (from initialize response)
  serverName: string | null;
  serverVersion: string | null;
  handshakeLatencyMs: number | null;
  processStartupMs: number | null;

  // Tool inventory
  totalTools: number;
  expectedTools: number;
  tools: McpToolInfo[];
  categories: McpToolCategory[];

  // Smoke tests
  smokeTests: McpSmokeTestResult[];

  // CEM metadata
  cemPath: string;
  cemExists: boolean;
  cemAgeHours: number | null;
  cemComponentCount: number | null;
  cemSchemaVersion: string | null;
  cemSurface: CemApiSurface | null;
  cemComponents: CemComponentSummary[];

  // Timing
  totalProbeMs: number;

  // Errors
  errors: string[];
}

export interface McpPhaseResult {
  name: string;
  latencyMs: number;
  passed: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────
// WC_TOOLS_ROOT, WC_TOOLS_BINARY, CEM_PATH imported from mcp-constants.ts

export const EXPECTED_TOOL_CATEGORIES: Record<string, number> = {
  discovery: 7,
  component: 9,
  health: 5,
  safety: 2,
  typescript: 2,
  composition: 1,
  cdn: 1,
  validate: 1,
  framework: 1,
  story: 1,
  bundle: 1,
};

export const EXPECTED_TOTAL_TOOLS = Object.values(EXPECTED_TOOL_CATEGORIES).reduce(
  (a, b) => a + b,
  0,
);

const TIMEOUT_HANDSHAKE = 3000;
const TIMEOUT_TOOL_LIST = 2000;
const TIMEOUT_SMOKE_TEST = 3000;

// ── JSON-RPC helpers ─────────────────────────────────────────────────────

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

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

let requestId = 0;

function makeRequest(method: string, params?: Record<string, unknown>): JsonRpcRequest {
  return {
    jsonrpc: '2.0',
    id: ++requestId,
    method,
    ...(params ? { params } : {}),
  };
}

function makeNotification(method: string, params?: Record<string, unknown>): JsonRpcNotification {
  return {
    jsonrpc: '2.0',
    method,
    ...(params ? { params } : {}),
  };
}

// ── Probe implementation ─────────────────────────────────────────────────

export async function probeMcpServer(): Promise<McpProbeResult> {
  const probeStart = Date.now();
  const errors: string[] = [];
  const phases: McpPhaseResult[] = [];

  const result: McpProbeResult = {
    status: 'unreachable',
    timestamp: new Date().toISOString(),
    phases: [],
    binaryExists: false,
    binaryPath: WC_TOOLS_BINARY,
    serverName: null,
    serverVersion: null,
    handshakeLatencyMs: null,
    processStartupMs: null,
    totalTools: 0,
    expectedTools: EXPECTED_TOTAL_TOOLS,
    tools: [],
    categories: [],
    smokeTests: [],
    cemPath: CEM_PATH,
    cemExists: false,
    cemAgeHours: null,
    cemComponentCount: null,
    cemSchemaVersion: null,
    cemSurface: null,
    cemComponents: [],
    totalProbeMs: 0,
    errors: [],
  };

  // Phase 1: Binary check
  const binaryStart = Date.now();
  result.binaryExists = existsSync(WC_TOOLS_BINARY);
  phases.push({
    name: 'Binary check',
    latencyMs: Date.now() - binaryStart,
    passed: result.binaryExists,
  });

  if (!result.binaryExists) {
    errors.push(`Binary not found at ${WC_TOOLS_BINARY}`);
    result.errors = errors;
    result.phases = phases;
    result.totalProbeMs = Date.now() - probeStart;
    return result;
  }

  // Phase 2-4: Spawn process and communicate
  let child: ReturnType<typeof spawn> | null = null;

  try {
    const spawnResult = await withTimeout(
      spawnAndProbe(WC_TOOLS_BINARY, errors, phases, result),
      15000,
      'Total probe timeout exceeded (15s)',
    );

    child = spawnResult.child;

    // Assign results from spawn
    Object.assign(result, spawnResult.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(message);
  } finally {
    // Always kill the child process
    if (child && !child.killed) {
      child.kill('SIGTERM');
      // Force kill after 500ms if still alive
      setTimeout(() => {
        if (child && !child.killed) {
          child.kill('SIGKILL');
        }
      }, 500);
    }
  }

  // Phase 5: CEM metadata (independent of MCP server)
  const cemStart = Date.now();
  result.cemExists = existsSync(CEM_PATH);
  if (result.cemExists) {
    try {
      const stat = statSync(CEM_PATH);
      result.cemAgeHours = Math.round(((Date.now() - stat.mtimeMs) / 3600000) * 10) / 10;

      const { readFileSync } = await import('node:fs');
      const cemContent = JSON.parse(readFileSync(CEM_PATH, 'utf-8')) as {
        schemaVersion?: string;
        modules?: Array<{
          declarations?: Array<{
            kind?: string;
            tagName?: string;
            superclass?: { name?: string };
            members?: Array<{ kind?: string; attribute?: string }>;
            events?: Array<unknown>;
            slots?: Array<unknown>;
            cssProperties?: Array<unknown>;
            cssParts?: Array<unknown>;
          }>;
        }>;
      };

      result.cemSchemaVersion = cemContent.schemaVersion ?? null;

      const surface: CemApiSurface = {
        attributes: 0,
        events: 0,
        slots: 0,
        cssProperties: 0,
        cssParts: 0,
        methods: 0,
      };
      const components: CemComponentSummary[] = [];

      for (const mod of cemContent.modules ?? []) {
        for (const decl of mod.declarations ?? []) {
          if (decl.kind === 'class' && decl.tagName) {
            const members = decl.members ?? [];
            const attrs = members.filter((m) => m.kind === 'field' && m.attribute).length;
            const methods = members.filter((m) => m.kind === 'method').length;
            const events = decl.events?.length ?? 0;
            const slots = decl.slots?.length ?? 0;
            const cssProps = decl.cssProperties?.length ?? 0;
            const cssParts = decl.cssParts?.length ?? 0;

            surface.attributes += attrs;
            surface.events += events;
            surface.slots += slots;
            surface.cssProperties += cssProps;
            surface.cssParts += cssParts;
            surface.methods += methods;

            components.push({
              tagName: decl.tagName,
              attributes: attrs,
              events,
              slots,
              cssProperties: cssProps,
              cssParts,
              methods,
              superclass: decl.superclass?.name ?? 'unknown',
            });
          }
        }
      }

      result.cemComponentCount = components.length;
      result.cemSurface = surface;
      result.cemComponents = components.sort((a, b) => a.tagName.localeCompare(b.tagName));
    } catch {
      errors.push('Failed to read CEM file metadata');
    }
  }
  phases.push({
    name: 'CEM metadata',
    latencyMs: Date.now() - cemStart,
    passed: result.cemExists,
  });

  // Determine overall status
  const smokePassRate =
    result.smokeTests.length > 0
      ? result.smokeTests.filter((t) => t.passed).length / result.smokeTests.length
      : 0;

  if (result.serverName && result.totalTools >= EXPECTED_TOTAL_TOOLS && smokePassRate === 1) {
    result.status = 'healthy';
  } else if (result.serverName) {
    result.status = 'degraded';
  } else {
    result.status = 'unreachable';
  }

  result.errors = errors;
  result.phases = phases;
  result.totalProbeMs = Date.now() - probeStart;

  return result;
}

// ── Spawn + MCP protocol ─────────────────────────────────────────────────

interface SpawnProbeResult {
  child: ReturnType<typeof spawn>;
  data: Partial<McpProbeResult>;
}

async function spawnAndProbe(
  binaryPath: string,
  errors: string[],
  phases: McpPhaseResult[],
  _result: McpProbeResult,
): Promise<SpawnProbeResult> {
  const data: Partial<McpProbeResult> = {};

  return new Promise((resolvePromise, rejectPromise) => {
    const processStart = Date.now();

    const child = spawn('node', [binaryPath], {
      cwd: WC_TOOLS_ROOT,
      env: getMcpProcessEnv(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let buffer = '';
    const pendingRequests = new Map<
      number,
      {
        resolve: (response: JsonRpcResponse) => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    >();

    function sendRequest(
      method: string,
      params?: Record<string, unknown>,
      timeout: number = 3000,
    ): Promise<JsonRpcResponse> {
      return new Promise((resolve, reject) => {
        const req = makeRequest(method, params);
        const timer = setTimeout(() => {
          pendingRequests.delete(req.id);
          reject(new Error(`Request ${method} timed out after ${timeout}ms`));
        }, timeout);

        pendingRequests.set(req.id, { resolve, reject, timer });
        child.stdin.write(JSON.stringify(req) + '\n');
      });
    }

    function sendNotification(method: string, params?: Record<string, unknown>): void {
      const notif = makeNotification(method, params);
      child.stdin.write(JSON.stringify(notif) + '\n');
    }

    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      // Process complete JSON-RPC messages (newline-delimited)
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

    child.stderr.on('data', () => {
      // Consume stderr to prevent backpressure
    });

    child.on('error', (err) => {
      rejectPromise(new Error(`Failed to spawn MCP server: ${err.message}`));
    });

    child.on('close', (code) => {
      // Clean up pending requests
      for (const [, pending] of pendingRequests) {
        clearTimeout(pending.timer);
        pending.reject(new Error(`Process exited with code ${code}`));
      }
      pendingRequests.clear();
    });

    // Run the probe sequence
    (async () => {
      // Phase 2: MCP handshake
      const handshakeStart = Date.now();
      try {
        const initResponse = await sendRequest(
          'initialize',
          {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'panopticon-probe', version: '1.0.0' },
          },
          TIMEOUT_HANDSHAKE,
        );

        data.processStartupMs = Date.now() - processStart;
        data.handshakeLatencyMs = Date.now() - handshakeStart;

        if (initResponse.result) {
          const serverInfo = initResponse.result.serverInfo as
            | { name?: string; version?: string }
            | undefined;
          data.serverName = serverInfo?.name ?? null;
          data.serverVersion = serverInfo?.version ?? null;
        }

        // Send initialized notification
        sendNotification('notifications/initialized');

        phases.push({
          name: 'MCP handshake',
          latencyMs: data.handshakeLatencyMs,
          passed: true,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Handshake failed: ${message}`);
        phases.push({
          name: 'MCP handshake',
          latencyMs: Date.now() - handshakeStart,
          passed: false,
        });
        resolvePromise({ child, data });
        return;
      }

      // Phase 3: Tool inventory
      const toolListStart = Date.now();
      try {
        const toolsResponse = await sendRequest('tools/list', {}, TIMEOUT_TOOL_LIST);

        const tools = (toolsResponse.result?.tools ?? []) as Array<{
          name: string;
          description?: string;
          inputSchema?: {
            properties?: Record<string, unknown>;
            required?: string[];
          };
        }>;

        data.totalTools = tools.length;
        data.tools = tools.map((t) => {
          const props = Object.keys(t.inputSchema?.properties ?? {});
          const required = t.inputSchema?.required ?? [];
          return {
            name: t.name,
            description: t.description ?? '',
            category: categorizeToolName(t.name),
            requiredArgs: required,
            optionalArgs: props.filter((p) => !required.includes(p)),
          };
        });

        // Build category summary with full tool info
        const categoryToolMap = new Map<string, McpToolInfo[]>();
        for (const tool of data.tools) {
          const existing = categoryToolMap.get(tool.category) ?? [];
          existing.push(tool);
          categoryToolMap.set(tool.category, existing);
        }

        data.categories = Object.entries(EXPECTED_TOOL_CATEGORIES).map(([name, expected]) => ({
          name,
          description: CATEGORY_DESCRIPTIONS[name] ?? '',
          expectedCount: expected,
          actualCount: categoryToolMap.get(name)?.length ?? 0,
          tools: categoryToolMap.get(name) ?? [],
        }));

        // Add any unexpected categories
        for (const [name, catTools] of categoryToolMap) {
          if (!EXPECTED_TOOL_CATEGORIES[name]) {
            data.categories.push({
              name,
              description: CATEGORY_DESCRIPTIONS[name] ?? '',
              expectedCount: 0,
              actualCount: catTools.length,
              tools: catTools,
            });
          }
        }

        phases.push({
          name: 'Tool inventory',
          latencyMs: Date.now() - toolListStart,
          passed: tools.length >= EXPECTED_TOTAL_TOOLS,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Tool list failed: ${message}`);
        phases.push({
          name: 'Tool inventory',
          latencyMs: Date.now() - toolListStart,
          passed: false,
        });
      }

      // Phase 4: Smoke tests
      const smokeTests: McpSmokeTestResult[] = [];
      const smokeStart = Date.now();

      const smokeConfigs: Array<{
        tool: string;
        category: string;
        args: Record<string, unknown>;
      }> = [
        // Discovery — zero-arg tools that enumerate the library
        { tool: 'list_components', category: 'discovery', args: {} },
        { tool: 'get_library_summary', category: 'discovery', args: {} },
        // Discovery — parameterized search
        { tool: 'find_component', category: 'discovery', args: { query: 'button' } },
        // Component — fetch full metadata for a known component
        { tool: 'get_component', category: 'component', args: { tagName: 'hx-button' } },
        // Component — CEM validation
        { tool: 'validate_cem', category: 'component', args: { tagName: 'hx-button' } },
        // Health — score all components
        { tool: 'score_all_components', category: 'health', args: {} },
        // Health — accessibility analysis
        { tool: 'analyze_accessibility', category: 'health', args: {} },
        // Framework — detect project framework
        { tool: 'detect_framework', category: 'framework', args: {} },
      ];

      for (const smokeConfig of smokeConfigs) {
        const testStart = Date.now();
        try {
          const response = await sendRequest(
            'tools/call',
            { name: smokeConfig.tool, arguments: smokeConfig.args },
            TIMEOUT_SMOKE_TEST,
          );

          const latency = Date.now() - testStart;
          const hasError = Boolean(response.error);
          const content = response.result?.content as
            | Array<{ type: string; text?: string }>
            | undefined;
          const text = content?.[0]?.text ?? '';
          const summary = text.length > 200 ? text.slice(0, 200) + '...' : text;

          smokeTests.push({
            tool: smokeConfig.tool,
            category: smokeConfig.category,
            args: smokeConfig.args,
            passed: !hasError && text.length > 0,
            latencyMs: latency,
            summary: hasError ? (response.error?.message ?? 'Unknown error') : summary,
            error: hasError ? response.error?.message : undefined,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          smokeTests.push({
            tool: smokeConfig.tool,
            category: smokeConfig.category,
            args: smokeConfig.args,
            passed: false,
            latencyMs: Date.now() - testStart,
            summary: message,
            error: message,
          });
        }
      }

      data.smokeTests = smokeTests;
      phases.push({
        name: 'Smoke tests',
        latencyMs: Date.now() - smokeStart,
        passed: smokeTests.every((t) => t.passed),
      });

      resolvePromise({ child, data });
    })().catch((err) => {
      rejectPromise(err);
    });
  });
}

// ── Tool categorization ──────────────────────────────────────────────────

const TOOL_CATEGORY_MAP: Record<string, string> = {
  list_components: 'discovery',
  find_component: 'discovery',
  get_library_summary: 'discovery',
  list_events: 'discovery',
  list_slots: 'discovery',
  list_css_parts: 'discovery',
  list_components_by_category: 'discovery',
  // Token tools (conditional — only registered when tokensPath is configured)
  get_design_tokens: 'tokens',
  find_token: 'tokens',
  get_component: 'component',
  validate_cem: 'component',
  suggest_usage: 'component',
  generate_import: 'component',
  get_component_narrative: 'component',
  get_prop_constraints: 'component',
  find_components_by_token: 'component',
  get_component_dependencies: 'component',
  find_components_using_token: 'component',
  score_component: 'health',
  score_all_components: 'health',
  get_health_trend: 'health',
  get_health_diff: 'health',
  analyze_accessibility: 'health',
  diff_cem: 'safety',
  check_breaking_changes: 'safety',
  get_file_diagnostics: 'typescript',
  get_project_diagnostics: 'typescript',
  get_composition_example: 'composition',
  resolve_cdn_cem: 'cdn',
  validate_usage: 'validate',
  detect_framework: 'framework',
  generate_story: 'story',
  estimate_bundle_size: 'bundle',
};

export function categorizeToolName(name: string): string {
  return TOOL_CATEGORY_MAP[name] ?? 'unknown';
}

// ── Utilities ────────────────────────────────────────────────────────────

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
