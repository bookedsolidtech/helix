# Breadcrumb Component Usage Guide

The `Breadcrumb` component provides hierarchical navigation for the Admin Dashboard.

## Files

- **Component**: `/apps/admin/src/components/dashboard/Breadcrumb.tsx`
- **Utilities**: `/apps/admin/src/lib/breadcrumb-utils.ts`

## Basic Usage

### Manual Breadcrumb Items

```tsx
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';

<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Components', href: '/components' },
    { label: 'hx-button' }, // Current page (no href)
  ]}
/>;
```

### Using Utility Functions

#### Component Detail Pages

```tsx
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getComponentBreadcrumbs } from '@/lib/breadcrumb-utils';

export default function ComponentDetailPage({ params }) {
  const { tag } = await params;

  return (
    <div>
      <Breadcrumb items={getComponentBreadcrumbs(tag)} />
      {/* Rest of page */}
    </div>
  );
}
```

**Output**: Home / Components / hx-button

#### Token Sub-Pages

```tsx
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getTokenBreadcrumbs } from '@/lib/breadcrumb-utils';

export default function ColorsPage() {
  return (
    <div>
      <Breadcrumb items={getTokenBreadcrumbs('colors')} />
      {/* Rest of page */}
    </div>
  );
}
```

**Output**: Home / Tokens / Colors

#### Generic Routes

```tsx
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getBreadcrumbItems } from '@/lib/breadcrumb-utils';

export default function ComponentsPage() {
  return (
    <div>
      <Breadcrumb items={getBreadcrumbItems('/components')} />
      {/* Rest of page */}
    </div>
  );
}
```

**Output**: Home / Components

## Behavior

- **Home page** (`/`): No breadcrumb is rendered
- **Top-level pages** (e.g., `/components`, `/tests`): Shows "Home / {Page Name}"
- **Component detail** (e.g., `/components/hx-badge`): Shows "Home / Components / hx-badge"
- **Token sub-pages** (e.g., `/tokens/colors`): Shows "Home / Tokens / Colors"

## Accessibility

- Uses semantic `<nav>` with `aria-label="Breadcrumb"`
- Current page has `aria-current="page"` attribute
- Separators use `aria-hidden="true"`

## Styling

- Uses Tailwind classes consistent with the dashboard design
- Chevron (`›`) separator from lucide-react
- Links have hover states (transitions to foreground color)
- Current page is muted and non-interactive
- Compact `text-sm` size

## Route Configuration

Supported routes are defined in `/apps/admin/src/lib/breadcrumb-utils.ts`:

```typescript
const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/components': 'Components',
  '/tests': 'Test Theater',
  '/tokens': 'Tokens',
  '/tokens/colors': 'Colors',
  '/tokens/spacing': 'Spacing',
  '/tokens/typography': 'Typography',
  '/tokens/borders': 'Borders',
  '/tokens/shadows': 'Shadows',
  '/tokens/utilities': 'Utilities',
  '/pipeline': 'Pipeline',
  '/architecture': 'Architecture',
};
```

To add new routes, update this configuration.

## Integration Examples

### Pages Currently Using Breadcrumbs

1. `/apps/admin/src/app/components/page.tsx` - Components list
2. `/apps/admin/src/app/components/[tag]/page.tsx` - Component detail
3. `/apps/admin/src/app/tests/page.tsx` - Test Theater
4. `/apps/admin/src/app/tokens/page.tsx` - Tokens overview
5. `/apps/admin/src/app/tokens/colors/page.tsx` - Color tokens
6. `/apps/admin/src/app/tokens/spacing/page.tsx` - Spacing tokens
7. `/apps/admin/src/app/tokens/typography/page.tsx` - Typography tokens
8. `/apps/admin/src/app/tokens/borders/page.tsx` - Border tokens
9. `/apps/admin/src/app/tokens/shadows/page.tsx` - Shadow tokens
10. `/apps/admin/src/app/tokens/utilities/page.tsx` - Utility tokens

### Adding to a New Page

```tsx
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getBreadcrumbItems } from '@/lib/breadcrumb-utils';

export default function MyNewPage() {
  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getBreadcrumbItems('/my-route')} />
        <h1 className="text-2xl font-bold tracking-tight">My Page Title</h1>
        <p className="text-muted-foreground mt-1">Page description</p>
      </div>
      {/* Rest of content */}
    </div>
  );
}
```

## TypeScript Types

```typescript
export interface BreadcrumbItem {
  label: string;
  href?: string; // Optional - omit for current page
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}
```

## Notes

- The breadcrumb automatically hides if there's only one item (just Home)
- Component tags (starting with `hx-`) are preserved as-is
- Other segments are automatically formatted (kebab-case to Title Case)
- The last item in the breadcrumb is always the current page and is non-interactive
