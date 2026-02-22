import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  getDiagnostics,
  getDiagnosticsForComponent,
  suggestFix,
  getStrictModeStatus,
} from './handlers.js';

export function registerTypeScriptTools(server: Server) {
  // Register tool list
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'getDiagnostics',
          description: 'Get TypeScript diagnostics/errors for a file or entire project',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description:
                  'Optional file path (relative to project root). If omitted, checks entire project.',
              },
            },
          },
        },
        {
          name: 'getDiagnosticsForComponent',
          description: 'Get TypeScript diagnostics for a specific component',
          inputSchema: {
            type: 'object',
            properties: {
              tagName: {
                type: 'string',
                pattern: '^hx-',
                description: 'Component tag name (e.g., hx-button)',
              },
            },
            required: ['tagName'],
          },
        },
        {
          name: 'suggestFix',
          description: 'Suggest a quick fix for a TypeScript error at a specific line',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'File path (relative to project root)',
              },
              line: {
                type: 'number',
                description: 'Line number with the error',
              },
            },
            required: ['filePath', 'line'],
          },
        },
        {
          name: 'getStrictModeStatus',
          description: 'Check TypeScript strict mode configuration status',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'getDiagnostics') {
        const filePath = (args as Record<string, unknown>).filePath as string | undefined;

        try {
          const diagnostics = await getDiagnostics(filePath);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(diagnostics, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error getting diagnostics: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'getDiagnosticsForComponent') {
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
          const diagnostics = await getDiagnosticsForComponent(tagName);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(diagnostics, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error getting component diagnostics: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'suggestFix') {
        const filePath = (args as Record<string, unknown>).filePath as string;
        const line = (args as Record<string, unknown>).line as number;

        if (!filePath || !line) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: filePath and line are required',
              },
            ],
            isError: true,
          };
        }

        try {
          const suggestion = await suggestFix(filePath, line);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(suggestion, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error suggesting fix: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === 'getStrictModeStatus') {
        try {
          const status = await getStrictModeStatus();
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(status, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Error checking strict mode: ${
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
