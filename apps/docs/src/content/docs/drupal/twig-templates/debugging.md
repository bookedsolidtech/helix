---
title: Debugging Twig Templates
description: Debugging strategies for HELiX web components in Drupal Twig templates — browser DevTools, Shadow DOM inspection, component not rendering, slot content not displaying, Twig dump() and Kint, and Devel module integration.
sidebar:
  order: 5
---

Debugging HELiX component integration in Drupal Twig templates involves two distinct debugging contexts: the **server-side Twig layer** (what Drupal renders) and the **client-side browser layer** (how the components hydrate). A problem that looks like a component rendering bug is often a Twig variable access error, and vice versa. This document gives you a systematic approach to both.

---

## Enable Twig Debug Mode

Twig debug is disabled in production for performance. Enable it locally by editing `sites/default/services.yml`:

```yaml
parameters:
  twig.config:
    debug: true
    auto_reload: true
    cache: false
```

Clear caches after the change:

```bash
drush cr
```

With debug enabled, Drupal inserts HTML comments around every rendered template:

```html
<!-- THEME DEBUG -->
<!-- THEME HOOK: 'node' -->
<!-- FILE NAME SUGGESTIONS:
   * node--patient--123--card.html.twig
   * node--patient--card.html.twig
   x node--patient.html.twig
   * node.html.twig
-->
<!-- BEGIN OUTPUT from 'themes/custom/mytheme/templates/node--patient.html.twig' -->
<hx-card variant="featured">...</hx-card>
<!-- END OUTPUT from 'themes/custom/mytheme/templates/node--patient.html.twig' -->
```

The `x` marks the active template. The others are valid suggestions you can override.

---

## Twig `dump()` for Variable Inspection

The `dump()` function prints variable contents. It is your primary tool for verifying that Twig variables have the values you expect before binding them to component attributes.

### Basic Usage

```twig
{# Dump all variables in this template's scope #}
{{ dump() }}

{# Dump a specific variable #}
{{ dump(node.field_patient_id) }}

{# Dump a nested value #}
{{ dump(node.field_department.entity.name.value) }}

{# Dump multiple values at once #}
{{ dump(node, content, view_mode) }}
```

### Debugging Before Component Rendering

Always verify attribute values before binding them:

```twig
{# Debug the values you're about to use #}
{# {{ dump({
  'variant': node.field_card_variant.value,
  'size': node.field_button_size.value,
  'disabled': node.field_disabled.value,
  'label': label
}) }} #}

<hx-button
  variant="{{ node.field_card_variant.value|default('primary') }}"
  hx-size="{{ node.field_button_size.value|default('md') }}"
  {% if node.field_disabled.value %}disabled{% endif %}
>
  {{ label }}
</hx-button>
```

### Using HTML Comments to Avoid Layout Breakage

```twig
{# Wrapped in a comment — doesn't break the visual layout #}
<!--
{{ dump(content.field_featured_image) }}
-->

<hx-card variant="featured">
  {% if content.field_featured_image|render|trim %}
    <div slot="image">{{ content.field_featured_image }}</div>
  {% endif %}
</hx-card>
```

### Listing All Available Variables

```twig
{# Print the names of all variables in the current template scope #}
{{ dump(_context|keys) }}
```

This tells you exactly what variable names Drupal has made available in that template.

---

## Kint (Devel + Kint contrib)

Kint provides an interactive, collapsible tree view of any PHP value. For Drupal 9+, Kint lives in the **standalone `devel_kint_extras`** (or `kint-php/kint` libraries pulled in by Devel); older Devel versions shipped a `kint` submodule directly. Either way, the goal is to expose the `kint()` / `ksm()` Twig functions in your dev environment.

### Install

```bash
# Drupal 9+ — install the standalone Kint integration
composer require drupal/devel_kint_extras
drush en devel devel_kint_extras -y
drush cr
```

If you're maintaining a site on an older Devel branch that still ships a `kint` submodule, `drush en devel kint -y` is the equivalent there.

### Usage

```twig
{# Interactive tree view — expand/collapse in browser. The exact function
   names (kint, ksm, dpm, d, s) depend on which Devel/Kint variant you have
   installed; check Drupal core's "available Twig debug helpers" by running
   `drush twig:debug` or inspecting the available filters in DevTools. #}
{{ kint(node) }}

{# With a descriptive label #}
{{ kint(content.field_image, 'Featured Image Render Array') }}

{# To Drupal messages area instead of inline (doesn't break layout) #}
{{ ksm(node) }}
{{ ksm(content.field_patient_id, 'Patient ID Field') }}
```

### Inspecting Entity Fields with Kint

```twig
{# Inspect the whole node object #}
{{ kint(node, 'Patient Node Object') }}

{# Inspect a specific field #}
{{ kint(node.field_department, 'Department Field') }}

{# Inspect the rendered content array #}
{{ kint(content, 'Content Render Array') }}
```

### Disable Kint in Production

```bash
drush pmu kint -y
```

---

## Debugging Component Not Rendering

**Symptom**: The `<hx-card>` or other HELiX component appears as plain HTML with no Shadow DOM and no styles.

### Check 1: Is the library loaded?

View the page source and look for the HELiX script tag:

```html
<!-- Look for something like this in the <head> or before </body>.
     Paths vary by setup: a Drupal library attachment generates a fingerprinted URL,
     a CDN load looks like cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/index.js,
     and a self-hosted libraries/ install resolves to /libraries/helixui/dist/index.js. -->
<script type="module" src="/libraries/helixui/dist/index.js"></script>
```

If the script is missing, the Drupal Libraries API definition is not attaching the library to the page. Check your `mytheme.libraries.yml` and the `#attached` key in the render array.

### Check 2: Is the component registered?

```javascript
// In the browser console:
customElements.get('hx-card');
// Returns the constructor function if registered, or undefined if not
```

If `undefined`, the script loaded but the component was not defined. This is usually a path or module loading error. Check the Network panel for 404 errors on JavaScript files.

### Check 3: Is there a JavaScript error blocking execution?

Open DevTools → Console. Any uncaught error before the HELiX module executes will prevent all components from upgrading.

### Check 4: Is the component tag spelled correctly?

```twig
{# Correct #}
<hx-card>...</hx-card>
<hx-button>...</hx-button>

{# Common mistakes #}
<hxcard>...</hxcard>        {# Missing hyphen #}
<hx-cards>...</hx-cards>    {# Plural — not a valid component #}
<HX-Card>...</HX-Card>      {# Uppercase — custom elements are case-sensitive #}
```

---

## Debugging Slot Content Not Displaying

**Symptom**: You placed content inside an `<hx-card>` in Twig, but it does not appear in the rendered component.

### Check 1: Is the slot name correct?

Component slot names are case-sensitive and must match the component's documented API exactly.

```twig
{# Correct slot names for hx-card #}
<hx-card>
  <div slot="heading">...</div>
  <div slot="image">...</div>
  <div slot="footer">...</div>
  <div slot="actions">...</div>
</hx-card>

{# Common mistakes #}
<div slot="header">...</div>    {# Wrong name — should be "heading" #}
<div slot="Heading">...</div>   {# Wrong case — slot names are lowercase #}
<div slot="content">...</div>   {# Not a named slot on hx-card — slot="content" is unrecognized; drop the slot attribute to use the default body slot #}
```

### Check 2: Is the content element actually in the DOM?

```javascript
// In the browser console:
const card = document.querySelector('hx-card');
console.log('Heading slot element:', card.querySelector('[slot="heading"]'));
console.log(
  'Default slot children:',
  Array.from(card.children).filter((el) => !el.slot),
);
```

If the element is not in the Light DOM, the Twig template produced no output for that slot. Use `dump()` to verify the Drupal variable.

### Check 3: Is the content a render array that returned empty?

```twig
{# Check if the field renders anything before projecting to slot #}
{{ dump(content.field_featured_image|render|trim) }}

{% if content.field_featured_image|render|trim %}
  <div slot="image">{{ content.field_featured_image }}</div>
{% endif %}
```

An empty render array prints nothing, but an empty `<div slot="image">` still ends up in the DOM. `hx-card`'s `image` slot doesn't render a fallback when empty — the slot container just collapses to zero content — but an empty assigned node can prevent the slot from being treated as "unset," which matters for selectors and conditional CSS that target the absence of a slot.

### Check 4: Inspect slot assignment in DevTools

In Chrome or Firefox DevTools:

1. Find the `<hx-card>` element in the Elements panel.
2. Expand it to see its Light DOM children.
3. Expand the `#shadow-root (open)` to see the Shadow DOM.
4. Look for `<slot name="heading">` inside the Shadow DOM — hover over it to see which Light DOM elements are assigned to it.

---

## Debugging Attribute Values

**Symptom**: A component attribute is empty or has an unexpected value.

### Step 1: Dump the source variable

```twig
{{ dump(node.field_card_variant.value) }}
```

### Step 2: Check for null with the null-coalesce operator

```twig
{# Is the value null or empty? #}
{{ dump(node.field_card_variant.value ?: 'VALUE IS EMPTY') }}
```

### Step 3: Verify the rendered attribute value

```twig
{# Set it to a variable so you can inspect it before use #}
{% set test_variant = node.field_card_variant.value|default('primary') %}
<!-- DEBUG: variant = {{ test_variant }} -->
<hx-button variant="{{ test_variant }}">Click me</hx-button>
```

### Step 4: Inspect the rendered HTML attribute in DevTools

In the Elements panel, select the HELiX component element and look at its attributes in the panel. The attribute values shown there are exactly what Drupal rendered.

---

## Shadow DOM Debugging in Browser DevTools

### Enabling Shadow DOM Inspection

Modern browsers show Shadow DOM trees in the Elements panel by default. Look for `#shadow-root (open)` as a child of any HELiX component element.

### Inspecting Component Internals

```
hx-card                           ← Your Twig markup element
  #shadow-root (open)             ← Component's internal structure
    <div part="card" class="card card--featured">
      <div part="heading" class="card__heading">
        <slot name="heading">     ← Named slot; shows assigned content
          ↳ <span slot="heading">Patient Name</span>  (Light DOM, assigned)
        </slot>
      </div>
      <div part="body" class="card__body">
        <slot>                    ← Default slot
          ↳ <p>Body content</p>   (Light DOM, assigned)
        </slot>
      </div>
    </div>
  <span slot="heading">Patient Name</span>  ← Light DOM children
  <p>Body content</p>
```

### Querying Inside the Shadow DOM in Console

```javascript
const card = document.querySelector('hx-card');

// Access shadow root
const shadow = card.shadowRoot;

// Query inside shadow DOM
const cardBase = shadow.querySelector('.card');
console.log('Card base element:', cardBase);

// Check component properties
console.log('variant property:', card.variant);
console.log('elevation property:', card.elevation);

// Check all slot assignments
const slots = shadow.querySelectorAll('slot');
slots.forEach((slot) => {
  const name = slot.name || '(default)';
  const assigned = slot.assignedElements();
  console.log(`Slot "${name}": ${assigned.length} element(s) assigned`);
  assigned.forEach((el) => console.log('  →', el));
});
```

---

## Debugging Component Properties in Console

After a component upgrades, its JavaScript properties are accessible directly:

```javascript
const card = document.querySelector('hx-card');

// Read current property values
console.log('variant:', card.variant);
console.log('elevation:', card.elevation);

// Verify a property was set by a Drupal Behavior
const button = document.querySelector('hx-button');
console.log('size:', button.size);
console.log('disabled:', button.disabled);
```

### Testing Property Assignment

If you suspect a Drupal Behavior is not setting a property correctly:

```javascript
// Manually set the property to test the expected behavior
const table = document.querySelector('hx-data-table');
table.columns = [
  { key: 'name', label: 'Name' },
  { key: 'id', label: 'ID' },
];
// Does the component render the columns correctly?
```

---

## Debugging JSON Data Attributes

When passing complex data from Twig to JavaScript via `data-` attributes:

### Twig side: verify the JSON is valid

```twig
{# Print the raw JSON to check it looks correct #}
{# {{ columns|json_encode }} #}

{# Check the escaped version (what lands in the attribute) #}
{# {{ columns|json_encode|escape }} #}
```

### Browser side: verify the attribute value

```javascript
const table = document.querySelector('hx-data-table');
const raw = table.getAttribute('data-columns');
console.log('Raw data-columns:', raw);

// Check if it parses
try {
  const parsed = JSON.parse(raw);
  console.log('Parsed:', parsed);
  if (!Array.isArray(parsed)) {
    console.warn('Parsed value is not an array — hx-data-table treats non-array data as empty');
  }
} catch (e) {
  console.error('JSON parse error:', e.message);
  console.log('Problematic string:', raw);
}
```

Common causes of JSON parse failures:

- Twig `|escape` double-encoding the JSON (use `|json_encode|escape` in the correct order)
- Unterminated strings from field values containing unescaped quotes

Common causes of unexpected parsed shape (parses successfully but `hx-data-table` renders empty):

- Twig variable was `null`, producing the literal string `"null"` (which `JSON.parse` resolves to `null`, not an array)
- Twig produced an object/scalar where the component expects an array — check `Array.isArray(parsed)` before assigning

---

## `data-` Debug Attributes for Template Tracing

Add debug data attributes to components during development to trace which Twig template, entity, and view mode produced each component instance:

```twig
<hx-card
  variant="{{ node.field_variant.value|default('default') }}"
  data-debug-node="{{ node.id }}"
  data-debug-bundle="{{ node.bundle }}"
  data-debug-view-mode="{{ view_mode }}"
  data-debug-template="{{ _self }}"
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

In the console:

```javascript
document.querySelectorAll('hx-card').forEach((card) => {
  console.log({
    nodeId: card.dataset.debugNode,
    bundle: card.dataset.debugBundle,
    viewMode: card.dataset.debugViewMode,
    template: card.dataset.debugTemplate,
    variant: card.variant,
  });
});
```

Remove these before committing production templates, or guard them behind a Twig variable:

```twig
{% if settings.twig_debug_enabled %}
  <hx-card
    ...
    data-debug-template="{{ _self }}"
  >
{% else %}
  <hx-card ...>
{% endif %}
```

---

## Common Debugging Scenarios

### Scenario: Field Not Rendering in Slot

```twig
{# 1. Check the raw field object #}
{{ dump(node.field_featured_image) }}

{# 2. Check if the entity reference is loaded #}
{{ dump(node.field_featured_image.entity) }}

{# 3. Check the render array #}
{{ dump(content.field_featured_image) }}

{# 4. Check if it renders to any non-whitespace output #}
{{ dump(content.field_featured_image|render|trim) }}

{# 5. Check if the field is enabled in the current view mode #}
{# Admin UI: Content type → Manage Display → [view mode] #}
```

### Scenario: Boolean Attribute Not Behaving as Expected

```twig
{# Check the raw field value #}
{{ dump(node.field_disabled.value) }}
{# A boolean field in Drupal returns "1" (string) for true, "0" or "" for false #}

{# Correct: test for truthiness #}
{% if node.field_disabled.value %}disabled{% endif %}

{# Wrong: renders disabled="0" which is still a truthy attribute #}
<hx-button disabled="{{ node.field_disabled.value }}">
```

### Scenario: Custom Template Not Being Used

1. Ensure Twig debug is enabled and check the HTML comment for `FILE NAME SUGGESTIONS`.
2. Find the exact file name suggestion you are trying to match.
3. Verify the file is in `themes/custom/mytheme/templates/` with the exact name.
4. Check for common naming errors: hyphens vs underscores, missing `.html` before `.twig`.
5. Clear all caches: `drush cr`.

```bash
# Verify the file exists with the exact name
ls themes/custom/mytheme/templates/node--patient--card.html.twig
```

### Scenario: Component Attributes Not Updating After AJAX

If a HELiX component is rendered in an AJAX-loaded region but its Drupal Behavior initialization does not run:

1. Verify the Behavior uses `once()` with a `context` parameter — `once('helixui:behavior', 'selector', context)`.
2. Verify `context` is passed to `attach(context)` and is used as the **third** argument to `once(id, selector, context)`.
3. Check whether `Drupal.attachBehaviors()` is being called on the new content after AJAX injection. Most Drupal AJAX responses call this automatically.

---

## Performance Note

Twig debug mode, `dump()`, and `kint()` have significant runtime costs:

- Twig debug mode adds ~5-10 KB of HTML comments per page
- `dump()` calls on large entity objects can add seconds to render time
- Never commit templates with uncommented `dump()` or `kint()` calls

Keep debug calls commented out (`{# {{ dump(x) }} #}`) rather than deleted so they are available for future debugging sessions.

---

## Additional Resources

- [Twig Integration Fundamentals](/drupal/twig-templates/fundamentals/)
- [Drupal Behaviors Fundamentals](/drupal/behaviors/fundamentals/)
- [Drupal Twig Debugging Documentation](https://www.drupal.org/docs/theming-drupal/twig-in-drupal/discovering-and-inspecting-variables-in-twig-templates)
- [Chrome DevTools: Shadow DOM](https://developer.chrome.com/docs/devtools/dom/#shadow)
- [Devel Module](https://www.drupal.org/project/devel)
