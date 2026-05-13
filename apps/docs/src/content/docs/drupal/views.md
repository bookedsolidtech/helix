---
title: Views Module Integration
description: Views template overrides for HELiX component output, row templates using hx-card, exposed filter forms with hx-select and hx-text-input, Views AJAX with behaviors, and results counter display.
sidebar:
  order: 5
---

Drupal Views generates lists of content via database queries and renders them through a layered plugin system. HELiX components integrate at the rendering layer — wrapping Views output in component tags through template overrides, without touching the query or data layers.

---

## Views Template Hierarchy

Views provides template suggestions in specificity order:

```text
views-view-unformatted--[view-id]--[display-id].html.twig   (most specific)
views-view-unformatted--[view-id].html.twig
views-view-unformatted.html.twig                             (base template)
```

For rows:

```text
views-view-fields--[view-id]--[display-id].html.twig
views-view-fields--[view-id].html.twig
views-view-fields.html.twig
```

Copy the base template into your theme directory and rename it for the target view:

```bash
# For view machine name "articles", display "page_1"
cp web/core/themes/classy/templates/views/views-view-unformatted.html.twig \
   web/themes/custom/mytheme/templates/views/views-view-unformatted--articles--page-1.html.twig
```

Clear cache after adding templates:

```bash
drush cr
```

---

## Row Template Using hx-card

Override the Views unformatted style template to wrap each row in an `hx-card`:

```twig
{# templates/views/views-view-unformatted--articles--page-1.html.twig #}
{{ attach_library('mytheme/helix-card') }}
{{ attach_library('mytheme/helix-button') }}
{{ attach_library('mytheme/helix-badge') }}

{% if title %}
  <h2>{{ title }}</h2>
{% endif %}

<div class="article-grid">
  {% for row in rows %}
    {# Access the underlying entity for direct field values #}
    {% set node = row.content['#node'] %}

    <hx-card variant="default">

      {# Image field — use the rendered row field if you have a Views field
         configured; otherwise access via the entity directly #}
      {% if row.content['#view'].field.field_hero_image is defined %}
        <div slot="image">
          {{ row.content['#view'].field.field_hero_image.render() }}
        </div>
      {% endif %}

      {# Heading #}
      <span slot="heading">
        {{- node.label|escape -}}
      </span>

      {# Category badge — hx-card has no `meta` slot. Render the badge in
         the default body slot, or use the real `footer` slot if the badge
         is metadata that belongs below the body. #}
      {% if node.field_category.entity %}
        <div>
          <hx-badge variant="primary">
            {{- node.field_category.entity.label|escape -}}
          </hx-badge>
        </div>
      {% endif %}

      {# Body summary — the full row render contains all configured fields #}
      {{ row.content }}

      {# CTA #}
      <div slot="actions">
        <hx-button href="{{ node.toUrl().toString()|escape }}" variant="ghost">
          Read more
        </hx-button>
      </div>

    </hx-card>
  {% endfor %}
</div>

{% if pager %}
  {{ pager }}
{% endif %}
```

### Using Views fields directly

If your View is configured to display specific fields (not "Content: rendered entity"), access them through the `fields` variable:

```twig
{# Row template using Views fields #}
<hx-card variant="default">
  {% if fields.field_hero_image is defined %}
    <div slot="image">{{ fields.field_hero_image.content }}</div>
  {% endif %}

  <span slot="heading">{{ fields.title.content }}</span>

  {% if fields.body is defined %}
    <p>{{ fields.body.content }}</p>
  {% endif %}

  <div slot="actions">
    <hx-button href="{{ fields.view_node.content }}" variant="ghost"> Read more </hx-button>
  </div>
</hx-card>
```

---

## Exposed Filter Forms with hx-select and hx-text-input

Views exposed filters generate a Drupal form. You can override the exposed form template to use HELiX form components.

### Override the exposed form template

```bash
cp web/core/themes/classy/templates/views/views-exposed-form.html.twig \
   web/themes/custom/mytheme/templates/views/views-exposed-form--articles--page-1.html.twig
```

### Template with HELiX form components

```twig
{# templates/views/views-exposed-form--articles--page-1.html.twig #}
{{ attach_library('mytheme/helix-text-input') }}
{{ attach_library('mytheme/helix-select') }}
{{ attach_library('mytheme/helix-button') }}

<form{{ form.attributes }}>
  {{ form.form_build_id }}
  {{ form.form_token }}
  {{ form.form_id }}

  <div class="views-filters">

    {# Text search filter #}
    {% if form.search_api_fulltext is defined %}
      <hx-text-input
        name="{{ form.search_api_fulltext['#name'] }}"
        label="{{ form.search_api_fulltext['#title'] }}"
        value="{{ form.search_api_fulltext['#value']|default('') }}"
        placeholder="{{ form.search_api_fulltext['#placeholder']|default('Search...') }}"
      ></hx-text-input>
    {% endif %}

    {# Category select filter #}
    {% if form.field_category_target_id is defined %}
      <hx-select
        name="{{ form.field_category_target_id['#name'] }}"
        label="{{ form.field_category_target_id['#title'] }}"
      >
        {% for key, option in form.field_category_target_id['#options'] %}
          <option
            value="{{ key }}"
            {% if form.field_category_target_id['#value'] == key %}selected{% endif %}
          >
            {{- option|escape -}}
          </option>
        {% endfor %}
      </hx-select>
    {% endif %}

    {# Submit #}
    <hx-button type="submit" variant="primary">
      {{ form.actions.submit['#value']|default('Apply Filters')|escape }}
    </hx-button>

    {# Reset — only shown when filters are active #}
    {% if form.actions.reset is defined %}
      <hx-button type="submit" name="{{ form.actions.reset['#name'] }}" variant="ghost">
        {{ form.actions.reset['#value']|default('Reset')|escape }}
      </hx-button>
    {% endif %}

  </div>
</form>
```

Note: This template replaces the exposed form widgets with raw HELiX HTML. The hidden form fields (`form_build_id`, `form_token`, `form_id`) must remain for Drupal form processing to work.

---

## Views AJAX with Drupal Behaviors

Views AJAX replaces the view results region when filters change or pagination is clicked. HELiX components in the replaced region are upgraded automatically by the browser. Drupal Behaviors re-run on the replacement.

### Attach behaviors to Views-rendered components

```javascript
// js/views-helix-behaviors.js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.viewsHelixCards = {
    attach(context) {
      // context is the replaced DOM subtree after Views AJAX.
      // hx-card only emits hx-click when it's in interactive mode
      // (hx-href + hx-label) — scope the selector so the behavior only
      // binds to cards that actually dispatch the event.
      once('mytheme:views-helix-card', 'hx-card[hx-href]', context).forEach((card) => {
        card.addEventListener('hx-click', (e) => {
          // Handle card click — e.g., expand a details panel
          const target = e.currentTarget.dataset.nodeId;
          if (target) {
            // AJAX load detail
          }
        });
      });
    },
  };
})(Drupal, once);
```

### Ensure the library loads before AJAX

Attach the behavior library globally so it is available when Views AJAX fires:

```yaml
# mytheme.info.yml
libraries:
  - mytheme/views-helix-behaviors
```

### AJAX-aware exposed filter behavior

When exposed filters use HELiX components, wire them to trigger Views AJAX:

```javascript
Drupal.behaviors.viewsHelixFilters = {
  attach(context) {
    // The Views AJAX form uses data-drupal-views-id to identify itself
    once('views-helix-filter', '[data-drupal-views-id] hx-select', context).forEach((select) => {
      select.addEventListener('hx-change', (e) => {
        // Trigger the native form's change event for Views AJAX to detect
        const form = select.closest('form');
        if (form) {
          const nativeInput = form.querySelector(`[name="${select.name}"]`);
          if (nativeInput) {
            nativeInput.value = e.detail.value;
            nativeInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
    });
  },
};
```

---

## Results Counter Display

Show a "Showing X of Y results" counter using the Views pager or a custom render element.

### Using Views pager information

```twig
{# In the view template #}
{% if view.pager.getTotalItems() > 0 %}
  <div class="views-result-count" aria-live="polite" aria-atomic="true">
    <hx-text variant="caption">
      Showing
      {{ view.pager.getCurrentPage() * view.pager.getItemsPerPage() + 1 }}–{{ [
        (view.pager.getCurrentPage() + 1) * view.pager.getItemsPerPage(),
        view.pager.getTotalItems()
      ]|min }}
      of {{ view.pager.getTotalItems() }} results
    </hx-text>
  </div>
{% endif %}
```

### Using a Views attachment

Add a Views attachment display type configured to show summary text. Override its template:

```twig
{# templates/views/views-view--articles--summary-attachment.html.twig
   hx-badge variants: primary | secondary | success | warning | error | neutral | info.
   There is no `default` variant — `neutral` is the closest "no-emphasis" choice. #}
<hx-badge variant="neutral">{{ rows }} results</hx-badge>
```

---

## Grid vs. List View Modes

Different display modes for the same View content:

```twig
{# Detect display ID from the view and render appropriate layout.
   hx-card variants: default | featured | compact. There is no `outlined`
   variant — use `compact` for dense list rows or omit `variant` for default
   card styling. #}
{% if view.current_display == 'page_grid' %}
  <div class="article-grid article-grid--3col">
    {% for row in rows %}
      <hx-card variant="default" class="article-grid__item">{{ row.content }}</hx-card>
    {% endfor %}
  </div>
{% else %}
  <div class="article-list">
    {% for row in rows %}
      <hx-card variant="compact" class="article-list__item">{{ row.content }}</hx-card>
    {% endfor %}
  </div>
{% endif %}
```

---

## Preprocess Hook for Views Rows

Use `hook_preprocess_views_view_unformatted` to add computed variables:

```php
/**
 * Implements hook_preprocess_views_view_unformatted().
 */
function mytheme_preprocess_views_view_unformatted(array &$variables): void {
  $view = $variables['view'];

  if ($view->id() === 'articles') {
    // Add a flag for featured row (first result)
    foreach ($variables['rows'] as $i => &$row) {
      $row['is_featured'] = ($i === 0 && $view->getCurrentPage() === 0);
    }
  }
}
```

In the template:

```twig
{% for row in rows %}
  {# hx-card has no `elevated` variant — use `featured` for emphasis,
     or keep variant="default" and shift the emphasis to elevation. #}
  <hx-card
    variant="{{ row.is_featured ? 'featured' : 'default' }}"
    elevation="{{ row.is_featured ? 'raised' : 'flat' }}"
  >
    {{ row.content }}
  </hx-card>
{% endfor %}
```

---

## Related

- [AJAX Integration](/drupal/ajax/) — Behaviors re-initialization after AJAX, `once()` patterns
- [SDC Composition Patterns](/drupal/sdc/composition/) — Reusable content patterns used in Views rows
- [Forms: Form API](/drupal/forms/form-api/) — Exposed filter forms in depth
