import { tokenEntries } from '@helixui/tokens';
import { getTokensByPrefix } from '@helixui/tokens/utils';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getTokenBreadcrumbs } from '@/lib/breadcrumb-utils';

export default function ShadowsPage() {
  const shadows = getTokensByPrefix(tokenEntries, '--wc-shadow-');

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getTokenBreadcrumbs('shadows')} />
        <h1 className="text-2xl font-bold tracking-tight">Shadows</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {shadows.length} shadow elevation levels
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {shadows.map((token) => (
          <div key={token.name} className="text-center">
            <div
              className="h-24 rounded-lg bg-card border border-border mb-3"
              style={{ boxShadow: token.value }}
            />
            <p className="text-xs font-mono text-muted-foreground">{token.key}</p>
            <p className="text-xs text-muted-foreground mt-0.5 break-all">{token.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
