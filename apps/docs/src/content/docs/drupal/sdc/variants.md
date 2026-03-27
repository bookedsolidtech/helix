---
title: SDC Variants
description: CSS variant classes in component.yml props, generating variant-specific templates, HELiX component variant props, theme variants, and responsive variants.
sidebar:
  order: 3
---

SDC variants let site builders and content editors choose between visual treatments of the same content pattern — an editorial card vs. a featured card, a compact staff profile vs. a full one. This guide documents three variant strategies that work together in HELiX-based SDCs.

---

## Strategy 1: HELiX Component Variant Props

The simplest variant mechanism passes a variant value directly to a HELiX component's `variant` attribute. The component handles all visual changes internally through Shadow DOM styles and CSS custom properties.

### Define the prop in component.yml

```yaml
# components/article-teaser/article-teaser.component.yml
props:
  type: object
  properties:
    card_variant:
      type: string
      title: Card Visual Style
      enum: [default, elevated, outlined, filled]
      default: default
      description: Passed to hx-card's variant attribute.
```

### Use it in the template

```twig
{# components/article-teaser/article-teaser.twig #}
<hx-card variant="{{ card_variant|default('default') }}">
  {# ... #}
</hx-card>
```

### Pass it from a parent template

```twig
{# node--article--featured.html.twig — uses elevated card #}
{% include 'mytheme:article-teaser' with {
  title: node.label,
  url: url,
  card_variant: 'elevated',
  image: content.field_hero_image,
} only %}
```

```twig
{# node--article--teaser.html.twig — uses default card #}
{% include 'mytheme:article-teaser' with {
  title: node.label,
  url: url,
  card_variant: 'default',
} only %}
```

---

## Strategy 2: CSS Classes for Layout Variants

When a variant changes layout (not just color/shadow), add a CSS class to the SDC's wrapper element and define the layout variant in the SDC's CSS file.

### Define a layout_variant prop

```yaml
# components/staff-profile/staff-profile.component.yml
props:
  type: object
  properties:
    layout:
      type: string
      title: Card Layout
      enum: [card, horizontal, minimal]
      default: card
      description: Controls card layout orientation.
```

### Apply the class in the template

```twig
{# components/staff-profile/staff-profile.twig #}
<div class="staff-profile staff-profile--{{ layout|default('card') }}">
  <hx-card variant="outlined">
    {# ... #}
  </hx-card>
</div>
```

### CSS for layout variants

```css
/* components/staff-profile/staff-profile.css */

/* Default: stacked (photo above content) */
.staff-profile--card .staff-profile__photo {
  display: flex;
  justify-content: center;
  padding-bottom: var(--hx-space-4);
}

/* Horizontal: photo beside content */
.staff-profile--horizontal {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: var(--hx-space-4);
  align-items: start;
}

.staff-profile--horizontal .staff-profile__photo {
  grid-row: 1 / 3;
  padding: 0;
}

/* Minimal: name and role only, no photo */
.staff-profile--minimal hx-avatar {
  display: none;
}
```

---

## Strategy 3: Variant-Specific Templates (Twig Template Suggestions)

For variants with substantially different markup structure, use Drupal's template suggestion system to load a separate Twig file.

### Add template suggestions in a preprocess function

```php
/**
 * Implements hook_preprocess_node().
 */
function mytheme_preprocess_node(array &$variables): void {
  $node = $variables['node'];
  $view_mode = $variables['view_mode'];

  // Add suggestion: node--[bundle]--[view-mode].html.twig
  // Already provided by Drupal, but you can add SDC-specific suggestions:
  $variables['theme_hook_suggestions'][] =
    'node__' . $node->bundle() . '__' . $view_mode . '__helix';
}
```

### Separate template for a "featured" variant

```twig
{# node--article--featured--helix.html.twig #}
{# Uses a full-bleed card layout with larger media area #}
{% include 'mytheme:article-featured' with {
  title: node.label,
  url: url,
  summary: content.body[0]['#text']|striptags|trim|slice(0, 400),
  category: node.field_category.entity.label,
  image: content.field_hero_image,
  card_variant: 'filled',
} only %}
```

Requires a separate `article-featured` SDC for the full-bleed layout.

---

## Theme Variants

Different editorial themes (healthcare, research, editorial) can override the variant prop values exposed by SDCs to produce context-appropriate styling without changing SDC code.

### Define a theme_context prop

```yaml
# components/article-teaser/article-teaser.component.yml
props:
  type: object
  properties:
    theme_context:
      type: string
      title: Theme Context
      enum: [editorial, healthcare, research]
      default: editorial
```

### Derive component variant from theme context

```twig
{# components/article-teaser/article-teaser.twig #}
{% set variant_map = {
  'editorial': 'default',
  'healthcare': 'outlined',
  'research': 'elevated',
} %}
<hx-card variant="{{ variant_map[theme_context]|default('default') }}">
  {# ... #}
</hx-card>
```

### Set theme context in a preprocess function

```php
/**
 * Implements hook_preprocess_node().
 */
function mytheme_preprocess_node(array &$variables): void {
  $node = $variables['node'];

  // Map content type to theme context.
  $context_map = [
    'article' => 'editorial',
    'clinical_resource' => 'healthcare',
    'research_publication' => 'research',
  ];

  $variables['helix_theme_context'] = $context_map[$node->bundle()] ?? 'editorial';
}
```

```twig
{# node--article--teaser.html.twig #}
{% include 'mytheme:article-teaser' with {
  title: node.label,
  url: url,
  theme_context: helix_theme_context,
} only %}
```

---

## Responsive Variants

Responsive variants change component presentation based on viewport. Use CSS custom properties and container queries rather than separate variant props.

### Container-query-driven responsiveness

```css
/* components/article-teaser/article-teaser.css */

/* Enable container queries on the SDC root */
.article-teaser-container {
  container-type: inline-size;
  container-name: article-teaser;
}

/* Compact layout in small containers */
@container article-teaser (max-width: 360px) {
  hx-card {
    --hx-card-padding: var(--hx-space-3);
  }

  .article-teaser__summary {
    display: none;
  }
}

/* Full layout in wider containers */
@container article-teaser (min-width: 600px) {
  hx-card {
    --hx-card-media-height: 240px;
  }
}
```

```twig
{# Wrap in a container-query root #}
<div class="article-teaser-container">
  {% include 'mytheme:article-teaser' with { ... } only %}
</div>
```

### Viewport-based via a Twig prop

For cases where server-side logic controls the variant (e.g., different layouts for mobile REST API responses vs. full page renders):

```yaml
props:
  type: object
  properties:
    compact:
      type: boolean
      title: Compact Mode
      description: Reduce card density for narrow contexts.
      default: false
```

```twig
<hx-card
  variant="{{ compact ? 'outlined' : 'default' }}"
  class="{{ compact ? 'article-teaser--compact' : '' }}"
>
  {% if not compact and summary %}
    <p>{{ summary|escape }}</p>
  {% endif %}
</hx-card>
```

---

## Combining Variant Strategies

A production SDC typically combines all three strategies:

```yaml
# component.yml
props:
  properties:
    # Strategy 1: HELiX component variant
    card_variant:
      type: string
      enum: [default, elevated, outlined, filled]
      default: default

    # Strategy 2: Layout CSS class variant
    layout:
      type: string
      enum: [card, horizontal]
      default: card

    # Strategy 3: Theme context (drives template selection or variant mapping)
    theme_context:
      type: string
      enum: [editorial, healthcare, research]
      default: editorial

    # Responsive: compact flag
    compact:
      type: boolean
      default: false
```

```twig
{% set resolved_variant = card_variant|default('default') %}
{% if theme_context == 'healthcare' and card_variant is not defined %}
  {% set resolved_variant = 'outlined' %}
{% endif %}

<div class="article-teaser article-teaser--{{ layout|default('card') }}{% if compact %} article-teaser--compact{% endif %}">
  <hx-card variant="{{ resolved_variant }}">
    {# ... #}
  </hx-card>
</div>
```

---

## Best Practices

- **Prefer HELiX variant props** for color/shadow/elevation changes — they are design-system governed and accessible by default.
- **Use CSS classes** for layout changes — flex vs. grid, portrait vs. landscape, compact vs. full.
- **Use separate templates** only when markup structure differs substantially (different slots, different element hierarchy).
- **Avoid more than 3–4 variant props** per SDC — complexity grows exponentially. If you have 8 variants, consider splitting into two SDCs.
- **Document enum values** in component.yml descriptions. Site builders using Layout Builder need to understand what each value does without reading the template.

---

## Related

- [SDC Architecture](/drupal/sdc/overview/) — Two-layer model, file structure, registration
- [SDC Composition Patterns](/drupal/sdc/composition/) — Full article-teaser and staff-profile examples
- [Theming](/drupal/theming/) — CSS custom properties for cross-component styling
