import { cn } from '@/lib/utils';
import type { ComponentValidation, FieldStatus, SectionValidation } from '@/lib/cem-validator';

interface CemMatrixProps {
  validation: ComponentValidation;
}

function StatusDot({ status }: { status: FieldStatus }) {
  return (
    <div
      className={cn(
        'w-3 h-3 rounded-full',
        status === 'complete' && 'bg-emerald-400',
        status === 'partial' && 'bg-amber-400',
        status === 'missing' && 'bg-red-400',
      )}
      title={status}
    />
  );
}

function CheckCell({ checked }: { checked: boolean }) {
  return (
    <td className="px-2 py-1.5 text-center">
      {checked ? (
        <span className="text-emerald-400 text-xs">&#10003;</span>
      ) : (
        <span className="text-red-400 text-xs">&#10007;</span>
      )}
    </td>
  );
}

function SectionBlock({ section }: { section: SectionValidation }) {
  if (section.fields.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic py-1">
        No {section.section.toLowerCase()} defined
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">{section.section}</h4>
        <span
          className={cn(
            'text-xs font-mono tabular-nums',
            section.completeness >= 90
              ? 'text-emerald-400'
              : section.completeness >= 70
                ? 'text-amber-400'
                : 'text-red-400',
          )}
        >
          {section.completeness}%
        </span>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left py-1 px-2">Name</th>
            <th className="text-center py-1 px-2">Desc</th>
            <th className="text-center py-1 px-2">Type</th>
            <th className="text-center py-1 px-2">Default</th>
            <th className="text-center py-1 px-2">Attr</th>
            <th className="text-center py-1 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {section.fields.map((field) => (
            <tr key={field.name} className="border-b border-border/50">
              <td className="py-1.5 px-2 font-mono">{field.name}</td>
              <CheckCell checked={field.hasDescription} />
              <CheckCell checked={field.hasType} />
              <CheckCell checked={field.hasDefault} />
              <CheckCell checked={field.hasAttribute} />
              <td className="px-2 py-1.5 flex justify-center">
                <StatusDot status={field.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CemMatrix({ validation }: CemMatrixProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          Complete
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          Partial
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          Missing
        </div>
      </div>

      {validation.sections.map((section) => (
        <SectionBlock key={section.section} section={section} />
      ))}
    </div>
  );
}
