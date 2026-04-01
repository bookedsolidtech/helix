---
title: Migration from Traditional Themes
description: Migrating from Bootstrap/jQuery Drupal themes to HELiX web components — gradual migration strategy, coexistence with existing themes, replacing form elements, cards, alerts, and CDN-based gradual adoption.
sidebar:
  order: 9
---

Migrating from a traditional Drupal theme (Bootstrap, Bartik-based, jQuery-heavy) to HELiX web components does not require a full rewrite. The most effective approach runs HELiX alongside your existing theme, migrates one content pattern at a time, and validates each change before proceeding.

---

## What Changes in the Migration

**Traditional Drupal theming:**

- Global CSS stylesheets applied via selector specificity
- jQuery for interactive behaviors (accordions, dropdowns, tabs)
- Twig templates producing flat HTML for CSS targeting
- `Drupal.behaviors` wrapping jQuery plugins
- SCSS variables for theme customization

**HELiX architecture:**

- Shadow DOM encapsulation per component
- Native Custom Elements lifecycle (no jQuery dependency)
- Twig templates producing web component tags with slotted content
- CSS custom properties (`--hx-*`) for theming
- `Drupal.behaviors` using `once()` for event attachment

---

## Gradual Migration Strategy

Migrate in three phases. Each phase can be deployed independently.

### Phase 1: Load HELiX alongside the existing theme

Add HELiX as a library dependency without removing anything. Both Bootstrap (or your existing CSS framework) and HELiX coexist.

```yaml
# mytheme.libraries.yml
helix-core:
  version: 1.1.2
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helixui/tokens@0.3.4/dist/tokens.css:
        type: external
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-button/index.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }
```

At this point, no existing HTML is changed. Adding the library causes no visual or functional changes.

### Phase 2: Migrate one pattern at a time

Pick the simplest, most self-contained pattern first. Cards are a good starting point because they are read-only (no form interactions) and visually isolated.

**Before — Bootstrap card:**

```twig
{# templates/node--article--teaser.html.twig — Bootstrap #}
<div class="card">
  {% if content.field_image %}
    <div class="card-img-top">{{ content.field_image }}</div>
  {% endif %}
  <div class="card-body">
    <h5 class="card-title">{{ node.label }}</h5>
    <p class="card-text">{{ content.body }}</p>
    <a href="{{ url }}" class="btn btn-primary">Read More</a>
  </div>
</div>
```

**After — HELiX:**

```twig
{# templates/node--article--teaser.html.twig — HELiX #}
{{ attach_library('mytheme/helix-card') }}
{{ attach_library('mytheme/helix-button') }}

<hx-card variant="default">
  {% if content.field_image %}
    <div slot="media">{{ content.field_image }}</div>
  {% endif %}
  <span slot="heading">{{ node.label }}</span>
  {{ content.body }}
  <div slot="actions">
    <hx-button href="{{ url }}" variant="primary">Read More</hx-button>
  </div>
</hx-card>
```

Deploy and verify. No other templates change.

### Phase 3: Remove legacy CSS and jQuery dependencies

Once all patterns have been migrated, audit which Bootstrap/jQuery files are still referenced. Remove them from your libraries YAML and theme info file. Test regression.

---

## Coexistence with Existing Themes

### Namespace isolation

HELiX component styles live inside Shadow DOM. Bootstrap's global CSS selectors cannot reach inside `hx-card`'s shadow root — there is no conflict between Bootstrap's `.card` styles and HELiX's card component.

The only potential conflict is:

- **CSS custom property names** — HELiX uses `--hx-` prefix to avoid collisions with Bootstrap's variables (Bootstrap 5 uses `--bs-` prefix).
- **JavaScript variable names** — HELiX behaviors use the `helix` namespace in `once()` calls.

### Running HELiX on specific page regions only

During migration, you may want HELiX only in certain page sections:

```twig
{# Use HELiX only in the content region, not in header/footer #}
{% if page.content %}
  {{ attach_library('mytheme/helix-card') }}
  {{ page.content }}
{% endif %}
```

### Phased template migration

Use Drupal's template suggestion system to serve both the old and new template simultaneously based on view mode:

```
node--article--teaser.html.twig       ← Bootstrap (existing)
node--article--teaser--helix.html.twig ← HELiX (new)
```

Add a template suggestion in preprocess:

```php
function mytheme_preprocess_node(array &$variables): void {
  if ($variables['view_mode'] === 'teaser') {
    // Opt specific content types into HELiX on a flag
    $use_helix = \Drupal::config('mytheme.settings')->get('use_helix_teasers');
    if ($use_helix) {
      $variables['theme_hook_suggestions'][] = 'node__article__teaser__helix';
    }
  }
}
```

This allows A/B testing the migration before full cutover.

---

## Replacing Form Elements

Form element migration is higher risk than card migration because it involves server-side validation and form submission. Migrate with a FormElement plugin (see [Form Element Plugins](/drupal/forms/element-plugin/)) so existing form validation logic continues to work.

### Before — standard Drupal textfield

```php
$form['email'] = [
  '#type' => 'textfield',
  '#title' => $this->t('Email Address'),
  '#required' => TRUE,
];
```

### After — HELiX text input

```php
$form['email'] = [
  '#type' => 'helix_text_input',  // Custom plugin — same API
  '#title' => $this->t('Email Address'),
  '#required' => TRUE,
  '#attributes' => ['type' => 'email'],
];
```

The FormElement plugin maps all standard Form API keys (`#title`, `#required`, `#default_value`, `#element_validate`) to the HELiX component's attributes. Your validation handlers, AJAX callbacks, and submit handlers require no changes.

### Gradual form migration by form ID

Migrate specific forms without touching others:

```php
// Only migrate the contact form
function my_module_form_contact_message_contact_form_alter(
  array &$form,
  FormStateInterface $form_state
): void {
  if (isset($form['field_message'])) {
    $form['field_message']['widget'][0]['value']['#type'] = 'helix_textarea';
  }
}
```

---

## Replacing Alerts

**Before — Bootstrap alert:**

```twig
<div class="alert alert-danger" role="alert">
  {{ message }}
</div>
```

**After — HELiX alert:**

```twig
{{ attach_library('mytheme/helix-alert') }}
<hx-alert variant="danger">
  {{ message|escape }}
</hx-alert>
```

---

## Replacing Accordions and Tabs

jQuery-dependent accordions require a behavior migration as well as a markup migration.

**Before — jQuery accordion:**

```twig
<div id="accordion-{{ id }}" class="accordion-container">
  {% for item in items %}
    <h3 class="accordion-trigger">{{ item.title }}</h3>
    <div class="accordion-content">{{ item.body }}</div>
  {% endfor %}
</div>
```

```javascript
// jQuery behavior
Drupal.behaviors.accordion = {
  attach(context) {
    once('jquery-accordion', '.accordion-container', context).forEach((el) => {
      $(el).accordion({ collapsible: true });
    });
  },
};
```

**After — HELiX accordion:**

```twig
{{ attach_library('mytheme/helix-accordion') }}
<hx-accordion>
  {% for item in items %}
    <hx-accordion-item>
      <span slot="heading">{{ item.title|escape }}</span>
      {{ item.body|escape }}
    </hx-accordion-item>
  {% endfor %}
</hx-accordion>
```

No JavaScript behavior needed — the component handles expand/collapse natively.

---

## CDN-Based Gradual Adoption

The CDN approach is the lowest-friction way to introduce HELiX into an existing theme. No npm, no build pipeline.

```yaml
# Add to an existing theme's libraries YAML
helix-gradual:
  version: 1.1.2
  css:
    theme:
      https://cdn.jsdelivr.net/npm/@helixui/tokens@0.3.4/dist/tokens.css:
        type: external
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/index.js:
      type: external
      preprocess: false
      attributes: { type: module, crossorigin: anonymous }
```

Attach it only on pages you are actively migrating:

```twig
{# Only on the page template you are migrating #}
{{ attach_library('mytheme/helix-gradual') }}
```

This limits the blast radius — CDN load only on migrated pages, no impact on others.

---

## Migration Risk Register

| Migration step | Risk | Mitigation |
|---|---|---|
| Loading HELiX CSS tokens | Medium — `--hx-*` properties visible globally | Use `--hx-` prefix — no conflict with `--bs-` |
| Migrating card templates | Low — no form interaction | Test in staging, compare screenshots |
| Migrating form elements | High — validation and submission | Use FormElement plugin, preserve `#type` API |
| Removing Bootstrap JS | Medium — existing behaviors may depend on it | Audit all jQuery dependencies before removal |
| Removing Bootstrap CSS | High — global selectors affect many templates | Remove only after all templates migrated |
| Removing jQuery | High — Drupal core still uses jQuery | Do not remove jQuery — only remove your custom jQuery behaviors |

---

## Rollback

Each template migration is independently revertable. Keep the original template in version control. If a migration causes issues, restore the original template and clear the Drupal theme cache:

```bash
drush cr
```

Because HELiX components are additive (new template files, new libraries, new element plugins), rollback never requires destructive changes to existing code.

---

## Related

- [Form Element Plugins](/drupal/forms/element-plugin/) — Wrapping HELiX form components in the Form API
- [SDC Architecture](/drupal/sdc/overview/) — Composition patterns for content types
- [Theming](/drupal/theming/) — Migrating from SCSS variables to CSS custom properties
