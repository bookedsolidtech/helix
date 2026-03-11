import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tokenEntries } from '@helixui/tokens';
import { getTokensByPrefix } from '@helixui/tokens/utils';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getTokenBreadcrumbs } from '@/lib/breadcrumb-utils';

export default function UtilitiesPage() {
  const allTokens = tokenEntries;
  const transitions = getTokensByPrefix(allTokens, '--wc-transition-');
  const focus = getTokensByPrefix(allTokens, '--wc-focus-');

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getTokenBreadcrumbs('utilities')} />
        <h1 className="text-2xl font-bold tracking-tight">Utilities</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {transitions.length + focus.length} utility tokens
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Transitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transitions.map((token) => (
              <div key={token.name} className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{token.key}</span>
                <Badge variant="secondary">{token.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Focus Ring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {focus.map((token) => (
              <div key={token.name} className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{token.name}</span>
                <span className="text-sm text-foreground font-mono">{token.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
