import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { scoreComponent, scoreAllComponents, getHealthTrend, getHealthDiff } from './handlers.js';

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
        const tagName = (args as Record<string, unknown>).tagName as string;

        if (!tagName || !tagName.startsWith('hx-')) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: tagName must start with hx- prefix',
              },
            ],
            isError: true,
          };
        }

        try {
          const health = await scoreComponent(tagName);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(health, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error scoring component: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'scoreAllComponents') {
        try {
          const scores = await scoreAllComponents();
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(scores, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error scoring all components: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'getHealthTrend') {
        const tagName = (args as Record<string, unknown>).tagName as string;
        const days = ((args as Record<string, unknown>).days as number) || 7;

        if (!tagName || !tagName.startsWith('hx-')) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: tagName must start with hx- prefix',
              },
            ],
            isError: true,
          };
        }

        try {
          const trend = await getHealthTrend(tagName, days);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(trend, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error getting health trend: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'getHealthDiff') {
        const tagName = (args as Record<string, unknown>).tagName as string;
        const baseBranch = ((args as Record<string, unknown>).baseBranch as string) || 'main';

        if (!tagName || !tagName.startsWith('hx-')) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: tagName must start with hx- prefix',
              },
            ],
            isError: true,
          };
        }

        try {
          const diff = await getHealthDiff(tagName, baseBranch);
          return {
            content: [
              {
                type: 'text' as const,
                text: diff.improved
                  ? `✅ HEALTH IMPROVED: ${diff.current.score} (↑ from ${diff.base.score})\n${JSON.stringify(diff, null, 2)}`
                  : diff.regressed
                    ? `⚠️  HEALTH REGRESSION: ${diff.current.score} (↓ from ${diff.base.score})\n${JSON.stringify(diff, null, 2)}`
                    : `No change in health score: ${diff.current.score}\n${JSON.stringify(diff, null, 2)}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error comparing health: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });
}
