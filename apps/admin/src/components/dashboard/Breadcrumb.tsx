import Link from 'next/link';
import {
  ChevronRight,
  Home,
  Boxes,
  FileCheck2,
  Palette,
  Activity,
  ShieldCheck,
  Component,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BreadcrumbIconType } from '@/lib/breadcrumb-utils';

export interface BreadcrumbItem {
  label: string;
  href?: string; // Optional - omit for current page
  icon?: React.ReactNode; // Optional icon for visual clarity
  iconType?: BreadcrumbIconType; // Optional icon type identifier
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Maps icon type to the corresponding Lucide icon component.
 */
function getIconComponent(iconType?: BreadcrumbIconType): React.ReactNode {
  if (!iconType) return null;

  const iconProps = { className: 'w-4 h-4' };

  switch (iconType) {
    case 'home':
      return <Home {...iconProps} />;
    case 'components':
      return <Boxes {...iconProps} />;
    case 'tests':
      return <FileCheck2 {...iconProps} />;
    case 'tokens':
      return <Palette {...iconProps} />;
    case 'pipeline':
      return <Activity {...iconProps} />;
    case 'architecture':
      return <ShieldCheck {...iconProps} />;
    case 'component-tag':
      return <Component {...iconProps} />;
    case 'mcp':
      return <Cpu {...iconProps} />;
    default:
      return null;
  }
}

/**
 * Breadcrumb navigation component for hierarchical page navigation.
 *
 * @example
 * ```tsx
 * <Breadcrumb items={[
 *   { label: 'Home', href: '/', iconType: 'home' },
 *   { label: 'Components', href: '/components', iconType: 'components' },
 *   { label: 'hx-button', iconType: 'component-tag' } // Current page, no href
 * ]} />
 * ```
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  // Don't render if empty or only one item (just home)
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const hasHref = Boolean(item.href);
          const icon = item.icon || getIconComponent(item.iconType);

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" aria-hidden="true" />
              )}
              {hasHref ? (
                <Link
                  href={item.href ?? '#'}
                  className={cn(
                    'flex items-center gap-1.5 transition-colors hover:text-foreground',
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground',
                  )}
                >
                  {icon}
                  {item.label}
                </Link>
              ) : (
                <span
                  className="flex items-center gap-1.5 text-muted-foreground"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {icon}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
