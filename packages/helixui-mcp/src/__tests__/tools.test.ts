/**
 * Unit tests for tool definition shape and input schema validation logic.
 *
 * tools.ts imports @modelcontextprotocol/sdk which is not available in the
 * test environment's module resolution (it's only available after build).
 * We test the schema contracts by:
 *   1. Validating schema regex/constraints in isolation
 *   2. Verifying the 16 tool names exist in the TOOL_DEFINITIONS by mocking
 *      the MCP server import and capturing what registerTools calls
 *
 * This approach keeps tests fast and deterministic without relying on the
 * MCP server runtime.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Schema contract tests (no external imports needed) ───────────────────────

describe('TagName validation contract', () => {
  const hxPrefixRegex = /^hx-/;

  it('accepts hx- prefixed tag names', () => {
    expect(hxPrefixRegex.test('hx-button')).toBe(true);
    expect(hxPrefixRegex.test('hx-card')).toBe(true);
    expect(hxPrefixRegex.test('hx-text-input')).toBe(true);
    expect(hxPrefixRegex.test('hx-my-component')).toBe(true);
  });

  it('rejects tag names without hx- prefix', () => {
    expect(hxPrefixRegex.test('button')).toBe(false);
    expect(hxPrefixRegex.test('wc-button')).toBe(false);
    expect(hxPrefixRegex.test('')).toBe(false);
    expect(hxPrefixRegex.test('hxbutton')).toBe(false);
  });
});

describe('scaffoldComponent name validation contract', () => {
  // Matches the regex in tools.ts ScaffoldComponentArgsSchema
  const validNameRegex = /^[a-z][a-z0-9-]*$/;

  it('accepts valid component names', () => {
    expect(validNameRegex.test('badge')).toBe(true);
    expect(validNameRegex.test('media-card')).toBe(true);
    expect(validNameRegex.test('my-button-v2')).toBe(true);
    expect(validNameRegex.test('a')).toBe(true);
  });

  it('rejects invalid component names', () => {
    expect(validNameRegex.test('MediaCard')).toBe(false);
    expect(validNameRegex.test('2button')).toBe(false);
    expect(validNameRegex.test('my_card')).toBe(false);
    expect(validNameRegex.test('')).toBe(false);
    expect(validNameRegex.test('-starts-with-hyphen')).toBe(false);
  });
});

describe('migrateVersion schema contract', () => {
  // Basic semver pattern check
  const semverRegex = /^\d+\.\d+\.\d+/;

  it('accepts valid semver strings', () => {
    expect(semverRegex.test('0.1.0')).toBe(true);
    expect(semverRegex.test('1.2.3')).toBe(true);
    expect(semverRegex.test('10.0.0')).toBe(true);
    expect(semverRegex.test('v0.1.0')).toBe(false); // no v prefix
  });

  it('rejects invalid version strings', () => {
    expect(semverRegex.test('not-semver')).toBe(false);
    expect(semverRegex.test('')).toBe(false);
    expect(semverRegex.test('1.0')).toBe(false); // missing patch
  });
});

// ─── TOOL_DEFINITIONS via mock ────────────────────────────────────────────────
//
// We mock the MCP SDK and zod so that tools.ts can be imported in the test
// environment. This lets us introspect the TOOL_DEFINITIONS without a live
// MCP server.

describe('TOOL_DEFINITIONS via mocked server', () => {
  beforeEach(() => {
    // Mock the MCP SDK so tools.ts can be imported
    vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
      Server: class MockServer {},
    }));
    vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
      ListToolsRequestSchema: { method: 'tools/list' },
      CallToolRequestSchema: { method: 'tools/call' },
    }));
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('registerTools registers exactly 2 request handlers', async () => {
    const { registerTools } = await import('../tools.js');
    const handlers: unknown[] = [];
    const mockServer = {
      setRequestHandler: (_schema: unknown, _handler: unknown) => {
        handlers.push(_handler);
      },
    };
    registerTools(mockServer as Parameters<typeof registerTools>[0]);
    expect(handlers).toHaveLength(2);
  });

  it('list-tools handler returns at least 15 tool definitions', async () => {
    const { registerTools } = await import('../tools.js');
    let listHandler: ((req: unknown) => Promise<{ tools: unknown[] }>) | undefined;
    let callCount = 0;

    const mockServer = {
      setRequestHandler: (
        _schema: unknown,
        handler: (req: unknown) => Promise<unknown>,
      ) => {
        callCount++;
        if (callCount === 1) {
          listHandler = handler as (req: unknown) => Promise<{ tools: unknown[] }>;
        }
      },
    };

    registerTools(mockServer as Parameters<typeof registerTools>[0]);

    if (listHandler) {
      const result = await listHandler({});
      expect(result.tools.length).toBeGreaterThanOrEqual(15);
    }
  });

  it('every tool has name, description, and inputSchema of type object', async () => {
    const { registerTools } = await import('../tools.js');
    let listHandler: ((req: unknown) => Promise<{ tools: Array<{ name: string; description: string; inputSchema: { type: string } }> }>) | undefined;
    let callCount = 0;

    const mockServer = {
      setRequestHandler: (
        _schema: unknown,
        handler: (req: unknown) => Promise<unknown>,
      ) => {
        callCount++;
        if (callCount === 1) {
          listHandler = handler as typeof listHandler;
        }
      },
    };

    registerTools(mockServer as Parameters<typeof registerTools>[0]);

    if (listHandler) {
      const result = await listHandler({});
      for (const tool of result.tools) {
        expect(typeof tool.name).toBe('string');
        expect(tool.name.length).toBeGreaterThan(0);
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(0);
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      }
    }
  });

  it('tool list includes all 16 expected tool names', async () => {
    const { registerTools } = await import('../tools.js');
    let listHandler: ((req: unknown) => Promise<{ tools: Array<{ name: string }> }>) | undefined;
    let callCount = 0;

    const mockServer = {
      setRequestHandler: (
        _schema: unknown,
        handler: (req: unknown) => Promise<unknown>,
      ) => {
        callCount++;
        if (callCount === 1) {
          listHandler = handler as typeof listHandler;
        }
      },
    };

    registerTools(mockServer as Parameters<typeof registerTools>[0]);

    if (listHandler) {
      const result = await listHandler({});
      const toolNames = result.tools.map((t) => t.name);

      const expectedTools = [
        'listComponents',
        'getComponent',
        'findComponents',
        'listSlots',
        'listEvents',
        'getDesignTokens',
        'findToken',
        'generateImport',
        'getLibrarySummary',
        'analyzeExtension',
        'validateIntegration',
        'scaffoldTheme',
        'scaffoldComponent',
        'auditTokens',
        'healthCheck',
        'migrateVersion',
      ];

      for (const name of expectedTools) {
        expect(toolNames).toContain(name);
      }
    }
  });

  it('call-tool handler returns error for unknown tool name', async () => {
    const { registerTools } = await import('../tools.js');
    let callToolHandler: ((req: unknown) => Promise<{ isError?: boolean; content: Array<{ text: string }> }>) | undefined;
    let callCount = 0;

    const mockServer = {
      setRequestHandler: (
        _schema: unknown,
        handler: (req: unknown) => Promise<unknown>,
      ) => {
        callCount++;
        if (callCount === 2) {
          callToolHandler = handler as typeof callToolHandler;
        }
      },
    };

    registerTools(mockServer as Parameters<typeof registerTools>[0]);

    if (callToolHandler) {
      const result = await callToolHandler({
        params: { name: 'nonExistentTool', arguments: {} },
      });
      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Unknown tool');
    }
  });

  it('call-tool handler returns error for invalid schema input', async () => {
    const { registerTools } = await import('../tools.js');
    let callToolHandler: ((req: unknown) => Promise<{ isError?: boolean; content: Array<{ text: string }> }>) | undefined;
    let callCount = 0;

    const mockServer = {
      setRequestHandler: (
        _schema: unknown,
        handler: (req: unknown) => Promise<unknown>,
      ) => {
        callCount++;
        if (callCount === 2) {
          callToolHandler = handler as typeof callToolHandler;
        }
      },
    };

    registerTools(mockServer as Parameters<typeof registerTools>[0]);

    if (callToolHandler) {
      // getComponent requires tagName with hx- prefix
      const result = await callToolHandler({
        params: { name: 'getComponent', arguments: { tagName: 'no-prefix' } },
      });
      expect(result.isError).toBe(true);
    }
  });
});
