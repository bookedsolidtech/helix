import { notFound } from 'next/navigation';
import { getComponentData } from '@/lib/cem-parser';
import { validateComponent } from '@/lib/cem-validator';
import { analyzeJsDoc, detectDrift } from '@/lib/jsdoc-analyzer';
import { scoreComponent } from '@/lib/health-scorer';
import { getSourceInfo } from '@/lib/source-analyzer';
import { getTestResultsForComponent } from '@/lib/test-results-reader';
import { analyzeAccessibility } from '@/lib/a11y-analyzer';
import { generateSnippetsWithOverrides } from '@/lib/snippet-generator';
import { getOverridesForComponent } from '@/data/snippet-overrides';
import { highlightCode } from '@/lib/syntax-highlighter';
import { getStorybookUrl, getDocsUrl } from '@/lib/env';
import { mcpGetHealthDiff, mcpAnalyzeAccessibility } from '@/lib/mcp-client';
import type { McpAccessibilityProfile } from '@/lib/mcp-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { HealthRadar } from '@/components/dashboard/HealthRadar';
import { CemMatrix } from '@/components/dashboard/CemMatrix';
import { ScoreBar } from '@/components/dashboard/ScoreBadge';
import { SplitButtonDropdown } from '@/components/dashboard/SplitButtonDropdown';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { CodeSnippets } from '@/components/dashboard/CodeSnippets';
import { BranchDiffView } from '@/components/health/BranchDiffView';
import { McpA11yComparison } from '@/components/health/McpA11yComparison';
import { getComponentBreadcrumbs } from '@/lib/breadcrumb-utils';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return [];
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const data = getComponentData(tag);
  if (!data) notFound();

  const healthRaw = scoreComponent(tag);
  const health = healthRaw && Array.isArray(healthRaw.dimensions) ? healthRaw : null;
  const validation = validateComponent(tag);
  const jsDoc = analyzeJsDoc(tag);
  const drift = detectDrift(tag);
  const source = getSourceInfo(tag);
  const testResults = getTestResultsForComponent(tag);
  const a11y = analyzeAccessibility(tag);

  // MCP data — fetched in parallel, graceful degradation when unavailable
  const [mcpDiff, mcpA11yRaw] = await Promise.all([
    mcpGetHealthDiff(tag).catch(() => null),
    mcpAnalyzeAccessibility(tag).catch(() => null),
  ]);
  const mcpA11y = mcpA11yRaw as McpAccessibilityProfile | null;

  // Generate CEM-driven code snippets with optional manual overrides
  const overrides = getOverridesForComponent(tag);
  const snippetData = generateSnippetsWithOverrides(data, overrides);

  // Server-side syntax highlighting via Shiki
  const snippetTabs = await Promise.all(
    snippetData.snippets.map(async (snippet) => ({
      framework: snippet.framework,
      label: snippet.label,
      code: snippet.code,
      highlightedHtml: await highlightCode(snippet.code, snippet.language),
    })),
  );

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Header */}
      <div>
        <Breadcrumb items={getComponentBreadcrumbs(tag)} />
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-tight">&lt;{data.tagName}&gt;</h1>
            <p className="text-muted-foreground mt-1">{data.summary}</p>
            <p className="text-sm text-muted-foreground mt-2">{data.description}</p>
            <div className="flex gap-2 mt-3">
              <Badge variant="outline">{data.className}</Badge>
              <Badge variant="secondary">{data.superclass}</Badge>
              {data.formAssociated && <Badge variant="success">Form Associated</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SplitButtonDropdown
              storybookUrl={getStorybookUrl(tag, 'default')}
              docsUrl={getDocsUrl(tag)}
            />
            {health && (
              <div
                className={cn(
                  'flex items-center justify-center w-16 h-16 rounded-xl border text-2xl font-bold',
                  health.grade === 'A'
                    ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                    : health.grade === 'B'
                      ? 'text-blue-400 bg-blue-400/10 border-blue-400/30'
                      : health.grade === 'C'
                        ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                        : health.grade === 'D'
                          ? 'text-orange-400 bg-orange-400/10 border-orange-400/30'
                          : 'text-red-400 bg-red-400/10 border-red-400/30',
                )}
              >
                {health.grade}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MiniStat label="Properties" value={data.properties.length} />
        <MiniStat label="Events" value={data.events.length} />
        <MiniStat label="Slots" value={data.slots.length} />
        <MiniStat label="CSS Parts" value={data.cssParts.length} />
        <MiniStat label="CSS Props" value={data.cssProperties.length} />
      </div>

      {/* Code Snippets — CEM-driven with framework tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Code Snippets</CardTitle>
          <CardDescription>
            Auto-generated from the Custom Elements Manifest.
            {overrides ? ' Includes curated enterprise examples.' : ''} Switch between frameworks to
            see idiomatic usage patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeSnippets tabs={snippetTabs} />
        </CardContent>
      </Card>

      {/* Health + CEM side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Radar */}
        {health && (
          <Card>
            <CardHeader>
              <CardTitle>Health Score: {health.overallScore}/100</CardTitle>
              <CardDescription>
                {health.dimensions.length} dimensions: {health.confidenceSummary.verified} verified,{' '}
                {health.confidenceSummary.heuristic} heuristic, {health.confidenceSummary.untested}{' '}
                untested
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HealthRadar dimensions={health.dimensions} />
              <div className="mt-4 space-y-2">
                {health.dimensions.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className={cn('flex items-center gap-1.5', !d.measured && 'opacity-50')}>
                      <ConfidenceIcon confidence={d.confidence} />
                      <span className="text-muted-foreground">{d.name}</span>
                      {!d.measured && (
                        <span className="ml-1 text-xs border border-dashed border-muted-foreground/30 rounded px-1.5 py-0.5">
                          {d.phase}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/60 hidden md:inline">
                        {d.methodology}
                      </span>
                      <span className="font-mono tabular-nums text-xs min-w-[3rem] text-right">
                        {d.measured ? `${d.score}%` : '\u2014'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CEM Matrix */}
        {validation && (
          <Card>
            <CardHeader>
              <CardTitle>CEM Completeness: {validation.overallCompleteness}%</CardTitle>
              <CardDescription>Field-level validation of custom-elements.json</CardDescription>
            </CardHeader>
            <CardContent>
              <CemMatrix validation={validation} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Branch Health Diff (MCP) */}
      {mcpDiff && <BranchDiffView diff={mcpDiff} />}

      {/* A11y Comparison: Admin vs MCP */}
      {a11y && mcpA11y && (
        <McpA11yComparison
          adminChecks={a11y.checks}
          adminScore={a11y.score}
          hasAxeResults={a11y.hasAxeResults}
          mcpProfile={mcpA11y}
        />
      )}

      {/* JSDoc + Drift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jsDoc && (
          <Card>
            <CardHeader>
              <CardTitle>JSDoc Coverage: {jsDoc.coveragePercent}%</CardTitle>
              <CardDescription>Source file: {jsDoc.sourceFile}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScoreBar
                score={jsDoc.propertyDocs > 0 ? 100 : 0}
                label={`Properties (${jsDoc.propertyDocs} documented)`}
              />
              <ScoreBar
                score={jsDoc.eventDocs > 0 ? 100 : 0}
                label={`Events (${jsDoc.eventDocs} documented)`}
              />
              <ScoreBar
                score={jsDoc.slotDocs > 0 ? 100 : 0}
                label={`Slots (${jsDoc.slotDocs} documented)`}
              />
              <ScoreBar
                score={jsDoc.cssPropDocs > 0 ? 100 : 0}
                label={`CSS Properties (${jsDoc.cssPropDocs} documented)`}
              />
              <ScoreBar
                score={jsDoc.cssPartDocs > 0 ? 100 : 0}
                label={`CSS Parts (${jsDoc.cssPartDocs} documented)`}
              />
              <div className="flex gap-2 pt-2">
                <Badge variant={jsDoc.classDescription ? 'success' : 'warning'}>
                  {jsDoc.classDescription ? 'Has Description' : 'Missing Description'}
                </Badge>
                <Badge variant={jsDoc.classSummary ? 'success' : 'warning'}>
                  {jsDoc.classSummary ? 'Has Summary' : 'Missing Summary'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {drift && (
          <Card>
            <CardHeader>
              <CardTitle>
                Drift Detection
                {drift.hasDrift ? (
                  <Badge variant="warning" className="ml-2">
                    {drift.driftCount} issues
                  </Badge>
                ) : (
                  <Badge variant="success" className="ml-2">
                    In Sync
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Comparing JSDoc source annotations against CEM output
              </CardDescription>
            </CardHeader>
            <CardContent>
              {drift.driftItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No drift detected. JSDoc and CEM are in sync.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>In JSDoc</TableHead>
                      <TableHead>In CEM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drift.driftItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{item.name}</TableCell>
                        <TableCell>
                          {item.inJsDoc ? (
                            <span className="text-emerald-400">&#10003;</span>
                          ) : (
                            <span className="text-red-400">&#10007;</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.inCem ? (
                            <span className="text-emerald-400">&#10003;</span>
                          ) : (
                            <span className="text-red-400">&#10007;</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>
              Test Coverage: {testResults.passRate}%
              <Badge
                variant={testResults.failed === 0 ? 'success' : 'destructive'}
                className="ml-2"
              >
                {testResults.failed === 0 ? 'All Passing' : `${testResults.failed} Failed`}
              </Badge>
            </CardTitle>
            <CardDescription>
              {testResults.total} tests, {testResults.totalDuration}ms total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Status</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Suite</TableHead>
                  <TableHead className="w-20 text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testResults.tests.map((test) => (
                  <TableRow key={test.fullName}>
                    <TableCell>
                      {test.status === 'pass' ? (
                        <span className="text-emerald-400">&#10003;</span>
                      ) : test.status === 'fail' ? (
                        <span className="text-red-400">&#10007;</span>
                      ) : (
                        <span className="text-amber-400">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{test.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {test.suite}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {test.duration}ms
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Accessibility Detail */}
      {a11y && (
        <Card>
          <CardHeader>
            <CardTitle>
              Accessibility: {a11y.score}%
              <Badge variant={a11y.hasAxeResults ? 'success' : 'warning'} className="ml-2">
                {a11y.hasAxeResults ? 'axe-core verified' : 'Static analysis only'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {a11y.hasAxeResults
                ? `Runtime: ${a11y.axePassCount} axe rules pass, ${a11y.axeViolationCount} violations. Static: ${a11y.passedChecks}/${a11y.totalChecks} checks.`
                : `Static analysis: ${a11y.passedChecks}/${a11y.totalChecks} pattern checks. Add axe-core tests for verified scoring.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {a11y.checks.map((check) => (
                <div key={check.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {check.passed ? (
                      <span className="text-emerald-400">&#10003;</span>
                    ) : (
                      <span className="text-red-400">&#10007;</span>
                    )}
                    <span className="text-muted-foreground">{check.name}</span>
                    <span className="text-[10px] text-muted-foreground/50">
                      (weight: {check.weight})
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground max-w-[300px] text-right">
                    {check.detail}
                  </span>
                </div>
              ))}
            </div>
            {!a11y.hasAxeResults && (
              <div className="mt-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <p className="text-xs text-amber-400">
                  Static analysis only. Run{' '}
                  <code className="bg-amber-500/10 px-1 rounded">npm run test:library</code> to
                  generate axe-core runtime results for verified scoring.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Source Info */}
      {source.exists && (
        <Card>
          <CardHeader>
            <CardTitle>Source Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Lines</span>
                <p className="font-mono">{source.lineCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Size</span>
                <p className="font-mono">{(source.sizeBytes / 1024).toFixed(1)} KB</p>
              </div>
              <div>
                <span className="text-muted-foreground">Modified</span>
                <p className="font-mono text-xs">
                  {source.lastModified?.toLocaleDateString() ?? '\u2014'}
                </p>
              </div>
              <div className="flex gap-2 items-start">
                <Badge variant={source.hasStyles ? 'success' : 'outline'}>Styles</Badge>
                <Badge variant={source.hasStories ? 'success' : 'outline'}>Stories</Badge>
                <Badge variant={source.hasIndex ? 'success' : 'outline'}>Index</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Tables */}
      {data.properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Attribute</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Reflects</TableHead>
                  <TableHead className="max-w-[300px]">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.properties.map((prop) => (
                  <TableRow key={prop.name}>
                    <TableCell className="font-mono text-xs">{prop.name}</TableCell>
                    <TableCell className="font-mono text-xs">{prop.attribute}</TableCell>
                    <TableCell className="font-mono text-xs text-primary">{prop.type}</TableCell>
                    <TableCell className="font-mono text-xs">{prop.default}</TableCell>
                    <TableCell>
                      {prop.reflects ? (
                        <span className="text-emerald-400 text-xs">&#10003;</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">\u2014</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-[300px]">{prop.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.events.map((event) => (
                  <TableRow key={event.name}>
                    <TableCell className="font-mono text-xs">{event.name}</TableCell>
                    <TableCell className="font-mono text-xs text-primary">{event.type}</TableCell>
                    <TableCell className="text-xs">{event.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slots.map((slot) => (
                  <TableRow key={slot.name}>
                    <TableCell className="font-mono text-xs">{slot.name}</TableCell>
                    <TableCell className="text-xs">{slot.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.cssProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CSS Custom Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cssProperties.map((prop) => (
                  <TableRow key={prop.name}>
                    <TableCell className="font-mono text-xs">{prop.name}</TableCell>
                    <TableCell className="font-mono text-xs">{prop.default}</TableCell>
                    <TableCell className="text-xs">{prop.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.cssParts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>CSS Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cssParts.map((part) => (
                  <TableRow key={part.name}>
                    <TableCell className="font-mono text-xs">{part.name}</TableCell>
                    <TableCell className="text-xs">{part.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

function ConfidenceIcon({ confidence }: { confidence: 'verified' | 'heuristic' | 'untested' }) {
  if (confidence === 'verified') {
    return (
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400"
        title="Verified: real runtime/build data"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5L4.5 7.5L8 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (confidence === 'heuristic') {
    return (
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-400"
        title="Heuristic: static analysis"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M1 3H9"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
          <path
            d="M1 7H9"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500/20 text-red-400"
      title="Untested: no data"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="8" r="0.75" fill="currentColor" />
      </svg>
    </span>
  );
}
