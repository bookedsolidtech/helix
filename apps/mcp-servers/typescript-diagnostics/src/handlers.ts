import { Project, DiagnosticCategory } from 'ts-morph';
import { resolve } from 'node:path';
import { z } from 'zod';
import { SafeFileOperations, MCPError, ErrorCategory } from '@helixui/mcp-shared';

const PROJECT_ROOT = resolve(process.cwd(), '../..');
const TSCONFIG_PATH = resolve(PROJECT_ROOT, 'tsconfig.base.json');

const fileOps = new SafeFileOperations(PROJECT_ROOT);

interface TypeScriptDiagnostic {
  file: string;
  line: number;
  column: number;
  message: string;
  category: 'error' | 'warning' | 'suggestion';
  code: number;
}

interface DiagnosticsResult {
  totalErrors: number;
  totalWarnings: number;
  diagnostics: TypeScriptDiagnostic[];
  summary: string;
}

interface FixSuggestion {
  file: string;
  line: number;
  error: string;
  suggestion: string;
  codeSnippet?: string;
}

interface StrictModeStatus {
  enabled: boolean;
  flags: {
    strict?: boolean | undefined;
    noImplicitAny?: boolean | undefined;
    strictNullChecks?: boolean | undefined;
    strictFunctionTypes?: boolean | undefined;
    strictBindCallApply?: boolean | undefined;
    strictPropertyInitialization?: boolean | undefined;
    noImplicitThis?: boolean | undefined;
    alwaysStrict?: boolean | undefined;
  };
  missingFlags: string[];
}

export async function getDiagnostics(filePath?: string): Promise<DiagnosticsResult> {
  const project = new Project({
    tsConfigFilePath: TSCONFIG_PATH,
    skipAddingFilesFromTsConfig: false,
  });

  let diagnostics;

  if (filePath) {
    const absolutePath = fileOps.validatePath(filePath);

    const sourceFile = project.getSourceFile(absolutePath);
    if (!sourceFile) {
      throw new MCPError(`Could not load file: ${filePath}`, ErrorCategory.UserInput);
    }

    diagnostics = sourceFile.getPreEmitDiagnostics();
  } else {
    diagnostics = project.getPreEmitDiagnostics();
  }

  const errors: TypeScriptDiagnostic[] = [];
  const warnings: TypeScriptDiagnostic[] = [];

  for (const diagnostic of diagnostics) {
    const file = diagnostic.getSourceFile()?.getFilePath() || 'unknown';
    const start = diagnostic.getStart();
    const sourceFile = diagnostic.getSourceFile();
    const lineAndColumn = sourceFile?.getLineAndColumnAtPos(start || 0);

    const category =
      diagnostic.getCategory() === DiagnosticCategory.Error
        ? 'error'
        : diagnostic.getCategory() === DiagnosticCategory.Warning
          ? 'warning'
          : 'suggestion';

    const diag: TypeScriptDiagnostic = {
      file: file.replace(PROJECT_ROOT, ''),
      line: lineAndColumn?.line || 0,
      column: lineAndColumn?.column || 0,
      message: diagnostic.getMessageText()?.toString() || '',
      category,
      code: diagnostic.getCode(),
    };

    if (category === 'error') {
      errors.push(diag);
    } else {
      warnings.push(diag);
    }
  }

  return {
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    diagnostics: [...errors, ...warnings],
    summary:
      errors.length === 0
        ? '✅ No TypeScript errors found'
        : `❌ Found ${errors.length} error(s) and ${warnings.length} warning(s)`,
  };
}

export async function getDiagnosticsForComponent(tagName: string): Promise<DiagnosticsResult> {
  const componentDir = `packages/hx-library/src/components/${tagName}`;
  const absolutePath = fileOps.validatePath(componentDir);

  const project = new Project({
    tsConfigFilePath: TSCONFIG_PATH,
    skipAddingFilesFromTsConfig: false,
  });

  // Get all TypeScript files in the component directory
  const componentFiles = project.getSourceFiles(`${absolutePath}/**/*.ts`);

  if (componentFiles.length === 0) {
    throw new MCPError(
      `No TypeScript files found for component: ${tagName}`,
      ErrorCategory.UserInput,
    );
  }

  const errors: TypeScriptDiagnostic[] = [];
  const warnings: TypeScriptDiagnostic[] = [];

  for (const sourceFile of componentFiles) {
    const diagnostics = sourceFile.getPreEmitDiagnostics();

    for (const diagnostic of diagnostics) {
      const file = diagnostic.getSourceFile()?.getFilePath() || 'unknown';
      const start = diagnostic.getStart();
      const lineAndColumn = diagnostic.getSourceFile()?.getLineAndColumnAtPos(start || 0);

      const category =
        diagnostic.getCategory() === DiagnosticCategory.Error
          ? 'error'
          : diagnostic.getCategory() === DiagnosticCategory.Warning
            ? 'warning'
            : 'suggestion';

      const diag: TypeScriptDiagnostic = {
        file: file.replace(PROJECT_ROOT, ''),
        line: lineAndColumn?.line || 0,
        column: lineAndColumn?.column || 0,
        message: diagnostic.getMessageText()?.toString() || '',
        category,
        code: diagnostic.getCode(),
      };

      if (category === 'error') {
        errors.push(diag);
      } else {
        warnings.push(diag);
      }
    }
  }

  return {
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    diagnostics: [...errors, ...warnings],
    summary:
      errors.length === 0
        ? `✅ No TypeScript errors in ${tagName}`
        : `❌ Found ${errors.length} error(s) in ${tagName}`,
  };
}

export async function suggestFix(filePath: string, line: number): Promise<FixSuggestion> {
  const absolutePath = fileOps.validatePath(filePath);

  const project = new Project({
    tsConfigFilePath: TSCONFIG_PATH,
    skipAddingFilesFromTsConfig: false,
  });

  const sourceFile = project.getSourceFile(absolutePath);
  if (!sourceFile) {
    throw new MCPError(`Could not load file: ${filePath}`, ErrorCategory.UserInput);
  }

  // Get diagnostics at the specific line
  const diagnostics = sourceFile.getPreEmitDiagnostics();
  const lineDiagnostics = diagnostics.filter((d) => {
    const start = d.getStart();
    const lineAndColumn = d.getSourceFile()?.getLineAndColumnAtPos(start || 0);
    return lineAndColumn?.line === line;
  });

  if (lineDiagnostics.length === 0) {
    throw new MCPError(
      `No TypeScript errors found at line ${line} in ${filePath}`,
      ErrorCategory.UserInput,
    );
  }

  const diagnostic = lineDiagnostics[0];
  if (!diagnostic) {
    throw new MCPError(`Could not retrieve diagnostic at line ${line}`, ErrorCategory.System);
  }

  const messageText = diagnostic.getMessageText()?.toString() || '';

  // Get code snippet at the line
  const lines = sourceFile.getFullText().split('\n');
  const codeSnippet = lines[line - 1] || '';

  // Basic suggestion logic based on error code
  let suggestion = 'No automatic fix available';

  const code = diagnostic.getCode();

  // Common TypeScript error codes and suggestions
  if (code === 2322) {
    // Type 'X' is not assignable to type 'Y'
    suggestion =
      'Check type compatibility. Consider using type assertions or updating the type definition.';
  } else if (code === 2345) {
    // Argument of type 'X' is not assignable to parameter of type 'Y'
    suggestion = 'Verify argument types match the function parameter types.';
  } else if (code === 2304) {
    // Cannot find name 'X'
    suggestion = 'Import the missing name or check for typos in the identifier.';
  } else if (code === 2339) {
    // Property 'X' does not exist on type 'Y'
    suggestion = 'Add the missing property to the type or interface definition.';
  } else if (code === 7006) {
    // Parameter 'X' implicitly has an 'any' type
    suggestion = 'Add explicit type annotation to the parameter.';
  } else if (code === 18046) {
    // 'X' is of type 'unknown'
    suggestion = 'Add type guard or type assertion to narrow the type.';
  } else if (code === 2532) {
    // Object is possibly 'undefined'
    suggestion =
      'Add null/undefined check using optional chaining (?.) or nullish coalescing (??).';
  } else if (code === 2531) {
    // Object is possibly 'null'
    suggestion = 'Add null check before accessing the property.';
  }

  return {
    file: filePath,
    line,
    error: messageText,
    suggestion,
    codeSnippet,
  };
}

const TsConfigSchema = z.object({
  compilerOptions: z
    .object({
      strict: z.boolean().optional(),
      noImplicitAny: z.boolean().optional(),
      strictNullChecks: z.boolean().optional(),
      strictFunctionTypes: z.boolean().optional(),
      strictBindCallApply: z.boolean().optional(),
      strictPropertyInitialization: z.boolean().optional(),
      noImplicitThis: z.boolean().optional(),
      alwaysStrict: z.boolean().optional(),
    })
    .passthrough()
    .optional(),
});

export async function getStrictModeStatus(): Promise<StrictModeStatus> {
  const tsconfigRelative = 'tsconfig.base.json';

  if (!fileOps.fileExists(tsconfigRelative)) {
    throw new MCPError('tsconfig.base.json not found', ErrorCategory.UserInput);
  }

  const tsconfig = fileOps.readJSON(tsconfigRelative, TsConfigSchema);

  const compilerOptions = tsconfig.compilerOptions || {};

  const flags = {
    strict: compilerOptions.strict,
    noImplicitAny: compilerOptions.noImplicitAny,
    strictNullChecks: compilerOptions.strictNullChecks,
    strictFunctionTypes: compilerOptions.strictFunctionTypes,
    strictBindCallApply: compilerOptions.strictBindCallApply,
    strictPropertyInitialization: compilerOptions.strictPropertyInitialization,
    noImplicitThis: compilerOptions.noImplicitThis,
    alwaysStrict: compilerOptions.alwaysStrict,
  };

  const missingFlags: string[] = [];

  if (!flags.strict) {
    if (!flags.noImplicitAny) missingFlags.push('noImplicitAny');
    if (!flags.strictNullChecks) missingFlags.push('strictNullChecks');
    if (!flags.strictFunctionTypes) missingFlags.push('strictFunctionTypes');
    if (!flags.strictBindCallApply) missingFlags.push('strictBindCallApply');
    if (!flags.strictPropertyInitialization) missingFlags.push('strictPropertyInitialization');
    if (!flags.noImplicitThis) missingFlags.push('noImplicitThis');
    if (!flags.alwaysStrict) missingFlags.push('alwaysStrict');
  }

  return {
    enabled: flags.strict === true || missingFlags.length === 0,
    flags,
    missingFlags,
  };
}
