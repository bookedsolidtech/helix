---
title: Slot Patterns in TWIG
description: Master slot-based composition in Drupal TWIG templates with HELIX web components
order: 8
---

Slots are the foundation of web component composition in Drupal. This comprehensive guide covers slot fundamentals, the HELIX hybrid architecture strategy (ADR-001), and real-world TWIG patterns for slot-driven content composition in healthcare CMS environments.

---

## Understanding Slots in Web Components

Slots are the HTML-native mechanism for **content projection** in web components. They allow components to define insertion points where consumer content (from TWIG templates) is rendered, maintaining Shadow DOM encapsulation while giving content editors full control over what appears inside components.

### Why Slots Matter in Drupal

```twig
{# Traditional Drupal approach: component controls everything #}
<div class="card" data-title="{{ title }}" data-body="{{ body }}">
  {# JavaScript reads attributes and renders content #}
</div>

{# Slot-based approach: Drupal controls content, component provides structure #}
<hx-card variant="featured" elevation="raised">
  <h3 slot="heading">{{ title }}</h3>
  {{ body }}
  <div slot="footer">{{ footer }}</div>
</hx-card>
```

**Benefits for enterprise healthcare CMS:**

1. **Content governance** - Editorial teams use familiar Drupal field system, media library, and WYSIWYG
2. **No serialization** - Rich HTML content renders directly (no JSON encoding/decoding)
3. **SEO and accessibility** - Content is in the Light DOM, fully indexable and screen reader accessible
4. **Progressive enhancement** - Content visible before JavaScript loads
5. **Zero component coupling** - Components work without custom Drupal modules

---

## Slot Fundamentals

### Default Slot (Unnamed Slot)

The **default slot** accepts all content that doesn't have a `slot` attribute. This is the primary content area.

**Component template (Lit):**

```typescript
// src/components/hx-button/hx-button.ts
render() {
  return html`
    <button part="button" class="button">
      <slot></slot>
    </button>
  `;
}
```

**TWIG usage:**

```twig
{# templates/components/button.html.twig #}
<hx-button variant="primary" hx-size="lg">
  Save Patient Record
</hx-button>
```

**Rendered HTML (Light DOM → Shadow DOM):**

```html
<hx-button variant="primary" hx-size="lg">
  #shadow-root (open)
  <button part="button" class="button">
    <slot> ↓ Projects this Light DOM content ↓ </slot>
  </button>
  Save Patient Record ← Light DOM (visible to search engines, screen readers)
</hx-button>
```

The text "Save Patient Record" remains in the Light DOM but renders _inside_ the Shadow DOM `<button>` via the slot projection mechanism.

### Named Slots

**Named slots** enable precise content placement. Use the `slot="name"` attribute to assign content to specific insertion points.

**Component template (Lit):**

```typescript
// src/components/hx-card/hx-card.ts
render() {
  return html`
    <div part="card" class="card">
      <div part="image" class="card__image">
        <slot name="image"></slot>
      </div>

      <div part="heading" class="card__heading">
        <slot name="heading"></slot>
      </div>

      <div part="body" class="card__body">
        <slot></slot>  <!-- Default slot -->
      </div>

      <div part="footer" class="card__footer">
        <slot name="footer"></slot>
      </div>

      <div part="actions" class="card__actions">
        <slot name="actions"></slot>
      </div>
    </div>
  `;
}
```

**TWIG usage:**

```twig
{# templates/node/node--patient--card.html.twig #}
<hx-card variant="default" elevation="raised">
  {# Named slot: image #}
  {% if content.field_patient_photo|render|trim %}
    <div slot="image">
      {{ content.field_patient_photo }}
    </div>
  {% endif %}

  {# Named slot: heading #}
  <h3 slot="heading">{{ label }}</h3>

  {# Default slot: body content #}
  <div class="patient-details">
    <dl>
      <dt>MRN:</dt>
      <dd>{{ node.field_medical_record_number.value }}</dd>

      <dt>Department:</dt>
      <dd>{{ node.field_department.entity.name.value }}</dd>

      <dt>Last Visit:</dt>
      <dd>{{ node.field_last_visit.value|date('F j, Y') }}</dd>
    </dl>
  </div>

  {# Named slot: footer #}
  {% if node.changed.value %}
    <span slot="footer">
      Updated {{ node.changed.value|time_diff }}
    </span>
  {% endif %}

  {# Named slot: actions (multiple elements) #}
  <hx-button slot="actions" variant="primary" hx-size="sm">
    View Chart
  </hx-button>
  <hx-button slot="actions" variant="secondary" hx-size="sm">
    Schedule Appointment
  </hx-button>
</hx-card>
```

**Key patterns:**

- **Semantic wrappers** - Use `<div slot="image">` to wrap complex Drupal render arrays
- **Multiple elements** - Multiple `<hx-button slot="actions">` elements render in the same slot container
- **Conditional rendering** - Use `{% if %}` to only render slots when content exists
- **Preserve render arrays** - Drupal field render arrays (`{{ content.field_name }}`) work directly in slots

### Slot Assignment Rules

| Pattern                                         | Slot Assignment      | Result                                                  |
| ----------------------------------------------- | -------------------- | ------------------------------------------------------- |
| `<p>Text</p>`                                   | Default slot         | Renders in unnamed `<slot></slot>`                      |
| `<h3 slot="heading">Title</h3>`                 | Named slot `heading` | Renders in `<slot name="heading"></slot>`               |
| `<div slot="nonexistent">Content</div>`         | No matching slot     | **Not rendered** (slot name doesn't exist in component) |
| `<img slot="image">` and `<video slot="image">` | Both to `image` slot | Both render (slots accept multiple elements)            |

---

## ADR-001: The Hybrid Slot/Property Strategy

**Architecture Decision Record 001** defines HELIX's component strategy: **Slot-First, Property-Enhanced**.

### The Decision

```
Atomic components (buttons, badges, toggles):
  → Property-driven (simple data via HTML attributes)

Complex components (cards, alerts, forms):
  → Slot-driven (Drupal controls content structure)

Form components (inputs, selects, textareas):
  → Hybrid (slots for labels/help text, properties for validation/state)
```

### Why This Matters

**Property-driven approach:**

```twig
{# Component controls rendering #}
<hx-hypothetical-card
  title="Patient Record"
  body="John Doe, 45 years old"
  footer="Updated 2 hours ago"
  image-url="/photo.jpg"
  image-alt="Patient photo"
></hx-hypothetical-card>
```

**Problems:**

- Drupal must serialize complex HTML to attributes (limited to strings)
- Can't use Drupal media library (must extract URLs manually)
- Can't use WYSIWYG editors (body is a string, not renderable HTML)
- Storybook controls everything (Drupal becomes data provider only)

**Slot-driven approach (HELIX):**

```twig
{# Drupal controls content, component provides structure #}
<hx-card variant="featured" elevation="raised">
  <div slot="image">
    {{ content.field_patient_photo }}
  </div>

  <h3 slot="heading">{{ label }}</h3>

  {{ content.body }}

  <span slot="footer">Updated {{ node.changed.value|time_diff }}</span>
</hx-card>
```

**Benefits:**

- Drupal field system controls all content (media, text, references)
- Content editors use existing workflows (no new skills)
- Rich HTML renders directly (no serialization)
- Component focuses on layout, styling, behavior

### When to Use Slots

Use slots for **content that content editors control**:

| Use Slots For                 | Examples                              | Rationale                                                       |
| ----------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| **Headings and titles**       | `<h2 slot="heading">{{ title }}</h2>` | Editors control text, hierarchy (h1/h2/h3), inline markup       |
| **Rich text content**         | `{{ content.body }}`                  | WYSIWYG output, embedded media, complex formatting              |
| **Media and images**          | `{{ content.field_image }}`           | Drupal Media library controls URLs, alt text, responsive images |
| **Lists and structured data** | `<dl>...</dl>` in default slot        | Editors control data structure and presentation                 |
| **Action buttons**            | `<hx-button slot="actions">`          | Editors control button text, order, and number of actions       |
| **Custom HTML**               | `<div slot="footer">...</div>`        | Editors need full markup control (timestamps, badges, links)    |

### When to Use Properties

Use properties for **component configuration and behavior**:

| Use Properties For    | Examples                            | Rationale                               |
| --------------------- | ----------------------------------- | --------------------------------------- |
| **Visual variants**   | `variant="primary"`                 | Design system controls available styles |
| **Sizes**             | `hx-size="lg"`                      | Consistent sizing across site           |
| **Elevation/shadows** | `elevation="raised"`                | Visual hierarchy controlled by theme    |
| **Validation state**  | `required` `disabled` `error`       | Form state managed by component         |
| **Behavior flags**    | `closable` `open` `checked`         | Component controls interactivity        |
| **ARIA attributes**   | `role="alert"` `aria-live="polite"` | Accessibility handled by component      |

### Hybrid Pattern (Form Components)

Form components like `hx-text-input` use **both slots and properties**:

```twig
{# templates/form/patient-intake-form.html.twig #}

{# Properties: validation state, input type, required flag #}
{# Slots: label text, help text, error messages #}
<hx-text-input
  name="patient_name"
  type="text"
  required
  value="{{ default_value }}"
  {% if errors %}error="{{ errors|first }}"{% endif %}
>
  {# Default slot: label text #}
  Patient Full Name

  {# Named slot: help text #}
  <span slot="help">Enter first and last name as it appears on insurance card</span>

  {# Named slot: error (conditionally rendered) #}
  {% if errors %}
    <span slot="error">{{ errors|first }}</span>
  {% endif %}
</hx-text-input>
```

**Why hybrid?**

- **Properties** control validation, state, and HTML5 input types (controlled by Form API)
- **Slots** allow editorial control over labels, help text, and error formatting
- **Best of both worlds** - Form API integration + content flexibility

---

## Slot Attribute Syntax in TWIG

### Basic Slot Assignment

```twig
{# Assign element to named slot #}
<element slot="slot-name">Content</element>

{# Examples #}
<h2 slot="heading">Patient Dashboard</h2>
<img slot="image" src="/photo.jpg" alt="Patient">
<div slot="footer">Last updated: {{ date }}</div>
```

**Rules:**

- Slot names are **case-sensitive** (`slot="Heading"` ≠ `slot="heading"`)
- Use **lowercase kebab-case** for consistency (`slot="call-to-action"` not `slot="callToAction"`)
- Elements without `slot` attribute go to **default slot**

### Multiple Elements in One Slot

Named slots accept **multiple elements**:

```twig
<hx-card>
  <h3 slot="heading">Recent Alerts</h3>

  {# Default slot: multiple alerts #}
  <hx-alert variant="warning">Medication interaction detected</hx-alert>
  <hx-alert variant="info">Lab results available</hx-alert>
  <hx-alert variant="success">Vitals recorded successfully</hx-alert>

  {# Actions slot: multiple buttons #}
  <hx-button slot="actions" variant="primary">Review All</hx-button>
  <hx-button slot="actions" variant="secondary">Dismiss</hx-button>
  <hx-button slot="actions" variant="ghost">Settings</hx-button>
</hx-card>
```

The component renders all three buttons in the `actions` slot container (typically a flexbox or grid layout).

### Slot Attribute on Drupal Render Arrays

Drupal render arrays can be wrapped in slot-assigned containers:

```twig
{# Wrap entire field render array #}
<div slot="image">
  {{ content.field_featured_image }}
</div>

{# Wrap entity reference field #}
<div slot="author">
  {{ content.field_author }}
</div>

{# Wrap View embed #}
<div slot="related-content">
  {{ drupal_view('related_patients', 'block_1') }}
</div>
```

**Why wrappers?**

- Render arrays output multiple elements (can't put `slot` on array itself)
- Wrapper provides single element for slot assignment
- Wrapper can add semantic meaning (`<aside slot="sidebar">`)

### Conditional Slot Rendering

Only render slots when content exists:

```twig
<hx-card variant="featured">
  <h3 slot="heading">{{ title }}</h3>

  {{ body }}

  {# Only render footer if content exists #}
  {% if footer_text or updated_date %}
    <div slot="footer">
      {% if footer_text %}
        <span>{{ footer_text }}</span>
      {% endif %}
      {% if updated_date %}
        <time datetime="{{ updated_date|date('c') }}">
          {{ updated_date|date('M j, Y') }}
        </time>
      {% endif %}
    </div>
  {% endif %}

  {# Only render actions if buttons exist #}
  {% if show_edit_button or show_delete_button %}
    <div slot="actions">
      {% if show_edit_button %}
        <hx-button variant="primary">Edit</hx-button>
      {% endif %}
      {% if show_delete_button %}
        <hx-button variant="danger">Delete</hx-button>
      {% endif %}
    </div>
  {% endif %}
</hx-card>
```

**Best practice:** HELIX components use `slotchange` events to **hide empty slot containers**, but conditional rendering in TWIG prevents unnecessary DOM nodes.

---

## Slot Forwarding Patterns

**Slot forwarding** allows components to pass slot content to nested child components. This is an advanced pattern for composite components.

### Basic Forwarding

```twig
{# Parent component template (hypothetical hx-alert-group) #}
<div class="alert-group">
  <hx-alert variant="warning">
    {# Forward icon slot from parent to child #}
    <slot name="icon" slot="icon"></slot>
    <slot></slot>
  </hx-alert>
</div>

{# Usage in TWIG #}
<hx-alert-group>
  <svg slot="icon"><!-- Custom warning icon --></svg>
  This alert uses a forwarded custom icon
</hx-alert-group>
```

The `<slot name="icon" slot="icon">` element:

1. **Receives** content from `hx-alert-group`'s light DOM (`slot="icon"` attribute)
2. **Assigns** that content to `hx-alert`'s `icon` slot (element has `slot="icon"`)

### Drupal Use Case: Layout Builder Blocks

In Drupal Layout Builder, blocks often need to forward content to nested components:

```twig
{# templates/block/block--featured-patient-card.html.twig #}
<div{{ attributes.addClass('block', 'block-featured-card') }}>
  {{ title_prefix }}
  {{ title_suffix }}

  <hx-card variant="featured" elevation="floating">
    {# Forward block title to card heading slot #}
    {% if label %}
      <h2 slot="heading">{{ label }}</h2>
    {% endif %}

    {# Forward block content to default slot #}
    {% block content %}
      {{ content }}
    {% endblock %}

    {# Add contextual actions to card actions slot #}
    {% if title_suffix %}
      <div slot="actions">
        {{ title_suffix }}
      </div>
    {% endif %}
  </hx-card>
</div>
```

This pattern lets Layout Builder blocks seamlessly integrate with HELIX card components.

---

## Drupal Field to Slot Mapping

### Content Type: Patient Record

**Fields:**

- `field_patient_photo` (Media: Image)
- `field_medical_record_number` (Text)
- `field_department` (Entity Reference: Taxonomy Term)
- `field_primary_diagnosis` (Text, long)
- `field_last_visit` (Date)
- `field_attending_physician` (Entity Reference: User)
- `field_status` (List: active, discharged, transferred)

**TWIG mapping to hx-card slots:**

```twig
{# templates/node/node--patient--card.html.twig #}
<hx-card variant="default" elevation="raised">
  {# FIELD: field_patient_photo → SLOT: image #}
  {% if content.field_patient_photo|render|trim %}
    <div slot="image">
      {{ content.field_patient_photo }}
    </div>
  {% endif %}

  {# FIELD: node.label (title) → SLOT: heading #}
  <h3 slot="heading">{{ label }}</h3>

  {# FIELDS: Multiple → DEFAULT SLOT (body) #}
  <div class="patient-summary">
    <dl class="patient-summary__data">
      <dt>Medical Record Number</dt>
      <dd>{{ node.field_medical_record_number.value }}</dd>

      <dt>Department</dt>
      <dd>
        {% if node.field_department.entity %}
          <hx-badge variant="secondary">
            {{ node.field_department.entity.name.value }}
          </hx-badge>
        {% endif %}
      </dd>

      <dt>Primary Diagnosis</dt>
      <dd>{{ content.field_primary_diagnosis }}</dd>

      <dt>Attending Physician</dt>
      <dd>
        {% if node.field_attending_physician.entity %}
          {{ node.field_attending_physician.entity.label }}
        {% endif %}
      </dd>
    </dl>
  </div>

  {# FIELDS: field_last_visit, field_status → SLOT: footer #}
  {% if node.field_last_visit.value or node.field_status.value %}
    <div slot="footer" class="patient-summary__meta">
      {% if node.field_last_visit.value %}
        <time datetime="{{ node.field_last_visit.value|date('c') }}">
          Last visit: {{ node.field_last_visit.value|date('M j, Y') }}
        </time>
      {% endif %}

      {% if node.field_status.value %}
        <hx-badge
          variant="{% if node.field_status.value == 'active' %}success{% else %}neutral{% endif %}"
        >
          {{ node.field_status.value|capitalize }}
        </hx-badge>
      {% endif %}
    </div>
  {% endif %}

  {# ACTIONS: Contextual links → SLOT: actions #}
  <div slot="actions">
    <hx-button
      variant="primary"
      hx-size="sm"
    >
      View Full Chart
    </hx-button>

    {% if edit_url %}
      <hx-button
        variant="secondary"
        hx-size="sm"
      >
        Edit Record
      </hx-button>
    {% endif %}
  </div>
</hx-card>
```

**Mapping strategy:**

| Drupal Concept       | HELIX Slot               | Pattern                                                     |
| -------------------- | ------------------------ | ----------------------------------------------------------- |
| Node title (`label`) | `heading`                | `<h3 slot="heading">{{ label }}</h3>`                       |
| Featured image field | `image`                  | `<div slot="image">{{ content.field_image }}</div>`         |
| Body field           | Default slot             | `{{ content.body }}` (no `slot` attribute)                  |
| Timestamp fields     | `footer`                 | `<time slot="footer">{{ node.changed.value\|date }}</time>` |
| Taxonomy badges      | Default slot or `footer` | `<hx-badge>{{ term.name }}</hx-badge>`                      |
| Action buttons       | `actions`                | `<hx-button slot="actions">...</hx-button>`                 |

### Views Templates

**Views row template with slot mapping:**

```twig
{# templates/views/views-view-unformatted--patient-list.html.twig #}
<div{{ attributes.addClass('patient-list') }}>
  {% for row in rows %}
    {# Access row entity #}
    {% set patient = row.content['#row']._entity %}

    <hx-card
      variant="compact"
      elevation="raised"
      hx-href="{{ path('entity.node.canonical', {'node': patient.id}) }}"
    >
      {# View field: field_patient_photo → image slot #}
      {% if patient.field_patient_photo.entity %}
        <img
          slot="image"
          src="{{ file_url(patient.field_patient_photo.entity.uri.value) }}"
          alt="{{ patient.field_patient_photo.alt }}"
        >
      {% endif %}

      {# View field: title → heading slot #}
      <h4 slot="heading">{{ patient.label }}</h4>

      {# View fields: multiple → default slot #}
      <div class="patient-card__summary">
        <p><strong>MRN:</strong> {{ patient.field_medical_record_number.value }}</p>
        <p><strong>Department:</strong> {{ patient.field_department.entity.name.value }}</p>
      </div>

      {# View field: field_last_visit → footer slot #}
      {% if patient.field_last_visit.value %}
        <time slot="footer" datetime="{{ patient.field_last_visit.value|date('c') }}">
          Last visit: {{ patient.field_last_visit.value|date('M j, Y') }}
        </time>
      {% endif %}

      {# Actions → actions slot #}
      <hx-button slot="actions" variant="primary" hx-size="sm">
        View Chart
      </hx-button>
    </hx-card>
  {% endfor %}
</div>
```

**Key technique:** Access the underlying entity via `row.content['#row']._entity` to get full field data (Views often only exposes rendered output).

---

## Complete TWIG Examples

### Example 1: Patient Intake Form (Hybrid Slots + Properties)

```twig
{# templates/form/patient-intake-form.html.twig #}
<hx-form action="{{ form_action }}" method="post">
  {{ form.form_build_id }}
  {{ form.form_token }}
  {{ form.form_id }}

  <hx-container max-width="md">
    <h1>Patient Intake Form</h1>

    {# ============================================
         SECTION: Personal Information
         ============================================ #}
    <fieldset>
      <legend>Personal Information</legend>

      {# Hybrid: property (required, value) + slot (label, help) #}
      <hx-text-input
        name="first_name"
        type="text"
        required
        value="{{ form.first_name['#default_value']|default('') }}"
        {% if form.first_name['#errors'] %}
          error="{{ form.first_name['#errors']|first }}"
        {% endif %}
      >
        First Name
        <span slot="help">Legal first name as it appears on insurance</span>
      </hx-text-input>

      <hx-text-input
        name="last_name"
        type="text"
        required
        value="{{ form.last_name['#default_value']|default('') }}"
      >
        Last Name
      </hx-text-input>

      <hx-text-input
        name="date_of_birth"
        type="date"
        required
        value="{{ form.date_of_birth['#default_value']|default('') }}"
      >
        Date of Birth
        <span slot="help">Used to verify patient identity and insurance eligibility</span>
      </hx-text-input>

      {# Radio group: hybrid pattern #}
      <hx-radio-group
        name="gender"
        required
      >
        {# Default slot: group label #}
        Gender

        {# Named slot: options (multiple radios) #}
        <hx-radio
          slot="options"
          value="male"
          {% if form.gender['#default_value'] == 'male' %}checked{% endif %}
        >
          Male
        </hx-radio>
        <hx-radio
          slot="options"
          value="female"
          {% if form.gender['#default_value'] == 'female' %}checked{% endif %}
        >
          Female
        </hx-radio>
        <hx-radio
          slot="options"
          value="other"
          {% if form.gender['#default_value'] == 'other' %}checked{% endif %}
        >
          Other
        </hx-radio>
        <hx-radio
          slot="options"
          value="prefer-not-to-say"
          {% if form.gender['#default_value'] == 'prefer-not-to-say' %}checked{% endif %}
        >
          Prefer not to say
        </hx-radio>
      </hx-radio-group>
    </fieldset>

    {# ============================================
         SECTION: Contact Information
         ============================================ #}
    <fieldset>
      <legend>Contact Information</legend>

      <hx-text-input
        name="phone"
        type="tel"
        required
        placeholder="(555) 555-5555"
        value="{{ form.phone['#default_value']|default('') }}"
      >
        Phone Number
        <span slot="help">Primary contact number for appointment reminders</span>
      </hx-text-input>

      <hx-text-input
        name="email"
        type="email"
        required
        value="{{ form.email['#default_value']|default('') }}"
      >
        Email Address
        <span slot="help">Used for patient portal access and appointment confirmations</span>
      </hx-text-input>

      <hx-textarea
        name="address"
        required
        rows="3"
      >
        Street Address
        <span slot="help">Full mailing address for billing and correspondence</span>
      </hx-textarea>
    </fieldset>

    {# ============================================
         SECTION: Emergency Contact
         ============================================ #}
    <fieldset>
      <legend>Emergency Contact</legend>

      <hx-text-input
        name="emergency_contact_name"
        type="text"
        required
        value="{{ form.emergency_contact_name['#default_value']|default('') }}"
      >
        Contact Name
      </hx-text-input>

      <hx-text-input
        name="emergency_contact_phone"
        type="tel"
        required
        value="{{ form.emergency_contact_phone['#default_value']|default('') }}"
      >
        Contact Phone
      </hx-text-input>

      <hx-text-input
        name="emergency_contact_relationship"
        type="text"
        required
        value="{{ form.emergency_contact_relationship['#default_value']|default('') }}"
      >
        Relationship
        <span slot="help">Spouse, parent, sibling, friend, etc.</span>
      </hx-text-input>
    </fieldset>

    {# ============================================
         SECTION: Consent
         ============================================ #}
    <fieldset>
      <legend>Consent and Acknowledgment</legend>

      <hx-checkbox
        name="consent_treatment"
        required
        {% if form.consent_treatment['#default_value'] %}checked{% endif %}
      >
        {# Default slot: checkbox label (rich HTML allowed) #}
        I consent to medical treatment and authorize healthcare providers to
        perform necessary diagnostic tests and procedures.
      </hx-checkbox>

      <hx-checkbox
        name="consent_privacy"
        required
        {% if form.consent_privacy['#default_value'] %}checked{% endif %}
      >
        I acknowledge that I have read and understand the
        <a href="/privacy-policy" target="_blank">Privacy Policy</a>
        and <a href="/hipaa-notice" target="_blank">HIPAA Notice of Privacy Practices</a>.
      </hx-checkbox>

      <hx-checkbox
        name="newsletter"
        {% if form.newsletter['#default_value'] %}checked{% endif %}
      >
        Subscribe to health tips and appointment reminders (optional)
      </hx-checkbox>
    </fieldset>

    {# ============================================
         FORM ACTIONS
         ============================================ #}
    <div class="form-actions">
      <hx-button
        type="submit"
        variant="primary"
        hx-size="lg"
      >
        Submit Intake Form
      </hx-button>

      <hx-button
        type="button"
        variant="ghost"
        hx-size="lg"
      >
        Save as Draft
      </hx-button>
    </div>
  </hx-container>
</hx-form>
```

**Key patterns:**

1. **Form component wrapper** - `<hx-form>` provides native form submission
2. **Hybrid inputs** - Properties for `required`, `type`, `value`; slots for labels and help text
3. **Rich HTML in slots** - Checkbox labels contain links (`<a>` tags)
4. **Radio group slot composition** - Group label in default slot, radios in `options` slot
5. **Help text slot** - Contextual guidance without breaking layout

### Example 2: Article Node with hx-card and hx-alert

```twig
{# templates/node/node--article--full.html.twig #}
<article{{ attributes.addClass('article', 'article--full') }}>
  {{ title_prefix }}
  {{ title_suffix }}

  {# Patient Safety Alert (if flagged) #}
  {% if node.field_patient_safety_alert.value %}
    <hx-alert variant="warning" closable>
      <svg slot="icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2L1 21h22L12 2zm0 5l7.53 13H4.47L12 7z"/>
        <circle cx="12" cy="16" r="1"/>
        <path d="M12 10v4"/>
      </svg>

      <strong>Patient Safety Notice:</strong>
      {{ content.field_patient_safety_alert }}

      <hx-button slot="actions" variant="secondary" hx-size="sm">
        Acknowledge
      </hx-button>
    </hx-alert>
  {% endif %}

  {# Main Article Card #}
  <hx-card variant="featured" elevation="floating">
    {# Featured Image → image slot #}
    {% if content.field_featured_image|render|trim %}
      <div slot="image">
        {{ content.field_featured_image }}
      </div>
    {% endif %}

    {# Article Title → heading slot #}
    <h1 slot="heading"{{ title_attributes }}>{{ label }}</h1>

    {# Article Body → default slot #}
    <div class="article__content">
      {# Metadata #}
      <div class="article__meta">
        <div class="article__author">
          {% if content.field_author|render|trim %}
            By {{ content.field_author }}
          {% else %}
            By {{ author_name }}
          {% endif %}
        </div>

        <time datetime="{{ node.created.value|date('c') }}">
          {{ node.created.value|date('F j, Y') }}
        </time>

        {% if content.field_read_time|render|trim %}
          <span class="article__read-time">
            <svg width="16" height="16" aria-hidden="true"><!-- Clock icon --></svg>
            {{ content.field_read_time }} min read
          </span>
        {% endif %}
      </div>

      {# Body content (WYSIWYG) #}
      <div class="article__body">
        {{ content.body }}
      </div>

      {# Tags #}
      {% if content.field_tags|render|trim %}
        <div class="article__tags">
          <strong>Tags:</strong>
          {% for item in node.field_tags %}
            <hx-badge variant="secondary" hx-size="sm">
              {{ item.entity.name.value }}
            </hx-badge>
          {% endfor %}
        </div>
      {% endif %}
    </div>

    {# Footer metadata → footer slot #}
    <div slot="footer" class="article__footer">
      <span>Last updated: {{ node.changed.value|date('M j, Y g:ia') }}</span>

      {% if node.field_medical_review_date.value %}
        <span>
          Medically reviewed:
          <time datetime="{{ node.field_medical_review_date.value|date('c') }}">
            {{ node.field_medical_review_date.value|date('M j, Y') }}
          </time>
        </span>
      {% endif %}
    </div>

    {# Call-to-action → actions slot #}
    {% if content.field_cta_link|render|trim %}
      <hx-button
        slot="actions"
        variant="primary"
        hx-size="lg"
      >
        {{ content.field_cta_link.0['#title'] }}
      </hx-button>
    {% endif %}
  </hx-card>

  {# Related Articles (nested cards in default layout) #}
  {% if content.field_related_articles|render|trim %}
    <aside class="article__related">
      <h2>Related Articles</h2>

      <div class="article__related-grid">
        {% for item in node.field_related_articles %}
          <hx-card
            variant="compact"
            elevation="raised"
            hx-href="{{ path('entity.node.canonical', {'node': item.target_id}) }}"
          >
            {% if item.entity.field_thumbnail.entity %}
              <img
                slot="image"
                src="{{ file_url(item.entity.field_thumbnail.entity.uri.value) }}"
                alt="{{ item.entity.field_thumbnail.alt }}"
              >
            {% endif %}

            <h3 slot="heading">{{ item.entity.label }}</h3>

            {{ item.entity.body.summary }}

            <span slot="footer">{{ item.entity.created.value|date('M j, Y') }}</span>
          </hx-card>
        {% endfor %}
      </div>
    </aside>
  {% endif %}
</article>
```

**Advanced patterns:**

1. **Alert with custom icon slot** - Override default warning icon with healthcare-specific SVG
2. **Nested components** - Cards inside article layout, alerts above main card
3. **Entity reference loops** - `{% for item in node.field_related_articles %}` renders multiple cards
4. **Conditional metadata** - Medical review date only renders if present
5. **Interactive card** - `hx-href` makes entire card clickable for navigation

### Example 3: Views Block with Empty State

```twig
{# templates/views/views-view--recent-patients--block.html.twig #}
<div{{ attributes.addClass('recent-patients-block') }}>
  {% if title %}
    <h2{{ title_attributes }}>{{ title }}</h2>
  {% endif %}

  {% if rows %}
    <div class="recent-patients-block__grid">
      {% for row in rows %}
        {% set patient = row.content['#row']._entity %}

        <hx-card variant="compact" elevation="raised">
          {# Patient photo → image slot #}
          {% if patient.field_patient_photo.entity %}
            <img
              slot="image"
              src="{{ file_url(patient.field_patient_photo.entity.uri.value) }}"
              alt="{{ patient.label }}"
            >
          {% endif %}

          {# Patient name → heading slot #}
          <h3 slot="heading">{{ patient.label }}</h3>

          {# Patient details → default slot #}
          <dl class="patient-quick-info">
            <dt>Department:</dt>
            <dd>
              {% if patient.field_department.entity %}
                <hx-badge variant="secondary">
                  {{ patient.field_department.entity.name.value }}
                </hx-badge>
              {% endif %}
            </dd>

            <dt>Status:</dt>
            <dd>
              <hx-badge
                variant="{% if patient.field_status.value == 'active' %}success{% else %}neutral{% endif %}"
              >
                {{ patient.field_status.value|capitalize }}
              </hx-badge>
            </dd>
          </dl>

          {# Last visit → footer slot #}
          {% if patient.field_last_visit.value %}
            <time slot="footer" datetime="{{ patient.field_last_visit.value|date('c') }}">
              Last visit: {{ patient.field_last_visit.value|date('M j, Y') }}
            </time>
          {% endif %}

          {# Actions → actions slot #}
          <hx-button
            slot="actions"
            variant="primary"
            hx-size="sm"
          >
            View Chart
          </hx-button>
        </hx-card>
      {% endfor %}
    </div>
  {% else %}
    {# Empty state card #}
    <hx-card variant="default">
      <div slot="heading">
        <svg width="48" height="48" viewBox="0 0 24 24" aria-hidden="true">
          <!-- Empty state icon -->
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
        </svg>
        <h3>No Recent Patients</h3>
      </div>

      <p>No patient records found. New admissions will appear here.</p>

      <hx-button slot="actions" variant="primary">
        Add New Patient
      </hx-button>
    </hx-card>
  {% endif %}
</div>
```

**Empty state pattern:**

- Use single `hx-card` for "no results" message
- SVG icon in `heading` slot provides visual feedback
- Action button guides user to next step (add new patient)

---

## Best Practices

### 1. Always Check for Content Before Rendering Slots

**Do:**

```twig
{% if content.field_image|render|trim %}
  <div slot="image">
    {{ content.field_image }}
  </div>
{% endif %}
```

**Don't:**

```twig
{# Renders empty <div slot="image"></div> if field is empty #}
<div slot="image">
  {{ content.field_image }}
</div>
```

**Why:** Empty slot containers create unnecessary DOM nodes. HELIX components hide empty slots via `slotchange` detection, but conditional TWIG is cleaner.

### 2. Use Semantic Wrappers for Complex Slot Content

**Do:**

```twig
<div slot="footer" class="card-footer">
  <time datetime="{{ date|date('c') }}">{{ date|date('F j, Y') }}</time>
  <hx-badge variant="success">Published</hx-badge>
</div>
```

**Don't:**

```twig
{# Multiple root elements in slot - hard to style #}
<time slot="footer" datetime="{{ date|date('c') }}">{{ date|date('F j, Y') }}</time>
<hx-badge slot="footer" variant="success">Published</hx-badge>
```

**Why:** Wrapper provides single root element for flexbox/grid layout and custom styling.

### 3. Preserve Drupal Render Arrays in Slots

**Do:**

```twig
<div slot="image">
  {{ content.field_featured_image }}  {# Render array with responsive images #}
</div>
```

**Don't:**

```twig
<img
  slot="image"
  src="{{ file_url(node.field_featured_image.entity.uri.value) }}"
  alt="{{ node.field_featured_image.alt }}"
>
```

**Why:** Render arrays include:

- Responsive image srcsets
- Image style processing
- Lazy loading
- Media entity metadata
- Cache tags

Manually extracting URLs bypasses Drupal's rendering pipeline.

### 4. Use Default Slot for Primary Content

**Do:**

```twig
<hx-card>
  <h3 slot="heading">{{ title }}</h3>
  {{ content.body }}  {# Default slot - no slot attribute #}
  <span slot="footer">{{ footer }}</span>
</hx-card>
```

**Don't:**

```twig
<hx-card>
  <h3 slot="heading">{{ title }}</h3>
  <div slot="body">{{ content.body }}</div>  {# Unnecessary slot name #}
  <span slot="footer">{{ footer }}</span>
</hx-card>
```

**Why:** Default slot is convention for main content. Reduces verbosity and matches HTML semantics (e.g., `<button>Text</button>` not `<button><span slot="label">Text</span></button>`).

### 5. Document Slot Usage in Template Comments

**Do:**

```twig
{# templates/node/node--patient--card.html.twig #}
{#
/**
 * Patient Card Template
 *
 * Slots used:
 * - image: Patient photo (field_patient_photo)
 * - heading: Patient name (node title)
 * - (default): Patient details (MRN, department, diagnosis)
 * - footer: Last visit date and status badge
 * - actions: View Chart and Schedule Appointment buttons
 *
 * Component: hx-card
 * Variant: default
 * Elevation: raised
 */
#}

<hx-card variant="default" elevation="raised">
  {# ... #}
</hx-card>
```

**Why:** Documents component API usage for future developers and content team.

### 6. Handle Empty Slots Gracefully

**Do:**

```twig
<hx-card>
  <h3 slot="heading">{{ title }}</h3>

  {% if content.body|render|trim %}
    {{ content.body }}
  {% else %}
    <p class="empty-state">No description available.</p>
  {% endif %}

  {% if footer %}
    <span slot="footer">{{ footer }}</span>
  {% endif %}
</hx-card>
```

**Don't:**

```twig
<hx-card>
  <h3 slot="heading">{{ title }}</h3>
  {{ content.body }}  {# Empty if no body field #}
  <span slot="footer">{{ footer }}</span>  {# Empty if no footer #}
</hx-card>
```

**Why:** Empty slots render blank containers. Provide fallback content or omit slot entirely.

### 7. Use TWIG Filters for Slot Content Transformation

**Do:**

```twig
<hx-badge variant="{{ node.field_priority.value|lower }}">
  {{ node.field_priority.value|upper }}
</hx-badge>

<time slot="footer" datetime="{{ node.created.value|date('c') }}">
  Published: {{ node.created.value|date('F j, Y') }}
</time>
```

**Don't:**

```twig
{# Raw field values without formatting #}
<hx-badge variant="{{ node.field_priority.value }}">
  {{ node.field_priority.value }}
</hx-badge>

<time slot="footer">
  {{ node.created.value }}
</time>
```

**Why:** TWIG filters handle:

- Case transformation (`|lower`, `|upper`, `|capitalize`)
- Date formatting (`|date('F j, Y')`)
- String operations (`|trim`, `|replace`)
- URL encoding (`|url_encode`)

### 8. Test Slot Patterns with Empty Fields

**Checklist:**

- [ ] Render template with all fields empty
- [ ] Verify no empty slot containers render
- [ ] Check for JavaScript console errors
- [ ] Validate ARIA labels don't reference missing content
- [ ] Ensure empty state is visually acceptable

**Example test scenario:**

```yaml
# Patient node with minimal fields
title: 'Jane Doe'
field_medical_record_number: 'MRN-67890'
# All other fields empty
```

Expected: Card renders with heading and MRN only. No empty image, footer, or actions containers.

---

## Troubleshooting

### Issue: Slot Content Doesn't Render

**Symptoms:**

- Content disappears when wrapped in component
- Browser DevTools shows content in Light DOM but not visible

**Cause:** Slot name mismatch

**Solution:**

```twig
{# Check slot name matches component template #}
<hx-card>
  <h3 slot="heading">Title</h3>  {# Correct: matches <slot name="heading"> #}
  <h3 slot="title">Title</h3>    {# Wrong: no <slot name="title"> exists #}
</hx-card>
```

**Debug in DevTools:**

1. Inspect element → Shadow Root
2. Find `<slot name="heading">`
3. Check `assignedNodes` property
4. Verify Light DOM element has matching `slot="heading"` attribute

### Issue: Multiple Elements Render Stacked Instead of Side-by-Side

**Symptoms:**

- Action buttons render vertically instead of horizontally
- Multiple badges stack instead of inline

**Cause:** Slot container CSS expects flex/grid layout

**Solution:**

```twig
{# Wrap multiple elements in container #}
<div slot="actions" class="action-buttons">
  <hx-button variant="primary">Save</hx-button>
  <hx-button variant="secondary">Cancel</hx-button>
</div>
```

**Or rely on component styles:**

```twig
{# Let component handle layout (if designed for multiple elements) #}
<hx-button slot="actions" variant="primary">Save</hx-button>
<hx-button slot="actions" variant="secondary">Cancel</hx-button>
```

HELIX components style `.card__actions` with `display: flex; gap: var(--hx-space-2);`.

### Issue: Drupal Render Array Outputs Multiple Elements

**Symptoms:**

- Field render array creates wrapper + content
- Can't assign `slot` attribute to render array itself

**Cause:** Render arrays output multiple DOM nodes

**Solution:**

```twig
{# Wrap render array in slot-assigned container #}
<div slot="image">
  {{ content.field_featured_image }}
</div>
```

**Not possible:**

```twig
{# Can't add attributes to render arrays directly #}
{{ content.field_featured_image|slot('image') }}  {# No such filter #}
```

### Issue: Slot Content Has Unexpected Styles

**Symptoms:**

- Slotted content looks different than expected
- Styles from parent page override component design

**Cause:** Slotted content inherits Light DOM styles, not Shadow DOM styles

**Expected behavior:** This is correct! Slotted content should inherit consumer styles (Drupal theme CSS).

**Solution:**

If component needs to style slotted content, use `::slotted()` CSS:

```css
/* In component styles */
::slotted(img) {
  width: 100%;
  height: auto;
  border-radius: var(--hx-border-radius-md);
}
```

Or add utility classes in TWIG:

```twig
<div slot="image" class="card-image-wrapper">
  {{ content.field_featured_image }}
</div>
```

### Issue: Empty Slots Create Visual Gaps

**Symptoms:**

- Card has padding/borders for empty slots
- Empty footer slot leaves white space

**Cause:** Component renders slot container even when empty

**Solution (TWIG):**

```twig
{# Conditionally render slots #}
{% if footer_content %}
  <div slot="footer">{{ footer_content }}</div>
{% endif %}
```

**Solution (Component):**

HELIX components use `slotchange` detection:

```typescript
// Component automatically hides empty slots
<div ?hidden=${!this._hasSlotContent['footer']}>
  <slot name="footer"></slot>
</div>
```

No TWIG changes needed if component implements slot detection.

---

## Advanced: Slot Events and JavaScript

For dynamic slot manipulation, use Drupal Behaviors:

```javascript
// mytheme/js/slot-interactions.js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxCardSlotDynamics = {
    attach(context) {
      once('hx-card-slots', 'hx-card', context).forEach((card) => {
        // Listen for slot changes
        const slots = card.shadowRoot.querySelectorAll('slot');
        slots.forEach((slot) => {
          slot.addEventListener('slotchange', (e) => {
            const slotName = e.target.name || 'default';
            const hasContent = e.target.assignedNodes({ flatten: true }).length > 0;

            console.log(`Slot "${slotName}" content changed. Has content: ${hasContent}`);

            // Example: Add custom class when actions slot is populated
            if (slotName === 'actions' && hasContent) {
              card.classList.add('has-actions');
            }
          });
        });

        // Programmatically add content to slot
        const addActionButton = () => {
          const button = document.createElement('hx-button');
          button.setAttribute('variant', 'ghost');
          button.setAttribute('slot', 'actions');
          button.textContent = 'Share';

          card.appendChild(button);
        };

        // Example: Add button on card click
        card.addEventListener('click', addActionButton, { once: true });
      });
    },
  };
})(Drupal, once);
```

**Use cases:**

- Dynamic slot population based on user actions
- Slot content validation
- Analytics tracking for slot usage
- Lazy loading slot content

---

## Summary

Slot-based composition is the cornerstone of HELIX's Drupal integration strategy. Key takeaways:

1. **Slots enable content control** - Drupal editors manage content via field system, not component properties
2. **ADR-001 defines the hybrid strategy** - Atoms use properties, organisms use slots, forms use both
3. **Default slot for primary content** - Minimize `slot` attribute usage for main content areas
4. **Named slots for structured layouts** - `heading`, `footer`, `actions` create semantic component APIs
5. **Conditional rendering prevents empty containers** - Always check for content before rendering slots
6. **Drupal render arrays work in slots** - Preserve responsive images, media entities, and cache tags
7. **Slot forwarding enables composition** - Pass slot content from parent to child components
8. **Field-to-slot mapping** - Direct mapping from content type fields to component slots
9. **TWIG filters transform slot content** - Date formatting, case conversion, string manipulation
10. **Real-world patterns scale** - Patient records, forms, views, and blocks all use slot composition

**The slot-first philosophy**: Drupal owns content, HELIX provides structure. This separation of concerns gives editorial teams full control while maintaining design system consistency and accessibility standards.

For atomic components (buttons, badges, toggles), see the [Properties and Attributes](/drupal-integration/twig/properties-attributes/) guide.

For form-specific hybrid patterns, see the [Form API Integration](/drupal-integration/forms/form-api/) guide.
