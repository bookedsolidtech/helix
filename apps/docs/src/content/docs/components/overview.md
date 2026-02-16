---
title: Components Overview
description: Overview of the HELIX enterprise web component library
---

The HELIX component library provides **40+ planned Web Components** built with Lit 3.x and TypeScript, designed for enterprise content platforms. Three components (`hx-button`, `hx-card`, `hx-text-input`) are implemented as working prototypes in Phase 0.

## Component Categories

### Primitives (Foundation)

Core building blocks used by all other components:

- `hx-button` - Interactive buttons with variants and states
- `hx-icon` - SVG icon system with accessibility
- `hx-text` - Typography with semantic hierarchy
- `hx-heading` - Accessible heading levels (h1-h6)
- `hx-link` - Navigation links with external indicators
- `hx-badge` - Status indicators and labels

### Layout Components

Structure and spacing for page composition:

- `hx-card` - Content containers with elevation variants
- `hx-grid` - Responsive CSS Grid layouts
- `hx-stack` - Vertical/horizontal spacing
- `hx-container` - Max-width content wrapper
- `hx-divider` - Section separators

### Content Components

Rich content display for editorial information:

- `hx-accordion` - Expandable content sections
- `hx-tabs` - Tabbed content navigation
- `hx-alert` - Status messages and notifications
- `hx-callout` - Important information highlights
- `hx-image` - Responsive images with lazy loading

### Form Components

Accessible form controls with ElementInternals:

- `hx-text-input` - Text inputs with validation
- `hx-select` - Dropdown selections
- `hx-checkbox` - Checkbox with label
- `hx-radio-group` - Radio button groups
- `hx-textarea` - Multi-line text input

### Navigation Components

Site navigation and wayfinding:

- `hx-breadcrumb` - Breadcrumb navigation
- `hx-pagination` - Page navigation
- `hx-nav` - Primary navigation
- `hx-skip-link` - Accessibility skip navigation

## Component Status

| Status         | Meaning                                   |
| -------------- | ----------------------------------------- |
| Planned        | Architecture defined, not yet implemented |
| In Development | Active implementation                     |
| Beta           | Feature complete, testing in progress     |
| Stable         | Production ready                          |

All components are currently in **Planned** status. Implementation begins in Phase 2.

## Next Steps

- [Building Components](/components/building/) - How to create new components
- [Component API](/components/api/) - API conventions and patterns
- [Pre-Planning: Component Architecture](/pre-planning/components/) - Full specification
