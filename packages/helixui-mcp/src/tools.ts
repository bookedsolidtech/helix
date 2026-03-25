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
          description: 'Absolute or relative path to a TypeScript file that extends a HELiX component',
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

        default:
          return failure(`Unknown tool: ${name}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return failure(message);
    }
  });
}
