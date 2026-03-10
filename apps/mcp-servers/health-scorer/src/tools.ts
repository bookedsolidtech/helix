import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import {
  TagNameSchema,
  BranchNameSchema,
  DaysSchema,
  handleToolError,
  createSuccessResponse,
  createErrorResponse,
} from '@helixui/mcp-shared';
import { scoreComponent, scoreAllComponents, getHealthTrend, getHealthDiff } from './handlers.js';

const ScoreComponentArgsSchema = z.object({
  tagName: TagNameSchema,
});

const GetHealthTrendArgsSchema = z.object({
  tagName: TagNameSchema,
  days: DaysSchema.default(7),
});

const GetHealthDiffArgsSchema = z.object({
  tagName: TagNameSchema,
  baseBranch: BranchNameSchema.default('main'),
});

export function registerHealthTools(server: Server) {
  // Register tool list
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'scoreComponent',
          description: 'Get comprehensive health score for a component (17 dimensions)',
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
          name: 'scoreAllComponents',
          description: 'Get health scores for all 15 components in the library',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'getHealthTrend',
          description: 'Get historical health trend for a component',
          inputSchema: {
            type: 'object',
            properties: {
              tagName: {
                type: 'string',
                pattern: '^hx-',
                description: 'Component tag name',
              },
              days: {
                type: 'number',
                description: 'Number of days to look back (default: 7)',
                default: 7,
              },
            },
            required: ['tagName'],
          },
        },
        {
          name: 'getHealthDiff',
          description: 'Compare component health between current branch and base branch',
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
      ],
    };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'scoreComponent') {
        const parseResult = ScoreComponentArgsSchema.safeParse(args);
        if (!parseResult.success) {
          return createErrorResponse(
            `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        const { tagName } = parseResult.data;

        try {
          const health = await scoreComponent(tagName);
          return createSuccessResponse(health);
        } catch (error) {
          return handleToolError(error);
        }
      }

      if (name === 'scoreAllComponents') {
        try {
          const scores = await scoreAllComponents();
          return createSuccessResponse(scores);
        } catch (error) {
          return handleToolError(error);
        }
      }

      if (name === 'getHealthTrend') {
        const parseResult = GetHealthTrendArgsSchema.safeParse(args);
        if (!parseResult.success) {
          return createErrorResponse(
            `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        const { tagName, days } = parseResult.data;

        try {
          const trend = await getHealthTrend(tagName, days);
          return createSuccessResponse(trend);
        } catch (error) {
          return handleToolError(error);
        }
      }

      if (name === 'getHealthDiff') {
        const parseResult = GetHealthDiffArgsSchema.safeParse(args);
        if (!parseResult.success) {
          return createErrorResponse(
            `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        const { tagName, baseBranch } = parseResult.data;

        try {
          const diff = await getHealthDiff(tagName, baseBranch);
          const message = diff.improved
            ? `✅ HEALTH IMPROVED: ${diff.current.score} (↑ from ${diff.base.score})\n${JSON.stringify(diff, null, 2)}`
            : diff.regressed
              ? `⚠️  HEALTH REGRESSION: ${diff.current.score} (↓ from ${diff.base.score})\n${JSON.stringify(diff, null, 2)}`
              : `No change in health score: ${diff.current.score}\n${JSON.stringify(diff, null, 2)}`;
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
