import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import {
  TagNameSchema,
  FilePathSchema,
  LineNumberSchema,
  handleToolError,
  createSuccessResponse,
  createErrorResponse,
} from '@helixui/mcp-shared';
import {
  getDiagnostics,
  getDiagnosticsForComponent,
  suggestFix,
  getStrictModeStatus,
} from './handlers.js';

const GetDiagnosticsArgsSchema = z.object({
  filePath: FilePathSchema.optional(),
});

const GetDiagnosticsForComponentArgsSchema = z.object({
  tagName: TagNameSchema,
});

const SuggestFixArgsSchema = z.object({
  filePath: FilePathSchema,
  line: LineNumberSchema,
});

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
        const parseResult = GetDiagnosticsArgsSchema.safeParse(args);
        if (!parseResult.success) {
          return createErrorResponse(
            `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        const { filePath } = parseResult.data;

        try {
          const diagnostics = await getDiagnostics(filePath);
          return createSuccessResponse(diagnostics);
        } catch (error) {
          return handleToolError(error);
        }
      }

      if (name === 'getDiagnosticsForComponent') {
        const parseResult = GetDiagnosticsForComponentArgsSchema.safeParse(args);
        if (!parseResult.success) {
          return createErrorResponse(
            `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        const { tagName } = parseResult.data;

        try {
          const diagnostics = await getDiagnosticsForComponent(tagName);
          return createSuccessResponse(diagnostics);
        } catch (error) {
          return handleToolError(error);
        }
      }

      if (name === 'suggestFix') {
        const parseResult = SuggestFixArgsSchema.safeParse(args);
        if (!parseResult.success) {
          return createErrorResponse(
            `Invalid arguments: ${parseResult.error.errors.map((e) => e.message).join(', ')}`,
          );
        }

        const { filePath, line } = parseResult.data;

        try {
          const suggestion = await suggestFix(filePath, line);
          return createSuccessResponse(suggestion);
        } catch (error) {
          return handleToolError(error);
        }
      }

      if (name === 'getStrictModeStatus') {
        try {
          const status = await getStrictModeStatus();
          return createSuccessResponse(status);
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
