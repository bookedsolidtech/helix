import { NextResponse } from 'next/server';
import { getLibrary, updateLibrary } from '@/lib/library-registry';
import { scoreAllComponents } from '@/lib/health-scorer';
import { mcpScoreAllComponents } from '@/lib/mcp-client';
import { existsSync } from 'node:fs';
import { WC_TOOLS_BINARY } from '@/lib/mcp-constants';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/libraries/[id]/score
 * Triggers health scoring for the library.
 *
 * For local libraries: runs the admin 17-dimension scorer.
 * For CDN/npm libraries: calls wc-tools score_all_components with cached CEM.
 *
 * Returns a scoring tier indicator: "full" (local) or "cem-only" (cdn/npm).
 */
export async function POST(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const library = getLibrary(id);

    if (!library) {
      return NextResponse.json({ error: `Library "${id}" not found.` }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (library.source === 'local') {
      // Full 17-dimension local scorer
      const results = await scoreAllComponents();
      const componentCount = results.length;

      const updated = updateLibrary(id, {
        componentCount,
        lastScored: now,
      });

      return NextResponse.json({
        library: updated,
        tier: 'full',
        componentCount,
        scores: results,
      });
    }

    // CDN/npm: use wc-tools MCP score_all_components
    if (!existsSync(WC_TOOLS_BINARY)) {
      return NextResponse.json(
        { error: 'wc-tools binary not found. Cannot perform CEM-based scoring.' },
        { status: 503 },
      );
    }

    const scores = await mcpScoreAllComponents();
    if (!scores) {
      return NextResponse.json(
        { error: 'Failed to retrieve scores from wc-tools.' },
        { status: 502 },
      );
    }

    const componentCount = scores.length;
    const updated = updateLibrary(id, {
      componentCount,
      lastScored: now,
    });

    return NextResponse.json({
      library: updated,
      tier: 'cem-only',
      componentCount,
      scores,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to score library', detail: message },
      { status: 500 },
    );
  }
}
