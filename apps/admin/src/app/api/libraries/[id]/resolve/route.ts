import { NextResponse } from 'next/server';
import { getLibrary, updateLibrary } from '@/lib/library-registry';
import { createMcpSession } from '@/lib/mcp-client';
import { existsSync } from 'node:fs';
import { WC_TOOLS_BINARY } from '@/lib/mcp-constants';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ResolvedCemResult {
  componentCount?: number;
  declarations?: unknown[];
  [key: string]: unknown;
}

/**
 * POST /api/libraries/[id]/resolve
 * Triggers CEM resolution for CDN/npm libraries via wc-tools resolve_cdn_cem.
 * Updates componentCount and lastScored on the registry entry.
 *
 * Returns 404 if the library is not found.
 * Returns 400 if the library is a local source (resolution not applicable).
 * Returns 503 if the wc-tools binary is not found.
 */
export async function POST(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const library = getLibrary(id);

    if (!library) {
      return NextResponse.json({ error: `Library "${id}" not found.` }, { status: 404 });
    }

    if (library.source === 'local') {
      return NextResponse.json(
        { error: 'CEM resolution is only applicable to cdn and npm libraries.' },
        { status: 400 },
      );
    }

    if (!existsSync(WC_TOOLS_BINARY)) {
      return NextResponse.json(
        { error: 'wc-tools binary not found. Cannot perform CEM resolution.' },
        { status: 503 },
      );
    }

    if (!library.packageName) {
      return NextResponse.json(
        { error: 'packageName is required for CEM resolution.' },
        { status: 400 },
      );
    }

    const session = await createMcpSession();
    if (!session) {
      return NextResponse.json({ error: 'Failed to start wc-tools MCP session.' }, { status: 503 });
    }

    let resolvedData: ResolvedCemResult | null = null;
    try {
      const args: Record<string, unknown> = { package: library.packageName };
      if (library.version) {
        args.version = library.version;
      }

      const result = await session.callTool<ResolvedCemResult>('resolve_cdn_cem', args);
      if (result.error) {
        return NextResponse.json(
          { error: 'CEM resolution failed', detail: result.error },
          { status: 502 },
        );
      }
      resolvedData = result.data;
    } finally {
      session.close();
    }

    // Derive componentCount from resolved CEM declarations
    let componentCount = 0;
    if (resolvedData) {
      if (typeof resolvedData.componentCount === 'number') {
        componentCount = resolvedData.componentCount;
      } else if (Array.isArray(resolvedData.declarations)) {
        componentCount = resolvedData.declarations.length;
      }
    }

    const now = new Date().toISOString();
    const updated = updateLibrary(id, {
      componentCount,
      lastScored: now,
    });

    return NextResponse.json({
      library: updated,
      resolved: resolvedData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to resolve library CEM', detail: message },
      { status: 500 },
    );
  }
}
