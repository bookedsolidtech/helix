import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tokenEntries } from '@helixui/tokens';
import { getTokensByPrefix } from '@helixui/tokens/utils';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getTokenBreadcrumbs } from '@/lib/breadcrumb-utils';

export default function TypographyPage() {
  const allTokens = tokenEntries;
  const families = getTokensByPrefix(allTokens, '--wc-font-family-');
  const sizes = getTokensByPrefix(allTokens, '--wc-font-size-');
  const weights = getTokensByPrefix(allTokens, '--wc-font-weight-');
  const lineHeights = getTokensByPrefix(allTokens, '--wc-line-height-');

  const total = families.length + sizes.length + weights.length + lineHeights.length;

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getTokenBreadcrumbs('typography')} />
        <h1 className="text-2xl font-bold tracking-tight">Typography</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{total} typography tokens</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Font Families
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {families.map((token) => (
                <div key={token.name}>
                  <p className="text-xs font-mono text-muted-foreground mb-1">{token.name}</p>
                  <p className="text-sm text-foreground break-all">{token.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Font Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sizes.map((token) => (
                <div key={token.name} className="flex items-baseline justify-between gap-4">
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    {token.key}
                  </span>
                  <span className="text-foreground truncate" style={{ fontSize: token.value }}>
                    The quick brown fox
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {token.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Font Weights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weights.map((token) => (
                <div key={token.name} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-mono text-muted-foreground">{token.key}</span>
                  <span
                    className="text-foreground"
                    style={{
                      fontWeight: parseInt(token.value, 10) || token.value,
                    }}
                  >
                    Aa Bb Cc
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{token.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Line Heights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineHeights.map((token) => (
                <div key={token.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{token.key}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {token.value}
                    </span>
                  </div>
                  <p
                    className="text-sm text-foreground bg-secondary/50 rounded px-2 py-1"
                    style={{ lineHeight: token.value }}
                  >
                    Line height demonstration text that wraps to show the vertical rhythm of this
                    setting across multiple lines.
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
