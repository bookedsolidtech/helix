---
title: TWIG Debugging
description: Comprehensive guide to debugging TWIG templates in Drupal with HELIX web components including dump(), Kint, template suggestions, and best practices
order: 12
---

Debugging TWIG templates is essential when integrating HELIX web components into Drupal. This comprehensive guide covers all debugging techniques, from enabling TWIG debug mode to using advanced debugging tools like Kint, and provides practical strategies for troubleshooting HELIX component rendering issues.

## Understanding TWIG Debugging in Drupal

Drupal's TWIG templating engine provides robust debugging capabilities that help developers:

- Identify which template files are being used
- Inspect available variables and their values
- Discover template suggestions for customization
- Track down rendering issues with web components
- Optimize template performance

When working with HELIX components, debugging becomes particularly important because:

1. **Server-side rendering meets client-side hydration** — You need to verify what Drupal renders before JavaScript loads
2. **Shadow DOM encapsulation** — Component internals aren't visible in standard HTML output
3. **Slot projection** — Content must be correctly projected into named slots
4. **Attribute mapping** — TWIG variables must correctly map to component properties

## Enabling TWIG Debug Mode

TWIG debug mode is disabled by default in Drupal for performance reasons. Enable it in your local development environment to access debugging features.

### Configuration via services.yml

Edit `sites/default/services.yml` (or copy from `sites/default/default.services.yml` if it doesn't exist):

```yaml
# sites/default/services.yml
parameters:
  twig.config:
    # Enable debug mode - adds HTML comments with template suggestions
    debug: true

    # Auto-reload templates when they change (no cache clear needed)
    auto_reload: true

    # Disable TWIG caching for development
    cache: false

    # Optional: disable TWIG autoescape (use with caution)
    # autoescape: false
```

### Apply Configuration Changes

After editing `services.yml`:

```bash
# Clear Drupal cache to apply changes
drush cr

# Or via UI: Admin > Configuration > Development > Performance > Clear all caches
```

### Verify Debug Mode is Active

View source of any Drupal page. With debug mode enabled, you'll see HTML comments like:

```html
<!-- THEME DEBUG -->
<!-- THEME HOOK: 'node' -->
<!-- FILE NAME SUGGESTIONS:
   * node--123--full.html.twig
   * node--123.html.twig
   * node--article--full.html.twig
   x node--article.html.twig
   * node--full.html.twig
   * node.html.twig
-->
<!-- BEGIN OUTPUT from 'themes/custom/mytheme/templates/node--article.html.twig' -->
<article>...</article>
<!-- END OUTPUT from 'themes/custom/mytheme/templates/node--article.html.twig' -->
```

## TWIG Debug Comments: Template Suggestions

When TWIG debug is enabled, Drupal inserts HTML comments before and after every template output, showing:

- **THEME HOOK**: The render element type (node, block, field, etc.)
- **FILE NAME SUGGESTIONS**: All possible template names in priority order
- **Active template**: Marked with `x` showing which template is actually used
- **BEGIN/END OUTPUT**: Wraps the rendered output with the template file path

### Reading Template Suggestions

```html
<!-- FILE NAME SUGGESTIONS:
   * node--patient--123--card.html.twig
   * node--patient--123.html.twig
   * node--patient--card.html.twig
   x node--patient.html.twig          <-- Currently active template
   * node--card.html.twig
   * node.html.twig
-->
```

**Priority order**: Top suggestions are most specific, bottom suggestions are most general. Drupal uses the first template file it finds.

### Creating Template Overrides

To customize a template:

1. Copy the base template (usually from `core/themes` or `core/modules`)
2. Rename it to a more specific suggestion from the list
3. Place it in your theme's `templates/` directory
4. Clear cache (`drush cr`)

Example:

```bash
# Copy base node template
cp core/themes/stable9/templates/content/node.html.twig \
   themes/custom/mytheme/templates/node--patient--card.html.twig

# Clear cache
drush cr
```

### Template Suggestions for HELIX Components

When debugging HELIX component integration, template suggestions help you target specific content types or display modes:

```twig
{# templates/node/node--patient--card.html.twig #}
{# This template only affects Patient nodes in "Card" display mode #}

<hx-card variant="default" elevation="raised">
  <span slot="heading">{{ label }}</span>
  {{ content.body }}

  {% if node.field_department.entity %}
    <div slot="footer">
      <hx-badge variant="secondary">
        {{ node.field_department.entity.name.value }}
      </hx-badge>
    </div>
  {% endif %}
</hx-card>
```

## The dump() Function

The `dump()` function outputs variable contents for inspection. It's the primary tool for debugging TWIG variables.

### Basic dump() Usage

```twig
{# Dump all available variables in the current template #}
{{ dump() }}

{# Dump a specific variable #}
{{ dump(node) }}

{# Dump a nested property #}
{{ dump(node.field_patient_id) }}

{# Dump multiple variables #}
{{ dump(node, content, attributes) }}
```

### dump() Output Format

Without Kint (default):

```twig
{{ dump(node.title) }}
```

Output (in rendered HTML):

```
array(1) {
  ["value"]=>
  string(12) "Patient Name"
}
```

### Practical dump() Examples

**Inspect field structure:**

```twig
{# See what's available in a field #}
{{ dump(content.field_featured_image) }}

{# Check field value directly from node object #}
{{ dump(node.field_patient_id.value) }}
```

**Debug entity references:**

```twig
{# See referenced entity structure #}
{{ dump(node.field_author.entity) }}

{# Check taxonomy term name #}
{{ dump(node.field_department.entity.name.value) }}
```

**Verify HELIX component attributes:**

```twig
{# Before rendering component #}
{{ dump(variant) }}
{{ dump(node.field_card_variant.value) }}

<hx-card variant="{{ node.field_card_variant.value|default('default') }}">
  {{ content }}
</hx-card>
```

**Debug multi-value fields:**

```twig
{# See all items in a multi-value field #}
{{ dump(node.field_tags) }}

{# Inspect first item #}
{{ dump(node.field_tags.0) }}

{# Check if field has items #}
{{ dump(node.field_tags|length) }}
```

### dump() Best Practices

**1. Comment out dump() in production templates:**

```twig
{# {{ dump(node) }} #}
```

**2. Use HTML comments to prevent layout breakage:**

```twig
<!--
{{ dump(content) }}
-->
```

**3. Dump to specific locations for readability:**

```twig
{# Dump at top of template #}
{# {{ dump() }} #}

<hx-card variant="featured">
  {# Template content #}
</hx-card>
```

**4. Use descriptive labels:**

```twig
{# Debug: Patient field values #}
{# {{ dump({
  'patient_id': node.field_patient_id.value,
  'department': node.field_department.entity.name.value,
  'last_visit': node.field_last_visit.value
}) }} #}
```

## Kint Integration

Kint is a powerful debugging tool that provides interactive, collapsible variable output with enhanced formatting. It's far superior to the default `dump()` output for complex data structures.

### Installing Kint via Devel Module

```bash
# Install Devel module (includes Kint)
composer require drupal/devel

# Enable Devel and Kint modules
drush en devel kint -y

# Clear cache
drush cr
```

### Using kint() Function

With Kint installed, use `kint()` instead of `dump()`:

```twig
{# Basic Kint output - interactive, collapsible tree view #}
{{ kint(node) }}

{# Kint with custom label #}
{{ kint(node, 'Patient Node Object') }}

{# Kint multiple variables #}
{{ kint(node, content, attributes) }}
```

### Kint Output Features

Kint provides:

- **Collapsible trees**: Expand/collapse complex objects
- **Type information**: Shows data types (string, int, array, object)
- **Array counts**: Shows number of items in arrays
- **Object methods**: Lists available methods on objects
- **Search**: Filter large data structures
- **Copy values**: Click to copy strings to clipboard
- **Color coding**: Different colors for different data types

### Kint Configuration

Configure Kint via `settings.php` or `settings.local.php`:

```php
// sites/default/settings.local.php

// Set Kint max depth (how many levels to expand)
if (class_exists('Kint')) {
  \Kint::$max_depth = 5; // Default: 7
  \Kint::$expanded = true; // Auto-expand all levels
}
```

### Practical Kint Examples

**Debug HELIX component integration:**

```twig
{# templates/node/node--patient--card.html.twig #}

{# Inspect all available data #}
{# {{ kint(node, 'Patient Node') }} #}
{# {{ kint(content, 'Renderable Content') }} #}

<hx-card
  variant="{{ node.field_card_variant.value|default('default') }}"
  elevation="raised"
>
  <span slot="heading">{{ label }}</span>

  {# Debug field before rendering #}
  {# {{ kint(node.field_featured_image, 'Featured Image Field') }} #}

  {% if content.field_featured_image|render|trim %}
    <div slot="image">
      {{ content.field_featured_image }}
    </div>
  {% endif %}

  {{ content.body }}
</hx-card>
```

**Debug Views template variables:**

```twig
{# templates/views/views-view-unformatted--patients.html.twig #}

{# See what's available in the view #}
{# {{ kint(view) }} #}
{# {{ kint(rows) }} #}

{% for row in rows %}
  {# Inspect row structure #}
  {# {{ kint(row.content['#row'], 'Row Data') }} #}

  <hx-card>
    {{ row.content }}
  </hx-card>
{% endfor %}
```

**Debug form variables:**

```twig
{# templates/form/patient-intake-form.html.twig #}

{# See form structure #}
{# {{ kint(form, 'Form Render Array') }} #}

<form{{ attributes }}>
  {# Check individual form element #}
  {# {{ kint(form.first_name, 'First Name Field') }} #}

  <hx-text-input
    name="first_name"
    label="{{ form.first_name['#title'] }}"
    required
  ></hx-text-input>
</form>
```

### ksm() — Kint to Messages

The `ksm()` function (Kint System Messages) outputs to Drupal's message area instead of inline:

```twig
{# Output to Drupal messages (top of page) #}
{{ ksm(node) }}
{{ ksm(content.field_patient_id, 'Patient ID Field') }}
```

This is useful when:

- You don't want to break template layout
- You need persistent output across page loads
- You're debugging AJAX responses

## Debugging Variables

### Common TWIG Variables in Drupal

Every template has a different set of available variables. Here are the most common:

**Node templates (`node.html.twig`):**

```twig
{# Available variables in node templates #}
{{ dump(_context|keys) }}

{# Common node variables: #}
- node              {# The full node entity object #}
- content           {# Renderable array of all fields #}
- label             {# The node title #}
- url               {# The node's canonical URL #}
- attributes        {# HTML attributes for wrapper element #}
- title_attributes  {# HTML attributes for title element #}
- content_attributes {# HTML attributes for content wrapper #}
- title_prefix      {# Contextual links, breadcrumbs #}
- title_suffix      {# Contextual links #}
- author_name       {# The node author's username #}
- date              {# Formatted creation date #}
- view_mode         {# Current display mode (full, teaser, etc.) #}
```

**Block templates (`block.html.twig`):**

```twig
- content           {# Block content renderable array #}
- plugin_id         {# Block plugin ID #}
- label             {# Block admin label #}
- configuration     {# Block configuration #}
- attributes        {# HTML attributes #}
- title_attributes  {# Title HTML attributes #}
```

**Field templates (`field.html.twig`):**

```twig
- items             {# Array of field items #}
- label             {# Field label #}
- field_name        {# Machine name of field #}
- field_type        {# Field type (text, image, entity_reference) #}
- entity_type       {# Entity type (node, user, etc.) #}
- bundle            {# Entity bundle (article, page, etc.) #}
- element           {# Renderable array #}
```

**Views templates (`views-view.html.twig`):**

```twig
- view              {# The view object #}
- rows              {# View results #}
- header            {# Header area render array #}
- footer            {# Footer area render array #}
- empty             {# Empty text render array #}
- pager             {# Pager render array #}
- title             {# View title #}
```

### Listing All Available Variables

To see ALL variables available in a template:

```twig
{# List variable names only #}
{{ dump(_context|keys) }}

{# Output (example):
array(15) {
  [0]=> string(4) "node"
  [1]=> string(7) "content"
  [2]=> string(5) "label"
  [3]=> string(3) "url"
  [4]=> string(10) "attributes"
  ...
}
#}
```

With Kint:

```twig
{# Interactive list of all variables #}
{{ kint(_context) }}
```

### Accessing Node Fields

**Via the `node` object (raw values):**

```twig
{# Simple field value #}
{{ node.title.value }}
{{ node.field_patient_id.value }}

{# Date field #}
{{ node.created.value|date('Y-m-d') }}

{# Boolean field #}
{% if node.field_featured.value %}
  <hx-badge variant="warning">Featured</hx-badge>
{% endif %}

{# Entity reference field #}
{{ node.field_author.entity.label }}
{{ node.field_department.entity.name.value }}

{# First item in multi-value field #}
{{ node.field_tags.0.entity.name.value }}
```

**Via the `content` array (rendered with formatters):**

```twig
{# Rendered with field formatter #}
{{ content.field_featured_image }}
{{ content.field_body }}

{# Access render array properties #}
{{ content.field_date.0['#markup'] }}
{{ content.field_link.0['#title'] }}
{{ content.field_link.0['#url'] }}
```

### Field Existence Checks

Always check if fields exist and have values before rendering:

```twig
{# Wrong: May cause errors if field doesn't exist #}
<div slot="image">
  {{ content.field_image }}
</div>

{# Right: Check if field renders content #}
{% if content.field_image|render|trim %}
  <div slot="image">
    {{ content.field_image }}
  </div>
{% endif %}

{# Alternative: Check node object directly #}
{% if node.field_image.entity %}
  <div slot="image">
    {{ content.field_image }}
  </div>
{% endif %}
```

### Debugging Field Rendering Issues

When a field doesn't render as expected:

```twig
{# Step 1: Check if field exists #}
{{ dump(node.field_featured_image) }}

{# Step 2: Check field value #}
{{ dump(node.field_featured_image.entity) }}

{# Step 3: Check renderable content #}
{{ dump(content.field_featured_image) }}

{# Step 4: Check if it renders anything #}
{{ dump(content.field_featured_image|render|trim) }}

{# Step 5: Render and inspect HTML #}
<!--
{{ content.field_featured_image }}
-->
```

## Debugging HELIX Components in TWIG

### Verify Component Attributes

Before rendering a component, verify all attributes are correct:

```twig
{# Debug attributes before rendering #}
{# {{ dump({
  'variant': node.field_variant.value,
  'size': node.field_size.value,
  'disabled': node.field_disabled.value
}) }} #}

<hx-button
  variant="{{ node.field_variant.value|default('primary') }}"
  hx-size="{{ node.field_size.value|default('md') }}"
  {% if node.field_disabled.value %}disabled{% endif %}
>
  {{ node.field_button_text.value }}
</hx-button>
```

### Inspect Rendered Component HTML

Add data attributes for debugging:

```twig
<hx-card
  variant="featured"
  {# Debug attributes #}
  data-node-id="{{ node.id }}"
  data-node-type="{{ node.bundle }}"
  data-view-mode="{{ view_mode }}"
  data-template="{{ _self }}"
>
  <span slot="heading">{{ label }}</span>
  {{ content.body }}
</hx-card>
```

Inspect in browser DevTools:

```html
<hx-card
  variant="featured"
  data-node-id="123"
  data-node-type="patient"
  data-view-mode="card"
  data-template="node--patient--card.html.twig"
>
  #shadow-root (open)
  <div part="base" class="card card--featured">...</div>
  <span slot="heading">John Doe</span>
  <p>Patient information...</p>
</hx-card>
```

### Debug Slot Projection

Verify slot content is correctly projected:

```twig
<hx-card variant="featured">
  {# Debug: What's going in the heading slot? #}
  {# {{ dump(label) }} #}
  <span slot="heading" data-debug="heading-slot">{{ label }}</span>

  {# Debug: What's going in the image slot? #}
  {# {{ dump(content.field_image) }} #}
  {% if content.field_image|render|trim %}
    <div slot="image" data-debug="image-slot">
      {{ content.field_image }}
    </div>
  {% endif %}

  {# Default slot (no slot attribute) #}
  <div data-debug="default-slot">
    {{ content.body }}
  </div>
</hx-card>
```

Inspect in browser to verify slots are filled:

```javascript
// In browser console
const card = document.querySelector('hx-card');

// Check what's in each slot
console.log('Heading slot:', card.querySelector('[slot="heading"]'));
console.log('Image slot:', card.querySelector('[slot="image"]'));
console.log(
  'Default slot:',
  Array.from(card.children).filter((el) => !el.slot),
);
```

### Debug Component Properties vs Attributes

Some HELIX properties can't be set via HTML attributes (objects, arrays):

```twig
{# This won't work - can't pass objects via attributes #}
<hx-data-table columns="{{ columns|json_encode }}"></hx-data-table>

{# Correct approach: use data attributes for JavaScript initialization #}
<hx-data-table
  id="patient-table"
  data-columns="{{ columns|json_encode|escape }}"
>
  {# Fallback table for no-JS #}
  <table>...</table>
</hx-data-table>

{# Initialize via Drupal Behavior #}
{# See behaviors documentation for JavaScript setup #}
```

Debug the initialization:

```twig
{# Verify JSON encoding #}
{# {{ dump(columns) }} #}
{# {{ dump(columns|json_encode) }} #}

<hx-data-table data-columns="{{ columns|json_encode|escape }}">
  <!-- Check browser console for JSON parsing errors -->
</hx-data-table>
```

### Common HELIX Component Issues

**Issue: Component doesn't render**

```twig
{# Debug: Is the component tag correct? #}
{# {{ kint(content) }} #}

{# Check for typos in component name #}
<hx-card>...</hx-card>     <!-- Correct -->
<hx-cards>...</hx-cards>   <!-- Wrong: plural -->
<card>...</card>           <!-- Wrong: missing hx- prefix -->
```

**Issue: Attributes not working**

```twig
{# Debug: Check attribute values #}
{# {{ dump(node.field_variant.value) }} #}

{# Common mistakes: #}
<hx-button variant="{{ variant }}">...</hx-button>
{# If variant is null, attribute becomes variant="" #}

{# Correct: provide default #}
<hx-button variant="{{ variant|default('primary') }}">...</hx-button>
```

**Issue: Boolean attributes**

```twig
{# Wrong: Setting boolean to string "false" #}
<hx-button disabled="{{ is_disabled ? 'true' : 'false' }}">

{# Correct: Presence/absence of attribute #}
<hx-button {% if is_disabled %}disabled{% endif %}>

{# Debug boolean values #}
{# {{ dump(node.field_disabled.value) }} #}
{# {{ dump(node.field_disabled.value ? 'disabled' : 'enabled') }} #}
```

## Template Suggestions and File Discovery

### Finding Template Files

When you see template suggestions in debug output, find the base template:

```bash
# Search for template file in Drupal core
find core/themes -name "node.html.twig"
find core/modules -name "node.html.twig"

# Search in contrib themes/modules
find modules/contrib -name "node.html.twig"
find themes/contrib -name "node.html.twig"

# Example output:
# core/themes/stable9/templates/content/node.html.twig
```

Copy to your theme:

```bash
# Create templates directory structure
mkdir -p themes/custom/mytheme/templates/content

# Copy base template
cp core/themes/stable9/templates/content/node.html.twig \
   themes/custom/mytheme/templates/content/node--patient.html.twig

# Clear cache
drush cr
```

### Understanding Template Suggestion Patterns

**Node templates:**

```
node--[type]--[node-id]--[view-mode].html.twig
node--[type]--[node-id].html.twig
node--[type]--[view-mode].html.twig
node--[type].html.twig
node--[view-mode].html.twig
node.html.twig
```

Example:

```
node--patient--123--card.html.twig    (Most specific: single patient in card mode)
node--patient--card.html.twig         (All patients in card mode)
node--patient.html.twig               (All patients, all modes)
node.html.twig                        (All nodes, all modes)
```

**Field templates:**

```
field--[field-name]--[entity-type]--[bundle]--[view-mode].html.twig
field--[entity-type]--[field-name]--[bundle].html.twig
field--[entity-type]--[field-name].html.twig
field--[field-name].html.twig
field--[field-type].html.twig
field.html.twig
```

**Block templates:**

```
block--[plugin-id]--[region].html.twig
block--[plugin-id].html.twig
block--[region].html.twig
block.html.twig
```

### Inspecting Template Suggestions in Browser

View page source and search for "THEME DEBUG":

```bash
# View source: Cmd+U (Mac) or Ctrl+U (Windows)
# Search: Cmd+F or Ctrl+F, type "THEME DEBUG"
```

You'll find comments like:

```html
<!-- THEME DEBUG -->
<!-- THEME HOOK: 'field' -->
<!-- FILE NAME SUGGESTIONS:
   * field--node--field-patient-id--patient--card.html.twig
   * field--node--field-patient-id--patient.html.twig
   * field--node--field-patient-id.html.twig
   * field--field-patient-id.html.twig
   * field--string.html.twig
   x field.html.twig
-->
<!-- BEGIN OUTPUT from 'core/themes/stable9/templates/field/field.html.twig' -->
```

This tells you:

1. What template type is being rendered (`field`)
2. All possible template names you can create
3. Which template is currently active (marked with `x`)
4. The full path to the active template

## Performance Impact of Debugging

### Development vs Production Settings

**Development (`sites/default/services.yml`):**

```yaml
parameters:
  twig.config:
    debug: true # Enable debug comments
    auto_reload: true # Auto-reload changed templates
    cache: false # Disable TWIG caching
```

**Production (`sites/default/services.yml`):**

```yaml
parameters:
  twig.config:
    debug: false # Disable debug comments
    auto_reload: false # Don't watch for template changes
    cache: true # Enable TWIG caching
```

### Performance Best Practices

**1. Never enable debug mode in production**

Debug mode significantly impacts performance:

- HTML comments add ~5-10KB per page
- Auto-reload watches filesystem for changes
- Disabled cache causes template re-compilation on every request

**2. Remove or comment out dump() calls**

```twig
{# Production-ready template #}
{# {{ dump(node) }} #}  <!-- Commented out for production -->

<hx-card variant="featured">
  {{ content }}
</hx-card>
```

**3. Use conditional debugging**

Create a debug flag in `settings.local.php`:

```php
// sites/default/settings.local.php
$settings['twig_debug_enabled'] = TRUE;
```

In templates:

```twig
{% if settings.twig_debug_enabled %}
  {{ kint(node, 'Patient Node Debug') }}
{% endif %}
```

**4. Disable Kint in production**

```bash
# Disable Kint module in production
drush pmu kint -y
```

## Best Practices for TWIG Debugging

### 1. Use Descriptive Debug Labels

```twig
{# Good: Clear labels for debugging output #}
{{ kint(node, 'Patient Node - Card View Mode') }}
{{ kint(content.field_image, 'Featured Image Render Array') }}
{{ kint(view_mode, 'Current View Mode') }}

{# Bad: No context #}
{{ kint(node) }}
{{ kint(content) }}
```

### 2. Debug in Logical Sections

```twig
{# Debug at top of template #}
{# {{ kint(_context|keys, 'Available Variables') }} #}

<hx-card variant="featured">
  {# Debug before slot projection #}
  {# {{ kint(content.field_image, 'Image Field Check') }} #}

  {% if content.field_image|render|trim %}
    <div slot="image">{{ content.field_image }}</div>
  {% endif %}

  {# Debug heading content #}
  {# {{ kint(label, 'Card Heading') }} #}
  <span slot="heading">{{ label }}</span>

  {{ content.body }}
</hx-card>
```

### 3. Use HTML Comments for Non-Visual Debugging

```twig
{# Won't break layout #}
<!--
DEBUG: Node ID = {{ node.id }}
DEBUG: Bundle = {{ node.bundle }}
DEBUG: View Mode = {{ view_mode }}
{{ dump(content.field_patient_id) }}
-->

<hx-card>...</hx-card>
```

### 4. Create Reusable Debug Macros

```twig
{# templates/macros/debug.html.twig #}
{% macro field_debug(field, label) %}
  {% if settings.twig_debug_enabled %}
    <!--
    DEBUG: {{ label }}
    {{ dump(field) }}
    -->
  {% endif %}
{% endmacro %}
```

Use in templates:

```twig
{% import 'macros/debug.html.twig' as debug %}

{{ debug.field_debug(content.field_image, 'Featured Image') }}

<hx-card>
  {% if content.field_image|render|trim %}
    <div slot="image">{{ content.field_image }}</div>
  {% endif %}
</hx-card>
```

### 5. Debug with Browser DevTools Integration

Add debug data attributes for JavaScript debugging:

```twig
<hx-card
  variant="featured"
  data-debug-node-id="{{ node.id }}"
  data-debug-bundle="{{ node.bundle }}"
  data-debug-view-mode="{{ view_mode }}"
  data-debug-template="{{ _self }}"
>
  <span slot="heading">{{ label }}</span>
  {{ content }}
</hx-card>
```

Inspect in browser console:

```javascript
// Find all HELIX cards
document.querySelectorAll('hx-card').forEach((card) => {
  console.log({
    nodeId: card.dataset.debugNodeId,
    bundle: card.dataset.debugBundle,
    viewMode: card.dataset.debugViewMode,
    template: card.dataset.debugTemplate,
  });
});
```

### 6. Check Template Execution Order

Add debug markers to see template execution flow:

```twig
{# node--patient--card.html.twig #}
<!-- TEMPLATE START: node--patient--card.html.twig -->

<hx-card>
  {# Include field template #}
  {{ content.field_tags }}
  <!-- Check if field--field-tags.html.twig was executed -->
</hx-card>

<!-- TEMPLATE END: node--patient--card.html.twig -->
```

### 7. Validate Component Hydration

Add markers to verify component JavaScript loaded:

```twig
<hx-card variant="featured" data-hydration-test>
  <span slot="heading">Test Card</span>
  <p>Content</p>
</hx-card>

<script>
  // Check if component is defined
  customElements.whenDefined('hx-card').then(() => {
    console.log('✓ hx-card component is defined');
    const card = document.querySelector('hx-card[data-hydration-test]');
    console.log('✓ Shadow root:', card.shadowRoot ? 'Present' : 'MISSING');
  });
</script>
```

## Common Debugging Scenarios

### Scenario 1: Component Not Rendering

**Symptom**: `<hx-card>` appears as plain HTML with no styling.

**Debug steps:**

```twig
{# 1. Verify component tag is correct #}
<hx-card>...</hx-card>  <!-- Check spelling, hx- prefix -->

{# 2. Check if library is loaded (view page source) #}
<!-- Look for: <script type="module" src=".../hx-library.js"> -->

{# 3. Check browser console for errors #}
<!-- Open DevTools > Console, look for JavaScript errors -->

{# 4. Verify component is defined #}
<script>
  console.log('hx-card defined?', customElements.get('hx-card') !== undefined);
</script>
```

### Scenario 2: Slot Content Not Appearing

**Symptom**: Slot content doesn't render in component.

**Debug steps:**

```twig
{# 1. Verify slot name is correct #}
{{ kint(card_slots, 'Available Slots') }}
{# Check component documentation for exact slot names #}

<hx-card>
  {# 2. Add data attribute to verify element exists #}
  <span slot="heading" data-debug-slot="heading">{{ label }}</span>

  {# 3. Check if content exists #}
  {# {{ dump(label) }} #}
</hx-card>

{# 4. Inspect in browser #}
<script>
  const card = document.querySelector('hx-card');
  console.log('Heading slot element:', card.querySelector('[slot="heading"]'));
  console.log('Slot content:', card.querySelector('[slot="heading"]').textContent);
</script>
```

### Scenario 3: Field Not Rendering

**Symptom**: Field is empty when it should have content.

**Debug steps:**

```twig
{# 1. Check if field exists on entity #}
{{ kint(node.field_featured_image, 'Field Object') }}

{# 2. Check field value #}
{{ dump(node.field_featured_image.entity) }}

{# 3. Check if field is configured to display #}
{# Admin UI: Manage Display settings for this view mode #}

{# 4. Check renderable content array #}
{{ kint(content.field_featured_image, 'Renderable Array') }}

{# 5. Check if it renders anything #}
{% if content.field_featured_image|render|trim %}
  <div>Field has content</div>
{% else %}
  <div>Field is empty or hidden</div>
{% endif %}
```

### Scenario 4: Attribute Value Is Empty

**Symptom**: Component attribute is empty or has wrong value.

**Debug steps:**

```twig
{# 1. Debug the source variable #}
{{ dump(node.field_variant.value) }}

{# 2. Check for null/empty values #}
{{ dump(node.field_variant.value ?: 'EMPTY') }}

{# 3. Use defaults #}
<hx-button variant="{{ node.field_variant.value|default('primary') }}">

{# 4. Debug the rendered attribute #}
{% set test_variant = node.field_variant.value|default('primary') %}
<!-- DEBUG: variant = {{ test_variant }} -->

<hx-button variant="{{ test_variant }}">Click me</hx-button>
```

### Scenario 5: Template Suggestions Not Working

**Symptom**: Custom template isn't being used.

**Debug steps:**

1. **Check TWIG debug is enabled** — View source, look for `<!-- THEME DEBUG -->`

2. **Find the active template:**

```html
<!-- FILE NAME SUGGESTIONS:
   * node--patient--card.html.twig
   x node--patient.html.twig          <-- Currently active
-->
```

3. **Verify file location:**

```bash
# Template must be in theme's templates/ directory
ls -la themes/custom/mytheme/templates/node--patient--card.html.twig
```

4. **Check file naming:**

```bash
# Common mistakes:
node-patient-card.html.twig   # Wrong: underscores, not hyphens
node_patient_card.html.twig   # Wrong: underscores
node--patient--card.twig      # Wrong: missing .html
node--patient-card.html.twig  # Wrong: single hyphen
node--patient--card.html.twig # Correct!
```

5. **Clear cache:**

```bash
drush cr
```

6. **Check theme path in settings:**

```php
// sites/default/settings.php - verify theme is active
// Config > Appearance > Set as default
```

## Debugging Tools Reference

### Drush Commands

```bash
# Clear all caches
drush cr

# Clear TWIG cache only
drush twig:debug

# List all template suggestions for an entity
drush ev "print_r(\\Drupal::theme()->getActiveTheme()->getPath());"

# Rebuild cache and theme registry
drush rebuild
```

### Browser DevTools

**Elements Panel:**

- Inspect component HTML structure
- View Shadow DOM contents
- Check slot assignments
- Verify attributes

**Console:**

```javascript
// Check if component is defined
customElements.get('hx-card');

// Get component instance
const card = document.querySelector('hx-card');

// Check Shadow DOM
card.shadowRoot;

// List all slots
card.querySelectorAll('[slot]');

// Get component properties
card.variant;
card.elevation;
```

**Network Panel:**

- Verify JavaScript library loads
- Check for 404 errors on component files
- Verify module script MIME type

### Devel Module Tools

```bash
# Install Devel module
composer require drupal/devel
drush en devel -y
```

**Devel features:**

- **Execute PHP Code**: Admin > Development > Execute PHP Code
- **Devel toolbar**: Quick access to cache clear, route info
- **Field Info**: Shows field details on entity pages

### Web Profiler (XDebug Integration)

For advanced debugging with breakpoints:

```bash
# Install Web Profiler
composer require drupal/devel
drush en webprofiler -y
```

Configure XDebug in `php.ini`:

```ini
[xdebug]
xdebug.mode=debug
xdebug.start_with_request=yes
xdebug.client_port=9003
```

Set breakpoints in TWIG templates (in IDE), then step through execution.

## Summary

Effective TWIG debugging is essential for successful HELIX component integration in Drupal:

### Key Takeaways

1. **Enable TWIG debug mode** in development via `services.yml`
2. **Use template suggestions** from HTML comments to customize templates
3. **Use `dump()` or `kint()`** to inspect variables and data structures
4. **Verify component attributes** before rendering
5. **Check slot projection** in browser DevTools
6. **Test field existence** before rendering to avoid errors
7. **Add debug data attributes** for browser console debugging
8. **Never enable debug in production** — significant performance impact
9. **Comment out debug code** before committing
10. **Use Drush** for cache clearing and template debugging

### Essential Debugging Workflow

```twig
{# 1. Enable debug mode (services.yml) #}
{# 2. Inspect available variables #}
{# {{ kint(_context|keys) }} #}

{# 3. Debug specific values before use #}
{# {{ kint(node.field_variant.value, 'Variant Field') }} #}

{# 4. Render component with debug attributes #}
<hx-card
  variant="{{ node.field_variant.value|default('default') }}"
  data-debug-node="{{ node.id }}"
  data-debug-template="{{ _self }}"
>
  {# 5. Verify slot content #}
  {# {{ kint(label, 'Heading Content') }} #}
  <span slot="heading">{{ label }}</span>

  {{ content.body }}
</hx-card>

{# 6. Inspect in browser DevTools #}
{# 7. Clear cache: drush cr #}
```

### Additional Resources

- [Drupal TWIG Documentation](https://www.drupal.org/docs/theming-drupal/twig-in-drupal)
- [Devel Module](https://www.drupal.org/project/devel)
- [Debugging TWIG Templates](https://www.drupal.org/docs/theming-drupal/twig-in-drupal/discovering-and-inspecting-variables-in-twig-templates)
- [HELIX Component Documentation](/components/)
- [TWIG Integration Fundamentals](/drupal-integration/twig/fundamentals/)
- [Drupal Behaviors](/drupal-integration/behaviors/)

Mastering TWIG debugging accelerates development, reduces errors, and ensures HELIX components integrate seamlessly with Drupal's rendering pipeline.
