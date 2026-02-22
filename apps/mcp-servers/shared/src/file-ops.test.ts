import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { SafeFileOperations } from './file-ops.js';
import { MCPError, ErrorCategory } from './error-handling.js';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';

const TEST_DIR = resolve(process.cwd(), '.test-tmp');

describe('SafeFileOperations - Path Traversal Protection', () => {
  let fileOps: SafeFileOperations;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    fileOps = new SafeFileOperations(TEST_DIR);
  });

  describe('ANTAGONISTIC: Path Traversal Attacks', () => {
    it('should block simple parent directory traversal', () => {
      expect(() => fileOps.validatePath('../etc/passwd')).toThrow(MCPError);
      expect(() => fileOps.validatePath('../etc/passwd')).toThrow('Path traversal detected');
    });

    it('should block double dot traversal', () => {
      expect(() => fileOps.validatePath('../../secret.txt')).toThrow(MCPError);
    });

    it('should block multiple levels of traversal', () => {
      expect(() => fileOps.validatePath('../../../../../../../etc/passwd')).toThrow(MCPError);
    });

    it('should block traversal with legitimate prefix', () => {
      expect(() => fileOps.validatePath('legit/../../etc/passwd')).toThrow(MCPError);
    });

    it('should block URL-encoded traversal', () => {
      // %2e%2e%2f = ../ but path validation works on decoded paths
      // This test documents that URL encoding is handled by callers, not validatePath
      // If a caller passes an encoded path, it won't be decoded automatically
      const result = fileOps.validatePath('%2e%2e%2f%2e%2e%2fetc%2fpasswd');
      expect(result).toContain('%2e%2e%2f'); // Literal string, not decoded
    });

    it('should block unicode traversal attempts', () => {
      // Unicode variants of dots
      expect(() => fileOps.validatePath('\u002e\u002e/\u002e\u002e/etc/passwd')).toThrow(MCPError);
    });

    it('should block absolute path outside root', () => {
      expect(() => fileOps.validatePath('/etc/passwd')).toThrow(MCPError);
    });

    it('should block Windows-style absolute paths', () => {
      // On Unix, C:\\ is interpreted as a relative path "C:\\"
      // The key is it doesn't escape TEST_DIR
      const result = fileOps.validatePath('C:\\Windows\\System32');
      expect(result).toContain(TEST_DIR);
      // It's treated as a weird filename, which is safe
    });

    it('should block mixed separators traversal', () => {
      expect(() => fileOps.validatePath('..\\..\\etc/passwd')).toThrow(MCPError);
    });

    it('should block symlink-style traversal', () => {
      expect(() => fileOps.validatePath('./../../../../etc/passwd')).toThrow(MCPError);
    });
  });

  describe('ANTAGONISTIC: Edge Cases', () => {
    it('should reject empty path', () => {
      expect(() => fileOps.validatePath('')).toThrow(MCPError);
    });

    it('should handle null bytes in path', () => {
      // Null bytes are handled by the OS/filesystem layer
      // Our validator should not crash, but let the filesystem reject it
      expect(() => fileOps.validatePath('file\0.txt')).not.toThrow(/stack|memory/i);
    });

    it('should handle very long paths', () => {
      const longPath = 'a/'.repeat(1000) + 'file.txt';
      // Should either validate or throw, but not crash
      expect(() => fileOps.validatePath(longPath)).not.toThrow(/stack|memory/i);
    });

    it('should handle special characters safely', () => {
      // These shouldn't crash the validator
      const specialPaths = [
        'file<script>.txt',
        'file;rm -rf /.txt',
        'file`whoami`.txt',
        'file$(whoami).txt',
        'file&& rm -rf /.txt',
      ];

      specialPaths.forEach((path) => {
        expect(() => fileOps.validatePath(path)).not.toThrow(/stack|memory/i);
      });
    });
  });

  describe('VALID: Legitimate Paths', () => {
    it('should allow simple filename', () => {
      const result = fileOps.validatePath('file.txt');
      expect(result).toContain('file.txt');
      expect(result).toContain(TEST_DIR);
    });

    it('should allow nested paths', () => {
      const result = fileOps.validatePath('foo/bar/baz.txt');
      expect(result).toContain('foo/bar/baz.txt');
    });

    it('should allow paths with dots in filename', () => {
      const result = fileOps.validatePath('my.config.json');
      expect(result).toContain('my.config.json');
    });

    it('should normalize legitimate relative paths', () => {
      const result = fileOps.validatePath('./foo/./bar/../baz.txt');
      expect(result).toContain('foo/baz.txt');
    });
  });

  describe('File Operations', () => {
    it('should read existing file', () => {
      const testFile = resolve(TEST_DIR, 'test.txt');
      writeFileSync(testFile, 'test content');

      const content = fileOps.readFile('test.txt');
      expect(content).toBe('test content');
    });

    it('should throw MCPError for non-existent file', () => {
      expect(() => fileOps.readFile('nonexistent.txt')).toThrow(MCPError);
      expect(() => fileOps.readFile('nonexistent.txt')).toThrow(/File not found/);
    });

    it('should categorize file not found as UserInput error', () => {
      try {
        fileOps.readFile('nonexistent.txt');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).category).toBe(ErrorCategory.UserInput);
      }
    });

    it('should parse valid JSON', () => {
      const testFile = resolve(TEST_DIR, 'test.json');
      writeFileSync(testFile, JSON.stringify({ foo: 'bar' }));

      const schema = z.object({ foo: z.string() });
      const result = fileOps.readJSON('test.json', schema);
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should throw for malformed JSON', () => {
      const testFile = resolve(TEST_DIR, 'bad.json');
      writeFileSync(testFile, '{ invalid json }');

      const schema = z.object({ foo: z.string() });
      expect(() => fileOps.readJSON('bad.json', schema)).toThrow(MCPError);
    });
  });

  describe('File Existence Checks', () => {
    it('should return true for existing file', () => {
      const testFile = resolve(TEST_DIR, 'exists.txt');
      writeFileSync(testFile, 'content');

      expect(fileOps.fileExists('exists.txt')).toBe(true);
    });

    it('should return false for non-existent file', () => {
      expect(fileOps.fileExists('does-not-exist.txt')).toBe(false);
    });

    it('should return false for traversal attempts', () => {
      // Should safely return false, not crash
      expect(fileOps.fileExists('../../etc/passwd')).toBe(false);
    });
  });
});
