---
title: Components Overview
description: Overview of the HELIX enterprise web component library
---

The HELIX component library provides **87 production-ready Web Components** built with Lit 3.x and TypeScript, designed for enterprise content platforms with Drupal as the primary consumer.

## Component Categories

### Actions

Interactive controls for user input:

- `hx-button` - Interactive buttons with variants and states
- `hx-button-group` - Grouped button controls
- `hx-copy-button` - One-click clipboard copy
- `hx-link` - Navigation links with external indicators
- `hx-split-button` - Primary action with secondary dropdown
- `hx-toggle-button` - Toggleable pressed state button

### Navigation

Wayfinding and structural navigation:

- `hx-accordion` / `hx-accordion-item` - Expandable content sections
- `hx-breadcrumb` / `hx-breadcrumb-item` - Path navigation
- `hx-nav` / `hx-nav-item` - Primary navigation
- `hx-pagination` - Page navigation
- `hx-side-nav` - Side navigation panel
- `hx-steps` / `hx-step` - Step-by-step progress
- `hx-tabs` / `hx-tab` / `hx-tab-panel` - Tabbed content
- `hx-action-bar` - Contextual action toolbar
- `hx-top-nav` - Top navigation bar

### Form Controls

Accessible form inputs with `ElementInternals` form participation:

- `hx-text-input` - Text inputs with validation
- `hx-textarea` - Multi-line text input
- `hx-select` - Dropdown selections
- `hx-checkbox` / `hx-checkbox-group` - Checkbox controls
- `hx-radio` / `hx-radio-group` - Radio button groups
- `hx-switch` - Binary toggle
- `hx-number-input` - Numeric input with step controls
- `hx-slider` - Range slider
- `hx-color-picker` - Color selection
- `hx-date-picker` - Date selection
- `hx-time-picker` - Time selection
- `hx-combobox` - Autocomplete input
- `hx-file-upload` - File upload control
- `hx-field` / `hx-field-label` / `hx-help-text` - Form field wrappers
- `hx-form` - Form wrapper with validation coordination

### Data Display

Content presentation components:

- `hx-card` - Content containers with image, heading, body, footer slots
- `hx-data-table` - Sortable, filterable table
- `hx-list` / `hx-list-item` - Structured lists
- `hx-structured-list` / `hx-structured-list-row` - Key-value lists
- `hx-carousel` / `hx-carousel-item` - Content carousel
- `hx-code-snippet` - Syntax-highlighted code blocks
- `hx-rating` - Star rating display
- `hx-tag` - Label and category tags
- `hx-tree-view` / `hx-tree-item` - Hierarchical tree

### Feedback & Status

Notifications, progress, and status indicators:

- `hx-alert` - Status messages with ARIA semantics
- `hx-badge` - Compact status labels
- `hx-toast` / `hx-toast-stack` - Transient notifications
- `hx-progress-bar` - Linear progress indicator
- `hx-progress-ring` - Circular progress indicator
- `hx-meter` - Measurement gauge
- `hx-skeleton` - Loading placeholder
- `hx-spinner` - Loading spinner
- `hx-status-indicator` - Status dot with label

### Content & Media

Typography, imagery, and layout primitives:

- `hx-avatar` - User/entity avatar
- `hx-container` - Max-width content wrapper
- `hx-divider` - Section separator
- `hx-icon` - SVG icon system
- `hx-image` - Responsive image with lazy loading
- `hx-prose` - Rich text with typographic styling
- `hx-text` - Typography with semantic variants

### Overlays & Menus

Layered interface elements:

- `hx-dialog` - Modal dialog
- `hx-drawer` - Side panel overlay
- `hx-dropdown` - Dropdown trigger + panel
- `hx-menu` / `hx-menu-item` / `hx-menu-divider` - Menu system
- `hx-overflow-menu` - More-actions overflow
- `hx-popover` - Anchored popover panel
- `hx-popup` - Lightweight popup
- `hx-tooltip` - Hover/focus tooltip

### Layout

Structural layout primitives:

- `hx-grid` / `hx-grid-item` - CSS Grid layout
- `hx-split-panel` - Resizable split view
- `hx-stack` - Vertical/horizontal spacing

### Utility

Behind-the-scenes helpers:

- `hx-format-date` - Date formatting
- `hx-theme` - Theme scope controller
- `hx-visually-hidden` - Screen-reader-only content

## Next Steps

- [Building Components](/components/building/) - How to create new components
- [Component API](/components/api/) - API conventions and patterns
- [Component Library](/component-library/overview/) - Browse all components with live demos
