---
title: Paragraphs Module Integration
description: Mapping Drupal Paragraph types to HELiX components — paragraph template overrides, the paragraph--hero pattern, nested paragraphs with compound components, Paragraphs behaviors, and media field handling.
sidebar:
  order: 6
---

The Paragraphs module lets content editors assemble pages from structured content blocks. Paired with HELiX web components, each Paragraph type maps to a component that enforces consistent design-system presentation without requiring editors to write markup.

---

## Architecture

```
Content Editor
  ↓ creates
Paragraph Item (fields: heading, body, image, cta_url, cta_label)
  ↓ Drupal renders fields through formatters
Render Array (rendered field output)
  ↓ Twig template override
<hx-card>
  <span slot="heading">{{ rendered heading }}</span>
  <div slot="media">{{ rendered image }}</div>
</hx-card>
  ↓ browser upgrades
Web component with Shadow DOM styles
```

The Paragraph type defines the content schema. The Twig template override maps that content into HELiX component slots and attributes.

---

## Paragraph Type to Component Mapping

| Paragraph Type | HELiX Component | Notes |
|---|---|---|
| Hero Banner | `hx-card` (full-bleed) or custom hero slot | Large format, image-forward |
| Content Card | `hx-card` | Teaser with media, heading, body, CTA |
| Alert/Notice | `hx-alert` | Variant: info, warning, success, danger |
| Staff Profile | `hx-card` + `hx-avatar` + `hx-badge` | Photo, name, role, department |
| CTA Button | `hx-button` | href, variant, label |
| Accordion | `hx-accordion` + `hx-accordion-item` | FAQ, collapsible content |
| Tabs | `hx-tabs` + `hx-tab-panel` | Sectioned content |
| Form Embed | `hx-form` wrapping form elements | Contact forms, survey embeds |

---

## Setting Up: Define a Card Paragraph Type

### Step 1: Create the Paragraph type

In Drupal admin: **Structure → Paragraph types → Add paragraph type**

Bundle name: `content_card`

Add fields:
- `field_card_heading` — Plain text
- `field_card_body` — Text (with text format)
- `field_card_image` — Media reference (image)
- `field_card_cta_url` — Link
- `field_card_variant` — List (text): `default`, `elevated`, `outlined`

### Step 2: Override the Paragraph template

Copy Drupal's base template to your theme:

```bash
cp web/modules/contrib/paragraphs/templates/paragraph.html.twig \
   web/themes/custom/mytheme/templates/paragraph--content-card.html.twig
```

### Step 3: Write the component template

```twig
{# templates/paragraph--content-card.html.twig #}
{{ attach_library('mytheme/helix-card') }}
{{ attach_library('mytheme/helix-button') }}

{% set variant = content.field_card_variant[0]['#markup']|default('default') %}

<hx-card variant="{{ variant|escape }}">

  {# Media: Drupal-rendered image with image style applied #}
  {% if content.field_card_image[0] %}
    <div slot="media">
      {{- content.field_card_image -}}
    </div>
  {% endif %}

  {# Heading #}
  {% if content.field_card_heading[0] %}
    <span slot="heading">
      {{- content.field_card_heading[0]['#context']['value']|escape -}}
    </span>
  {% endif %}

  {# Body — rendered through text format pipeline #}
  {% if content.field_card_body[0] %}
    <div class="card-body-content">
      {{- content.field_card_body -}}
    </div>
  {% endif %}

  {# CTA #}
  {% if content.field_card_cta_url[0] %}
    <div slot="actions">
      <hx-button
        href="{{ content.field_card_cta_url[0]['#url']|escape }}"
        variant="primary"
      >
        {{- content.field_card_cta_url[0]['#title']|escape -}}
      </hx-button>
    </div>
  {% endif %}

</hx-card>
```

### Step 4: Clear cache

```bash
drush cr
```

---

## Hero Banner Pattern

A hero banner uses a full-bleed image with overlay text. The pattern differs from a card because the image is a background and text overlays it.

### Template: paragraph--hero.html.twig

```twig
{# templates/paragraph--hero.html.twig #}
{{ attach_library('mytheme/helix-button') }}
{{ attach_library('mytheme/helix-text') }}

{% set bg_url = content.field_hero_image[0]['#media'].field_media_image.entity.fileuri.value|file_url %}

<section
  class="hero-banner"
  style="--hero-bg: url('{{ bg_url|escape }}')"
  aria-label="{{ content.field_hero_headline[0]['#context']['value']|escape }}"
>
  <div class="hero-banner__content">
    <hx-text tag="h1" variant="display">
      {{ content.field_hero_headline[0]['#context']['value']|escape }}
    </hx-text>

    {% if content.field_hero_subheadline[0] %}
      <hx-text tag="p" variant="lead">
        {{ content.field_hero_subheadline[0]['#context']['value']|escape }}
      </hx-text>
    {% endif %}

    {% if content.field_hero_cta_url[0] %}
      <hx-button
        href="{{ content.field_hero_cta_url[0]['#url']|escape }}"
        variant="primary"
        hx-size="lg"
      >
        {{ content.field_hero_cta_url[0]['#title']|escape }}
      </hx-button>
    {% endif %}
  </div>
</section>
```

CSS for the hero section:

```css
/* paragraph--hero.css in the theme */
.hero-banner {
  position: relative;
  background-image: var(--hero-bg);
  background-size: cover;
  background-position: center;
  min-height: 480px;
  display: flex;
  align-items: center;
}

.hero-banner__content {
  position: relative;
  z-index: 1;
  padding: var(--hx-space-10) var(--hx-space-6);
  max-width: 720px;
  color: white;
}
```

---

## Nested Paragraphs: Accordion with Item Children

Paragraphs supports nested entity references. An `accordion` Paragraph type can reference multiple `accordion_item` Paragraph children.

### Parent type: accordion

Fields:
- `field_accordion_items` — Entity reference revisions (Paragraph type: `accordion_item`)

### Child type: accordion_item

Fields:
- `field_item_heading` — Plain text
- `field_item_body` — Text with text format

### Parent template: paragraph--accordion.html.twig

```twig
{{ attach_library('mytheme/helix-accordion') }}

<hx-accordion>
  {% for item in content.field_accordion_items %}
    {% if item['#paragraph'] is defined %}
      {# Each item is a rendered paragraph via entity reference #}
      {{ item }}
    {% endif %}
  {% endfor %}
</hx-accordion>
```

### Child template: paragraph--accordion-item.html.twig

```twig
{# No library needed — parent loads helix-accordion #}
<hx-accordion-item>
  <span slot="heading">
    {{- content.field_item_heading[0]['#context']['value']|escape -}}
  </span>
  <div>
    {{- content.field_item_body -}}
  </div>
</hx-accordion-item>
```

The child template renders an `<hx-accordion-item>` element. These are slotted into the parent `<hx-accordion>` via the normal DOM hierarchy — Drupal's render pipeline produces the correct nesting automatically.

---

## Media Field Handling

Drupal's media system renders images through image styles (responsive images, focal point). Pass the rendered output directly to the component slot — do not extract the raw URL.

```twig
{# Correct: pass rendered content array — includes image styles, alt, srcset #}
{% if content.field_card_image[0] %}
  <div slot="media">
    {{- content.field_card_image -}}
  </div>
{% endif %}
```

```twig
{# Wrong: extracts raw URL, loses image styles and srcset #}
{% set img_url = content.field_card_image[0]['#media'].field_media_image.entity.fileuri.value|file_url %}
<img src="{{ img_url }}" slot="media">
```

The `|raw` filter is safe when applied to `content.*` render arrays because Drupal's rendering pipeline (not user input) produced the HTML.

---

## Paragraphs Behaviors

Paragraphs module provides a Behaviors UI for configuring variant options in the paragraph widget. You can use this to expose the `card_variant` field without creating a Select list field.

### Enable behaviors for a type

In the Paragraph type edit form: **Behaviors** tab → Enable "Paragraphs Style" or create a custom behavior plugin.

### Custom behavior plugin

```php
<?php
// src/Plugin/paragraphs/Behavior/HelixCardBehavior.php
namespace Drupal\my_module\Plugin\paragraphs\Behavior;

use Drupal\paragraphs\ParagraphsBehaviorBase;
use Drupal\paragraphs\ParagraphInterface;
use Drupal\Core\Form\FormStateInterface;

/**
 * @ParagraphsBehavior(
 *   id = "helix_card_behavior",
 *   label = @Translation("HELiX Card Behavior"),
 *   entity_type_plugin_ids = {"content_card"}
 * )
 */
class HelixCardBehavior extends ParagraphsBehaviorBase {

  public function buildBehaviorForm(
    ParagraphInterface $paragraph,
    array &$field_widget_complete_form,
    FormStateInterface $form_state
  ): array {
    return [
      'card_variant' => [
        '#type' => 'select',
        '#title' => $this->t('Card Style'),
        '#options' => [
          'default' => $this->t('Default'),
          'elevated' => $this->t('Elevated'),
          'outlined' => $this->t('Outlined'),
        ],
        '#default_value' => $paragraph->getBehaviorSetting('helix_card_behavior', 'card_variant', 'default'),
      ],
    ];
  }

  public function validateBehaviorForm(
    ParagraphInterface $paragraph,
    array &$form,
    FormStateInterface $form_state
  ): void {}

  public function submitBehaviorForm(
    ParagraphInterface $paragraph,
    array &$form,
    FormStateInterface $form_state
  ): void {
    $paragraph->setBehaviorSettings('helix_card_behavior', [
      'card_variant' => $form_state->getValue('card_variant'),
    ]);
  }

}
```

In the Paragraph template:

```twig
{% set variant = paragraph.getBehaviorSetting('helix_card_behavior', 'card_variant', 'default') %}
<hx-card variant="{{ variant|escape }}">
```

---

## Preprocess Hook for Paragraphs

Use `hook_preprocess_paragraph` to prepare data before it reaches the template:

```php
/**
 * Implements hook_preprocess_paragraph() for content_card.
 */
function mytheme_preprocess_paragraph__content_card(array &$variables): void {
  $paragraph = $variables['paragraph'];

  // Extract variant from behavior settings
  $variables['card_variant'] = $paragraph->getBehaviorSetting(
    'helix_card_behavior',
    'card_variant',
    'default'
  );

  // Extract clean CTA data
  if (!$paragraph->field_card_cta_url->isEmpty()) {
    $link = $paragraph->field_card_cta_url->first();
    $variables['cta_url'] = $link->getUrl()->toString();
    $variables['cta_label'] = $link->title ?: $link->getUrl()->toString();
  }
}
```

---

## Related

- [SDC Composition Patterns](/drupal/sdc/composition/) — Composing HELiX components for content patterns
- [Twig Templates: Slots](/drupal/twig-templates/slots/) — Slot projection mechanics
- [Twig Templates: Properties](/drupal/twig-templates/properties/) — Attribute output
