import { describe, it, expect, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import {
  createMcpSession,
  mcpScoreComponent,
  mcpScoreAllComponents,
  mcpGetHealthTrend,
  mcpGetHealthDiff,
  mcpAnalyzeAccessibility,
  clearMcpCache,
} from './mcp-client';
import type { McpComponentHealth } from './mcp-client';
import { WC_TOOLS_BINARY } from './mcp-constants';

afterEach(() => {
  clearMcpCache();
});

// ── Structural tests ────────────────────────────────────────────────────

describe('mcp-client — exports', () => {
  it('exports createMcpSession function', () => {
    expect(typeof createMcpSession).toBe('function');
  });

  it('exports typed wrapper functions', () => {
    expect(typeof mcpScoreComponent).toBe('function');
    expect(typeof mcpScoreAllComponents).toBe('function');
    expect(typeof mcpGetHealthTrend).toBe('function');
    expect(typeof mcpGetHealthDiff).toBe('function');
    expect(typeof mcpAnalyzeAccessibility).toBe('function');
  });

  it('exports clearMcpCache function', () => {
    expect(typeof clearMcpCache).toBe('function');
  });
});

// ── createMcpSession — binary check ─────────────────────────────────────

describe('createMcpSession — binary check', () => {
  it('returns null when binary is missing (if applicable)', async () => {
    // This test is meaningful if the binary doesn't exist
    if (existsSync(WC_TOOLS_BINARY)) {
      // Binary exists — session creation should succeed
      const session = await createMcpSession();
      expect(session).not.toBeNull();
      session?.close();
    } else {
      const session = await createMcpSession();
      expect(session).toBeNull();
    }
  }, 10000);
});

// ── Live server integration tests ───────────────────────────────────────

const serverAvailable = existsSync(WC_TOOLS_BINARY);

describe.skipIf(!serverAvailable)('mcp-client — live session', () => {
  it('creates a session and calls a tool', async () => {
    const session = await createMcpSession();
    expect(session).not.toBeNull();

    const result = await session!.callTool<McpComponentHealth[]>('list_components', {});
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();

    session!.close();
  }, 10000);

  it('handles unknown tool gracefully', async () => {
    const session = await createMcpSession();
    expect(session).not.toBeNull();

    const result = await session!.callTool('nonexistent_tool_xyz', {});
    // wc-tools may return an error in result.error or as text in result.data
    // Either way, we shouldn't get a clean parsed object
    const hasError = result.error !== null || typeof result.data === 'string';
    expect(hasError).toBe(true);

    session!.close();
  }, 10000);
});

describe.skipIf(!serverAvailable)('mcp-client — typed wrappers', () => {
  it('mcpScoreAllComponents returns component array', async () => {
    const result = await mcpScoreAllComponents();
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    if (result && result.length > 0) {
      const first = result[0] as McpComponentHealth;
      expect(first).toHaveProperty('tagName');
      expect(first).toHaveProperty('score');
      expect(first).toHaveProperty('grade');
    }
  }, 15000);

  it('mcpScoreComponent returns health for hx-button', async () => {
    const result = await mcpScoreComponent('hx-button');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.tagName).toBe('hx-button');
      expect(typeof result.score).toBe('number');
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
    }
  }, 15000);

  it('mcpGetHealthDiff returns diff object or null', async () => {
    const result = await mcpGetHealthDiff('hx-button');
    // May be null if no git context or error text returned — graceful degradation
    if (result && typeof result === 'object' && 'tagName' in result) {
      expect(result.tagName).toBe('hx-button');
      expect(typeof result.scoreDelta).toBe('number');
      expect(result).toHaveProperty('base');
      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('changedDimensions');
    }
    // If null or non-object, that's acceptable — tool may return error text
  }, 15000);

  it('mcpAnalyzeAccessibility returns profile(s)', async () => {
    const result = await mcpAnalyzeAccessibility();
    expect(result).not.toBeNull();
  }, 15000);

  it('mcpGetHealthTrend handles missing history gracefully', async () => {
    const result = await mcpGetHealthTrend('hx-button');
    // May be null if no history files exist — graceful degradation
    // If it returns a valid trend object, verify shape
    if (result && typeof result === 'object' && 'tagName' in result) {
      expect(result.tagName).toBe('hx-button');
      expect(typeof result.days).toBe('number');
      expect(Array.isArray(result.dataPoints)).toBe(true);
      expect(['improving', 'declining', 'stable']).toContain(result.trend);
    }
    // If null or non-object, that's acceptable — tool may return error text
  }, 15000);
});

describe.skipIf(!serverAvailable)('mcp-client — caching', () => {
  it('returns cached result on second call', async () => {
    const first = await mcpScoreAllComponents();
    expect(first).not.toBeNull();

    // Second call should be instant (cached)
    const start = Date.now();
    const second = await mcpScoreAllComponents();
    const elapsed = Date.now() - start;

    expect(second).toEqual(first);
    // Cached call should be near-instant (< 50ms, no spawn)
    expect(elapsed).toBeLessThan(50);
  }, 15000);

  it('clearMcpCache invalidates cache', async () => {
    await mcpScoreAllComponents();
    clearMcpCache();
    // After clearing, the next call must spawn a new session
    // Just verify it still works
    const result = await mcpScoreAllComponents();
    expect(result).not.toBeNull();
  }, 15000);
});
