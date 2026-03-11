import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tokenEntries, tokensByCategory, tokenMap } from '@helixui/tokens';
import { getTokenStats, isHexColor, resolveTokenRef } from '@helixui/tokens/utils';
import { Hash, Layers, Link2, FileJson2 } from 'lucide-react';
import { TokenReferenceTable } from '@/components/tokens/TokenReferenceTable';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getBreadcrumbItems } from '@/lib/breadcrumb-utils';

export default function TokensDashboard() {
  const allTokens = tokenEntries;
  const stats = getTokenStats(allTokens);

  const referencingTokens = allTokens.filter((t) => t.value.includes('var(')).length;
  const coveragePercent =
    allTokens.length > 0 ? Math.round((referencingTokens / allTokens.length) * 100) : 0;

  // Build category groups for the reference table
  const categoryGroups = Object.entries(tokensByCategory)
    .map(([category, tokens]) => ({
      category,
      tokens,
      hasColors: tokens.some((t) => isHexColor(resolveTokenRef(t.value, tokenMap))),
      hasRefs: tokens.some((t) => t.value.includes('var(')),
    }))
    .sort((a, b) => b.tokens.length - a.tokens.length);

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getBreadcrumbItems('/tokens')} />
        <h1 className="text-2xl font-bold tracking-tight">Design Tokens</h1>
        <p className="text-muted-foreground mt-1">
          {allTokens.length} tokens from{' '}
          <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">
            @helixui/tokens
          </code>
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Hash className="w-3.5 h-3.5" />}
          label="Total Tokens"
          value={allTokens.length}
        />
        <StatCard
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Categories"
          value={Object.keys(stats.byCategory).length}
        />
        <StatCard
          icon={<Link2 className="w-3.5 h-3.5" />}
          label="Cross-References"
          value={referencingTokens}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FileJson2 className="w-3.5 h-3.5" />
              Source Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-xs">
              JSON (DTCG)
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Token Coverage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Token Cross-Reference Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {referencingTokens} of {allTokens.length} tokens reference other tokens via{' '}
                  <code className="font-mono">var()</code>
                </span>
                <span className="text-sm font-bold tabular-nums">{coveragePercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${coveragePercent}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Reference — grouped + collapsible */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Token Reference</h2>
        <TokenReferenceTable groups={categoryGroups} />
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
