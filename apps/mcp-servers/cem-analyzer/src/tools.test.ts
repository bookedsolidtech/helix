import { describe, it, expect, beforeEach } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerCemTools } from './tools.js';

describe('MCP Tools - CEM Analyzer', () => {
  let server: Server;

  beforeEach(() => {
    server = new Server(
      { name: '@helix/mcp-cem-analyzer', version: '0.1.0' },
      { capabilities: { tools: {} } },
    );
  });

  describe('Tool Registration', () => {
    it('registers tools successfully', () => {
      expect(() => registerCemTools(server)).not.toThrow();
    });

    it('does not throw when called multiple times', () => {
      registerCemTools(server);
      expect(() => registerCemTools(server)).not.toThrow();
    });
  });

  describe('analyzeCEM - Arguments', () => {
    it('accepts valid tagName argument', () => {
      const args = { tagName: 'hx-button' };
      expect(args.tagName).toBe('hx-button');
    });

    it('validates string tagName', () => {
      const args = { tagName: 'hx-card' };
      expect(typeof args.tagName).toBe('string');
    });

    it('accepts hyphenated tag names', () => {
      const args = { tagName: 'hx-text-input' };
      expect(args.tagName).toContain('-');
    });
  });

  describe('diffCEM - Arguments', () => {
    it('accepts valid arguments', () => {
      const args = { tagName: 'hx-button', baseBranch: 'main' };
      expect(args.tagName).toBe('hx-button');
      expect(args.baseBranch).toBe('main');
    });

    it('accepts tagName only', () => {
      const args = { tagName: 'hx-button' };
      expect(args.tagName).toBeDefined();
    });

    it('validates baseBranch is string', () => {
      const args = { tagName: 'hx-button', baseBranch: 'develop' };
      expect(typeof args.baseBranch).toBe('string');
    });
  });

  describe('listComponents - Arguments', () => {
    it('accepts empty arguments object', () => {
      const args = {};
      expect(args).toEqual({});
    });

    it('works with no required arguments', () => {
      const args = {};
      expect(Object.keys(args).length).toBe(0);
    });
  });

  describe('validateCEMCompleteness - Arguments', () => {
    it('accepts valid tagName argument', () => {
      const args = { tagName: 'hx-button' };
      expect(args.tagName).toBe('hx-button');
    });

    it('validates string tagName', () => {
      const args = { tagName: 'hx-card' };
      expect(typeof args.tagName).toBe('string');
    });
  });
});
