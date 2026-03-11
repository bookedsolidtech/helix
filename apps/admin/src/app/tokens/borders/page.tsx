import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tokenEntries } from '@helixui/tokens';
import { getTokensByPrefix } from '@helixui/tokens/utils';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getTokenBreadcrumbs } from '@/lib/breadcrumb-utils';

export default function BordersPage() {
  const allTokens = tokenEntries;
  const radii = getTokensByPrefix(allTokens, '--wc-border-radius-');
  const widths = getTokensByPrefix(allTokens, '--wc-border-width-');

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getTokenBreadcrumbs('borders')} />
        <h1 className="text-2xl font-bold tracking-tight">Borders</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {radii.length + widths.length} border tokens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Border Radius
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {radii.map((token) => (
                <div key={token.name} className="text-center">
                  <div
                    className="w-16 h-16 bg-emerald-400/20 border-2 border-emerald-400 mb-2"
                    style={{ borderRadius: token.value }}
                  />
                  <p className="text-xs font-mono text-muted-foreground">{token.key}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{token.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Border Width
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {widths.map((token) => (
                <div key={token.name} className="flex items-center gap-4">
                  <div
                    className="flex-1 border-emerald-400"
                    style={{
                      borderBottomWidth: token.value,
                      borderBottomStyle: 'solid',
                    }}
                  />
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    {token.key}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {token.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
