import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { parseCem, diffCem, validateCompleteness, listAllComponents } from './handlers.js';

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
          const analysis = await parseCem(tagName);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(analysis, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error analyzing CEM: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'diffCEM') {
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
          const diff = await diffCem(tagName, baseBranch);
          return {
            content: [
              {
                type: 'text' as const,
                text:
                  diff.breaking.length > 0
                    ? `⚠️  BREAKING CHANGES DETECTED:\n${JSON.stringify(diff, null, 2)}`
                    : `✅ No breaking changes.\n${diff.added.length} additions, ${diff.removed.length} removals`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Diff error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'listComponents') {
        try {
          const components = await listAllComponents();
          return {
            content: [
              {
                type: 'text' as const,
                text: `Found ${components.length} components:\n${components.join('\n')}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error listing components: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'validateCEMCompleteness') {
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
          const validation = await validateCompleteness(tagName);
          return {
            content: [
              {
                type: 'text' as const,
                text: validation.isValid
                  ? `✅ CEM is valid for ${tagName}. Score: ${validation.score}%`
                  : `❌ CEM validation issues:\n${JSON.stringify(validation.issues, null, 2)}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
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
