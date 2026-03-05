import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import * as ts from 'typescript';
import * as path from 'path';

interface NgAddOptions {
  project?: string;
  skipImport?: boolean;
  standalone?: boolean;
}

/**
 * Finds the workspace configuration file (`angular.json` or `workspace.json`)
 * and returns the parsed JSON object.
 */
function getWorkspaceConfig(tree: Tree): { path: string; content: Record<string, unknown> } {
  const possibleFiles = ['angular.json', 'workspace.json', '.angular.json'];
  for (const filePath of possibleFiles) {
    const buffer = tree.read(filePath);
    if (buffer) {
      return {
        path: filePath,
        content: JSON.parse(buffer.toString('utf-8')) as Record<string, unknown>,
      };
    }
  }
  throw new Error(
    'Could not find Angular workspace configuration (angular.json or workspace.json).',
  );
}

/**
 * Resolves the default project name from the workspace configuration.
 */
function getDefaultProjectName(workspaceContent: Record<string, unknown>): string {
  const defaultProject = workspaceContent['defaultProject'] as string | undefined;
  if (defaultProject) return defaultProject;

  const projects = workspaceContent['projects'] as Record<string, unknown> | undefined;
  if (projects) {
    const projectNames = Object.keys(projects);
    if (projectNames.length > 0 && projectNames[0]) {
      return projectNames[0];
    }
  }

  throw new Error(
    'Could not determine the default Angular project. Please specify --project explicitly.',
  );
}

/**
 * Returns the root directory of the given project.
 */
function getProjectRoot(workspaceContent: Record<string, unknown>, projectName: string): string {
  const projects = workspaceContent['projects'] as
    | Record<string, { root?: string; sourceRoot?: string }>
    | undefined;
  const project = projects?.[projectName];
  if (!project) {
    throw new Error(`Project "${projectName}" not found in workspace configuration.`);
  }
  return project.root ?? '';
}

/**
 * Finds the source root for the project (typically `src/`).
 */
function getProjectSourceRoot(
  workspaceContent: Record<string, unknown>,
  projectName: string,
): string {
  const projects = workspaceContent['projects'] as
    | Record<string, { sourceRoot?: string; root?: string }>
    | undefined;
  const project = projects?.[projectName];
  if (!project) {
    throw new Error(`Project "${projectName}" not found in workspace configuration.`);
  }
  return project.sourceRoot ?? path.join(project.root ?? '', 'src');
}

/**
 * Locates the `AppModule` file in the project source root.
 * Searches common locations: `app.module.ts` in the sourceRoot/app directory.
 */
function findAppModule(tree: Tree, sourceRoot: string): string | null {
  const candidates = [
    path.join(sourceRoot, 'app', 'app.module.ts'),
    path.join(sourceRoot, 'app.module.ts'),
  ];
  for (const candidate of candidates) {
    if (tree.exists(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Locates the `main.ts` bootstrap file for standalone Angular apps.
 */
function findMainTs(tree: Tree, sourceRoot: string): string | null {
  const candidates = [path.join(sourceRoot, 'main.ts'), path.join(sourceRoot, 'main.server.ts')];
  for (const candidate of candidates) {
    if (tree.exists(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Adds `@helix/library` side-effect import to `main.ts` so custom elements
 * are registered at application startup.
 */
function addLibraryImportToMain(tree: Tree, mainPath: string): void {
  const content = tree.read(mainPath)?.toString('utf-8');
  if (!content) return;

  const importLine = `import '@helix/library';`;
  if (content.includes(importLine)) {
    // Already present, nothing to do.
    return;
  }

  // Prepend the import after the last existing import statement.
  const lines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.trimStart().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  const insertAt = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
  lines.splice(insertAt, 0, importLine);
  tree.overwrite(mainPath, lines.join('\n'));
}

/**
 * Parses a TypeScript source file into an AST using the TypeScript compiler API.
 */
function parseSourceFile(content: string, filePath: string): ts.SourceFile {
  return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
}

/**
 * Checks whether an import for a given module already exists in the source file.
 */
function hasImport(sourceFile: ts.SourceFile, moduleName: string): boolean {
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === moduleName
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Adds a named import to the top of a TypeScript source file, after any
 * existing import declarations.
 */
function addNamedImport(content: string, symbolName: string, moduleName: string): string {
  const sourceFile = parseSourceFile(content, 'temp.ts');

  if (hasImport(sourceFile, moduleName)) {
    // Module already imported — ensure the symbol is in the import list.
    return ensureSymbolInImport(content, symbolName, moduleName);
  }

  const importStatement = `import { ${symbolName} } from '${moduleName}';\n`;
  const lines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.trimStart().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  const insertAt = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
  lines.splice(insertAt, 0, importStatement.trimEnd());
  return lines.join('\n');
}

/**
 * Ensures that a symbol is present in an existing named import declaration.
 */
function ensureSymbolInImport(content: string, symbolName: string, moduleName: string): string {
  const importRegex = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${moduleName.replace(/\//g, '\\/')}['"]`,
    'g',
  );

  return content.replace(importRegex, (match, namedImports: string) => {
    const symbols = namedImports
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (symbols.includes(symbolName)) return match;
    symbols.push(symbolName);
    return `import { ${symbols.join(', ')} } from '${moduleName}'`;
  });
}

/**
 * Inserts `HelixAngularModule` into the `imports` array of an `@NgModule` decorator.
 */
function addHelixModuleToNgModule(content: string): string {
  // Find the @NgModule decorator and add HelixAngularModule to the imports array.
  // Strategy: locate `imports: [` and add the module name before the closing `]`.
  const ngModuleImportsPattern = /(imports\s*:\s*\[)([^\]]*?)(\])/s;
  const match = ngModuleImportsPattern.exec(content);

  if (!match) {
    // No imports array found — this is an unusual NgModule; skip modification.
    return content;
  }

  const [fullMatch, openBracket, existingImports, closeBracket] = match;

  if (existingImports.includes('HelixAngularModule')) {
    return content; // Already present.
  }

  const trimmedImports = existingImports.trimEnd();
  const separator = trimmedImports.length > 0 && !trimmedImports.endsWith(',') ? ',' : '';
  const newImports = `${trimmedImports}${separator}\n    HelixAngularModule\n  `;

  return content.replace(fullMatch, `${openBracket}${newImports}${closeBracket}`);
}

/**
 * Adds `CUSTOM_ELEMENTS_SCHEMA` to the `schemas` array of an `@NgModule` decorator.
 */
function addCustomElementsSchemaToNgModule(content: string): string {
  const schemasPattern = /(schemas\s*:\s*\[)([^\]]*?)(\])/s;
  const match = schemasPattern.exec(content);

  if (!match) {
    // No schemas array — insert one before the closing `}` of @NgModule({...})
    return content.replace(
      /(imports\s*:\s*\[[^\]]*\])/s,
      '$1,\n  schemas: [CUSTOM_ELEMENTS_SCHEMA]',
    );
  }

  const [fullMatch, openBracket, existingSchemas, closeBracket] = match;

  if (existingSchemas.includes('CUSTOM_ELEMENTS_SCHEMA')) {
    return content; // Already present.
  }

  const trimmedSchemas = existingSchemas.trimEnd();
  const separator = trimmedSchemas.length > 0 && !trimmedSchemas.endsWith(',') ? ',' : '';
  const newSchemas = `${trimmedSchemas}${separator}\n    CUSTOM_ELEMENTS_SCHEMA\n  `;

  return content.replace(fullMatch, `${openBracket}${newSchemas}${closeBracket}`);
}

/**
 * Schematic rule that modifies the NgModule-based `AppModule` file.
 */
function updateAppModule(tree: Tree, appModulePath: string): void {
  let content = tree.read(appModulePath)?.toString('utf-8') ?? '';

  // Add library side-effect import.
  const libraryImport = `import '@helix/library';`;
  if (!content.includes(libraryImport)) {
    content = addNamedImport(content, '', '@helix/library').replace(
      `import {  } from '@helix/library';`,
      libraryImport,
    );
    // Simpler: just prepend the bare import.
    if (!content.includes(libraryImport)) {
      const firstImportMatch = /^(import .+)/m.exec(content);
      if (firstImportMatch?.index !== undefined) {
        content =
          content.slice(0, firstImportMatch.index) +
          libraryImport +
          '\n' +
          content.slice(firstImportMatch.index);
      }
    }
  }

  // Add Angular imports.
  content = addNamedImport(content, 'CUSTOM_ELEMENTS_SCHEMA', '@angular/core');
  content = addNamedImport(content, 'HelixAngularModule', '@helixds/angular');

  // Modify @NgModule decorator.
  content = addHelixModuleToNgModule(content);
  content = addCustomElementsSchemaToNgModule(content);

  tree.overwrite(appModulePath, content);
}

/**
 * Prints instructions for standalone Angular apps since we cannot safely
 * auto-modify the bootstrap configuration in all project layouts.
 */
function printStandaloneInstructions(context: SchematicContext): void {
  context.logger.info('');
  context.logger.info('╔════════════════════════════════════════════════════════════╗');
  context.logger.info('║        @helixds/angular installed (standalone mode)        ║');
  context.logger.info('╚════════════════════════════════════════════════════════════╝');
  context.logger.info('');
  context.logger.info('For standalone Angular applications, add the following to your main.ts:');
  context.logger.info('');
  context.logger.info("  import '@helix/library';");
  context.logger.info('');
  context.logger.info('Then import directives in each standalone component:');
  context.logger.info('');
  context.logger.info(
    "  import { HELIX_DIRECTIVES, HELIX_VALUE_ACCESSORS } from '@helixds/angular';",
  );
  context.logger.info('');
  context.logger.info('  @Component({');
  context.logger.info('    standalone: true,');
  context.logger.info('    imports: [...HELIX_DIRECTIVES, ...HELIX_VALUE_ACCESSORS],');
  context.logger.info("    schemas: [CUSTOM_ELEMENTS_SCHEMA], // from '@angular/core'");
  context.logger.info('  })');
  context.logger.info('  export class MyComponent {}');
  context.logger.info('');
}

/**
 * `ng add @helixds/angular` schematic entry point.
 *
 * Performs the following steps:
 * 1. Schedules `npm install` to install the package and its peer dependencies.
 * 2. For NgModule apps: patches `AppModule` to import `HelixAngularModule` and
 *    add `CUSTOM_ELEMENTS_SCHEMA`.
 * 3. For standalone apps: prints actionable setup instructions.
 * 4. Adds `@helix/library` side-effect import to register custom elements.
 */
export function ngAdd(options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      // Step 1 – Resolve project metadata.
      (host: Tree) => {
        const workspace = getWorkspaceConfig(host);
        const projectName = options.project ?? getDefaultProjectName(workspace.content);
        const sourceRoot = getProjectSourceRoot(workspace.content, projectName);

        context.logger.info(`Adding @helixds/angular to project "${projectName}"...`);

        // Step 2 – Handle NgModule apps.
        if (!options.standalone && !options.skipImport) {
          const appModulePath = findAppModule(host, sourceRoot);
          if (appModulePath) {
            context.logger.info(`Updating NgModule at ${appModulePath}...`);
            updateAppModule(host, appModulePath);
            context.logger.info('  - Added HelixAngularModule to imports');
            context.logger.info('  - Added CUSTOM_ELEMENTS_SCHEMA to schemas');
            context.logger.info("  - Added import '@helix/library' for element registration");
          } else {
            context.logger.warn(
              'Could not locate AppModule. Please import HelixAngularModule manually.',
            );
          }
        }

        // Step 3 – Add library side-effect to main.ts for both standalone and NgModule.
        const mainTsPath = findMainTs(host, sourceRoot);
        if (mainTsPath) {
          addLibraryImportToMain(host, mainTsPath);
          context.logger.info(`  - Added import '@helix/library' to ${mainTsPath}`);
        }

        // Step 4 – Print standalone instructions if applicable.
        if (options.standalone || options.skipImport) {
          printStandaloneInstructions(context);
        } else {
          context.logger.info('');
          context.logger.info('Done! @helixds/angular has been configured.');
          context.logger.info('');
          context.logger.info(
            'Use Helix components in your templates with full Angular form support:',
          );
          context.logger.info('');
          context.logger.info(
            '  <hx-text-input label="Patient Name" formControlName="name"></hx-text-input>',
          );
          context.logger.info('');
        }

        return host;
      },

      // Step 5 – Schedule package installation.
      (_host: Tree) => {
        context.addTask(new NodePackageInstallTask());
        return _host;
      },
    ])(tree, context);
  };
}
