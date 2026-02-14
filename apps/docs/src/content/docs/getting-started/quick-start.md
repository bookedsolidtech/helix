---
title: Quick Start
description: Get up and running with WC-2026 web components in minutes
---

This guide walks you through creating your first WC-2026 component and using it in a page.

## Start the Dev Environment

```bash
# From the repository root
turbo run dev --filter=docs
```

The documentation site will be available at `http://localhost:4321`.

## Using Components

WC-2026 components are standard Web Components. They work in any HTML page:

```html
<script type="module" src="@wc-2026/library"></script>

<wc-card variant="elevated">
  <wc-heading level="2">Patient Resources</wc-heading>
  <wc-text>Find healthcare information and support services.</wc-text>
  <wc-button slot="actions" variant="primary">Learn More</wc-button>
</wc-card>
```

## Component Library (Coming in Phase 2)

The component library is under active development. See the [Pre-Planning documents](/pre-planning/) for the complete architecture and component specifications.

## Next Steps

- [Project Structure](/getting-started/project-structure/) - Understand the codebase
- [Component Architecture](/pre-planning/components/) - Deep dive into component design
- [Design Tokens](/design-tokens/overview/) - Learn the token system
