import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { registerHealthTools } from './tools.js';

// Mock handlers
vi.mock('./handlers.js', () => ({
  scoreComponent: vi.fn(),
  scoreAllComponents: vi.fn(),
  getHealthTrend: vi.fn(),
  getHealthDiff: vi.fn(),
}));

const { scoreComponent, scoreAllComponents, getHealthTrend, getHealthDiff } =
  await import('./handlers.js');

describe('Tool Registration - health-scorer', () => {
  let server: Server;

  beforeEach(() => {
    server = new Server(
      { name: '@helixui/mcp-health-scorer', version: '0.1.0' },
      { capabilities: { tools: {} } },
    );
    registerHealthTools(server);
    vi.clearAllMocks();
  });

  describe('ListTools', () => {
    it('returns all 4 tools', async () => {
      const request = ListToolsRequestSchema.parse({
        method: 'tools/list',
        params: {},
      });

      // @ts-expect-error - internal method
      const response = await server._requestHandlers.get('tools/list')?.(request);

      expect(response.tools).toHaveLength(4);
    });

    it('tool schemas are valid', async () => {
      const request = ListToolsRequestSchema.parse({
        method: 'tools/list',
        params: {},
      });

      // @ts-expect-error - internal method
      const response = await server._requestHandlers.get('tools/list')?.(request);

      response.tools.forEach(
        (tool: { name: string; description: string; inputSchema: { type: string } }) => {
          expect(tool.name).toBeDefined();
          expect(tool.description).toBeDefined();
          expect(tool.inputSchema).toBeDefined();
          expect(tool.inputSchema.type).toBe('object');
        },
      );
    });

    it('includes correct tool names', async () => {
      const request = ListToolsRequestSchema.parse({
        method: 'tools/list',
        params: {},
      });

      // @ts-expect-error - internal method
      const response = await server._requestHandlers.get('tools/list')?.(request);

      const toolNames = response.tools.map((t: { name: string }) => t.name);
      expect(toolNames).toContain('scoreComponent');
      expect(toolNames).toContain('scoreAllComponents');
      expect(toolNames).toContain('getHealthTrend');
      expect(toolNames).toContain('getHealthDiff');
    });
  });

  describe('scoreComponent - Argument Validation', () => {
    it('accepts valid arguments and calls handler', async () => {
      vi.mocked(scoreComponent).mockResolvedValue({
        tagName: 'hx-button',
        score: 100,
        grade: 'A',
        dimensions: {},
        issues: [],
        timestamp: '2026-02-21T00:00:00.000Z',
      });

      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'scoreComponent',
          arguments: { tagName: 'hx-button' },
        },
      });

      // @ts-expect-error - internal method
      await server._requestHandlers.get('tools/call')?.(request);

      expect(vi.mocked(scoreComponent)).toHaveBeenCalledWith('hx-button');
    });

    it('rejects missing required arguments', async () => {
      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'scoreComponent',
          arguments: {},
        },
      });

      // @ts-expect-error - internal method
      const response = await server._requestHandlers.get('tools/call')?.(request);

      expect(response.isError).toBe(true);
      expect(response.content[0]?.text).toContain('Invalid arguments');
    });

    it('rejects invalid tagName pattern', async () => {
      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'scoreComponent',
          arguments: { tagName: 'invalid-component' },
        },
      });

      // @ts-expect-error - internal method
      const response = await server._requestHandlers.get('tools/call')?.(request);

      expect(response.isError).toBe(true);
    });
  });

  describe('scoreAllComponents', () => {
    it('accepts empty arguments', async () => {
      vi.mocked(scoreAllComponents).mockResolvedValue([]);

      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'scoreAllComponents',
          arguments: {},
        },
      });

      // @ts-expect-error - internal method
      await server._requestHandlers.get('tools/call')?.(request);

      expect(vi.mocked(scoreAllComponents)).toHaveBeenCalled();
    });

    it('returns array data', async () => {
      const mockScores = [
        {
          tagName: 'hx-button',
          score: 100,
          grade: 'A' as const,
          dimensions: {},
          issues: [],
          timestamp: '2026-02-21T00:00:00.000Z',
        },
        {
          tagName: 'hx-card',
          score: 95,
          grade: 'A' as const,
          dimensions: {},
          issues: [],
          timestamp: '2026-02-21T00:00:00.000Z',
        },
      ];
      vi.mocked(scoreAllComponents).mockResolvedValue(mockScores);

      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'scoreAllComponents',
          arguments: {},
        },
      });

      // @ts-expect-error - internal method
      const response = await server._requestHandlers.get('tools/call')?.(request);

      expect(response.content[0]?.text).toContain('hx-button');
      expect(response.content[0]?.text).toContain('hx-card');
    });
  });

  describe('getHealthTrend', () => {
    it('accepts valid arguments with days parameter', async () => {
      vi.mocked(getHealthTrend).mockResolvedValue({
        tagName: 'hx-button',
        days: 14,
        dataPoints: [],
        trend: 'stable',
        changePercent: 0,
      });

      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'getHealthTrend',
          arguments: { tagName: 'hx-button', days: 14 },
        },
      });

      // @ts-expect-error - internal method
      await server._requestHandlers.get('tools/call')?.(request);

      expect(vi.mocked(getHealthTrend)).toHaveBeenCalledWith('hx-button', 14);
    });

    it('uses default days when not provided', async () => {
      vi.mocked(getHealthTrend).mockResolvedValue({
        tagName: 'hx-button',
        days: 7,
        dataPoints: [],
        trend: 'stable',
        changePercent: 0,
      });

      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'getHealthTrend',
          arguments: { tagName: 'hx-button' },
        },
      });

      // @ts-expect-error - internal method
      await server._requestHandlers.get('tools/call')?.(request);

      expect(vi.mocked(getHealthTrend)).toHaveBeenCalledWith('hx-button', 7);
    });

    it('rejects negative days', async () => {
      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'getHealthTrend',
          arguments: { tagName: 'hx-button', days: -1 },
        },
      });

      // @ts-expect-error - internal method
      const response = await server._requestHandlers.get('tools/call')?.(request);

      expect(response.isError).toBe(true);
    });
  });

  describe('getHealthDiff', () => {
    it('accepts valid arguments with baseBranch', async () => {
      vi.mocked(getHealthDiff).mockResolvedValue({
        tagName: 'hx-button',
        base: {
          tagName: 'hx-button',
          score: 90,
          grade: 'A',
          dimensions: {},
          issues: [],
          timestamp: '2026-02-20T00:00:00.000Z',
        },
        current: {
          tagName: 'hx-button',
          score: 95,
          grade: 'A',
          dimensions: {},
          issues: [],
          timestamp: '2026-02-21T00:00:00.000Z',
        },
        improved: true,
        regressed: false,
        scoreDelta: 5,
        changedDimensions: [],
      });

      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'getHealthDiff',
          arguments: { tagName: 'hx-button', baseBranch: 'develop' },
        },
      });

      // @ts-expect-error - internal method
      await server._requestHandlers.get('tools/call')?.(request);

      expect(vi.mocked(getHealthDiff)).toHaveBeenCalledWith('hx-button', 'develop');
    });

    it('uses default baseBranch when not provided', async () => {
      vi.mocked(getHealthDiff).mockResolvedValue({
        tagName: 'hx-button',
        base: {
          tagName: 'hx-button',
          score: 90,
          grade: 'A',
          dimensions: {},
          issues: [],
          timestamp: '2026-02-20T00:00:00.000Z',
        },
        current: {
          tagName: 'hx-button',
          score: 90,
          grade: 'A',
          dimensions: {},
          issues: [],
          timestamp: '2026-02-21T00:00:00.000Z',
        },
        improved: false,
        regressed: false,
        scoreDelta: 0,
        changedDimensions: [],
      });

      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'getHealthDiff',
          arguments: { tagName: 'hx-button' },
        },
      });

      // @ts-expect-error - internal method
      await server._requestHandlers.get('tools/call')?.(request);

      expect(vi.mocked(getHealthDiff)).toHaveBeenCalledWith('hx-button', 'main');
    });

    it('formats improvement message correctly', async () => {
      vi.mocked(getHealthDiff).mockResolvedValue({
        tagName: 'hx-button',
        base: {
          tagName: 'hx-button',
          score: 80,
          grade: 'B' as const,
          dimensions: {},
          issues: [],
          timestamp: '2026-02-20T00:00:00.000Z',
        },
        current: {
          tagName: 'hx-button',
          score: 95,
          grade: 'A' as const,
          dimensions: {},
          issues: [],
          timestamp: '2026-02-21T00:00:00.000Z',
        },
        improved: true,
        regressed: false,
        scoreDelta: 15,
        changedDimensions: [],
      });

      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'getHealthDiff',
          arguments: { tagName: 'hx-button' },
        },
      });

      // @ts-expect-error - internal method
      const response = await server._requestHandlers.get('tools/call')?.(request);

      expect(response.content[0]?.text).toContain('HEALTH IMPROVED');
      expect(response.content[0]?.text).toContain('95');
      expect(response.content[0]?.text).toContain('80');
    });
  });

  describe('Unknown tool handling', () => {
    it('returns error for unknown tool', async () => {
      const request = CallToolRequestSchema.parse({
        method: 'tools/call',
        params: {
          name: 'unknownTool',
          arguments: {},
        },
      });

      // @ts-expect-error - internal method
      const response = await server._requestHandlers.get('tools/call')?.(request);

      expect(response.isError).toBe(true);
      expect(response.content[0]?.text).toContain('Unknown tool');
    });
  });
});
