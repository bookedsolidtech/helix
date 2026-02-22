export enum ErrorCategory {
  UserInput = 'USER_INPUT',
  System = 'SYSTEM',
  Security = 'SECURITY',
}

export class MCPError extends Error {
  constructor(
    message: string,
    public category: ErrorCategory,
    public cause?: Error,
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export interface MCPErrorResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
}

export function handleToolError(error: unknown): MCPErrorResponse {
  if (error instanceof MCPError) {
    if (error.category !== ErrorCategory.UserInput) {
      console.error('[MCP Error]', error.stack);
    }

    return {
      content: [
        {
          type: 'text',
          text: `[${error.category}] ${error.message}`,
        },
      ],
      isError: true,
    };
  }

  console.error('[Unexpected Error]', error);
  return {
    content: [
      {
        type: 'text',
        text: 'Internal server error. Check logs.',
      },
    ],
    isError: true,
  };
}
