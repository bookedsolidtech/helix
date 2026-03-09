# Component Doc Page Template

> **Usage:** Copy this template when writing a new component doc page under
> `apps/docs/src/content/docs/component-library/`. Replace every
> `<!-- PLACEHOLDER -->` comment with real content pulled from the component
> source and CEM output (`packages/hx-library/custom-elements.json`).
>
> The rendered file must be `.mdx` so it can import Astro components.
> Rename this file `hx-<component-name>.mdx` and delete this callout block.

---

````mdx
---
title: 'hx-<component-name>'
description: <!-- ONE-LINE DESCRIPTION: what the component does -->
---

import ComponentLoader from '../../../components/ComponentLoader.astro';
import ComponentDemo from '../../../components/ComponentDemo.astro';
import ComponentDoc from '../../../components/ComponentDoc.astro';

<!-- Injects the component bundle into the page so live demos work. Required. -->

<ComponentLoader />

<!-- Renders the CEM-derived summary paragraph for this component. -->

<ComponentDoc tagName="hx-<component-name>" section="summary" />

## Overview

<!-- COMPONENT OVERVIEW
  Brief description (2–4 sentences):
  - What problem it solves
  - Typical use cases in a healthcare or enterprise UI
  - When to prefer this component over alternatives (e.g. "use hx-button for
    actions; use hx-link when navigating the user to another page")
-->

## Live Demo

<!-- Add ComponentDemo blocks for the most important variants.
     Each demo title appears as a visible label above the live preview.
     Use real hx-* attributes, not placeholder values. -->

<ComponentDemo title="<!-- DEMO TITLE -->">
  <!-- hx-<component-name> usage here -->
</ComponentDemo>

<!-- Add more <ComponentDemo> blocks for additional variants / states. -->

## Installation

Install the full library or import the component individually:

```bash
# Full library
npm install @helix/library

# Or import only this component (tree-shaking friendly)
import '@helix/library/components/hx-<component-name>';
```
````

## Basic Usage

Minimal HTML snippet — no build tool required:

```html
<!-- REPLACE with the simplest meaningful use of the component -->
<hx-<component-name>><!-- content --></hx-<component-name>>
```

## Properties

<!-- PROPERTIES TABLE
  Pull from CEM: custom-elements.json → members where kind = "field".
  Include every @property-decorated member in the component class.
  Omit private/internal members.
-->

| Property          | Attribute          | Type                  | Default        | Description          |
| ----------------- | ------------------ | --------------------- | -------------- | -------------------- |
| <!-- propName --> | <!-- attr-name --> | <!-- `'a' \| 'b'` --> | <!-- `'a'` --> | <!-- Description --> |

## Events

<!-- EVENTS TABLE
  Pull from CEM: custom-elements.json → events[].
  Include every @fires / dispatchEvent call documented in the source.
-->

| Event                    | Detail Type              | Description            |
| ------------------------ | ------------------------ | ---------------------- |
| <!-- `hx-event-name` --> | <!-- `{ key: Type }` --> | <!-- When it fires --> |

## CSS Custom Properties

<!-- CSS CUSTOM PROPERTIES TABLE
  Pull from CEM: custom-elements.json → cssProperties[].
  Document every @cssprop in the component JSDoc.
-->

| Property                            | Default                  | Description               |
| ----------------------------------- | ------------------------ | ------------------------- |
| <!-- `--hx-<component>-<token>` --> | <!-- `var(--hx-...)` --> | <!-- What it controls --> |

## CSS Parts

<!-- CSS PARTS TABLE
  Pull from CEM: custom-elements.json → cssParts[].
  Document every @csspart in the component JSDoc.
-->

| Part                 | Description                      |
| -------------------- | -------------------------------- |
| <!-- `part-name` --> | <!-- What element it targets --> |

## Slots

<!-- SLOTS TABLE
  Pull from CEM: custom-elements.json → slots[].
  List the default (unnamed) slot first, then named slots.
-->

| Slot                 | Description                                      |
| -------------------- | ------------------------------------------------ |
| _(default)_          | <!-- Content placed without a slot attribute --> |
| <!-- `slot-name` --> | <!-- Purpose of named slot -->                   |

## Accessibility

<!-- ACCESSIBILITY SECTION
  Cover ALL of the following (delete rows that don't apply):
  - ARIA role applied by the component
  - aria-* attributes set automatically
  - Keyboard interactions (Tab, Enter, Space, Arrow keys, Escape, etc.)
  - Screen reader announcements
  - Focus management on open/close/select
  - Any WCAG 2.1 AA requirements specific to this component
-->

| Topic         | Details                                       |
| ------------- | --------------------------------------------- |
| ARIA role     | <!-- e.g. `button`, `combobox`, `dialog` -->  |
| Keyboard      | <!-- Tab / Enter / Space / Arrow behavior --> |
| Screen reader | <!-- What is announced and when -->           |
| Focus         | <!-- Where focus moves on interaction -->     |

## Drupal Integration

Use the component in a Twig template after registering the library:

```twig
{# my-module/templates/my-template.html.twig #}

{# REPLACE with a real Twig example for this component #}
<hx-<component-name>
  <!-- attribute="value" -->
>
  {{ label }}
</hx-<component-name>>
```

Load the library in your module's `.libraries.yml`:

```yaml
helix-components:
  js:
    /libraries/helix/helix.min.js: { minified: true }
```

Listen for events in Drupal behaviors using `once()` to prevent duplicate listeners on AJAX:

```javascript
Drupal.behaviors.myComponent = {
  attach(context) {
    // once() is a Drupal core utility (no import needed) — prevents duplicate event binding during AJAX attach cycles
    once('myComponent', 'hx-<component-name>', context).forEach((el) => {
      el.addEventListener('hx-<event>', (e) => {
        // handle event
      });
    });
  },
};
```

## Standalone HTML Example

Copy-paste this into a `.html` file and open it in a browser — no build tool needed:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>hx-<component-name> example</title>
  <!-- @helix/library is a private package — install via npm workspace, not CDN -->
  <!-- In your project: import '@helix/library'; in your bundler entry point -->
</head>
<body>
  <!-- REPLACE with a complete, realistic usage example -->
  <hx-<component-name>
    <!-- attribute="value" -->
  >
    <!-- content -->
  </hx-<component-name>>

  <script>
    // Optional: listen for component events
    document.querySelector('hx-<component-name>').addEventListener('hx-<event>', (e) => {
      console.log('Event detail:', e.detail);
    });
  </script>
</body>
</html>
```

## API Reference

<!-- Renders the full CEM-driven API table (properties, events, slots, parts). -->
<ComponentDoc tagName="hx-<component-name>" section="api" />
```
