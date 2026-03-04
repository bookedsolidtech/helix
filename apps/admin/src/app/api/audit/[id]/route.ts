import { NextResponse } from 'next/server';
import { getLibrary } from '@/lib/library-registry';
import { existsSync } from 'node:fs';
import { WC_TOOLS_BINARY } from '@/lib/mcp-constants';
import { scoreAllComponents } from '@/lib/health-scorer';
import { analyzeAccessibility } from '@/lib/a11y-analyzer';
import { validateComponent } from '@/lib/cem-validator';
import { analyzeBundleSize } from '@/lib/bundle-analyzer';
import { getAllComponents } from '@/lib/cem-parser';
import { mcpScoreAllComponents, mcpAnalyzeAccessibility } from '@/lib/mcp-client';
import { aggregateLocalAudit, aggregateMcpAudit, type AuditReport } from '@/lib/audit-report';
import type { McpAccessibilityProfile } from '@/lib/mcp-client';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/audit/[id]
 * Runs a full audit on a library and returns an AuditReport.
 *
 * For local libraries: runs all 17-dimension health scoring, accessibility analysis,
 * CEM validation, and bundle size estimation in parallel.
 *
 * For CDN/npm libraries: uses wc-tools MCP score_all_components and analyze_accessibility.
 *
 * Gracefully degrades — returns partial results when individual tools fail.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const library = getLibrary(id);

    if (!library) {
      return NextResponse.json({ error: `Library "${id}" not found.` }, { status: 404 });
    }

    if (library.source === 'local') {
      // Run all local analyses in parallel
      const [healthResults, components] = await Promise.all([
        scoreAllComponents().catch(() => []),
        Promise.resolve(getAllComponents()),
      ]);

      const tagNames = components.map((c) => c.tagName);

      const [a11yResults, cemValidations, bundleResults] = await Promise.all([
        Promise.all(
          tagNames.map((tag) => Promise.resolve(analyzeAccessibility(tag)).catch(() => null)),
        ),
        Promise.all(
          tagNames.map((tag) => Promise.resolve(validateComponent(tag) ?? null).catch(() => null)),
        ),
        Promise.all(
          tagNames.map((tag) => Promise.resolve(analyzeBundleSize(tag)).catch(() => null)),
        ),
      ]);

      const report = aggregateLocalAudit(
        healthResults,
        a11yResults,
        cemValidations,
        bundleResults,
        library.id,
        library.name,
      );

      return NextResponse.json(report);
    }

    // CDN/npm — use wc-tools MCP
    if (!existsSync(WC_TOOLS_BINARY)) {
      return NextResponse.json(
        { error: 'wc-tools binary not found. Cannot audit CDN/npm library.' },
        { status: 503 },
      );
    }

    const [healthScores, a11yData] = await Promise.all([
      mcpScoreAllComponents().catch(() => null),
      mcpAnalyzeAccessibility().catch(() => null),
    ]);

    if (!healthScores) {
      return NextResponse.json(
        { error: 'Failed to retrieve health scores from wc-tools.' },
        { status: 502 },
      );
    }

    const a11yProfiles: McpAccessibilityProfile[] = Array.isArray(a11yData)
      ? (a11yData as McpAccessibilityProfile[])
      : a11yData
        ? [a11yData as McpAccessibilityProfile]
        : [];

    const report: AuditReport = aggregateMcpAudit(
      healthScores,
      a11yProfiles,
      library.id,
      library.name,
    );

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Audit failed', detail: message }, { status: 500 });
  }
}
