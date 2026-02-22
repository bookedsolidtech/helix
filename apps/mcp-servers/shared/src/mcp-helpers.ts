export function createErrorResponse(message: string): {
  content: { type: 'text'; text: string }[];
  isError: true;
} {
  return {
    content: [
      {
        type: 'text' as const,
        text: message,
      },
    ],
    isError: true as const,
  };
}

export function createSuccessResponse(data: unknown): {
  content: { type: 'text'; text: string }[];
} {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}
