# HELiX Light DOM Style Injection — Usage Examples

## Basic Card with Slotted Body Content

```twig
{# node--article--card.html.twig #}
{% import '@helix/hx-style-scope.macro.twig' as hx %}

<hx-card>
  <span slot="heading">{{ node.label }}</span>
  {{ hx.scope('hx-card', content.body) }}
</hx-card>
```

## Multiple Components on One Page

Each component type injects its stylesheet only once, regardless of how many
instances appear on the page:

```twig
{# views--row--cards.html.twig #}
{% import '@helix/hx-style-scope.macro.twig' as hx %}

{% for item in rows %}
  <hx-card>
    {{ hx.scope('hx-card', item.content) }}
  </hx-card>
{% endfor %}
{#
  Even with 50 cards, only one <style data-hx-light-styles="hx-card"> is injected.
#}
```

## Prose Content in a Dialog

```twig
<hx-dialog label="Patient Instructions">
  <hx-style-scope component="hx-dialog" data-hx-styled="hx-dialog">
    {{ content.field_instructions }}
  </hx-style-scope>
</hx-dialog>
```

## Custom Light CSS Override

Use `light-css` to inject additional scoped styles beyond the component defaults:

```twig
<hx-style-scope
  component="hx-card"
  light-css="p { color: var(--hx-color-text-muted); font-style: italic; }"
  data-hx-styled="hx-card"
>
  {{ content.disclaimer }}
</hx-style-scope>
```

Injected into `document.head`:
```css
[data-hx-styled="hx-card"] p {
  color: var(--hx-color-text-muted);
  font-style: italic;
}
```

## Using SheetManager for Programmatic Control

```typescript
import { SheetManager } from '@helixui/library';

const manager = new SheetManager();

// Inject styles for multiple components
manager.inject('hx-card', cardLightCss);
manager.inject('hx-dialog', dialogLightCss);

console.log(manager.getInjectedCount()); // 2

// Clean up specific component
manager.cleanup('hx-card');

// Clean up all in teardown
manager.cleanupAll();
```

## Adopted Stylesheets (Browser Support Detection)

The `adoptedStylesheetRegistry` uses `document.adoptedStyleSheets` when available
(modern browsers) and falls back to `<style>` injection automatically:

```typescript
import { adoptedStylesheetRegistry } from '@helixui/library';

// Automatically uses the best available mechanism
adoptedStylesheetRegistry.register('hx-card', cardLightCss);
```
