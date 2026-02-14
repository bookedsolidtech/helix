---
title: Components Overview
description: Overview of the WC-2026 healthcare web component library
---

The WC-2026 component library provides **40+ planned Web Components** built with Lit 3.x and TypeScript, designed for healthcare content hubs. Three components (`wc-button`, `wc-card`, `wc-text-input`) are implemented as working prototypes in Phase 0.

## Component Categories

### Primitives (Foundation)

Core building blocks used by all other components:

- `wc-button` - Interactive buttons with variants and states
- `wc-icon` - SVG icon system with accessibility
- `wc-text` - Typography with semantic hierarchy
- `wc-heading` - Accessible heading levels (h1-h6)
- `wc-link` - Navigation links with external indicators
- `wc-badge` - Status indicators and labels

### Layout Components

Structure and spacing for page composition:

- `wc-card` - Content containers with elevation variants
- `wc-grid` - Responsive CSS Grid layouts
- `wc-stack` - Vertical/horizontal spacing
- `wc-container` - Max-width content wrapper
- `wc-divider` - Section separators

### Content Components

Rich content display for healthcare information:

- `wc-accordion` - Expandable content sections
- `wc-tabs` - Tabbed content navigation
- `wc-alert` - Status messages and notifications
- `wc-callout` - Important information highlights
- `wc-image` - Responsive images with lazy loading

### Form Components

Accessible form controls with ElementInternals:

- `wc-text-input` - Text inputs with validation
- `wc-select` - Dropdown selections
- `wc-checkbox` - Checkbox with label
- `wc-radio-group` - Radio button groups
- `wc-textarea` - Multi-line text input

### Navigation Components

Site navigation and wayfinding:

- `wc-breadcrumb` - Breadcrumb navigation
- `wc-pagination` - Page navigation
- `wc-nav` - Primary navigation
- `wc-skip-link` - Accessibility skip navigation

## Component Status

| Status | Meaning |
|--------|---------|
| Planned | Architecture defined, not yet implemented |
| In Development | Active implementation |
| Beta | Feature complete, testing in progress |
| Stable | Production ready |

All components are currently in **Planned** status. Implementation begins in Phase 2.

## Next Steps

- [Building Components](/components/building/) - How to create new components
- [Component API](/components/api/) - API conventions and patterns
- [Pre-Planning: Component Architecture](/pre-planning/components/) - Full specification
