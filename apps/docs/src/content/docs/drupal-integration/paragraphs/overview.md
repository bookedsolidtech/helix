---
title: Paragraph Types Integration
description: Integrating HELIX web components with Drupal Paragraphs module for flexible content authoring
sidebar:
  order: 28
---

The Paragraphs module is one of the most powerful content authoring tools in the Drupal ecosystem, enabling site builders to create flexible, component-based content structures. When combined with HELIX web components, Paragraphs becomes a bridge between Drupal's structured content and enterprise-grade UI patterns — all without writing custom code.

This guide demonstrates how to map Paragraph types to HELIX components, creating a content authoring experience where editors build pages from reusable, accessible, design-system-compliant building blocks.

## Paragraphs Module Overview

The [Paragraphs module](https://www.drupal.org/project/paragraphs) provides a field type (`entity_reference_revisions`) that allows editors to embed structured "paragraph items" within nodes, blocks, and other entities. Each Paragraph type is a discrete bundle with its own field schema, similar to content types but designed for reusable content chunks.

### Why Paragraphs + Web Components?

Combining Drupal Paragraphs with HELIX creates a powerful architectural pattern:

**Drupal Paragraphs provides:**

- Structured content schema (fields, validation, required rules)
- Content editor UI (inline editing, drag-and-drop reordering)
- Revision tracking and workflow integration
- Field-level permissions and translation support

**HELIX Components provide:**

- Consistent visual presentation across all sites
- Accessibility compliance (WCAG 2.1 AA built-in)
- Design system governance (tokens, variants, validation)
- Interactive behaviors (click handlers, form participation)

The result: **editors manage content, components enforce design standards**.

### Core Concepts

**Paragraph Type** - A bundle definition with fields (title, image, body, CTA link). Lives at `/admin/structure/paragraphs_type`.

**Paragraph Item** - A specific instance of a Paragraph type embedded in a node's `entity_reference_revisions` field.

**Field Mapping** - The strategy for mapping Paragraph fields to web component properties and slots.

**Template Override** - A Twig template that renders Paragraph fields as component markup instead of Drupal's default field wrappers.

## Integration Architecture

The Paragraphs-to-components pattern follows HELIX's hybrid property/slot philosophy:

1. **Paragraph fields hold structured data** (text, media, entity references)
2. **Drupal renders fields through its normal pipeline** (formatters, image styles, text filters)
3. **Template overrides wrap rendered output in web component tags** (`<hx-card>`, `<hx-alert>`)
4. **Rendered field HTML projects into component slots** (`slot="heading"`, `slot="media"`)

This approach preserves Drupal's rendering architecture while delegating presentation to the design system.

### Data Flow

```
Content Editor
  ↓ (creates)
Paragraph Item (field_card_heading, field_card_image, field_card_body)
  ↓ (Drupal renders)
Render Array (with field formatters, image styles)
  ↓ (Twig template override)
<hx-card variant="featured">
  <span slot="heading">{{ rendered field_card_heading }}</span>
  <div slot="media">{{ rendered field_card_image }}</div>
  {{ rendered field_card_body }}
</hx-card>
  ↓ (Browser)
Web Component (slots filled, Shadow DOM styled)
```

## Creating a Custom Paragraph Type

Let's build a complete example: a **Card Paragraph** that maps to the `<hx-card>` component.

### Step 1: Define the Paragraph Type

Navigate to **Structure → Paragraph types → Add paragraph type** (`/admin/structure/paragraphs_type/add`).

**Machine name:** `card`
**Label:** Card
**Description:** A card component for displaying grouped content with optional image, heading, body, and actions.

Click **Save and manage fields**.

### Step 2: Configure Fields

Add fields that map to the component's API:

| Field Label | Machine Name           | Field Type             | Purpose                            |
| ----------- | ---------------------- | ---------------------- | ---------------------------------- |
| Variant     | `field_card_variant`   | List (text)            | Component visual style             |
| Elevation   | `field_card_elevation` | List (text)            | Shadow depth                       |
| Image       | `field_card_image`     | Media (Image)          | Top image slot                     |
| Heading     | `field_card_heading`   | Text (plain)           | Heading slot                       |
| Body        | `field_card_body`      | Text (formatted, long) | Default slot content               |
| Footer Text | `field_card_footer`    | Text (plain)           | Footer slot                        |
| Link        | `field_card_link`      | Link                   | Optional href for interactive card |

#### Field Configuration Details

**Variant Field (`field_card_variant`)**

- **Widget:** Select list
- **Allowed values:**
  ```
  default|Default
  featured|Featured
  compact|Compact
  ```
- **Default value:** `default`
- **Required:** Yes

**Elevation Field (`field_card_elevation`)**

- **Widget:** Select list
- **Allowed values:**
  ```
  flat|Flat (no shadow)
  raised|Raised
  floating|Floating (elevated)
  ```
- **Default value:** `flat`
- **Required:** Yes

**Image Field (`field_card_image`)**

- **Reference type:** Media
- **Media types:** Image
- **Required:** No
- **Help text:** Optional image displayed at top of card

**Heading Field (`field_card_heading`)**

- **Max length:** 255
- **Required:** Yes
- **Help text:** Card title or heading text

**Body Field (`field_card_body`)**

- **Text format:** Full HTML (or restricted HTML)
- **Rows:** 5
- **Required:** No

**Footer Text (`field_card_footer`)**

- **Max length:** 255
- **Required:** No
- **Help text:** Optional footer text (e.g., publication date, metadata)

**Link Field (`field_card_link`)**

- **Allowed link types:** Both internal and external
- **Required:** No
- **Help text:** If provided, entire card becomes clickable

### Step 3: Configure Form Display

Navigate to **Manage form display** tab (`/admin/structure/paragraphs_type/card/form-display`).

Set field order and widgets for optimal editor UX:

1. Heading (Text field)
2. Variant (Select list)
3. Elevation (Select list)
4. Image (Media library)
5. Body (Text area)
6. Footer Text (Text field)
7. Link (Link widget)

Consider using **Field Group module** to organize fields:

- **Content** group: Heading, Image, Body, Footer Text
- **Settings** group: Variant, Elevation, Link

### Step 4: Configure Display Settings

Navigate to **Manage display** tab (`/admin/structure/paragraphs_type/card/display`).

For the **Default** view mode:

| Field       | Label  | Format                           |
| ----------- | ------ | -------------------------------- |
| Variant     | Hidden | N/A (used as attribute)          |
| Elevation   | Hidden | N/A (used as attribute)          |
| Image       | Hidden | Rendered entity (Full view mode) |
| Heading     | Hidden | Plain text                       |
| Body        | Hidden | Default (filtered text)          |
| Footer Text | Hidden | Plain text                       |
| Link        | Hidden | N/A (used as attribute)          |

**Why hide labels?** Component slots don't need Drupal's field wrapper HTML. We'll access raw values in the Twig template.

## Template Overrides

Drupal's Paragraphs module uses the `paragraph.html.twig` template with several [theme hook suggestions](https://www.drupal.org/docs/develop/theming-drupal/twig-in-drupal/working-with-twig-templates) that allow targeted overrides:

- `paragraph.html.twig` (base template)
- `paragraph--TYPE.html.twig` (specific paragraph type)
- `paragraph--TYPE--VIEW-MODE.html.twig` (type + view mode)

For our Card Paragraph, we'll create a type-specific override: `paragraph--card.html.twig`.

### Locating Template Files

**Base template location:** `modules/contrib/paragraphs/templates/paragraph.html.twig`

**Theme override location:** `themes/custom/MYTHEME/templates/paragraph/paragraph--card.html.twig`

Copy the base template to your theme as a starting point:

```bash
mkdir -p themes/custom/mytheme/templates/paragraph
cp modules/contrib/paragraphs/templates/paragraph.html.twig \
   themes/custom/mytheme/templates/paragraph/paragraph--card.html.twig
```

### Basic Template: Property-Driven Attributes

The simplest approach: map Paragraph fields to component attributes.

```twig
{#
/**
 * @file
 * Template override for Card paragraph type.
 *
 * Available variables:
 * - paragraph: Full paragraph entity
 * - content: Render array of paragraph content
 * - attributes: HTML attributes for wrapper element
 */
#}

<hx-card
  variant="{{ paragraph.field_card_variant.value }}"
  elevation="{{ paragraph.field_card_elevation.value }}"
  {% if paragraph.field_card_link.0.url %}
    hx-href="{{ paragraph.field_card_link.0.url }}"
  {% endif %}
  {{ attributes }}
>
  {% if content.field_card_image|render|trim %}
    <div slot="image">
      {{ content.field_card_image }}
    </div>
  {% endif %}

  {% if paragraph.field_card_heading.value %}
    <span slot="heading">{{ paragraph.field_card_heading.value }}</span>
  {% endif %}

  {{ content.field_card_body }}

  {% if paragraph.field_card_footer.value %}
    <div slot="footer">{{ paragraph.field_card_footer.value }}</div>
  {% endif %}
</hx-card>
```

### Template Breakdown

**Accessing raw field values:**

```twig
{{ paragraph.field_card_variant.value }}
```

This accesses the stored value directly without Drupal's field wrapper HTML. Use for attributes and simple text.

**Accessing rendered content:**

```twig
{{ content.field_card_body }}
```

This renders the field through Drupal's rendering pipeline with formatters, filters, and cache tags. Use for rich text, media, entity references.

**Conditional link attribute:**

```twig
{% if paragraph.field_card_link.0.url %}
  hx-href="{{ paragraph.field_card_link.0.url }}"
{% endif %}
```

Only add the `hx-href` attribute if a link is provided. The component becomes interactive only when needed.

**Conditional slot rendering:**

```twig
{% if content.field_card_image|render|trim %}
  <div slot="image">{{ content.field_card_image }}</div>
{% endif %}
```

Only render slot container if field has content. The `|render|trim` pattern forces evaluation and removes whitespace.

**Preserving Drupal attributes:**

```twig
{{ attributes }}
```

This includes Drupal's contextual links, RDF attributes, and other system-added attributes on the component root.

## Field to Property/Slot Mapping

Different field types require different mapping strategies.

### Text Fields (Plain)

**Use case:** Variant selection, metadata, headings

```twig
{# Direct value access #}
<hx-card variant="{{ paragraph.field_variant.value }}">
  <span slot="heading">{{ paragraph.field_heading.value }}</span>
</hx-card>
```

### Text Fields (Formatted)

**Use case:** Body content with HTML formatting

```twig
{# Rendered to apply text format filters #}
<hx-card>
  {{ content.field_body }}
</hx-card>
```

### Boolean Fields

**Use case:** Toggles (dismissible, disabled, required)

```twig
{# Conditional boolean attribute #}
<hx-alert
  variant="{{ paragraph.field_alert_variant.value }}"
  {% if paragraph.field_dismissible.value %}dismissible{% endif %}
>
  {{ content.field_message }}
</hx-alert>
```

### List Fields (Select)

**Use case:** Variant, size, elevation (controlled vocabularies)

```twig
{# List field value maps directly to attribute #}
<hx-button
  variant="{{ paragraph.field_button_variant.value }}"
  size="{{ paragraph.field_button_size.value }}"
>
  {{ paragraph.field_button_label.value }}
</hx-button>
```

### Link Fields

**Use case:** URLs, CTAs, navigation targets

```twig
{# Link field provides both url and title #}
{% if paragraph.field_link.0.url %}
  <hx-button
    href="{{ paragraph.field_link.0.url }}"
    variant="{{ paragraph.field_button_variant.value }}"
  >
    {{ paragraph.field_link.0.title }}
  </hx-button>
{% endif %}
```

### Media Fields (Image)

**Use case:** Card images, hero backgrounds, thumbnails

```twig
{# Render through Drupal's media system (image styles, responsive images) #}
{% if content.field_card_image|render|trim %}
  <div slot="image">
    {{ content.field_card_image }}
  </div>
{% endif %}
```

**With custom image style:**

```twig
{# Access media entity to render specific image style #}
{% if paragraph.field_card_image.entity %}
  <div slot="image">
    {{ drupal_image(
      paragraph.field_card_image.entity.field_media_image.entity.uri.value,
      'card_image_large',
      {alt: paragraph.field_card_image.entity.field_media_image.alt}
    ) }}
  </div>
{% endif %}
```

### Entity Reference Fields

**Use case:** Related content, nested paragraphs, taxonomy terms

```twig
{# Loop through referenced paragraphs #}
<hx-container variant="narrow">
  {% for item in content.field_nested_paragraphs %}
    {{ item }}
  {% endfor %}
</hx-container>
```

### Multi-Value Fields

**Use case:** Tag lists, image galleries, action button groups

```twig
{# Multiple buttons in actions slot #}
<hx-card>
  <span slot="heading">{{ paragraph.field_heading.value }}</span>
  {{ content.field_body }}
  <div slot="actions">
    {% for item in paragraph.field_action_links %}
      <hx-button href="{{ item.url }}" variant="text">
        {{ item.title }}
      </hx-button>
    {% endfor %}
  </div>
</hx-card>
```

## Preprocessing for Complex Data

When field data needs transformation before template rendering, use [preprocess functions](https://www.drupal.org/docs/8/theming/twig/twig-best-practices-preprocess-functions-and-templates).

### When to Preprocess

- Computing derived values (e.g., time ago, reading time)
- Formatting dates or numbers
- Complex conditional logic
- Building data structures for nested components
- Accessing entity relationships multiple levels deep

### Preprocess Function Pattern

Create a preprocess hook in your theme's `.theme` file:

```php
<?php
// themes/custom/mytheme/mytheme.theme

/**
 * Implements hook_preprocess_paragraph__TYPE().
 */
function mytheme_preprocess_paragraph__card(&$variables) {
  /** @var \Drupal\paragraphs\Entity\Paragraph $paragraph */
  $paragraph = $variables['paragraph'];

  // Example: Compute derived values
  $body_text = $paragraph->get('field_card_body')->value;
  $word_count = str_word_count(strip_tags($body_text));
  $read_time_minutes = ceil($word_count / 200);

  // Make available in Twig template
  $variables['read_time'] = $read_time_minutes;

  // Example: Default variant if empty
  $variant = $paragraph->get('field_card_variant')->value;
  $variables['card_variant'] = $variant ?: 'default';

  // Example: Process link for external indicator
  if (!$paragraph->get('field_card_link')->isEmpty()) {
    $link_url = $paragraph->get('field_card_link')->first()->getUrl();
    $variables['is_external'] = $link_url->isExternal();
  }
}
```

**Accessing preprocessed variables in Twig:**

```twig
<hx-card variant="{{ card_variant }}">
  <span slot="heading">{{ paragraph.field_card_heading.value }}</span>
  {{ content.field_card_body }}
  <div slot="footer">
    {{ read_time }} min read
    {% if is_external %}
      <hx-badge variant="info">External</hx-badge>
    {% endif %}
  </div>
</hx-card>
```

### Complex Example: Date Formatting

```php
function mytheme_preprocess_paragraph__event_card(&$variables) {
  $paragraph = $variables['paragraph'];

  if (!$paragraph->get('field_event_date')->isEmpty()) {
    $timestamp = $paragraph->get('field_event_date')->value;
    $date_formatter = \Drupal::service('date.formatter');

    // Format for display
    $variables['event_date_formatted'] = $date_formatter->format(
      $timestamp,
      'custom',
      'F j, Y'
    );

    // Determine if upcoming
    $variables['is_upcoming'] = $timestamp > time();
  }
}
```

```twig
<hx-card variant="{{ is_upcoming ? 'featured' : 'default' }}">
  <span slot="heading">{{ paragraph.field_event_title.value }}</span>
  {{ content.field_event_description }}
  <div slot="footer">
    <hx-badge variant="{{ is_upcoming ? 'success' : 'neutral' }}">
      {{ event_date_formatted }}
    </hx-badge>
  </div>
</hx-card>
```

## Complete Example: Card Paragraph Implementation

This section brings together all concepts with a production-ready implementation.

### 1. Paragraph Type Configuration

**Machine name:** `card`
**Fields:**

```yaml
field_card_variant:
  type: list_string
  values: [default, featured, compact]
  default: default
  required: true

field_card_elevation:
  type: list_string
  values: [flat, raised, floating]
  default: flat
  required: true

field_card_image:
  type: entity_reference
  target: media
  bundle: image
  required: false

field_card_heading:
  type: string
  max_length: 255
  required: true

field_card_body:
  type: text_long
  format: basic_html
  required: false

field_card_footer:
  type: string
  max_length: 255
  required: false

field_card_link:
  type: link
  required: false
```

### 2. Template Override

**File:** `themes/custom/mytheme/templates/paragraph/paragraph--card.html.twig`

```twig
{#
/**
 * @file
 * Card paragraph template.
 *
 * Maps Paragraph fields to <hx-card> component slots.
 */
#}

{%
  set classes = [
    'paragraph',
    'paragraph--type--' ~ paragraph.bundle|clean_class,
    'paragraph--card',
  ]
%}

<hx-card
  variant="{{ paragraph.field_card_variant.value }}"
  elevation="{{ paragraph.field_card_elevation.value }}"
  {% if paragraph.field_card_link.0.url %}
    hx-href="{{ paragraph.field_card_link.0.url }}"
  {% endif %}
  {{ attributes.addClass(classes) }}
>
  {# Image slot - rendered through Drupal's media system #}
  {% if content.field_card_image|render|trim %}
    <div slot="image">
      {{ content.field_card_image }}
    </div>
  {% endif %}

  {# Heading slot - plain text #}
  {% if paragraph.field_card_heading.value %}
    <span slot="heading">{{ paragraph.field_card_heading.value }}</span>
  {% endif %}

  {# Default slot - formatted body text #}
  {% if content.field_card_body|render|trim %}
    {{ content.field_card_body }}
  {% endif %}

  {# Footer slot - plain text or metadata #}
  {% if paragraph.field_card_footer.value %}
    <div slot="footer">{{ paragraph.field_card_footer.value }}</div>
  {% endif %}
</hx-card>
```

### 3. Preprocess Function (Optional Enhancement)

**File:** `themes/custom/mytheme/mytheme.theme`

```php
<?php

/**
 * Implements hook_preprocess_paragraph__card().
 */
function mytheme_preprocess_paragraph__card(&$variables) {
  /** @var \Drupal\paragraphs\Entity\Paragraph $paragraph */
  $paragraph = $variables['paragraph'];

  // Default variant if not set
  $variant = $paragraph->get('field_card_variant')->value;
  $variables['card_variant'] = $variant ?: 'default';

  // Compute reading time from body text
  if (!$paragraph->get('field_card_body')->isEmpty()) {
    $body_text = $paragraph->get('field_card_body')->value;
    $word_count = str_word_count(strip_tags($body_text));
    $variables['read_time_minutes'] = ceil($word_count / 200);
  }

  // Check if link is external
  if (!$paragraph->get('field_card_link')->isEmpty()) {
    $url = $paragraph->get('field_card_link')->first()->getUrl();
    $variables['is_external_link'] = $url->isExternal();
  }

  // Format media alt text for accessibility
  if (!$paragraph->get('field_card_image')->isEmpty()) {
    $media = $paragraph->get('field_card_image')->entity;
    if ($media && $media->hasField('field_media_image')) {
      $alt = $media->get('field_media_image')->alt;
      $variables['image_alt'] = $alt ?: 'Card image';
    }
  }
}
```

### 4. Enhanced Template with Preprocessing

```twig
<hx-card
  variant="{{ card_variant }}"
  elevation="{{ paragraph.field_card_elevation.value }}"
  {% if paragraph.field_card_link.0.url %}
    hx-href="{{ paragraph.field_card_link.0.url }}"
    {% if is_external_link %}
      aria-label="External link: {{ paragraph.field_card_heading.value }}"
    {% endif %}
  {% endif %}
  {{ attributes }}
>
  {% if content.field_card_image|render|trim %}
    <div slot="image">
      {{ content.field_card_image }}
    </div>
  {% endif %}

  {% if paragraph.field_card_heading.value %}
    <span slot="heading">
      {{ paragraph.field_card_heading.value }}
      {% if is_external_link %}
        <hx-icon name="external-link" size="sm" aria-hidden="true"></hx-icon>
      {% endif %}
    </span>
  {% endif %}

  {{ content.field_card_body }}

  {% if paragraph.field_card_footer.value or read_time_minutes %}
    <div slot="footer">
      {{ paragraph.field_card_footer.value }}
      {% if read_time_minutes %}
        <hx-badge variant="neutral">{{ read_time_minutes }} min read</hx-badge>
      {% endif %}
    </div>
  {% endif %}
</hx-card>
```

### 5. Using the Paragraph Type

**Add to a content type:**

1. Navigate to **Structure → Content types → Article → Manage fields**
2. Add field: **Entity reference revisions**
3. Field label: "Page Sections"
4. Machine name: `field_page_sections`
5. **Type of item to reference:** Paragraph
6. **Paragraph types:** Check "Card"
7. **Number of values:** Unlimited
8. Save settings

**Content editor workflow:**

1. Create/edit an Article node
2. Click **Add Card** in the Page Sections field
3. Fill out Card fields (heading, variant, image, etc.)
4. Save
5. Component renders on the front end with design system styling

## Best Practices

### 1. Field Naming Conventions

**Prefix field names with paragraph type** to avoid collisions when mixing paragraph types:

- Good: `field_card_heading`, `field_card_image`, `field_card_variant`
- Bad: `field_heading`, `field_image`, `field_variant`

This prevents confusion when multiple Paragraph types share similar field names but different formatting requirements.

### 2. Controlled Vocabularies for Variants

**Always use List (text) fields for component variants**, never free-text fields. This ensures:

- Content editors can't introduce invalid variant values
- Changes to component API are updated in one place
- Field validation prevents typos and inconsistencies

```
field_card_variant allowed values:
  default|Default (white background)
  featured|Featured (branded background)
  compact|Compact (reduced padding)
```

### 3. Required vs Optional Fields

Match field requirements to component API expectations:

- **Required:** Variant, heading (components need these to render properly)
- **Optional:** Image, footer, link (components handle empty slots gracefully)

Components with missing required data render error states. Align Drupal's required field validation with component contracts.

### 4. Image Field Configuration

Configure media image fields with appropriate image styles:

```yaml
field_card_image:
  type: media
  display:
    formatter: media_thumbnail
    settings:
      image_style: card_image_large
      responsive_image_style: card_responsive
```

Create image styles at **Configuration → Media → Image styles** that match component slot dimensions.

### 5. Help Text for Editors

Provide clear, actionable help text that explains the field's purpose in the component:

- **Bad:** "Enter a heading"
- **Good:** "Card heading displayed prominently at the top. Recommended: 3-8 words."

Include character count recommendations, variant explanations, and examples.

### 6. Template Comments

Document slot mappings and rendering strategies in template comments:

```twig
{#
  Slot mapping:
  - image: field_card_image (rendered via media formatter)
  - heading: field_card_heading (plain text)
  - default: field_card_body (filtered HTML)
  - footer: field_card_footer (plain text)

  Attributes:
  - variant: field_card_variant (list field)
  - elevation: field_card_elevation (list field)
  - hx-href: field_card_link.url (optional)
#}
```

Future maintainers (including Future You) will thank you.

### 7. Cache Metadata

Ensure Drupal's render cache tags flow through to component output:

```twig
{# Don't do this - loses cache metadata #}
{% set body_text = paragraph.field_card_body.value %}
{{ body_text }}

{# Do this - preserves cache tags #}
{{ content.field_card_body }}
```

Using `content.*` preserves cache tags, cache contexts, and max-age metadata.

### 8. Accessibility Considerations

**Link fields with descriptive text:**

```twig
{# Bad: no context #}
<hx-button href="{{ paragraph.field_link.0.url }}">Read More</hx-button>

{# Good: contextual link text #}
<hx-button href="{{ paragraph.field_link.0.url }}">
  Read more about {{ paragraph.field_card_heading.value }}
</hx-button>
```

**External link indicators:**

```twig
{% if is_external_link %}
  <hx-icon name="external" aria-label="External link"></hx-icon>
{% endif %}
```

**Alt text for images:**

Ensure media image fields require alt text and provide guidance:

```
Alt text help: Describe what's in the image for users who can't see it.
Not required if image is purely decorative.
```

### 9. Defensive Rendering

Check for field existence before accessing values:

```twig
{# Defensive checks #}
{% if paragraph.field_card_link and paragraph.field_card_link.0 %}
  {% if paragraph.field_card_link.0.url %}
    hx-href="{{ paragraph.field_card_link.0.url }}"
  {% endif %}
{% endif %}
```

Or use Twig's null-safe operators (Drupal 10+):

```twig
{% if paragraph.field_card_link.0.url ?? false %}
  hx-href="{{ paragraph.field_card_link.0.url }}"
{% endif %}
```

### 10. Library Attachment

Attach component libraries in preprocess or template:

**Preprocess method:**

```php
function mytheme_preprocess_paragraph__card(&$variables) {
  // Attach hx-card library
  $variables['#attached']['library'][] = 'mytheme/hx-card';
}
```

**Template method:**

```twig
{{ attach_library('mytheme/hx-card') }}

<hx-card>
  {# ... #}
</hx-card>
```

The preprocess method is preferred for automated, consistent library loading.

## Advanced Patterns

### Nested Paragraphs as Slots

Complex components like accordions or tabs can use nested Paragraph fields:

```yaml
# Accordion paragraph type
field_accordion_variant: list_string
field_accordion_items: entity_reference_revisions (Paragraph: Accordion Item)

# Accordion Item paragraph type
field_item_heading: string
field_item_body: text_long
```

```twig
{# paragraph--accordion.html.twig #}
<hx-accordion variant="{{ paragraph.field_accordion_variant.value }}">
  {% for item in paragraph.field_accordion_items %}
    <hx-accordion-item>
      <span slot="heading">{{ item.entity.field_item_heading.value }}</span>
      {{ item.entity.field_item_body.value }}
    </hx-accordion-item>
  {% endfor %}
</hx-accordion>
```

### Paragraph Type as Layout Container

Use paragraphs to wrap other paragraphs with layout components:

```yaml
# Container paragraph type
field_container_variant: list_string [narrow, default, wide, full]
field_container_items: entity_reference_revisions (Paragraph: any)
```

```twig
{# paragraph--container.html.twig #}
<hx-container variant="{{ paragraph.field_container_variant.value }}">
  {% for item in content.field_container_items %}
    {{ item }}
  {% endfor %}
</hx-container>
```

Now editors can nest cards, alerts, and other components inside layout containers.

### View Mode Variations

Create multiple view modes for different component presentations:

**Configuration:**

- Default view mode → `<hx-card variant="default">`
- Teaser view mode → `<hx-card variant="compact">`
- Featured view mode → `<hx-card variant="featured" elevation="floating">`

**Template suggestions:**

```
paragraph--card--default.html.twig
paragraph--card--teaser.html.twig
paragraph--card--featured.html.twig
```

**Usage in parent entity:**

```twig
{# Render all cards in teaser mode #}
{% for item in content.field_page_sections %}
  {{ item|view('teaser') }}
{% endfor %}
```

## Troubleshooting

### Component Not Rendering

**Symptom:** Page displays paragraph content but web component doesn't apply styles.

**Solutions:**

1. Verify library is attached: Check browser DevTools → Network for component JS file
2. Check template override path: `drush debug:theme` to verify template discovery
3. Clear cache: `drush cr` after template changes
4. Check browser console for custom element registration errors

### Slots Not Populating

**Symptom:** Component renders but slots are empty.

**Solutions:**

1. Check field access: Ensure current user has permission to view field
2. Verify field formatter: Some formatters return empty render arrays
3. Use `{{ content.field_name|render|trim }}` to force rendering for conditionals
4. Check view mode configuration: Field may be hidden in current view mode

### Attributes Not Applying

**Symptom:** Component renders with default variant instead of field value.

**Solutions:**

1. Check field value access: Use `{{ dump(paragraph.field_variant.value) }}` to debug
2. Verify list field keys: Use machine name (e.g., `featured`), not label (e.g., `Featured`)
3. Check for whitespace: `{{ paragraph.field_variant.value|trim }}`
4. Ensure field has value: Check default value configuration

### Template Changes Not Appearing

**Symptom:** Template edits don't show on front end.

**Solutions:**

1. Clear Drupal cache: `drush cr`
2. Disable Twig cache: **Configuration → Development → Twig** → Disable cache (development only)
3. Check template path: Verify Drupal is discovering your override (check `drush debug:theme`)
4. Rebuild theme registry: `drush php-eval 'drupal_theme_rebuild();'`

### Preprocess Function Not Running

**Symptom:** Template variables from preprocess are undefined.

**Solutions:**

1. Clear cache after adding preprocess function: `drush cr`
2. Check function naming: Must be `THEMENAME_preprocess_paragraph__BUNDLE`
3. Verify bundle machine name: Use underscore `card`, not hyphen `card`
4. Check `.theme` file syntax: PHP parse errors silently prevent preprocess execution

## Related Resources

This guide focused on Paragraphs integration. For broader Drupal patterns:

- **[Drupal Integration Overview](/drupal-integration/overview/)** - Integration philosophy and architecture
- **[TWIG Patterns](/drupal-integration/twig/)** - General Twig template examples
- **[Installation Guide](/drupal-integration/installation/)** - Adding HELIX to your theme
- **[Drupal Behaviors](/drupal-integration/behaviors/)** - JavaScript lifecycle integration

For component API reference:

- **[hx-card Component](/components/hx-card/)** - Full API documentation
- **[Design Tokens](/design-tokens/overview/)** - Customizing component appearance
- **[Accessibility](/guides/accessibility/)** - WCAG compliance guidance

For Paragraphs module documentation:

- [Paragraphs Module Project Page](https://www.drupal.org/project/paragraphs)
- [Using and Customizing the Paragraphs Module](https://www.specbee.com/blogs/using-and-customizing-paragraphs-module-in-drupal)
- [Preprocessing Paragraphs: A Beginner's Guide](https://chromatichq.com/insights/preprocessing-paragraphs-beginners-guide/)
- [Working with Twig Templates](https://www.drupal.org/docs/develop/theming-drupal/twig-in-drupal/working-with-twig-templates)
- [Paragraphs Template Theming](https://www.drupal.org/node/2532824)

## Next Steps

Now that you understand Paragraphs integration, explore related advanced patterns:

1. **Layout Builder Integration** - Use components in Layout Builder sections
2. **Views Integration** - Render component-wrapped view rows
3. **Form Integration** - Map Webform fields to form components
4. **Media Integration** - Advanced media field rendering strategies
5. **Single Directory Components (SDC)** - Wrap HELIX components in Drupal SDC definitions

Each integration point builds on the same core principle: **Drupal manages content, HELIX enforces design standards**.
