# @helixui/drupal-behaviors — Usage Guide

Practical integration patterns for consuming `@helixui/drupal-behaviors` in Drupal 10 and 11 themes and modules.

---

## Setup: libraries.yml

### Combined bundle (all behaviors)

```yaml
# mytheme.libraries.yml
helix-behaviors:
  version: 0.1.0
  js:
    /libraries/helix-behaviors/src/index.js: {}
  dependencies:
    - core/drupal
    - core/once
```

### Selective loading (per-component)

```yaml
# mytheme.libraries.yml
helix-accordion:
  version: 0.1.0
  js:
    /libraries/helix-behaviors/src/behaviors/hx-accordion.behavior.js: {}
  dependencies:
    - core/drupal
    - core/once

helix-dialog:
  version: 0.1.0
  js:
    /libraries/helix-behaviors/src/behaviors/hx-dialog.behavior.js: {}
  dependencies:
    - core/drupal
    - core/once

helix-drawer:
  version: 0.1.0
  js:
    /libraries/helix-behaviors/src/behaviors/hx-drawer.behavior.js: {}
  dependencies:
    - core/drupal
    - core/once

helix-tabs:
  version: 0.1.0
  js:
    /libraries/helix-behaviors/src/behaviors/hx-tabs.behavior.js: {}
  dependencies:
    - core/drupal
    - core/once

helix-toast:
  version: 0.1.0
  js:
    /libraries/helix-behaviors/src/behaviors/hx-toast.behavior.js: {}
  dependencies:
    - core/drupal
    - core/once
```

Attach libraries in Twig with `{{ attach_library('mytheme/helix-accordion') }}` or via a module's `hook_page_attachments()`.

---

## Twig Templates

### hx-accordion — Collapsible FAQ section

```twig
{# templates/components/faq-section.html.twig #}
{{ attach_library('mytheme/helix-accordion') }}

<div data-drupal-accordion data-open-first="true">
  <hx-accordion>
    {% for item in faq_items %}
      <hx-accordion-panel>
        <span slot="heading">{{ item.question }}</span>
        {{ item.answer }}
      </hx-accordion-panel>
    {% endfor %}
  </hx-accordion>
</div>
```

### hx-dialog — Patient record modal

```twig
{# templates/node/node--patient-record--teaser.html.twig #}
{{ attach_library('mytheme/helix-dialog') }}

<div
  data-drupal-dialog
  data-trigger-selector="#dialog-trigger-{{ node.id() }}"
>
  <hx-dialog>
    <span slot="heading">{{ node.label() }}</span>
    <div>
      <p>DOB: {{ node.field_date_of_birth.value }}</p>
      <p>MRN: {{ node.field_mrn.value }}</p>
    </div>
    <div slot="footer">
      <wc-button variant="secondary" data-close-dialog>Close</wc-button>
    </div>
  </hx-dialog>
</div>
<hx-button id="dialog-trigger-{{ node.id() }}" variant="tertiary">
  View Record
</hx-button>
```

### hx-drawer — Mobile navigation

```twig
{# templates/navigation/navigation--mobile.html.twig #}
{{ attach_library('mytheme/helix-drawer') }}

<div
  data-drupal-drawer
  data-trigger-selector="#mobile-nav-toggle"
  data-direction="left"
  data-size="320px"
>
  <hx-drawer>
    <nav>
      {{ drupal_menu('main') }}
    </nav>
  </hx-drawer>
</div>

<button id="mobile-nav-toggle" aria-label="{{ 'Open navigation'|t }}">
  <span class="visually-hidden">{{ 'Menu'|t }}</span>
  &#9776;
</button>
```

### hx-tabs — Patient profile tabs with deep linking

```twig
{# templates/node/node--patient-profile--full.html.twig #}
{{ attach_library('mytheme/helix-tabs') }}

<div data-drupal-tabs data-active-tab="overview">
  <hx-tabs>
    <hx-tab value="overview">{{ 'Overview'|t }}</hx-tab>
    <hx-tab value="medications">{{ 'Medications'|t }}</hx-tab>
    <hx-tab value="history">{{ 'History'|t }}</hx-tab>

    <hx-tab-panel value="overview">
      {{ content.field_patient_summary }}
    </hx-tab-panel>
    <hx-tab-panel value="medications">
      {{ content.field_medications }}
    </hx-tab-panel>
    <hx-tab-panel value="history">
      {{ content.field_visit_history }}
    </hx-tab-panel>
  </hx-tabs>
</div>
```

Linking directly to the History tab: `/patient/123#history`

### hx-toast — Drupal status messages

```twig
{# templates/misc/status-messages.html.twig #}
{{ attach_library('mytheme/helix-toast') }}

{% for type, messages in message_list %}
  {% for message in messages %}
    <div
      data-drupal-toast
      data-duration="6000"
      data-show="true"
    >
      <hx-toast variant="{{ type }}">
        {{ message }}
        <button slot="close" data-toast-close aria-label="{{ 'Dismiss'|t }}">
          &times;
        </button>
      </hx-toast>
    </div>
  {% endfor %}
{% endfor %}
```

### hx-tooltip — Field help text

```twig
{# templates/field/field--field-mrn.html.twig #}
{{ attach_library('mytheme/helix-tooltip') }}

<div
  data-drupal-tooltip
  data-content="{{ 'Medical Record Number assigned by the EHR system'|t }}"
  data-placement="top"
>
  <hx-tooltip>
    <span slot="trigger">
      {{ label }}
      <span aria-hidden="true">?</span>
    </span>
  </hx-tooltip>
</div>

{{ items }}
```

### hx-popover — Contextual actions menu

```twig
{# templates/views/views-view-field--actions.html.twig #}
{{ attach_library('mytheme/helix-accordion') }}

<div data-drupal-popover data-placement="bottom-end" data-trigger="click">
  <hx-popover>
    <hx-button slot="trigger" variant="ghost" size="sm">
      {{ 'Actions'|t }}
    </hx-button>
    <div slot="content">
      <ul>
        <li><a href="{{ edit_url }}">{{ 'Edit'|t }}</a></li>
        <li><a href="{{ delete_url }}">{{ 'Delete'|t }}</a></li>
      </ul>
    </div>
  </hx-popover>
</div>
```

---

## Drupal Module Integration

### Attaching behaviors from a custom module

```php
<?php
// mymodule.module

/**
 * Implements hook_page_attachments().
 */
function mymodule_page_attachments(array &$attachments): void {
  $attachments['#attached']['library'][] = 'mymodule/helix-behaviors';
}
```

```yaml
# mymodule.libraries.yml
helix-behaviors:
  version: 0.1.0
  js:
    /libraries/helix-behaviors/src/index.js: {}
  dependencies:
    - core/drupal
    - core/once
```

### Attaching only on specific routes

```php
<?php
/**
 * Implements hook_page_attachments().
 */
function mymodule_page_attachments(array &$attachments): void {
  $route = \Drupal::routeMatch()->getRouteName();
  if (str_starts_with($route, 'entity.node.canonical')) {
    $attachments['#attached']['library'][] = 'mymodule/helix-tabs';
    $attachments['#attached']['library'][] = 'mymodule/helix-accordion';
  }
}
```

---

## Drupal Views Integration

When using HELiX components in Views templates, wrapper elements with `data-drupal-*` attributes work within the Views AJAX refresh cycle automatically:

```twig
{# views/views-view-unformatted--patient-list.html.twig #}
{{ attach_library('mytheme/helix-drawer') }}

<div class="patient-list">
  {% for row in rows %}
    <div data-drupal-drawer data-trigger-selector=".patient-{{ loop.index }}-toggle">
      <hx-drawer>
        <div>{{ row.content }}</div>
      </hx-drawer>
    </div>
    <button class="patient-{{ loop.index }}-toggle">
      {{ 'View Details'|t }}
    </button>
  {% endfor %}
</div>
```

When the View refreshes via AJAX (pagination, filters), `Drupal.behaviors.hxDrawer.attach()` runs again on the new DOM. The `once()` call ensures only newly inserted elements get initialized — already-processed elements are skipped.

---

## Layout Builder Compatibility

Layout Builder inserts blocks as partial DOM updates. Behaviors run on each inserted block's subtree. The `context` parameter scopes `once()` to the new subtree, preventing double-initialization of pre-existing elements:

```twig
{# In a Layout Builder block template #}
<div data-drupal-accordion>
  <hx-accordion>
    {{ content }}
  </hx-accordion>
</div>
```

No special configuration is required — the `once()` pattern handles Layout Builder automatically.

---

## Single Directory Components (SDC)

When wrapping HELiX components in Drupal SDCs, add the `data-drupal-*` wrapper at the SDC template level:

```yaml
# components/patient-accordion/patient-accordion.component.yml
name: Patient Accordion
status: stable
props:
  type: object
  properties:
    open_first:
      type: boolean
      default: false
    items:
      type: array
```

```twig
{# components/patient-accordion/patient-accordion.html.twig #}
{{ attach_library('mytheme/helix-accordion') }}

<div
  data-drupal-accordion
  {% if open_first %}data-open-first="true"{% endif %}
>
  <hx-accordion>
    {% for item in items %}
      <hx-accordion-panel>
        <span slot="heading">{{ item.heading }}</span>
        {{ item.body }}
      </hx-accordion-panel>
    {% endfor %}
  </hx-accordion>
</div>
```
