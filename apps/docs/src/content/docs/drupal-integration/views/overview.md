---
title: Views Integration Overview
description: Comprehensive guide to integrating HELIX web components with Drupal Views - custom plugins, display formatters, and template strategies
sidebar:
  order: 24
---

Drupal Views is one of the most powerful content querying and display systems in any CMS. This guide explores how HELIX web components integrate with Views through template overrides, custom plugins, field formatters, and architectural patterns that respect both Drupal's rendering pipeline and web component standards.

## Understanding Drupal Views Architecture

Drupal Views is built on a plugin-based architecture that controls every aspect of content display. The Views pipeline consists of:

1. **Query Phase** - Views constructs database queries based on filters, sorts, and relationships
2. **Field Retrieval** - Selected fields are loaded from the database
3. **Rendering Phase** - Display plugins, style plugins, row plugins, and field formatters transform data into HTML
4. **Output** - Final HTML is passed to Drupal's render system for caching and delivery

Each layer is pluggable, allowing developers to inject custom behavior at any point. HELIX components integrate primarily at the **rendering phase**, where HTML structure is generated.

### Views Plugin Types

**Display Plugins** - Control where Views output appears (page, block, REST export, embed)

**Style Plugins** - Determine how a set of results is rendered (grid, table, unformatted list)

**Row Plugins** - Define how individual result rows render (fields, teaser, full entity)

**Field Plugins** - Handle individual field rendering and formatting

**Relationship Plugins** - Connect related entities (node → user, node → taxonomy term)

Understanding this hierarchy is critical for choosing the right integration strategy with HELIX components.

## Web Components in Views: Core Concepts

HELIX components work in Views by wrapping Drupal-rendered content with web component tags. The fundamental pattern:

```twig
{# Drupal renders fields through standard pipeline #}
{# Web component provides structure and interactivity #}
<hx-card variant="default" elevation="raised">
  <span slot="heading">{{ fields.title.content }}</span>
  {{ fields.body.content }}
  <div slot="actions">
    <hx-button href="{{ fields.view_node.content }}">Read More</hx-button>
  </div>
</hx-card>
```

This approach preserves:

- **Drupal field formatters** - Image styles, text formats, link attributes
- **View field rewriting** - Custom output overrides in Views UI
- **Render caching** - Cache tags and contexts flow through normally
- **Contextual links** - Quick edit functionality remains accessible

The component is a structural wrapper, not a content replacement.

## Integration Strategy 1: Template Overrides

The simplest and most common approach is overriding Views templates in your theme.

### Views Template Hierarchy

Views provides template suggestions in this order (most specific first):

```
views-view-unformatted--[view-id]--[display-id].html.twig
views-view-unformatted--[view-id].html.twig
views-view-unformatted.html.twig (base template)
```

For field-level overrides:

```
views-view-fields--[view-id]--[display-id].html.twig
views-view-fields--[view-id].html.twig
views-view-fields.html.twig (base template)
```

### Row Template Pattern

Override `views-view-unformatted.html.twig` to wrap each row in a component:

```twig
{# templates/views/views-view-unformatted--patient-list.html.twig #}
{# Attach HELIX card library #}
{{ attach_library('mytheme/helix-card') }}

<div{{ attributes.addClass('patient-list') }}>
  {% for row in rows %}
    {# Each row renders as hx-card #}
    <hx-card
      variant="{{ view.args[0] is defined and view.args[0] == 'featured' ? 'featured' : 'default' }}"
      elevation="raised"
    >
      {{ row.content }}
    </hx-card>
  {% endfor %}
</div>
```

**Key Details:**

- `attach_library()` ensures component JavaScript loads
- `{{ attributes }}` preserves Views CSS classes and data attributes
- `{{ row.content }}` contains the full rendered row (all fields)
- View arguments can dynamically control component properties

### Fields Template Pattern

For fine-grained control, override the fields template:

```twig
{# templates/views/views-view-fields--article-grid.html.twig #}
{{ attach_library('mytheme/helix-card') }}

<hx-card
  variant="compact"
  elevation="raised"
  hx-href="{{ fields.path.content|striptags|trim }}"
>
  {# Image field in media slot #}
  {% if fields.field_hero_image.content %}
    <div slot="image">
      {{ fields.field_hero_image.content }}
    </div>
  {% endif %}

  {# Title in heading slot #}
  <span slot="heading">
    {{ fields.title.content }}
  </span>

  {# Body content in default slot #}
  {{ fields.body.content }}

  {# Metadata in footer slot #}
  {% if fields.created.content or fields.field_category.content %}
    <div slot="footer">
      {% if fields.created.content %}
        <span class="date">{{ fields.created.content }}</span>
      {% endif %}
      {% if fields.field_category.content %}
        {{ fields.field_category.content }}
      {% endif %}
    </div>
  {% endif %}
</hx-card>
```

**Advantages:**

- Full control over field-to-slot mapping
- Conditional slot rendering based on field presence
- Access to all Views field options (rewrite results, exclusion, label display)

**Trade-offs:**

- Template maintenance required per View
- Changes require theme rebuild and cache clear
- No UI for content editors

## Integration Strategy 2: Custom Style Plugins

For reusable component-based Views layouts, create a custom style plugin.

### Plugin Structure

Style plugins extend `\Drupal\views\Plugin\views\style\StylePluginBase`:

```php
<?php
// mytheme/src/Plugin/views/style/HelixCardGrid.php

namespace Drupal\mytheme\Plugin\views\style;

use Drupal\core\form\FormStateInterface;
use Drupal\views\Plugin\views\style\StylePluginBase;

/**
 * Style plugin to render rows as hx-card components.
 *
 * @ViewsStyle(
 *   id = "helix_card_grid",
 *   title = @Translation("HELIX Card Grid"),
 *   help = @Translation("Displays rows as hx-card web components in a responsive grid."),
 *   theme = "views_view_helix_card_grid",
 *   display_types = {"normal"}
 * )
 */
class HelixCardGrid extends StylePluginBase {

  protected $usesRowPlugin = TRUE;
  protected $usesRowClass = FALSE;
  protected $usesFields = TRUE;

  protected function defineOptions() {
    $options = parent::defineOptions();
    $options['card_variant'] = ['default' => 'default'];
    $options['card_elevation'] = ['default' => 'raised'];
    $options['grid_columns'] = ['default' => '3'];
    $options['image_field'] = ['default' => ''];
    $options['heading_field'] = ['default' => ''];
    $options['link_field'] = ['default' => ''];
    return $options;
  }

  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);

    $form['card_variant'] = [
      '#type' => 'select',
      '#title' => $this->t('Card Variant'),
      '#options' => [
        'default' => $this->t('Default'),
        'featured' => $this->t('Featured'),
        'compact' => $this->t('Compact'),
      ],
      '#default_value' => $this->options['card_variant'],
    ];

    $form['card_elevation'] = [
      '#type' => 'select',
      '#title' => $this->t('Card Elevation'),
      '#options' => [
        'flat' => $this->t('Flat'),
        'raised' => $this->t('Raised'),
        'floating' => $this->t('Floating'),
      ],
      '#default_value' => $this->options['card_elevation'],
    ];

    $form['grid_columns'] = [
      '#type' => 'select',
      '#title' => $this->t('Grid Columns'),
      '#options' => array_combine(range(1, 6), range(1, 6)),
      '#default_value' => $this->options['grid_columns'],
    ];

    // Field selection for component mapping
    $field_options = [];
    foreach ($this->displayHandler->getHandlers('field') as $field_id => $field) {
      $field_options[$field_id] = $field->adminLabel();
    }

    $form['image_field'] = [
      '#type' => 'select',
      '#title' => $this->t('Image Field'),
      '#options' => ['' => $this->t('- None -')] + $field_options,
      '#default_value' => $this->options['image_field'],
    ];

    $form['heading_field'] = [
      '#type' => 'select',
      '#title' => $this->t('Heading Field'),
      '#options' => ['' => $this->t('- None -')] + $field_options,
      '#default_value' => $this->options['heading_field'],
      '#required' => TRUE,
    ];

    $form['link_field'] = [
      '#type' => 'select',
      '#title' => $this->t('Link Field'),
      '#options' => ['' => $this->t('- None -')] + $field_options,
      '#default_value' => $this->options['link_field'],
    ];
  }
}
```

### Template Implementation

Create the corresponding Twig template:

```twig
{# mytheme/templates/views/views-view-helix-card-grid.html.twig #}
{{ attach_library('mytheme/helix-card') }}

<div{{ attributes.addClass('helix-card-grid') }}
     style="--grid-columns: {{ options.grid_columns }};">
  {% for row in rows %}
    {# Extract field values for component properties #}
    {% set link_url = row.content[options.link_field]|render|striptags|trim %}

    <hx-card
      variant="{{ options.card_variant }}"
      elevation="{{ options.card_elevation }}"
      {% if link_url %}hx-href="{{ link_url }}"{% endif %}
    >
      {# Map fields to slots based on plugin configuration #}
      {% if options.image_field and row.content[options.image_field] %}
        <div slot="image">
          {{ row.content[options.image_field] }}
        </div>
      {% endif %}

      {% if options.heading_field and row.content[options.heading_field] %}
        <span slot="heading">
          {{ row.content[options.heading_field] }}
        </span>
      {% endif %}

      {# All other fields in body slot #}
      <div slot="body">
        {% for field_id, field_content in row.content %}
          {% if field_id not in [options.image_field, options.heading_field, options.link_field] %}
            {{ field_content }}
          {% endif %}
        {% endfor %}
      </div>
    </hx-card>
  {% endfor %}
</div>
```

### Benefits of Style Plugins

- **UI-Configurable** - Site builders configure components through Views admin interface
- **Reusable** - One plugin works across all Views
- **Field Mapping** - Select which fields map to which component slots
- **No Template Maintenance** - Changes happen in Views UI, not codebase

### When to Use Style Plugins

Use custom style plugins when:

- Multiple Views need the same component layout
- Content editors require configuration flexibility
- You're building a module or distribution for reuse
- Field-to-slot mapping varies by content type

Avoid when:

- Only one or two Views need components (template override is simpler)
- Highly custom layouts that don't generalize
- Rapid prototyping (templates iterate faster)

## Integration Strategy 3: Custom Field Formatters

Field formatters provide component wrappers at the field level.

### Formatter Plugin Structure

```php
<?php
// mytheme/src/Plugin/Field/FieldFormatter/HelixBadgeFormatter.php

namespace Drupal\mytheme\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Plugin implementation of the 'helix_badge' formatter.
 *
 * @FieldFormatter(
 *   id = "helix_badge",
 *   label = @Translation("HELIX Badge"),
 *   field_types = {
 *     "string",
 *     "list_string",
 *   }
 * )
 */
class HelixBadgeFormatter extends FormatterBase {

  public static function defaultSettings() {
    return [
      'variant' => 'default',
      'size' => 'md',
      'show_icon' => FALSE,
    ] + parent::defaultSettings();
  }

  public function settingsForm(array $form, FormStateInterface $form_state) {
    $elements = parent::settingsForm($form, $form_state);

    $elements['variant'] = [
      '#type' => 'select',
      '#title' => $this->t('Variant'),
      '#options' => [
        'default' => $this->t('Default'),
        'primary' => $this->t('Primary'),
        'success' => $this->t('Success'),
        'warning' => $this->t('Warning'),
        'danger' => $this->t('Danger'),
      ],
      '#default_value' => $this->getSetting('variant'),
    ];

    $elements['size'] = [
      '#type' => 'select',
      '#title' => $this->t('Size'),
      '#options' => [
        'sm' => $this->t('Small'),
        'md' => $this->t('Medium'),
        'lg' => $this->t('Large'),
      ],
      '#default_value' => $this->getSetting('size'),
    ];

    $elements['show_icon'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show icon'),
      '#default_value' => $this->getSetting('show_icon'),
    ];

    return $elements;
  }

  public function viewElements(FieldItemListInterface $items, $langcode) {
    $elements = [];

    foreach ($items as $delta => $item) {
      $elements[$delta] = [
        '#type' => 'html_tag',
        '#tag' => 'hx-badge',
        '#value' => $item->value,
        '#attributes' => [
          'variant' => $this->getSetting('variant'),
          'size' => $this->getSetting('size'),
        ],
        '#attached' => [
          'library' => ['mytheme/helix-badge'],
        ],
      ];

      if ($this->getSetting('show_icon')) {
        $elements[$delta]['#attributes']['show-icon'] = TRUE;
      }
    }

    return $elements;
  }
}
```

### Using Field Formatters in Views

Once registered, field formatters appear in Views field configuration:

1. Add field to View (e.g., "Content: Status")
2. Click "Settings" next to field
3. Under "Formatter", select "HELIX Badge"
4. Configure variant, size, icon options
5. Save

The field now renders through your component:

```html
<hx-badge variant="success" size="md">Published</hx-badge>
```

### Benefits of Field Formatters

- **Granular Control** - Component wrapping at the field level
- **Reusable Everywhere** - Works in Views, node display, paragraphs, blocks
- **Views UI Integration** - Configurable per field without code
- **Field API Compatibility** - Works with all field types

### When to Use Field Formatters

Use custom field formatters when:

- Individual fields map cleanly to components (badge for status, button for links)
- The same field needs component rendering across multiple displays
- Content editors configure field presentation per content type
- You want maximum reusability (not Views-specific)

## Integration Strategy 4: Custom Row Plugins

Row plugins provide the deepest integration, rendering entire entities through components.

### Row Plugin Structure

```php
<?php
// mytheme/src/Plugin/views/row/HelixCardRow.php

namespace Drupal\mytheme\Plugin\views\row;

use Drupal\views\Plugin\views\row\EntityRow;
use Drupal\Core\Form\FormStateInterface;

/**
 * Row plugin to display entities as hx-card components.
 *
 * @ViewsRow(
 *   id = "helix_card_row",
 *   title = @Translation("HELIX Card"),
 *   help = @Translation("Renders entity as hx-card web component."),
 *   theme = "views_view_helix_card_row",
 *   entity_type = "node",
 *   display_types = {"normal"}
 * )
 */
class HelixCardRow extends EntityRow {

  protected function defineOptions() {
    $options = parent::defineOptions();
    $options['card_variant'] = ['default' => 'default'];
    $options['card_elevation'] = ['default' => 'raised'];
    $options['show_actions'] = ['default' => TRUE];
    return $options;
  }

  public function buildOptionsForm(&$form, FormStateInterface $form_state) {
    parent::buildOptionsForm($form, $form_state);

    $form['card_variant'] = [
      '#type' => 'select',
      '#title' => $this->t('Card Variant'),
      '#options' => [
        'default' => $this->t('Default'),
        'featured' => $this->t('Featured'),
        'compact' => $this->t('Compact'),
      ],
      '#default_value' => $this->options['card_variant'],
    ];

    $form['card_elevation'] = [
      '#type' => 'select',
      '#title' => $this->t('Elevation'),
      '#options' => [
        'flat' => $this->t('Flat'),
        'raised' => $this->t('Raised'),
        'floating' => $this->t('Floating'),
      ],
      '#default_value' => $this->options['card_elevation'],
    ];

    $form['show_actions'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show action button'),
      '#default_value' => $this->options['show_actions'],
    ];
  }
}
```

### Row Template Implementation

```twig
{# mytheme/templates/views/views-view-helix-card-row.html.twig #}
{{ attach_library('mytheme/helix-card') }}

{# Entity is available via view.row_plugin.entity #}
{% set entity = row._entity %}
{% set url = entity.toUrl().toString() %}

<hx-card
  variant="{{ options.card_variant }}"
  elevation="{{ options.card_elevation }}"
  hx-href="{{ url }}"
>
  {# Render entity using configured view mode #}
  {% if entity.field_hero_image.value %}
    <div slot="image">
      {{ entity.field_hero_image }}
    </div>
  {% endif %}

  <span slot="heading">
    {{ entity.label }}
  </span>

  {{ entity.body }}

  {% if options.show_actions %}
    <div slot="actions">
      <hx-button variant="text" href="{{ url }}">
        {{ 'Read More'|t }}
      </hx-button>
    </div>
  {% endif %}
</hx-card>
```

### When to Use Row Plugins

Use custom row plugins when:

- Entire entity rendering should be component-wrapped
- Multiple entity types share the same component display pattern
- You need access to full entity object (not just rendered fields)
- Building a distribution with component-first architecture

## Performance Considerations

### Library Loading Strategy

**Per-View Library Attachment**

Attach component libraries in View-specific templates:

```twig
{# Only load hx-card on this View #}
{{ attach_library('mytheme/helix-card') }}
```

**Global Theme Library**

For heavily component-driven sites, load core components globally:

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix-core # Loads hx-button, hx-badge, hx-icon
```

Then attach specialty components per template:

```twig
{{ attach_library('mytheme/helix-card') }}  # Adds hx-card specifically
```

**Views Display Library Attachment**

Use `hook_views_pre_render()` for conditional loading:

```php
<?php
/**
 * Implements hook_views_pre_render().
 */
function mytheme_views_pre_render(\Drupal\views\ViewExecutable $view) {
  // Load hx-card library only when custom style plugin is active
  if ($view->style_plugin->getPluginId() === 'helix_card_grid') {
    $view->element['#attached']['library'][] = 'mytheme/helix-card';
  }
}
```

### Bundle Size Impact

HELIX per-component bundles minimize overhead:

- `hx-button`: ~2.8KB (min+gz)
- `hx-badge`: ~1.9KB (min+gz)
- `hx-card`: ~4.2KB (min+gz)
- `hx-alert`: ~3.1KB (min+gz)

A typical Views listing page with cards loads ~4.2KB of component JavaScript. Compare this to loading a full framework (React: 45KB, Vue: 38KB).

### Render Caching

HELIX components preserve Drupal's render cache tags:

```twig
{# Cache tags flow through to component-wrapped content #}
<hx-card>
  {{ content.body }}  {# Cache tags: node:123, node_view, ... #}
</hx-card>
```

Cache invalidation works normally - updating a node invalidates all Views rows containing that node, regardless of component wrapping.

### Progressive Enhancement

Before JavaScript loads, slotted content is visible:

```html
<!-- Initial HTML (pre-hydration) -->
<hx-card variant="default">
  <span slot="heading">Patient Portal Downtime</span>
  <p>The patient portal will be unavailable Saturday 2AM-6AM...</p>
</hx-card>
```

Content is immediately readable. Component hydration adds interactivity (hover states, click handlers, animations) but doesn't block content access.

## Complete Example: Patient List View

Let's build a complete patient listing view with HELIX components.

### Step 1: Create the View

1. Navigate to `/admin/structure/views/add`
2. View name: "Patient List"
3. Show: Content of type "Patient"
4. Create a page: `/patients`

### Step 2: Configure Fields

Add fields:

- Field: Patient Photo (Image)
- Field: Patient Name (Title)
- Field: Medical Record Number (Text)
- Field: Last Visit Date (Date)
- Field: Status (List - Active/Inactive/Pending)
- Field: View Patient (Link)

### Step 3: Override Template

Create `views-view-fields--patient-list.html.twig`:

```twig
{# mytheme/templates/views/views-view-fields--patient-list.html.twig #}
{{ attach_library('mytheme/helix-card') }}
{{ attach_library('mytheme/helix-badge') }}
{{ attach_library('mytheme/helix-button') }}

<hx-card
  variant="default"
  elevation="raised"
  hx-href="{{ fields.view_patient.content|render|striptags|trim }}"
>
  {# Patient photo in image slot #}
  {% if fields.field_patient_photo.content %}
    <div slot="image">
      {{ fields.field_patient_photo.content }}
    </div>
  {% endif %}

  {# Patient name in heading slot #}
  <span slot="heading">
    {{ fields.title.content }}
  </span>

  {# Medical record number and last visit date in body #}
  <div class="patient-details">
    <div class="detail-row">
      <strong>MRN:</strong> {{ fields.field_mrn.content }}
    </div>
    <div class="detail-row">
      <strong>Last Visit:</strong> {{ fields.field_last_visit.content }}
    </div>
  </div>

  {# Status badge in footer #}
  <div slot="footer">
    {% set status = fields.field_status.content|render|striptags|trim %}
    <hx-badge
      variant="{% if status == 'Active' %}success{% elseif status == 'Pending' %}warning{% else %}default{% endif %}"
      size="sm"
    >
      {{ status }}
    </hx-badge>
  </div>

  {# Action button #}
  <div slot="actions">
    <hx-button
      variant="text"
      size="sm"
      href="{{ fields.view_patient.content|render|striptags|trim }}"
    >
      View Record
    </hx-button>
  </div>
</hx-card>
```

### Step 4: Style the Grid

Add grid layout CSS:

```css
/* mytheme/css/patient-list.css */
.view-patient-list .view-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--hx-space-6);
}

.patient-details {
  display: flex;
  flex-direction: column;
  gap: var(--hx-space-2);
  color: var(--hx-color-neutral-600);
  font-size: var(--hx-font-size-sm);
}

.detail-row {
  display: flex;
  gap: var(--hx-space-2);
}
```

### Step 5: Attach Library

```yaml
# mytheme.libraries.yml
helix-card:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-card.js:
      type: external
      attributes:
        type: module

helix-badge:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-badge.js:
      type: external
      attributes:
        type: module

helix-button:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-button.js:
      type: external
      attributes:
        type: module

patient-list:
  css:
    theme:
      css/patient-list.css: {}
  dependencies:
    - mytheme/helix-card
    - mytheme/helix-badge
    - mytheme/helix-button
```

### Result

A responsive, accessible patient list where each card:

- Shows patient photo, name, MRN, last visit, and status
- Uses color-coded badge for status (green for Active, yellow for Pending, gray for Inactive)
- Entire card is clickable via `hx-href`
- Action button provides redundant navigation for keyboard users
- Content is visible before JavaScript loads
- Meets WCAG 2.1 AA standards (HHS healthcare mandate)

## Best Practices

### 1. Preserve Drupal's Rendering Pipeline

Always render fields through Drupal first, then project into component slots:

**Correct:**

```twig
<hx-card>
  {{ content.body }}  {# Drupal renders, applies text format, caching #}
</hx-card>
```

**Incorrect:**

```twig
<hx-card body="{{ node.body.value }}">  {# Bypasses rendering pipeline #}
</hx-card>
```

### 2. Use Semantic Slot Names

Map Drupal field patterns to component slots intuitively:

- `field_hero_image` → `slot="image"`
- `title` → `slot="heading"`
- `body` → default slot
- `field_cta` → `slot="actions"`
- `field_metadata` → `slot="footer"`

### 3. Attach Libraries Correctly

Attach component libraries in the template that uses them:

```twig
{# Top of template #}
{{ attach_library('mytheme/helix-card') }}

{# Now safe to use #}
<hx-card>...</hx-card>
```

Avoid global library loading unless components appear on >70% of pages.

### 4. Conditional Slot Rendering

Only render slots when content exists:

```twig
{% if fields.field_hero_image.content %}
  <div slot="image">
    {{ fields.field_hero_image.content }}
  </div>
{% endif %}
```

Empty slots may render unnecessary spacing or borders depending on component CSS.

### 5. Respect View Field Configuration

Honor Views field settings (exclude from display, rewrite results, label position):

```twig
{# Views field already processed through formatters and rewrite rules #}
{{ fields.created.content }}  {# Uses Views configuration #}
```

Don't re-process field values in templates unless necessary.

### 6. Accessibility: Provide Redundant Navigation

When using clickable cards (`hx-href`), include explicit action buttons for keyboard users:

```twig
<hx-card hx-href="{{ url }}">
  <span slot="heading">{{ title }}</span>
  {{ body }}
  <div slot="actions">
    <hx-button href="{{ url }}">Read More</hx-button>  {# Redundant but accessible #}
  </div>
</hx-card>
```

Screen reader users can navigate to the explicit button rather than clicking the card.

### 7. Testing Views Templates

Use Drupal's theme debug to identify correct template suggestions:

```yaml
# sites/default/services.yml
parameters:
  twig.config:
    debug: true
```

View source to see template hints:

```html
<!-- THEME DEBUG -->
<!-- THEME HOOK: 'views_view_fields' -->
<!-- FILE NAME SUGGESTIONS:
   * views-view-fields--patient-list--page-1.html.twig
   * views-view-fields--patient-list.html.twig
   ✅ views-view-fields.html.twig
-->
```

### 8. Cache Invalidation

Component wrappers don't affect cache invalidation. Drupal's cache tags flow through:

```twig
<hx-card>
  {# Cache tags: node:123, user:45, ... #}
  {{ content.body }}
</hx-card>
```

Clear caches after template changes: `drush cr`

## Decision Matrix: Which Strategy?

| Scenario                                  | Recommended Approach            |
| ----------------------------------------- | ------------------------------- |
| Single View needs components              | Template override               |
| Multiple Views share component layout     | Custom style plugin             |
| Individual fields need component wrapping | Custom field formatter          |
| Entire entity renders through component   | Custom row plugin               |
| Rapid prototyping                         | Template override               |
| Reusable module/distribution              | Style or row plugin             |
| Content editor configuration required     | Field formatter or style plugin |
| Highly custom, one-off design             | Template override               |
| Need UI for field-to-slot mapping         | Style plugin with form          |

## Troubleshooting Common Issues

### Components Don't Render

**Symptom:** Seeing `<hx-card></hx-card>` as plain text
**Cause:** Component library not loaded
**Solution:** Add `{{ attach_library('mytheme/helix-card') }}` to template

### Styles Not Applying

**Symptom:** Component appears but no styling
**Cause:** Shadow DOM encapsulation or CSS custom properties not defined
**Solution:** Check that theme defines `--hx-*` CSS custom properties or uses HELIX token files

### Click Handlers Not Working

**Symptom:** `hx-href` doesn't navigate
**Cause:** JavaScript error or incorrect URL value
**Solution:** Check browser console, verify URL is clean (use `|striptags|trim` filter)

### Fields Not Appearing

**Symptom:** Component renders but content is empty
**Cause:** Field excluded in Views configuration
**Solution:** Check Views field settings - ensure "Exclude from display" is unchecked

### Cache Stale After Template Changes

**Symptom:** Template changes don't appear
**Cause:** Drupal render cache and Twig cache
**Solution:** `drush cr` (clear all caches)

## Further Reading

### Drupal Documentation

- [Views Module Overview](https://www.drupal.org/docs/8/core/modules/views) - Official Drupal.org Views guide
- [Building a Views Display Style Plugin](https://www.drupal.org/docs/develop/creating-modules/building-a-views-display-style-plugin-for-drupal) - Creating custom style plugins
- [Create a Custom Field Formatter](https://www.drupal.org/docs/creating-custom-modules/creating-custom-field-types-widgets-and-formatters/create-a-custom-field-formatter) - Field formatter development
- [Working With Twig Templates](https://www.drupal.org/docs/develop/theming-drupal/twig-in-drupal/working-with-twig-templates) - Twig in Drupal
- [Customize View Fields Using Twig](https://www.webwash.net/customize-view-fields-using-twig-in-drupal/) - Views Twig customization

### Drupal API References

- [Views API Documentation](https://api.drupal.org/api/drupal/core!modules!views!views.api.php/9) - Core Views hooks and plugins
- [views-view.html.twig](https://api.drupal.org/api/drupal/core!modules!views!templates!views-view.html.twig/11.x) - Base Views template reference
- [Overview: Views Plugins](https://drupalize.me/tutorial/overview-views-plugins) - Educational Views plugin overview

### HELIX Documentation

- [Drupal Integration Overview](/drupal-integration/overview/) - Core integration concepts
- [TWIG Patterns](/drupal-integration/twig/) - Component usage in Twig
- [Drupal Behaviors](/drupal-integration/behaviors/) - JavaScript lifecycle integration

## Summary

HELIX web components integrate with Drupal Views through four primary strategies:

1. **Template Overrides** - Simplest approach for single Views or custom layouts
2. **Custom Style Plugins** - Reusable, UI-configurable component layouts
3. **Custom Field Formatters** - Granular component wrapping at field level
4. **Custom Row Plugins** - Entity-level component rendering

All strategies preserve Drupal's rendering pipeline (field formatters, image styles, caching) while wrapping content in web components for structural consistency and interactivity.

The hybrid property/slot pattern ensures components remain portable while respecting Drupal's content management architecture. Properties configure component behavior; slots project Drupal-rendered content.

Choose template overrides for rapid development and one-off designs. Choose custom plugins for reusable, UI-configurable patterns across multiple Views or sites.

HELIX components work with Drupal Views without requiring PHP modules, tight coupling, or framework dependencies. This architecture preserves both Drupal's content management strengths and web component portability.

---

**Next Steps:**

- [Field Formatters Deep Dive](/drupal-integration/views/field-formatters/) - Building custom formatters for HELIX
- [Style Plugin Development](/drupal-integration/views/style-plugins/) - Complete style plugin implementation
- [Single Directory Components](/drupal-integration/sdc/) - Wrapping HELIX in Drupal SDC
