import { cn } from '@/lib/utils';
import { tokenEntries, type TokenEntry } from '@helixui/tokens';
import { getColorSubgroups, isHexColor, getContrastColor } from '@helixui/tokens/utils';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getTokenBreadcrumbs } from '@/lib/breadcrumb-utils';

export default function ColorsPage() {
  const colorSubgroups = getColorSubgroups(tokenEntries);

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getTokenBreadcrumbs('colors')} />
        <h1 className="text-2xl font-bold tracking-tight">Color Palette</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {tokenEntries.filter((t) => t.category === 'color').length} color tokens across{' '}
          {colorSubgroups.length} palettes
        </p>
      </div>

      {colorSubgroups.map((subgroup) => (
        <section key={subgroup.label}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">{subgroup.label}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {subgroup.tokens.map((token) => (
              <ColorSwatch key={token.name} token={token} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ColorSwatch({ token }: { token: TokenEntry }) {
  const isHex = isHexColor(token.value);
  return (
    <div className="group">
      <div
        className={cn(
          'h-16 rounded-lg border border-border mb-2 transition-transform group-hover:scale-105',
          !isHex && 'bg-secondary',
        )}
        style={isHex ? { backgroundColor: token.value } : undefined}
      >
        {isHex && (
          <span
            className="text-xs font-mono px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: getContrastColor(token.value) }}
          >
            {token.value}
          </span>
        )}
      </div>
      <p className="text-xs font-mono text-foreground">{token.key}</p>
      <p className="text-xs text-muted-foreground">{token.value}</p>
    </div>
  );
}
