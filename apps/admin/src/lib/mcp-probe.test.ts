import { describe, it, expect } from 'vitest';
import {
  probeMcpServer,
  categorizeToolName,
  EXPECTED_TOOL_CATEGORIES,
  EXPECTED_TOTAL_TOOLS,
} from './mcp-probe';
import type { McpProbeResult, McpProbeStatus } from './mcp-probe';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── categorizeToolName ───────────────────────────────────────────────────

describe('categorizeToolName', () => {
  it('categorizes discovery tools correctly', () => {
    expect(categorizeToolName('list_components')).toBe('discovery');
    expect(categorizeToolName('find_component')).toBe('discovery');
    expect(categorizeToolName('get_library_summary')).toBe('discovery');
    expect(categorizeToolName('list_events')).toBe('discovery');
    expect(categorizeToolName('list_slots')).toBe('discovery');
    expect(categorizeToolName('list_css_parts')).toBe('discovery');
  });

  it('categorizes component tools correctly', () => {
    expect(categorizeToolName('get_component')).toBe('component');
    expect(categorizeToolName('validate_cem')).toBe('component');
    expect(categorizeToolName('suggest_usage')).toBe('component');
    expect(categorizeToolName('generate_import')).toBe('component');
    expect(categorizeToolName('get_component_narrative')).toBe('component');
    expect(categorizeToolName('get_prop_constraints')).toBe('component');
    expect(categorizeToolName('find_components_by_token')).toBe('component');
    expect(categorizeToolName('get_component_dependencies')).toBe('component');
    expect(categorizeToolName('find_components_using_token')).toBe('component');
  });

  it('categorizes health tools correctly', () => {
    expect(categorizeToolName('score_component')).toBe('health');
    expect(categorizeToolName('score_all_components')).toBe('health');
    expect(categorizeToolName('get_health_trend')).toBe('health');
    expect(categorizeToolName('get_health_diff')).toBe('health');
    expect(categorizeToolName('analyze_accessibility')).toBe('health');
  });

  it('categorizes safety tools correctly', () => {
    expect(categorizeToolName('diff_cem')).toBe('safety');
    expect(categorizeToolName('check_breaking_changes')).toBe('safety');
  });

  it('categorizes singleton category tools correctly', () => {
    expect(categorizeToolName('get_composition_example')).toBe('composition');
    expect(categorizeToolName('resolve_cdn_cem')).toBe('cdn');
    expect(categorizeToolName('validate_usage')).toBe('validate');
    expect(categorizeToolName('detect_framework')).toBe('framework');
    expect(categorizeToolName('generate_story')).toBe('story');
    expect(categorizeToolName('estimate_bundle_size')).toBe('bundle');
  });

  it('returns "unknown" for unrecognized tools', () => {
    expect(categorizeToolName('nonexistent_tool')).toBe('unknown');
    expect(categorizeToolName('')).toBe('unknown');
  });
});

// ── EXPECTED_TOOL_CATEGORIES ─────────────────────────────────────────────

describe('EXPECTED_TOOL_CATEGORIES', () => {
  it('has 11 categories (tokens excluded without config)', () => {
    expect(Object.keys(EXPECTED_TOOL_CATEGORIES)).toHaveLength(11);
  });

  it('sums to EXPECTED_TOTAL_TOOLS', () => {
    const sum = Object.values(EXPECTED_TOOL_CATEGORIES).reduce((a, b) => a + b, 0);
    expect(sum).toBe(EXPECTED_TOTAL_TOOLS);
  });

  it('expects 31 total tools', () => {
    expect(EXPECTED_TOTAL_TOOLS).toBe(31);
  });
});

// ── probeMcpServer — structural ──────────────────────────────────────────

describe('probeMcpServer — result structure', () => {
  let result: McpProbeResult;

  // Run probe once for all structural tests (expensive operation)
  beforeAll(async () => {
    result = await probeMcpServer();
  }, 15000);

  it('returns a valid McpProbeResult shape', () => {
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('phases');
    expect(result).toHaveProperty('binaryExists');
    expect(result).toHaveProperty('binaryPath');
    expect(result).toHaveProperty('totalTools');
    expect(result).toHaveProperty('expectedTools');
    expect(result).toHaveProperty('tools');
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('smokeTests');
    expect(result).toHaveProperty('cemPath');
    expect(result).toHaveProperty('cemExists');
    expect(result).toHaveProperty('cemSchemaVersion');
    expect(result).toHaveProperty('cemSurface');
    expect(result).toHaveProperty('cemComponents');
    expect(result).toHaveProperty('totalProbeMs');
    expect(result).toHaveProperty('errors');
  });

  it('status is a valid McpProbeStatus', () => {
    const validStatuses: McpProbeStatus[] = ['healthy', 'degraded', 'unreachable'];
    expect(validStatuses).toContain(result.status);
  });

  it('timestamp is a valid ISO string', () => {
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('totalProbeMs is a non-negative number', () => {
    expect(result.totalProbeMs).toBeGreaterThanOrEqual(0);
  });

  it('expectedTools equals EXPECTED_TOTAL_TOOLS', () => {
    expect(result.expectedTools).toBe(EXPECTED_TOTAL_TOOLS);
  });

  it('errors is an array', () => {
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('phases is a non-empty array', () => {
    expect(Array.isArray(result.phases)).toBe(true);
    expect(result.phases.length).toBeGreaterThan(0);
  });

  it('each phase has name, latencyMs, and passed', () => {
    for (const phase of result.phases) {
      expect(phase).toHaveProperty('name');
      expect(phase).toHaveProperty('latencyMs');
      expect(phase).toHaveProperty('passed');
      expect(typeof phase.name).toBe('string');
      expect(typeof phase.latencyMs).toBe('number');
      expect(typeof phase.passed).toBe('boolean');
    }
  });
});

// ── probeMcpServer — binary check ────────────────────────────────────────

describe('probeMcpServer — binary check', () => {
  it('detects the wc-tools binary', async () => {
    const result = await probeMcpServer();
    const binaryActuallyExists = existsSync(result.binaryPath);
    expect(result.binaryExists).toBe(binaryActuallyExists);
  }, 15000);

  it('first phase is always "Binary check"', async () => {
    const result = await probeMcpServer();
    expect(result.phases[0].name).toBe('Binary check');
  }, 15000);
});

// ── probeMcpServer — live server integration ─────────────────────────────
// These tests require the helixir MCP server package to be installed.

let HELIXIR_BINARY: string;
try {
  HELIXIR_BINARY = require.resolve('helixir');
} catch {
  HELIXIR_BINARY = '';
}
const serverAvailable = HELIXIR_BINARY !== '' && existsSync(HELIXIR_BINARY);

describe.skipIf(!serverAvailable)('probeMcpServer — live server', () => {
  let result: McpProbeResult;

  beforeAll(async () => {
    result = await probeMcpServer();
  }, 15000);

  it('reports healthy status', () => {
    expect(result.status).toBe('healthy');
  });

  it('binary exists', () => {
    expect(result.binaryExists).toBe(true);
  });

  it('completes MCP handshake', () => {
    expect(result.serverName).toBeTruthy();
    expect(result.handshakeLatencyMs).toBeGreaterThan(0);
    expect(result.processStartupMs).toBeGreaterThan(0);
  });

  it('server reports name and version', () => {
    expect(typeof result.serverName).toBe('string');
    expect(result.serverName!.length).toBeGreaterThan(0);
  });

  it('discovers all expected tools', () => {
    expect(result.totalTools).toBeGreaterThanOrEqual(EXPECTED_TOTAL_TOOLS);
  });

  it('tool list contains known tools', () => {
    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain('list_components');
    expect(toolNames).toContain('get_component');
    expect(toolNames).toContain('score_all_components');
    expect(toolNames).toContain('get_library_summary');
  });

  it('each tool has name, description, category, and arg info', () => {
    for (const tool of result.tools) {
      expect(tool.name).toBeTruthy();
      expect(typeof tool.description).toBe('string');
      expect(typeof tool.category).toBe('string');
      expect(Array.isArray(tool.requiredArgs)).toBe(true);
      expect(Array.isArray(tool.optionalArgs)).toBe(true);
    }
  });

  it('tools with known required args report them correctly', () => {
    const getComponent = result.tools.find((t) => t.name === 'get_component');
    expect(getComponent).toBeDefined();
    expect(getComponent!.requiredArgs).toContain('tagName');
  });

  it('categories match expected structure with descriptions', () => {
    expect(result.categories.length).toBeGreaterThanOrEqual(
      Object.keys(EXPECTED_TOOL_CATEGORIES).length,
    );

    for (const cat of result.categories) {
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('description');
      expect(cat).toHaveProperty('expectedCount');
      expect(cat).toHaveProperty('actualCount');
      expect(cat).toHaveProperty('tools');
      expect(Array.isArray(cat.tools)).toBe(true);
    }
  });

  it('category tools contain full McpToolInfo objects', () => {
    const discovery = result.categories.find((c) => c.name === 'discovery');
    expect(discovery).toBeDefined();
    expect(discovery!.tools.length).toBeGreaterThan(0);
    expect(discovery!.tools[0]).toHaveProperty('name');
    expect(discovery!.tools[0]).toHaveProperty('description');
    expect(discovery!.tools[0]).toHaveProperty('category');
  });

  it('all 8 smoke tests pass', () => {
    expect(result.smokeTests.length).toBe(8);
    for (const test of result.smokeTests) {
      expect(test.passed).toBe(true);
      expect(test.latencyMs).toBeGreaterThanOrEqual(0);
      expect(test.summary.length).toBeGreaterThan(0);
      expect(test.error).toBeUndefined();
    }
  });

  it('smoke tests cover multiple categories', () => {
    const categories = new Set(result.smokeTests.map((t) => t.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
    expect(categories).toContain('discovery');
    expect(categories).toContain('component');
    expect(categories).toContain('health');
    expect(categories).toContain('framework');
  });

  it('smoke tests include parameterized calls', () => {
    const withArgs = result.smokeTests.filter((t) => Object.keys(t.args).length > 0);
    expect(withArgs.length).toBeGreaterThanOrEqual(3);
  });

  it('smoke test tools are correct', () => {
    const testedTools = result.smokeTests.map((t) => t.tool);
    expect(testedTools).toContain('list_components');
    expect(testedTools).toContain('get_library_summary');
    expect(testedTools).toContain('score_all_components');
    expect(testedTools).toContain('find_component');
    expect(testedTools).toContain('get_component');
    expect(testedTools).toContain('validate_cem');
    expect(testedTools).toContain('analyze_accessibility');
    expect(testedTools).toContain('detect_framework');
  });

  it('runs all 5 phases', () => {
    const phaseNames = result.phases.map((p) => p.name);
    expect(phaseNames).toContain('Binary check');
    expect(phaseNames).toContain('MCP handshake');
    expect(phaseNames).toContain('Tool inventory');
    expect(phaseNames).toContain('Smoke tests');
    expect(phaseNames).toContain('CEM metadata');
  });

  it('all phases pass', () => {
    for (const phase of result.phases) {
      expect(phase.passed).toBe(true);
    }
  });

  it('no errors reported', () => {
    expect(result.errors).toHaveLength(0);
  });

  it('total probe completes within 15 seconds', () => {
    expect(result.totalProbeMs).toBeLessThan(15000);
  });
});

// ── CEM metadata ─────────────────────────────────────────────────────────

const CEM_FILE = resolve(__dirname, '../../../../packages/hx-library/custom-elements.json');
const cemAvailable = existsSync(CEM_FILE);

describe('probeMcpServer — CEM metadata', () => {
  it('reports CEM file status', async () => {
    const result = await probeMcpServer();
    expect(typeof result.cemExists).toBe('boolean');
    expect(typeof result.cemPath).toBe('string');
  }, 15000);

  it('CEM path points to expected location', async () => {
    const result = await probeMcpServer();
    expect(result.cemPath).toContain('hx-library/custom-elements.json');
  }, 15000);
});

// ── CEM deep dive (requires CEM file on disk) ──────────────────────────

describe.skipIf(!cemAvailable)('probeMcpServer — CEM deep dive', () => {
  let result: McpProbeResult;

  beforeAll(async () => {
    result = await probeMcpServer();
  }, 15000);

  it('reports CEM schema version', () => {
    expect(result.cemSchemaVersion).toBeTruthy();
    expect(typeof result.cemSchemaVersion).toBe('string');
  });

  it('reports API surface totals', () => {
    expect(result.cemSurface).not.toBeNull();
    const surface = result.cemSurface!;
    expect(surface.attributes).toBeGreaterThan(0);
    expect(surface.events).toBeGreaterThanOrEqual(0);
    expect(surface.slots).toBeGreaterThanOrEqual(0);
    expect(surface.cssProperties).toBeGreaterThanOrEqual(0);
    expect(surface.cssParts).toBeGreaterThanOrEqual(0);
    expect(surface.methods).toBeGreaterThanOrEqual(0);
  });

  it('reports per-component breakdown', () => {
    expect(result.cemComponents.length).toBeGreaterThan(0);
    expect(result.cemComponents.length).toBe(result.cemComponentCount);
  });

  it('each component has expected shape', () => {
    for (const comp of result.cemComponents) {
      expect(comp.tagName).toMatch(/^hx-/);
      expect(typeof comp.attributes).toBe('number');
      expect(typeof comp.events).toBe('number');
      expect(typeof comp.slots).toBe('number');
      expect(typeof comp.cssProperties).toBe('number');
      expect(typeof comp.cssParts).toBe('number');
      expect(typeof comp.methods).toBe('number');
      expect(typeof comp.superclass).toBe('string');
    }
  });

  it('components are sorted alphabetically by tagName', () => {
    const tags = result.cemComponents.map((c) => c.tagName);
    const sorted = [...tags].sort();
    expect(tags).toEqual(sorted);
  });

  it('surface totals match sum of component values', () => {
    const surface = result.cemSurface!;
    const sumAttrs = result.cemComponents.reduce((a, c) => a + c.attributes, 0);
    const sumEvents = result.cemComponents.reduce((a, c) => a + c.events, 0);
    const sumSlots = result.cemComponents.reduce((a, c) => a + c.slots, 0);
    const sumCssProps = result.cemComponents.reduce((a, c) => a + c.cssProperties, 0);
    const sumCssParts = result.cemComponents.reduce((a, c) => a + c.cssParts, 0);
    const sumMethods = result.cemComponents.reduce((a, c) => a + c.methods, 0);

    expect(surface.attributes).toBe(sumAttrs);
    expect(surface.events).toBe(sumEvents);
    expect(surface.slots).toBe(sumSlots);
    expect(surface.cssProperties).toBe(sumCssProps);
    expect(surface.cssParts).toBe(sumCssParts);
    expect(surface.methods).toBe(sumMethods);
  });
});
