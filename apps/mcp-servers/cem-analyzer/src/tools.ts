import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import {
  TagNameSchema,
  BranchNameSchema,
  handleToolError,
  createSuccessResponse,
  createErrorResponse,
} from '@helixui/mcp-shared';
import { parseCem, diffCem, validateCompleteness, listAllComponents } from './handlers.js';

const AnalyzeCEMArgsSchema = z.object({
  tagName: TagNameSchema,
});

const DiffCEMArgsSchema = z.object({
  tagName: TagNameSchema,
  baseBranch: BranchNameSchema.default('main'),
});

const ValidateCEMArgsSchema = z.object({
  tagName: TagNameSchema,
});

export function registerCemTools(server: Server) {
  // Register tool list
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'analyzeCEM',
          description: 'Analyze Custom Elements Manifest (CEM) for a component',
          inputSchema: {
            type: 'object',
            properties: {
              tagName: {
                type: 'string',
                pattern: '^hx-',
                description: 'Component tag name (e.g., hx-button, hx-card)',
              },
            },
            required: ['tagName'],
          },
        },
        {
          name: 'diffCEM',
          description:
            'Compare CEM between current branch and base branch (detects breaking changes)',
          inputSchema: {
            type: 'object',
            properties: {
              tagName: {
                type: 'string',
                pattern: '^hx-',
                description: 'Component tag name',
              },
              baseBranch: {
                type: 'string',
                description: 'Base branch for comparison (default: main)',
                default: 'main',
              },
            },
            required: ['tagName'],
          },
        },
        {
          name: 'listComponents',
          description: 'List all components in the library',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'validateCEMCompleteness',
          description:
            'Validate that CEM is complete (properties, events, slots, parts all documented)',
          inputSchema: {
            type: 'object',
            properties: {
              tagName: {
                type: 'string',
                pattern: '^hx-',
                description: 'Component tag name',
              },
            },
            required: ['tagName'],
          },
        },
      ],
    };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'analyzeCEM') {
        const parseResult = AnalyzeCEMArgsSchema.safeParse(args);
        if (!parseResult.success) {
          return createErrorResponse(
            `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        const { tagName } = parseResult.data;

        try {
          const analysis = await parseCem(tagName);
          return createSuccessResponse(analysis);
        } catch (error) {
          return handleToolError(error);
        }
      }

      if (name === 'diffCEM') {
        const parseResult = DiffCEMArgsSchema.safeParse(args);
        if (!parseResult.success) {
          return createErrorResponse(
            `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        const { tagName, baseBranch } = parseResult.data;

        try {
          const diff = await diffCem(tagName, baseBranch);
          const message =
            diff.breaking.length > 0
              ? `⚠️  BREAKING CHANGES DETECTED:\n${JSON.stringify(diff, null, 2)}`
              : `✅ No breaking changes.\n${diff.added.length} additions, ${diff.removed.length} removals`;
          return createSuccessResponse(message);
        } catch (error) {
          return handleToolError(error);
        }
      }

      if (name === 'listComponents') {
        try {
          const components = await listAllComponents();
          return createSuccessResponse(
            `Found ${components.length} components:\n${components.join('\n')}`,
          );
        } catch (error) {
          return handleToolError(error);
        }
      }

      if (name === 'validateCEMCompleteness') {
        const parseResult = ValidateCEMArgsSchema.safeParse(args);
        if (!parseResult.success) {
          return createErrorResponse(
            `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        const { tagName } = parseResult.data;

        try {
          const validation = await validateCompleteness(tagName);
          const message = validation.isValid
            ? `✅ CEM is valid for ${tagName}. Score: ${validation.score}%`
            : `❌ CEM validation issues:\n${JSON.stringify(validation.issues, null, 2)}`;
          return createSuccessResponse(message);
        } catch (error) {
          return handleToolError(error);
        }
      }

      return createErrorResponse(`Unknown tool: ${name}`);
    } catch (error) {
      return handleToolError(error);
    }
  });
}
