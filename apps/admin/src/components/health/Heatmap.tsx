'use client';

import { ComponentHealth } from '@/lib/health-scorer';
import { cn } from '@/lib/utils';

interface HeatmapProps {
  components: ComponentHealth[];
  onSelectComponent: (component: ComponentHealth) => void;
}

export function Heatmap({ components, onSelectComponent }: HeatmapProps) {
  if (components.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No components to display
      </div>
    );
  }

  // Get all unique dimension names (in order of first component)
  const dimensionNames = components[0]?.dimensions.map((d) => d.name) ?? [];

  const getCellColor = (score: number | null, measured: boolean) => {
    if (!measured || score === null) {
      return 'bg-gray-500/20';
    }
    if (score >= 90) return 'bg-emerald-500/60';
    if (score >= 70) return 'bg-amber-500/50';
    if (score >= 50) return 'bg-orange-500/50';
    return 'bg-red-500/50';
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `200px repeat(${dimensionNames.length}, 60px)` }}
        >
          {/* Header Row */}
          <div className="sticky left-0 z-10 bg-background p-2" />
          {dimensionNames.map((name) => (
            <div
              key={name}
              className="p-2 text-[10px] font-medium text-muted-foreground text-center"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              title={name}
            >
              {name}
            </div>
          ))}

          {/* Component Rows */}
          {components.map((component) => (
            <>
              {/* Component Name */}
              <button
                key={`${component.tagName}-name`}
                onClick={() => onSelectComponent(component)}
                className="sticky left-0 z-10 bg-background p-2 text-left text-xs font-mono text-foreground hover:bg-white/[0.04] transition-colors rounded truncate"
                title={component.tagName}
              >
                &lt;{component.tagName}&gt;
              </button>

              {/* Dimension Cells */}
              {component.dimensions.map((dimension) => (
                <button
                  key={`${component.tagName}-${dimension.name}`}
                  onClick={() => onSelectComponent(component)}
                  className={cn(
                    'h-12 rounded transition-all hover:scale-105 hover:shadow-lg cursor-pointer',
                    getCellColor(dimension.score, dimension.measured),
                  )}
                  title={`${component.tagName} - ${dimension.name}: ${dimension.measured && dimension.score !== null ? `${dimension.score}%` : 'Not measured'}`}
                />
              ))}
            </>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500/60" />
            <span>90-100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-amber-500/50" />
            <span>70-89%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-orange-500/50" />
            <span>50-69%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-500/50" />
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-gray-500/20" />
            <span>Not Measured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
