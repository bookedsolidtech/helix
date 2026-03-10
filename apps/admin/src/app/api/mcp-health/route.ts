import { probeMcpServer } from '@/lib/mcp-probe';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const result = await probeMcpServer();
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ status: 'unreachable', error: message }, { status: 500 });
  }
}
