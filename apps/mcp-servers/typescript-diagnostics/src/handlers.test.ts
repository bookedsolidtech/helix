import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MCPError, ErrorCategory } from '@helixui/mcp-shared';
import { DiagnosticCategory } from 'ts-morph';

// Create shared mock objects
const mockFileOps = {
  fileExists: vi.fn(),
  readJSON: vi.fn(),
  validatePath: vi.fn((path: string) => path),
};

// Mock diagnostics
const createMockDiagnostic = (config: {
  file?: string;
  line?: number;
  column?: number;
  message: string;
  category: DiagnosticCategory;
  code: number;
}) => ({
  getSourceFile: () => ({
    getFilePath: () => config.file || '/test/file.ts',
    getLineAndColumnAtPos: () => ({ line: config.line || 1, column: config.column || 0 }),
    getFullText: () => `line 1 content\nline 2 content\nline 3 content`,
  }),
  getStart: () => 0,
  getMessageText: () => ({ toString: () => config.message }),
  getCategory: () => config.category,
  getCode: () => config.code,
});

// Mock ts-morph Project
interface MockDiagnostic {
  getSourceFile: () => unknown;
  getStart: () => number;
  getMessageText: () => { toString: () => string };
  getCategory: () => unknown;
  getCode: () => number;
}

const mockSourceFile = {
  getPreEmitDiagnostics: vi.fn(() => [] as MockDiagnostic[]),
  getFilePath: vi.fn(() => '/test/file.ts'),
  getFullText: vi.fn(() => 'line 1 content\nline 2 content\nline 3 content'),
};

const mockProject = {
  getSourceFile: vi.fn(() => mockSourceFile),
  getPreEmitDiagnostics: vi.fn(() => [] as MockDiagnostic[]),
  getSourceFiles: vi.fn(() => [] as (typeof mockSourceFile)[]),
};

// Mock dependencies BEFORE importing handlers
vi.mock('@helixui/mcp-shared', async () => {
  const actual = await vi.importActual('@helixui/mcp-shared');

  return {
    ...actual,
    SafeFileOperations: vi.fn(() => mockFileOps),
  };
});

vi.mock('ts-morph', () => ({
  Project: vi.fn(() => mockProject),
  DiagnosticCategory: {
    Error: 1,
    Warning: 0,
    Suggestion: 2,
  },
}));

// Import after mocking
const { getDiagnostics, getDiagnosticsForComponent, suggestFix, getStrictModeStatus } =
  await import('./handlers.js');

describe('MCP Server: typescript-diagnostics handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileOps.validatePath.mockImplementation((path: string) => path);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =====================================================
  // getDiagnostics (10 tests)
  // =====================================================
  describe('getDiagnostics', () => {
    describe('File diagnostics happy path', () => {
      it('should return diagnostics for a specific file', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            message: 'Type error',
            category: DiagnosticCategory.Error,
            code: 2322,
            line: 5,
            column: 10,
          }),
        ]);

        const result = await getDiagnostics('/test/file.ts');

        expect(result.totalErrors).toBe(1);
        expect(result.totalWarnings).toBe(0);
        expect(result.diagnostics).toHaveLength(1);
        expect(result.diagnostics[0]?.message).toBe('Type error');
        expect(result.summary).toContain('1 error');
      });

      it('should return warnings and errors separately', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            message: 'Error message',
            category: DiagnosticCategory.Error,
            code: 2322,
          }),
          createMockDiagnostic({
            message: 'Warning message',
            category: DiagnosticCategory.Warning,
            code: 1234,
          }),
          createMockDiagnostic({
            message: 'Suggestion message',
            category: DiagnosticCategory.Suggestion,
            code: 5678,
          }),
        ]);

        const result = await getDiagnostics('/test/file.ts');

        expect(result.totalErrors).toBe(1);
        expect(result.totalWarnings).toBe(2); // warnings + suggestions
        expect(result.diagnostics).toHaveLength(3);
      });

      it('should return success message when no errors', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([]);

        const result = await getDiagnostics('/test/file.ts');

        expect(result.totalErrors).toBe(0);
        expect(result.totalWarnings).toBe(0);
        expect(result.summary).toBe('✅ No TypeScript errors found');
      });
    });

    describe('Project-wide diagnostics', () => {
      it('should return project-wide diagnostics when no file specified', async () => {
        mockProject.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            message: 'Project error 1',
            category: DiagnosticCategory.Error,
            code: 2322,
          }),
          createMockDiagnostic({
            message: 'Project error 2',
            category: DiagnosticCategory.Error,
            code: 2345,
          }),
        ]);

        const result = await getDiagnostics();

        expect(result.totalErrors).toBe(2);
        expect(result.diagnostics).toHaveLength(2);
      });

      it('should handle large project diagnostics', async () => {
        const largeDiagnostics = Array.from({ length: 100 }, (_, i) =>
          createMockDiagnostic({
            message: `Error ${i}`,
            category: DiagnosticCategory.Error,
            code: 2322,
          }),
        );
        mockProject.getPreEmitDiagnostics.mockReturnValue(largeDiagnostics);

        const result = await getDiagnostics();

        expect(result.totalErrors).toBe(100);
        expect(result.diagnostics).toHaveLength(100);
      });
    });

    describe('CRITICAL SECURITY: Path traversal', () => {
      it('should validate file paths and prevent traversal', async () => {
        mockFileOps.validatePath.mockImplementation((path: string) => {
          if (path.includes('..')) {
            throw new MCPError('Path traversal detected', ErrorCategory.Security);
          }
          return path;
        });

        await expect(getDiagnostics('../../etc/passwd')).rejects.toThrow(MCPError);
      });

      it('should reject absolute paths outside project', async () => {
        mockFileOps.validatePath.mockImplementation((path: string) => {
          if (path.startsWith('/etc/') || path.startsWith('/var/')) {
            throw new MCPError('Path outside project root', ErrorCategory.Security);
          }
          return path;
        });

        await expect(getDiagnostics('/etc/passwd')).rejects.toThrow(MCPError);
      });

      it('should normalize paths before validation', async () => {
        mockFileOps.validatePath.mockImplementation((path: string) => {
          if (path.includes('../') || path.includes('..\\')) {
            throw new MCPError('Invalid path', ErrorCategory.Security);
          }
          return path;
        });

        await expect(getDiagnostics('./../../etc/passwd')).rejects.toThrow(MCPError);
      });
    });

    describe('Missing file handling', () => {
      it('should throw error when file cannot be loaded', async () => {
        mockFileOps.validatePath.mockReturnValue('/nonexistent/file.ts');
        mockProject.getSourceFile.mockReturnValue(null as unknown as typeof mockSourceFile);

        await expect(getDiagnostics('/nonexistent/file.ts')).rejects.toThrow(MCPError);
        await expect(getDiagnostics('/nonexistent/file.ts')).rejects.toThrow('Could not load file');
      });
    });
  });

  // =====================================================
  // getDiagnosticsForComponent (9 tests)
  // =====================================================
  describe('getDiagnosticsForComponent', () => {
    describe('Component errors found', () => {
      it('should return diagnostics for component directory', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/components/hx-button');
        mockProject.getSourceFiles.mockReturnValue([
          {
            getPreEmitDiagnostics: vi.fn(() => [
              createMockDiagnostic({
                file: '/test/components/hx-button/index.ts',
                message: 'Component error',
                category: DiagnosticCategory.Error,
                code: 2322,
              }),
            ]),
            getFilePath: vi.fn(() => '/test/components/hx-button/index.ts'),
            getFullText: vi.fn(() => ''),
          },
        ]);

        const result = await getDiagnosticsForComponent('hx-button');

        expect(result.totalErrors).toBe(1);
        expect(result.summary).toContain('1 error');
      });

      it('should aggregate errors from multiple files', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/components/hx-button');
        mockProject.getSourceFiles.mockReturnValue([
          {
            getPreEmitDiagnostics: vi.fn(() => [
              createMockDiagnostic({
                message: 'Error in file 1',
                category: DiagnosticCategory.Error,
                code: 2322,
              }),
            ]),
            getFilePath: vi.fn(() => '/test/file1.ts'),
            getFullText: vi.fn(() => ''),
          },
          {
            getPreEmitDiagnostics: vi.fn(() => [
              createMockDiagnostic({
                message: 'Error in file 2',
                category: DiagnosticCategory.Error,
                code: 2345,
              }),
            ]),
            getFilePath: vi.fn(() => '/test/file2.ts'),
            getFullText: vi.fn(() => ''),
          },
        ]);

        const result = await getDiagnosticsForComponent('hx-button');

        expect(result.totalErrors).toBe(2);
      });

      it('should include line and column information', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/components/hx-button');
        mockProject.getSourceFiles.mockReturnValue([
          {
            getPreEmitDiagnostics: vi.fn(() => [
              createMockDiagnostic({
                line: 42,
                column: 15,
                message: 'Error at specific location',
                category: DiagnosticCategory.Error,
                code: 2322,
              }),
            ]),
            getFilePath: vi.fn(() => '/test/file.ts'),
            getFullText: vi.fn(() => ''),
          },
        ]);

        const result = await getDiagnosticsForComponent('hx-button');

        expect(result.diagnostics[0]?.line).toBe(42);
        expect(result.diagnostics[0]?.column).toBe(15);
      });
    });

    describe('Missing component directory', () => {
      it('should throw error when component has no TypeScript files', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/components/hx-missing');
        mockProject.getSourceFiles.mockReturnValue([]);

        await expect(getDiagnosticsForComponent('hx-missing')).rejects.toThrow(MCPError);
        await expect(getDiagnosticsForComponent('hx-missing')).rejects.toThrow(
          'No TypeScript files found',
        );
      });

      it('should validate component path', async () => {
        mockFileOps.validatePath.mockImplementation((path: string) => {
          if (path.includes('..')) {
            throw new MCPError('Invalid path', ErrorCategory.Security);
          }
          return path;
        });

        await expect(getDiagnosticsForComponent('../../../etc')).rejects.toThrow(MCPError);
      });
    });

    describe('Multiple files in component', () => {
      it('should scan all TypeScript files in component', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/components/hx-button');
        mockProject.getSourceFiles.mockReturnValue([
          {
            getPreEmitDiagnostics: vi.fn(() => []),
            getFilePath: vi.fn(() => '/test/components/hx-button/index.ts'),
            getFullText: vi.fn(() => ''),
          },
          {
            getPreEmitDiagnostics: vi.fn(() => []),
            getFilePath: vi.fn(() => '/test/components/hx-button/styles.ts'),
            getFullText: vi.fn(() => ''),
          },
          {
            getPreEmitDiagnostics: vi.fn(() => []),
            getFilePath: vi.fn(() => '/test/components/hx-button/types.ts'),
            getFullText: vi.fn(() => ''),
          },
        ]);

        const result = await getDiagnosticsForComponent('hx-button');

        expect(result.summary).toContain('No TypeScript errors');
      });

      it('should report success when no errors in any file', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/components/hx-button');
        mockProject.getSourceFiles.mockReturnValue([
          {
            getPreEmitDiagnostics: vi.fn(() => []),
            getFilePath: vi.fn(() => '/test/file1.ts'),
            getFullText: vi.fn(() => ''),
          },
          {
            getPreEmitDiagnostics: vi.fn(() => []),
            getFilePath: vi.fn(() => '/test/file2.ts'),
            getFullText: vi.fn(() => ''),
          },
        ]);

        const result = await getDiagnosticsForComponent('hx-button');

        expect(result.totalErrors).toBe(0);
        expect(result.summary).toBe('✅ No TypeScript errors in hx-button');
      });
    });

    describe('Empty component directory', () => {
      it('should handle component with only test files', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/components/hx-button');
        mockProject.getSourceFiles.mockReturnValue([]);

        await expect(getDiagnosticsForComponent('hx-button')).rejects.toThrow(
          'No TypeScript files found',
        );
      });

      it('should categorize as UserInput error', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/components/hx-empty');
        mockProject.getSourceFiles.mockReturnValue([]);

        try {
          await getDiagnosticsForComponent('hx-empty');
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(MCPError);
          expect((error as MCPError).category).toBe(ErrorCategory.UserInput);
        }
      });
    });
  });

  // =====================================================
  // suggestFix (8 tests)
  // =====================================================
  describe('suggestFix', () => {
    describe('Valid fix suggestions', () => {
      it('should suggest fix for type assignment error', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockProject.getSourceFile.mockReturnValue(mockSourceFile);
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            line: 5,
            message: "Type 'string' is not assignable to type 'number'",
            category: DiagnosticCategory.Error,
            code: 2322,
          }),
        ]);

        const result = await suggestFix('/test/file.ts', 5);

        expect(result.line).toBe(5);
        expect(result.suggestion).toContain('type compatibility');
        expect(result.codeSnippet).toBeDefined();
      });

      it('should suggest fix for implicit any error', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockProject.getSourceFile.mockReturnValue(mockSourceFile);
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            line: 3,
            message: "Parameter 'x' implicitly has an 'any' type",
            category: DiagnosticCategory.Error,
            code: 7006,
          }),
        ]);

        const result = await suggestFix('/test/file.ts', 3);

        expect(result.suggestion).toContain('explicit type annotation');
      });
    });

    describe('No fix available', () => {
      it('should handle no diagnostics at specified line', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockProject.getSourceFile.mockReturnValue(mockSourceFile);
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            line: 5,
            message: 'Error',
            category: DiagnosticCategory.Error,
            code: 2322,
          }),
        ]);

        await expect(suggestFix('/test/file.ts', 10)).rejects.toThrow(MCPError);
        await expect(suggestFix('/test/file.ts', 10)).rejects.toThrow(
          'No TypeScript errors found at line',
        );
      });

      it('should return generic message for unknown error code', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockProject.getSourceFile.mockReturnValue(mockSourceFile);
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            line: 2,
            message: 'Unknown error',
            category: DiagnosticCategory.Error,
            code: 9999,
          }),
        ]);

        const result = await suggestFix('/test/file.ts', 2);

        expect(result.suggestion).toBe('No automatic fix available');
      });
    });

    describe('Multiple fixes for same line', () => {
      it('should return first diagnostic when multiple on same line', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockProject.getSourceFile.mockReturnValue(mockSourceFile);
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            line: 5,
            message: 'First error',
            category: DiagnosticCategory.Error,
            code: 2322,
          }),
          createMockDiagnostic({
            line: 5,
            message: 'Second error',
            category: DiagnosticCategory.Error,
            code: 2345,
          }),
        ]);

        const result = await suggestFix('/test/file.ts', 5);

        expect(result.error).toBe('First error');
      });

      it('should include code snippet from file', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        const mockDiagnostic = createMockDiagnostic({
          line: 2,
          message: 'Error',
          category: DiagnosticCategory.Error,
          code: 2322,
        });
        mockDiagnostic.getSourceFile = () => ({
          getFilePath: () => '/test/file.ts',
          getLineAndColumnAtPos: () => ({ line: 2, column: 0 }),
          getFullText: () => 'line 1\nconst x: string = 42;\nline 3',
        });
        const mockSF = {
          getPreEmitDiagnostics: vi.fn(() => [mockDiagnostic]),
          getFilePath: vi.fn(() => '/test/file.ts'),
          getFullText: vi.fn(() => 'line 1\nconst x: string = 42;\nline 3'),
        };
        mockProject.getSourceFile.mockReturnValue(mockSF);

        const result = await suggestFix('/test/file.ts', 2);

        expect(result.codeSnippet).toBe('const x: string = 42;');
      });
    });

    describe('Error code to suggestion mapping', () => {
      it('should suggest fix for missing name error (2304)', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockProject.getSourceFile.mockReturnValue(mockSourceFile);
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            line: 1,
            message: "Cannot find name 'foo'",
            category: DiagnosticCategory.Error,
            code: 2304,
          }),
        ]);

        const result = await suggestFix('/test/file.ts', 1);

        expect(result.suggestion).toContain('Import the missing name');
      });

      it('should suggest fix for property not exist error (2339)', async () => {
        mockFileOps.validatePath.mockReturnValue('/test/file.ts');
        mockProject.getSourceFile.mockReturnValue(mockSourceFile);
        mockSourceFile.getPreEmitDiagnostics.mockReturnValue([
          createMockDiagnostic({
            line: 1,
            message: "Property 'foo' does not exist on type 'Bar'",
            category: DiagnosticCategory.Error,
            code: 2339,
          }),
        ]);

        const result = await suggestFix('/test/file.ts', 1);

        expect(result.suggestion).toContain('Add the missing property');
      });
    });
  });

  // =====================================================
  // getStrictModeStatus (8 tests)
  // =====================================================
  describe('getStrictModeStatus', () => {
    describe('Strict mode enabled', () => {
      it('should return enabled when strict flag is true', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          compilerOptions: {
            strict: true,
          },
        });

        const result = await getStrictModeStatus();

        expect(result.enabled).toBe(true);
        expect(result.flags.strict).toBe(true);
        expect(result.missingFlags).toHaveLength(0);
      });

      it('should return all strict flags when strict is true', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          compilerOptions: {
            strict: true,
            noImplicitAny: true,
            strictNullChecks: true,
          },
        });

        const result = await getStrictModeStatus();

        expect(result.flags.strict).toBe(true);
        expect(result.enabled).toBe(true);
      });
    });

    describe('Strict mode disabled', () => {
      it('should return disabled when strict flag is false', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          compilerOptions: {
            strict: false,
          },
        });

        const result = await getStrictModeStatus();

        expect(result.enabled).toBe(false);
        expect(result.missingFlags.length).toBeGreaterThan(0);
      });

      it('should list all missing strict flags', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          compilerOptions: {
            strict: false,
          },
        });

        const result = await getStrictModeStatus();

        expect(result.missingFlags).toContain('noImplicitAny');
        expect(result.missingFlags).toContain('strictNullChecks');
        expect(result.missingFlags).toContain('strictFunctionTypes');
        expect(result.missingFlags).toContain('strictBindCallApply');
        expect(result.missingFlags).toContain('strictPropertyInitialization');
        expect(result.missingFlags).toContain('noImplicitThis');
        expect(result.missingFlags).toContain('alwaysStrict');
      });
    });

    describe('Missing tsconfig.json', () => {
      it('should throw error when tsconfig.json not found', async () => {
        mockFileOps.fileExists.mockReturnValue(false);

        await expect(getStrictModeStatus()).rejects.toThrow(MCPError);
        await expect(getStrictModeStatus()).rejects.toThrow('tsconfig.base.json not found');
      });

      it('should categorize as UserInput error', async () => {
        mockFileOps.fileExists.mockReturnValue(false);

        try {
          await getStrictModeStatus();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(MCPError);
          expect((error as MCPError).category).toBe(ErrorCategory.UserInput);
        }
      });
    });

    describe('Partial strict flags', () => {
      it('should detect enabled without strict flag when all individual flags set', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          compilerOptions: {
            noImplicitAny: true,
            strictNullChecks: true,
            strictFunctionTypes: true,
            strictBindCallApply: true,
            strictPropertyInitialization: true,
            noImplicitThis: true,
            alwaysStrict: true,
          },
        });

        const result = await getStrictModeStatus();

        expect(result.enabled).toBe(true);
        expect(result.missingFlags).toHaveLength(0);
      });

      it('should list only missing flags when some are set', async () => {
        mockFileOps.fileExists.mockReturnValue(true);
        mockFileOps.readJSON.mockReturnValue({
          compilerOptions: {
            noImplicitAny: true,
            strictNullChecks: true,
          },
        });

        const result = await getStrictModeStatus();

        expect(result.enabled).toBe(false);
        expect(result.missingFlags).not.toContain('noImplicitAny');
        expect(result.missingFlags).not.toContain('strictNullChecks');
        expect(result.missingFlags).toContain('strictFunctionTypes');
        expect(result.missingFlags.length).toBeGreaterThan(0);
      });
    });
  });
});
