import type { BreadcrumbItem } from '@/components/dashboard/Breadcrumb';

/**
 * Route configuration for breadcrumb generation.
 * Maps route patterns to human-readable labels.
 */
const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/components': 'Components',
  '/tests': 'Verification Suite',
  '/tokens': 'Tokens',
  '/tokens/colors': 'Colors',
  '/tokens/spacing': 'Spacing',
  '/tokens/typography': 'Typography',
  '/tokens/borders': 'Borders',
  '/tokens/shadows': 'Shadows',
  '/tokens/utilities': 'Utilities',
  '/pipeline': 'Pipeline',
  '/roadmap': 'Issue Tracker',
  '/architecture': 'Architecture',
  '/hooks': 'Hooks & MCP Servers',
  '/mcp': 'MCP Server',
};

/**
 * Icon type identifiers for routes.
 * Used by consumers to determine which icon to render.
 */
export type BreadcrumbIconType =
  | 'home'
  | 'components'
  | 'tests'
  | 'tokens'
  | 'pipeline'
  | 'roadmap'
  | 'architecture'
  | 'hooks'
  | 'mcp'
  | 'component-tag';

/**
 * Maps route patterns to their corresponding icon types.
 */
function getIconTypeForRoute(
  path: string,
  isComponentTag: boolean = false,
): BreadcrumbIconType | undefined {
  if (isComponentTag) {
    return 'component-tag';
  }

  switch (path) {
    case '/':
      return 'home';
    case '/components':
      return 'components';
    case '/tests':
      return 'tests';
    case '/tokens':
    case '/tokens/colors':
    case '/tokens/spacing':
    case '/tokens/typography':
    case '/tokens/borders':
    case '/tokens/shadows':
    case '/tokens/utilities':
      return 'tokens';
    case '/pipeline':
      return 'pipeline';
    case '/roadmap':
      return 'pipeline';
    case '/architecture':
      return 'architecture';
    case '/hooks':
      return 'hooks';
    case '/mcp':
      return 'mcp';
    default:
      return undefined;
  }
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats a URL segment into a readable label.
 * Handles kebab-case, camelCase, and component tags.
 *
 * @example
 * formatSegment('hx-button') => 'hx-button'
 * formatSegment('my-page') => 'My Page'
 */
function formatSegment(segment: string): string {
  // If it starts with 'hx-', keep it as-is (component tag)
  if (segment.startsWith('hx-')) {
    return segment;
  }

  // Otherwise, split by hyphens and capitalize
  return segment
    .split('-')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Generates breadcrumb items from a pathname.
 *
 * @param pathname - The current URL pathname (from usePathname() or similar)
 * @param componentTag - Optional: For dynamic routes like `/components/[tag]`, provide the tag
 * @returns Array of breadcrumb items
 *
 * @example
 * ```ts
 * // Static route
 * getBreadcrumbItems('/tokens/colors')
 * // => [{ label: 'Home', href: '/' }, { label: 'Tokens', href: '/tokens' }, { label: 'Colors' }]
 *
 * // Dynamic route
 * getBreadcrumbItems('/components/hx-button', 'hx-button')
 * // => [{ label: 'Home', href: '/' }, { label: 'Components', href: '/components' }, { label: 'hx-button' }]
 * ```
 */
export function getBreadcrumbItems(pathname: string, componentTag?: string): BreadcrumbItem[] {
  // Home page - no breadcrumb needed
  if (pathname === '/') {
    return [];
  }

  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/', iconType: getIconTypeForRoute('/') },
  ];

  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items progressively
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Check if this is a known route
    const knownLabel = ROUTE_LABELS[currentPath];

    if (knownLabel) {
      items.push({
        label: knownLabel,
        href: isLast ? undefined : currentPath,
        iconType: getIconTypeForRoute(currentPath),
      });
    } else if (segment === '[tag]' && componentTag) {
      // Handle dynamic component tag route
      items.push({
        label: componentTag,
        href: undefined, // Current page
        iconType: getIconTypeForRoute(currentPath, true),
      });
    } else {
      // Fallback: format the segment
      items.push({
        label: formatSegment(segment),
        href: isLast ? undefined : currentPath,
        iconType: getIconTypeForRoute(currentPath),
      });
    }
  });

  return items;
}

/**
 * Generates breadcrumb items for a component detail page.
 *
 * @param componentTag - The component tag name (e.g., 'hx-button')
 * @returns Array of breadcrumb items
 *
 * @example
 * ```ts
 * getComponentBreadcrumbs('hx-button')
 * // => [{ label: 'Home', href: '/' }, { label: 'Components', href: '/components' }, { label: 'hx-button' }]
 * ```
 */
export function getComponentBreadcrumbs(componentTag: string): BreadcrumbItem[] {
  return [
    { label: 'Home', href: '/', iconType: getIconTypeForRoute('/') },
    { label: 'Components', href: '/components', iconType: getIconTypeForRoute('/components') },
    { label: componentTag, iconType: getIconTypeForRoute('', true) },
  ];
}

/**
 * Generates breadcrumb items for a token sub-page.
 *
 * @param category - The token category (e.g., 'colors', 'spacing')
 * @returns Array of breadcrumb items
 *
 * @example
 * ```ts
 * getTokenBreadcrumbs('colors')
 * // => [{ label: 'Home', href: '/' }, { label: 'Tokens', href: '/tokens' }, { label: 'Colors' }]
 * ```
 */
export function getTokenBreadcrumbs(category: string): BreadcrumbItem[] {
  const label = ROUTE_LABELS[`/tokens/${category}`] || capitalize(category);
  const tokenPath = `/tokens/${category}`;

  return [
    { label: 'Home', href: '/', iconType: getIconTypeForRoute('/') },
    { label: 'Tokens', href: '/tokens', iconType: getIconTypeForRoute('/tokens') },
    { label, iconType: getIconTypeForRoute(tokenPath) },
  ];
}
