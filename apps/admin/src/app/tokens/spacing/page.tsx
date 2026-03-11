import { Card, CardContent } from '@/components/ui/card';
import { tokenEntries, type TokenEntry } from '@helixui/tokens';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getTokenBreadcrumbs } from '@/lib/breadcrumb-utils';

export default function SpacingPage() {
  const spacingTokens = tokenEntries.filter((t) => t.category === 'space');

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getTokenBreadcrumbs('spacing')} />
        <h1 className="text-2xl font-bold tracking-tight">Spacing Scale</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {spacingTokens.length} spacing tokens from 0 to 4rem
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {spacingTokens.map((token) => (
              <SpacingBar key={token.name} token={token} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SpacingBar({ token }: { token: TokenEntry }) {
  const remMatch = token.value.match(/^([\d.]+)rem$/);
  const pxValue = remMatch ? parseFloat(remMatch[1]) * 16 : 0;
  const barWidth = Math.min(pxValue, 256);

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs font-mono text-muted-foreground w-8 text-right shrink-0 tabular-nums">
        {token.key}
      </span>
      <div className="flex-1 flex items-center gap-3">
        <div
          className="h-4 rounded bg-emerald-400/30 border border-emerald-400/50"
          style={{ width: `${barWidth}px`, minWidth: token.value === '0' ? '2px' : undefined }}
        />
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {token.value}
          {remMatch ? ` (${pxValue}px)` : ''}
        </span>
      </div>
    </div>
  );
}
