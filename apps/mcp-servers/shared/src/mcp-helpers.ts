export interface MCPSuccessResponse {
  content: Array<{ type: 'text'; text: string }>;
}

export interface MCPErrorResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
}

export type MCPResponse = MCPSuccessResponse | MCPErrorResponse;

export function createErrorResponse(message: string): MCPErrorResponse {
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    isError: true,
  };
}

export function createSuccessResponse(data: unknown): MCPSuccessResponse {
  return {
    content: [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}
