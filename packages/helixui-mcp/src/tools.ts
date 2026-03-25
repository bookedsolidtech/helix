import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  listComponents,
  getComponent,
  findComponents,
  listSlots,
  listEvents,
  getDesignTokens,
  findToken,
  generateImport,
  getLibrarySummary,
} from './handlers.js';
import { analyzeExtension } from './tools/analyze-extension.js';
import { validateIntegration } from './tools/validate-integration.js';
import { scaffoldTheme } from './tools/scaffold-theme.js';
import { auditTokens, formatAuditReport } from './tools/audit-tokens.js';
import { scaffoldComponent } from './tools/scaffold-component.js';
import { generateTests } from './tools/generate-tests.js';
import { generateDocs } from './tools/generate-docs.js';

// ─── Input schemas ─────────────────────────────────────────────────────────────

const TagNameSchema = z
  .string()
  .min(1)
  .regex(/^hx-/, 'Component tag name must start with "hx-" (e.g., hx-button)');

const ListComponentsArgsSchema = z.object({
  filter: z.string().optional().describe('Optional substring to filter tag names or descriptions'),
});

const GetComponentArgsSchema = z.object({
  tagName: TagNameSchema.describe('Component tag name, e.g. hx-button'),
});

const FindComponentsArgsSchema = z.object({
  query: z.string().min(1).describe('Search query matched against tag name and description'),
});

const ListSlotsArgsSchema = z.object({
  tagName: TagNameSchema.describe('Component tag name, e.g. hx-button'),
});

const ListEventsArgsSchema = z.object({
  tagName: TagNameSchema.describe('Component tag name, e.g. hx-button'),
});

const GetDesignTokensArgsSchema = z.object({
  category: z
    .string()
    .optional()
    .describe('Token category, e.g. "color", "spacing", "radius". Omit for all tokens.'),
});

const FindTokenArgsSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe('Token name or partial name, e.g. "primary" or "--hx-color-primary-500"'),
});

const GenerateImportArgsSchema = z.object({
  tagName: TagNameSchema.describe('Component tag name, e.g. hx-button'),
});

const AnalyzeExtensionArgsSchema = z.object({
  filePath: z
    .string()
    .min(1)
    .describe('Absolute or relative path to a TypeScript file that extends a HELiX component'),
});

const ValidateIntegrationArgsSchema = z.object({
  projectPath: z
    .string()
    .min(1)
    .describe('Absolute or relative path to the consumer project directory to scan'),
});

const ScaffoldThemeArgsSchema = z.object({
  selector: z
    .string()
    .optional()
    .describe(
      'CSS scoping selector for the generated theme block (e.g. ".my-theme", ":root"). Defaults to ".hx-theme".',
    ),
  outputPath: z
    .string()
    .optional()
    .describe(
      'Absolute or relative file path to write the generated CSS file. Omit to return the CSS as output only.',
    ),
});

const ScaffoldComponentArgsSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(
      /^[a-z][a-z0-9-]*$/,
      'Component name must be lowercase alphanumeric with hyphens, starting with a lowercase letter (e.g. "media-card").',
    )
    .describe('Component name without hx- prefix, e.g. "media-card"'),
  extends: z
    .string()
    .regex(/^hx-/, 'Base component tag name must start with "hx-"')
    .optional()
    .describe('Optional base component tag name to extend, e.g. "hx-card"'),
  outputDir: z
    .string()
    .optional()
    .describe(
      'Absolute path to the components directory where hx-{name}/ will be created. Omit to return file contents only.',
    ),
});

const AuditTokensArgsSchema = z.object({
  path: z
    .string()
    .min(1)
    .describe(
      'Path to a CSS file or project root directory to scan for --hx-* custom property declarations.',
    ),
});

const GenerateTestsArgsSchema = z.object({
  componentPath: z
    .string()
    .min(1)
    .describe(
      'Absolute or relative path to the component .ts file, e.g. packages/hx-library/src/components/hx-button/hx-button.ts',
    ),
});

const GenerateDocsArgsSchema = z.object({
  componentPath: z
    .string()
    .min(1)
    .describe(
      'Absolute or relative path to the component .ts file, e.g. packages/hx-library/src/components/hx-button/hx-button.ts',
    ),
});

// ─── Tool list ─────────────────────────────────────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    name: 'listComponents',
    description:
      'List all hx-* components available in the HELiX UI library. Optionally filter by tag name or description.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        filter: {
          type: 'string',
          description: 'Optional substring to filter tag names or descriptions',
        },
      },
    },
  },
  {
    name: 'getComponent',
    description:
      'Get full details for a component: description, properties, events, slots, CSS parts, and CSS custom properties.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tagName: {
          type: 'string',
          pattern: '^hx-',
          description: 'Component tag name, e.g. hx-button',
        },
      },
      required: ['tagName'],
    },
  },
  {
    name: 'findComponents',
    description:
      'Search components by a query string matched against tag name and description. Useful for discovering which component fits a use case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query matched against tag name and description',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'listSlots',
    description: 'List all slots for a component (default slot and named slots).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tagName: {
          type: 'string',
          pattern: '^hx-',
          description: 'Component tag name, e.g. hx-card',
        },
      },
      required: ['tagName'],
    },
  },
  {
    name: 'listEvents',
    description:
      'List all custom events dispatched by a component with their types and descriptions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tagName: {
          type: 'string',
          pattern: '^hx-',
          description: 'Component tag name, e.g. hx-text-input',
        },
      },
      required: ['tagName'],
    },
  },
  {
    name: 'getDesignTokens',
    description:
      'Get HELiX design tokens (CSS custom properties). Optionally filter by category: color, spacing, radius, font-size, etc.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: 'Token category, e.g. "color", "spacing", "radius". Omit for all tokens.',
        },
      },
    },
  },
  {
    name: 'findToken',
    description:
      'Find a design token by name or partial name. Returns matching --hx-* CSS custom properties.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Token name or partial name, e.g. "primary" or "--hx-color-primary-500"',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'generateImport',
    description: 'Generate the correct import statement(s) for a component.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        tagName: {
          type: 'string',
          pattern: '^hx-',
          description: 'Component tag name, e.g. hx-button',
        },
      },
      required: ['tagName'],
    },
  },
  {
    name: 'getLibrarySummary',
    description:
      'Get a high-level summary of the HELiX UI library: component count, token count, and import instructions.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'analyzeExtension',
    description:
      'Analyze a TypeScript file that extends a HELiX component and detect common anti-patterns: missing super calls in lifecycle methods, incorrect Shadow DOM usage (this.innerHTML vs slots), properties shadowing parent @property decorators, broken slot forwarding, and direct style manipulation bypassing design tokens.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        filePath: {
          type: 'string',
          description:
            'Absolute or relative path to a TypeScript file that extends a HELiX component',
        },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'validateIntegration',
    description:
      'Scan a consumer project directory for HELiX integration issues: import correctness (barrel vs tree-shakeable), bundler configuration for custom elements, SSR compatibility (unguarded DOM API access), CSP compliance (inline styles, unsafe-eval), and framework-specific issues (React @lit/react wrappers, Vue isCustomElement, Angular CUSTOM_ELEMENTS_SCHEMA, Drupal once() behaviors).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectPath: {
          type: 'string',
          description: 'Absolute or relative path to the consumer project directory to scan',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'scaffoldTheme',
    description:
      'Generate a CSS theme scaffold containing all HELiX semantic design tokens as commented-out custom property overrides, organized by category. Useful for bootstrapping a custom theme.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        selector: {
          type: 'string',
          description:
            'CSS scoping selector for the generated theme block (e.g. ".my-theme", ":root"). Defaults to ".hx-theme".',
        },
        outputPath: {
          type: 'string',
          description:
            'Absolute or relative file path to write the generated CSS file. Omit to return the CSS as output only.',
        },
      },
    },
  },
  {
    name: 'scaffoldComponent',
    description:
      'Generate a complete hx-{name}/ component directory: index.ts (re-export), hx-{name}.ts (Lit class with @customElement and 3-tier token styles), hx-{name}.styles.ts (adopted-stylesheets CSS), hx-{name}.test.ts (Vitest browser mode), hx-{name}.stories.ts (Storybook 10.x autodocs), hx-{name}.twig (Drupal template). When extends is provided, reads the CEM manifest to inherit slot/event/CSS-part metadata and generates a class that extends the base component.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Component name without hx- prefix, e.g. "media-card"',
        },
        extends: {
          type: 'string',
          description: 'Optional base component tag name to extend, e.g. "hx-card"',
        },
        outputDir: {
          type: 'string',
          description:
            'Absolute path to the components directory where hx-{name}/ will be created. Omit to return file contents only.',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'auditTokens',
    description:
      'Audit a CSS file or project directory for --hx-* design token usage. Flags unknown tokens (not in schema), deprecated tokens, and tier violations (component-tier tokens overridden globally instead of via semantic tier).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description:
            'Path to a CSS file or project root directory to scan for --hx-* custom property declarations.',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'generateTests',
    description:
      'Generate a Vitest browser-mode test file for a HELiX component. Reads the CEM manifest (or falls back to TypeScript source parsing) to enumerate public properties, events, slots, and CSS parts, then produces test blocks for: rendering, each property, events, slots, CSS parts, keyboard navigation, and accessibility (axe-core). The generated file is co-located with the component at hx-{name}.test.ts.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentPath: {
          type: 'string',
          description:
            'Absolute or relative path to the component .ts file, e.g. packages/hx-library/src/components/hx-button/hx-button.ts',
        },
      },
      required: ['componentPath'],
    },
  },
  {
    name: 'generateDocs',
    description:
      'Generate a Storybook story file and a Drupal Twig template for a HELiX component. Reads the CEM manifest (or falls back to TypeScript source parsing) to enumerate properties, events, slots, CSS parts, and CSS custom properties, then produces: a .stories.ts file with Meta, Default story, per-enum variant stories, boolean state stories, interaction play functions, and a CSS parts demo; plus a .twig template with a parameter documentation header block. Both files are co-located with the component.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        componentPath: {
          type: 'string',
          description:
            'Absolute or relative path to the component .ts file, e.g. packages/hx-library/src/components/hx-button/hx-button.ts',
        },
      },
      required: ['componentPath'],
    },
  },
] as const;

// ─── Response helpers ──────────────────────────────────────────────────────────

function success(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function failure(message: string) {
  return {
    content: [{ type: 'text' as const, text: `Error: ${message}` }],
    isError: true,
  };
}

// ─── Registration ──────────────────────────────────────────────────────────────

export function registerTools(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'listComponents': {
          const parsed = ListComponentsArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(listComponents(parsed.data.filter));
        }

        case 'getComponent': {
          const parsed = GetComponentArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(getComponent(parsed.data.tagName));
        }

        case 'findComponents': {
          const parsed = FindComponentsArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(findComponents(parsed.data.query));
        }

        case 'listSlots': {
          const parsed = ListSlotsArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(listSlots(parsed.data.tagName));
        }

        case 'listEvents': {
          const parsed = ListEventsArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(listEvents(parsed.data.tagName));
        }

        case 'getDesignTokens': {
          const parsed = GetDesignTokensArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(getDesignTokens(parsed.data.category));
        }

        case 'findToken': {
          const parsed = FindTokenArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(findToken(parsed.data.name));
        }

        case 'generateImport': {
          const parsed = GenerateImportArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(generateImport(parsed.data.tagName));
        }

        case 'getLibrarySummary': {
          return success(getLibrarySummary());
        }

        case 'analyzeExtension': {
          const parsed = AnalyzeExtensionArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(analyzeExtension(parsed.data.filePath));
        }

        case 'validateIntegration': {
          const parsed = ValidateIntegrationArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          return success(validateIntegration(parsed.data.projectPath));
        }

        case 'scaffoldTheme': {
          const parsed = ScaffoldThemeArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          const themeOpts: Parameters<typeof scaffoldTheme>[0] = {};
          if (parsed.data.selector !== undefined) themeOpts.selector = parsed.data.selector;
          if (parsed.data.outputPath !== undefined) themeOpts.outputPath = parsed.data.outputPath;
          const result = scaffoldTheme(themeOpts);
          const lines = [
            `Generated theme scaffold with ${result.tokenCount} tokens across ${result.categories.length} categories.`,
            ...(result.outputPath !== undefined ? [`Written to: ${result.outputPath}`, ''] : ['']),
            result.css,
          ];
          return success(lines.join('\n'));
        }

        case 'scaffoldComponent': {
          const parsed = ScaffoldComponentArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          const opts: Parameters<typeof scaffoldComponent>[0] = { name: parsed.data.name };
          if (parsed.data.extends !== undefined) opts.extends = parsed.data.extends;
          if (parsed.data.outputDir !== undefined) opts.outputDir = parsed.data.outputDir;
          const result = scaffoldComponent(opts);
          const lines: string[] = [
            `Scaffolded ${result.tagName} (${result.className})`,
            ...(result.outputDir !== undefined ? [`Written to: ${result.outputDir}`, ''] : ['']),
            `Generated files (${Object.keys(result.files).length}):`,
            ...Object.keys(result.files).map((f) => `  ${f}`),
            ...(result.warnings.length > 0
              ? ['', 'Warnings:', ...result.warnings.map((w) => `  ⚠ ${w}`)]
              : []),
          ];
          return success(lines.join('\n'));
        }

        case 'auditTokens': {
          const parsed = AuditTokensArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          const report = auditTokens({ path: parsed.data.path });
          return success(formatAuditReport(report));
        }

        case 'generateTests': {
          const parsed = GenerateTestsArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          const result = generateTests({ componentPath: parsed.data.componentPath });
          const lines: string[] = [
            `Generated test file for ${result.tagName} (${result.className})`,
            `Output path: ${result.testFilePath}`,
            '',
            '```typescript',
            result.testContent,
            '```',
            ...(result.warnings.length > 0
              ? ['', 'Warnings:', ...result.warnings.map((w) => `  ! ${w}`)]
              : []),
          ];
          return success(lines.join('\n'));
        }

        case 'generateDocs': {
          const parsed = GenerateDocsArgsSchema.safeParse(args);
          if (!parsed.success) return failure(parsed.error.message);
          const result = generateDocs({ componentPath: parsed.data.componentPath });
          const lines: string[] = [
            `Generated docs for ${result.tagName} (${result.className})`,
            `Stories path: ${result.storiesFilePath}`,
            `Twig path:    ${result.twigFilePath}`,
            '',
            '--- stories ---',
            '',
            result.storiesContent,
            '',
            '--- twig ---',
            '',
            result.twigContent,
            ...(result.warnings.length > 0
              ? ['', 'Warnings:', ...result.warnings.map((w) => `  ! ${w}`)]
              : []),
          ];
          return success(lines.join('\n'));
        }

        default:
          return failure(`Unknown tool: ${name}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return failure(message);
    }
  });
}
