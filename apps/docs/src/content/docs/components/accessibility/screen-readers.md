---
title: Screen Reader Support
description: Comprehensive guide to screen reader testing, announcement patterns, accessible names, and NVDA/JAWS/VoiceOver support for HELIX web components.
sidebar:
  order: 38
---

Screen readers are assistive technologies that convert digital text into synthesized speech or braille output, enabling users who are blind or have low vision to access web content. In healthcare applications where patient safety and data accuracy are critical, robust screen reader support is not optional—it is a legal mandate under WCAG 2.1 AA and a fundamental requirement for equitable patient care.

This guide covers screen reader testing methodologies, announcement patterns, accessible naming strategies, and real-world examples from the HELIX component library. Whether you're building new components or auditing existing ones, this documentation provides the knowledge needed to ensure screen reader users can access all functionality independently and efficiently.

## Why Screen Reader Support Matters

Screen readers serve several critical user populations:

- **Users who are blind** and cannot perceive visual interfaces
- **Users with low vision** who rely on screen magnification paired with audio output
- **Users with cognitive disabilities** who benefit from multimodal information presentation
- **Users with reading disabilities** such as dyslexia who use text-to-speech for comprehension
- **Power users** who use screen readers for multitasking (e.g., listening while performing other tasks)

In healthcare environments, screen reader users include:

- **Healthcare providers** who are blind or have low vision, providing patient care
- **Patients** accessing their medical records, appointment scheduling, and telehealth platforms
- **Administrative staff** managing billing, scheduling, and documentation systems

**Healthcare mandate context**: The HHS Section 504 Final Rule requires healthcare organizations to ensure digital accessibility by May 11, 2026 (organizations with 15+ employees). Screen reader compatibility is a core requirement of WCAG 2.1 AA compliance.

## Screen Reader Basics

### How Screen Readers Work

Screen readers interact with web content through the browser's **accessibility tree**, a parallel structure to the DOM that represents the semantic meaning of each element. When you use semantic HTML (`<button>`, `<input>`, `<label>`) or ARIA attributes, the browser populates the accessibility tree with:

- **Role** — What the element is (button, heading, link, textbox)
- **Name** — The element's label or text content
- **State** — Current condition (checked, expanded, disabled, invalid)
- **Properties** — Additional context (required, readonly, describedby)

Screen readers traverse this tree and announce information based on the element's role, name, state, and properties.

### Common Screen Readers

| Screen Reader | Platform  | Market Share | License                 | Notes                                                      |
| ------------- | --------- | ------------ | ----------------------- | ---------------------------------------------------------- |
| **NVDA**      | Windows   | ~40%         | Free / Open Source      | Most popular free screen reader, widely used in healthcare |
| **JAWS**      | Windows   | ~30%         | Commercial ($900-$1900) | Enterprise standard, extensive features                    |
| **VoiceOver** | macOS/iOS | ~15%         | Free / Built-in         | Apple ecosystem, Safari optimized                          |
| **TalkBack**  | Android   | ~10%         | Free / Built-in         | Google ecosystem, Chrome optimized                         |
| **Narrator**  | Windows   | ~5%          | Free / Built-in         | Basic features, improving rapidly                          |

**Testing priority for HELIX**: NVDA (Windows), JAWS (Windows), VoiceOver (macOS). These three cover 85% of screen reader users.

### Browsing Modes

Screen readers operate in different modes depending on context:

#### Browse Mode (Virtual Cursor)

Used for reading static content. Users navigate by character, word, line, or semantic element (headings, links, landmarks).

**Common commands**:

- <kbd>↑</kbd> <kbd>↓</kbd> — Previous/next line
- <kbd>H</kbd> — Next heading
- <kbd>L</kbd> — Next link
- <kbd>F</kbd> — Next form field
- <kbd>B</kbd> — Next button

#### Forms Mode (Focus Mode)

Automatically activates when focus enters a form field. In forms mode, keystrokes are passed directly to the input (not intercepted by screen reader shortcuts).

**Example**: When a user tabs into `<hx-text-input>`, NVDA switches to forms mode automatically. Typing letters enters text rather than triggering browse mode shortcuts.

#### Application Mode

Used for complex interactive widgets (tree views, grids, custom controls). Requires explicit `role="application"` and careful implementation to avoid trapping users.

**HELIX approach**: Components avoid `role="application"` and rely on native HTML elements with forms mode, ensuring predictable behavior.

## Accessible Names and Descriptions

Every interactive element must have an **accessible name** that screen readers announce when the element receives focus. Accessible names come from several sources, prioritized in this order:

### 1. `aria-labelledby`

References one or more elements by ID. The referenced elements' text content becomes the accessible name.

```html
<span id="label-1">Patient</span>
<span id="label-2">Medical Record Number</span>
<hx-text-input aria-labelledby="label-1 label-2"></hx-text-input>
```

**Screen reader announcement**: "Patient Medical Record Number, edit, blank"

**HELIX usage**: All form components use `aria-labelledby` to associate internal labels with inputs in shadow DOM:

```typescript
// Inside hx-text-input shadow DOM
<label id=${this._labelId}>${this.label}</label>
<input aria-labelledby=${this._labelId} />
```

This pattern works across shadow boundaries because both elements live in the same shadow root.

### 2. `aria-label`

Provides an explicit text string as the accessible name.

```html
<hx-button aria-label="Close dialog">
  <svg><!-- X icon --></svg>
</hx-button>
```

**Screen reader announcement**: "Close dialog, button"

**When to use**:

- Icon-only buttons without visible text
- When the visible label needs clarification for screen reader users
- When the element has no visible label

**HELIX usage**: Close buttons, icon-only actions, and components where visible labels aren't appropriate:

```typescript
// Inside hx-alert shadow DOM
<button
  part="close-button"
  aria-label="Close"
  @click=${this._handleClose}
>
  ${this._renderCloseIcon()}
</button>
```

### 3. `<label>` element (for inputs)

The native HTML `<label for="input-id">` pattern provides the accessible name.

```html
<label for="email">Email Address</label> <input id="email" type="email" />
```

**Screen reader announcement**: "Email Address, edit, blank"

**Shadow DOM limitation**: The `for` attribute doesn't work across shadow boundaries. HELIX components use `aria-labelledby` instead (see pattern above).

### 4. `placeholder` (fallback, not recommended)

If no other name source exists, screen readers may use the `placeholder` attribute as a fallback. This is unreliable and does not meet WCAG 2.1 AA requirements.

```html
<!-- ❌ Bad: placeholder is not a label -->
<input type="text" placeholder="Enter your name" />

<!-- ✅ Good: explicit label -->
<hx-text-input label="Full name" placeholder="First Last"></hx-text-input>
```

**Why placeholders are insufficient**:

- Disappear when the user starts typing
- Low contrast (often fails WCAG contrast requirements)
- Not consistently announced by all screen readers
- May be mistaken for pre-filled values

### 5. Element content (for buttons, links)

Buttons and links derive their accessible name from their text content.

```html
<hx-button>Submit Form</hx-button>
```

**Screen reader announcement**: "Submit Form, button"

### Accessible Descriptions (`aria-describedby`)

While accessible names identify what an element is, descriptions provide additional context like help text, error messages, or instructions.

```typescript
// Inside hx-text-input shadow DOM
const describedBy =
  [hasError ? this._errorId : null, this.helpText ? this._helpTextId : null]
    .filter(Boolean)
    .join(' ') || undefined;

return html`
  <input aria-labelledby=${this._labelId} aria-describedby=${ifDefined(describedBy)} />

  ${this.helpText ? html`<div id=${this._helpTextId}>${this.helpText}</div>` : nothing}
  ${hasError ? html`<div id=${this._errorId} role="alert">${this.error}</div>` : nothing}
`;
```

**Screen reader announcement on focus**:

1. Accessible name: "Email address"
2. Role: "edit"
3. State: "required, invalid"
4. Description: "Please enter a valid email address (e.g., name@example.com)"

The description provides context without cluttering the initial announcement.

## Announcement Patterns

Screen readers announce different information depending on the element type, state, and context.

### Form Input Announcement Pattern

When focus enters a form input, screen readers announce:

1. **Label** (accessible name)
2. **Role** (edit, combobox, checkbox, etc.)
3. **State** (required, invalid, readonly)
4. **Current value** (if any)
5. **Description** (help text, error message)

**Example: `hx-text-input`**

```html
<hx-text-input
  label="Email address"
  value="user@example"
  required
  error="Please enter a valid email address"
  help-text="We'll never share your email"
>
</hx-text-input>
```

**NVDA announcement**:

```
Email address
edit, required, invalid
user@example
Please enter a valid email address. We'll never share your email.
```

**VoiceOver announcement**:

```
Email address, invalid data, required, edit text
user@example
Please enter a valid email address. We'll never share your email.
```

Slight variations between screen readers are normal. The key is that all critical information (label, state, error, help text) is announced.

### Button Announcement Pattern

Buttons announce their label, role, and state.

**Example: `hx-button`**

```html
<hx-button disabled>Submit</hx-button>
```

**NVDA announcement**:

```
Submit, button, unavailable
```

**VoiceOver announcement**:

```
Submit, dimmed, button
```

The `disabled` attribute is announced as "unavailable" (NVDA) or "dimmed" (VoiceOver), informing users the button cannot be activated.

**Why `aria-disabled` is used alongside `disabled`**:

```typescript
<button
  ?disabled=${this.disabled}
  aria-disabled=${this.disabled ? 'true' : nothing}
>
  <slot></slot>
</button>
```

The native `disabled` attribute prevents interaction, while `aria-disabled` ensures screen readers announce the disabled state even if CSS hides visual cues.

### Checkbox Announcement Pattern

Checkboxes announce their label, role, and checked state.

**Example: `hx-checkbox`**

```html
<hx-checkbox checked label="I agree to the terms and conditions"></hx-checkbox>
```

**NVDA announcement**:

```
I agree to the terms and conditions, checkbox, checked
```

**VoiceOver announcement**:

```
I agree to the terms and conditions, checked, checkbox
```

When the user presses <kbd>Space</kbd> to toggle:

**NVDA**: "checked" → "not checked"
**VoiceOver**: "checked" → "unchecked"

### Radio Group Announcement Pattern

Radio buttons are unique because they operate as a group. Screen readers announce the group label, the number of options, and the current selection.

**Example: `hx-radio-group`**

```html
<hx-radio-group label="Appointment type" value="in-person">
  <hx-radio value="in-person">In-person visit</hx-radio>
  <hx-radio value="telehealth">Telehealth video</hx-radio>
  <hx-radio value="phone">Phone call</hx-radio>
</hx-radio-group>
```

**NVDA announcement (on focus)**:

```
Appointment type, grouping
In-person visit, radio button, checked, 1 of 3
```

When the user presses <kbd>↓</kbd>:

```
Telehealth video, radio button, not checked, 2 of 3
```

The "1 of 3" / "2 of 3" context helps users understand the size of the group and their position.

**Implementation note**: `hx-radio-group` uses `<fieldset>` and `<legend>` to provide the group label:

```typescript
<fieldset part="fieldset">
  ${this.label
    ? html`<legend part="legend">${this.label}</legend>`
    : nothing}
  <div role="none">
    <slot></slot>
  </div>
</fieldset>
```

The `<legend>` is announced as part of the group context.

### Switch Announcement Pattern

Switches announce their label, role, and checked state.

**Example: `hx-switch`**

```html
<hx-switch checked label="Enable notifications"></hx-switch>
```

**NVDA announcement**:

```
Enable notifications, switch, on
```

**VoiceOver announcement**:

```
Enable notifications, on, switch button
```

When toggled:

**NVDA**: "on" → "off"
**VoiceOver**: "on" → "off"

**Implementation**: `hx-switch` uses `role="switch"` with `aria-checked`:

```typescript
<button
  role="switch"
  aria-checked=${this.checked ? 'true' : 'false'}
>
  <span part="thumb"></span>
</button>
```

The `role="switch"` tells screen readers this is a toggle control (not a checkbox), and `aria-checked` conveys the current state.

### Select Announcement Pattern

Select dropdowns announce their label, role, current value, and (when expanded) available options.

**Example: `hx-select`**

```html
<hx-select label="State" value="CA">
  <option value="">Select a state</option>
  <option value="CA">California</option>
  <option value="NY">New York</option>
  <option value="TX">Texas</option>
</hx-select>
```

**NVDA announcement (on focus)**:

```
State, combo box, California
```

When the user presses <kbd>↓</kbd>:

```
New York, 2 of 4
```

Screen readers announce both the option label and the position within the list.

### Link Announcement Pattern

Links announce their label, role, and (when appropriate) whether they open in a new window.

**Example: Interactive card as link**

```html
<hx-card hx-href="/patient/12345">
  <h3>John Doe</h3>
  <p>MRN: 12345678</p>
</hx-card>
```

**Implementation**:

```typescript
<div
  part="card"
  role="link"
  tabindex="0"
  aria-label="View patient John Doe, MRN 12345678"
>
  <slot></slot>
</div>
```

**NVDA announcement**:

```
View patient John Doe, MRN 12345678, link
```

**Best practice**: When a card contains complex content (headings, multiple text nodes), provide an explicit `aria-label` that summarizes the link's purpose clearly.

## Live Region Announcements

Live regions announce dynamic content changes without moving focus, allowing screen readers to inform users of updates while they continue working.

### `role="alert"` and `aria-live="assertive"`

Use `role="alert"` for critical messages that require immediate attention. Screen readers interrupt the current announcement to read the alert.

**Example: Error message in `hx-text-input`**

```typescript
${hasError
  ? html`<div
      id=${this._errorId}
      role="alert"
      aria-live="polite"
    >
      ${this.error}
    </div>`
  : nothing}
```

**Note**: HELIX uses `aria-live="polite"` even with `role="alert"` to make validation errors less intrusive. The `role="alert"` implicitly sets `aria-live="assertive"`, but explicitly setting `aria-live="polite"` overrides it.

**NVDA announcement (when error appears)**:

```
[immediately after typing]
Please enter a valid email address
```

Screen readers announce the error as soon as it appears in the DOM, without moving focus from the input.

### `role="status"` and `aria-live="polite"`

Use `role="status"` for non-critical status updates. Screen readers announce the message when the user pauses (doesn't interrupt ongoing announcements).

**Example: Success message in `hx-alert`**

```typescript
<div
  role="status"
  aria-live="polite"
  part="alert"
>
  <slot></slot>
</div>
```

```html
<hx-alert variant="success">Your appointment has been scheduled.</hx-alert>
```

**NVDA announcement (when alert appears)**:

```
[waits for user to pause]
Your appointment has been scheduled
```

The announcement happens when the user is idle, not interrupting their current task.

### Dynamic vs. Static Content

**Critical rule**: Only content that changes dynamically should be in a live region. Static content (present on page load) should not use `aria-live` or live region roles.

**Why**: Screen readers track live regions and announce changes when content is inserted, removed, or modified. If a live region is present on page load, screen readers may not announce it at all (no "change" occurred).

**HELIX implementation**: `hx-alert` is typically rendered after page load (in response to user actions), making `role="status"` or `role="alert"` appropriate.

### Announcement Timing

Live region announcements are asynchronous and can be delayed by several factors:

- **Screen reader responsiveness** — JAWS, NVDA, and VoiceOver have different announcement queues
- **Politeness level** — `polite` waits for pauses, `assertive` interrupts immediately
- **Content length** — Long messages may be truncated or queued

**Testing tip**: Use real screen readers to verify announcement timing. Automated tools cannot simulate the asynchronous nature of live region announcements.

## Shadow DOM and Screen Reader Compatibility

Shadow DOM is fully compatible with screen readers because assistive technologies traverse the rendered **accessibility tree**, not the DOM. The accessibility tree flattens shadow boundaries, exposing all content to screen readers.

### ARIA Relationships Across Shadow Boundaries

ARIA attributes that use ID references (`aria-labelledby`, `aria-describedby`, `aria-controls`) **do not work across shadow boundaries** in most browsers.

**Problem**:

```html
<!-- Light DOM -->
<label id="external-label">Username</label>
<hx-text-input aria-labelledby="external-label"></hx-text-input>

<!-- Inside hx-text-input shadow DOM -->
<input aria-labelledby="external-label" />
<!-- ❌ Does not work -->
```

**Solution 1: Keep related elements in the same shadow root**

```typescript
// Inside hx-text-input shadow DOM
<label id="internal-label">${this.label}</label>
<input aria-labelledby="internal-label" /> <!-- ✅ Works -->
```

**Solution 2: Use `aria-label` for cross-boundary labeling**

```html
<hx-text-input aria-label="Username"></hx-text-input>
```

The `aria-label` attribute is set on the custom element and passes through to the internal input.

**HELIX pattern**: All form components accept both `label` (property for internal label) and `aria-label` (attribute for override):

```typescript
@property({ type: String })
label = '';

@property({ type: String, attribute: 'aria-label' })
override ariaLabel: string | null = null;

render() {
  return html`
    <label id=${this._labelId}>${this.label}</label>
    <input
      aria-label=${ifDefined(this.ariaLabel ?? undefined)}
      aria-labelledby=${ifDefined(!this.ariaLabel ? this._labelId : undefined)}
    />
  `;
}
```

If `aria-label` is provided, it takes precedence. Otherwise, `aria-labelledby` references the internal label.

### Slotted Content and Screen Readers

Slotted content lives in the light DOM and is fully accessible to screen readers. ARIA attributes on slotted elements work as expected.

**Example: Custom label via slot**

```html
<hx-text-input>
  <span slot="label">
    <strong>Patient ID</strong>
    <em>(required)</em>
  </span>
</hx-text-input>
```

**Screen reader announcement**: "Patient ID (required), edit"

The slotted label's markup (strong, em) is flattened into text content for the accessibility tree, but the structure provides semantic emphasis.

### Focus Delegation

Shadow DOM supports focus delegation via `delegatesFocus: true`. When the custom element receives focus, it automatically forwards focus to the first focusable element in the shadow tree.

**HELIX usage**: Most form components use focus delegation to ensure the internal `<input>` receives focus:

```typescript
static shadowRootOptions = {
  ...LitElement.shadowRootOptions,
  delegatesFocus: true
};
```

This ensures screen readers announce the correct element (the input, not the wrapper).

## Screen Reader Testing Methodology

Automated tools catch approximately 30% of screen reader issues. Manual testing with real screen readers is essential.

### Testing Priorities

1. **NVDA + Firefox** (Windows) — Most popular free screen reader
2. **JAWS + Chrome** (Windows) — Enterprise standard
3. **VoiceOver + Safari** (macOS) — Apple ecosystem
4. **TalkBack + Chrome** (Android) — Mobile testing

**Minimum viable testing**: NVDA + Firefox. This combination covers the majority of screen reader users and catches most issues.

### NVDA Quick Start (Windows)

**Installation**:

1. Download NVDA from [nvaccess.org](https://www.nvaccess.org/)
2. Run installer (free, no license required)
3. NVDA starts automatically after installation

**Basic commands**:

| Key                       | Action                                           |
| ------------------------- | ------------------------------------------------ |
| <kbd>Ctrl+Alt+N</kbd>     | Toggle NVDA on/off                               |
| <kbd>Insert</kbd>         | NVDA modifier key                                |
| <kbd>Insert+Q</kbd>       | Quit NVDA                                        |
| <kbd>Insert+S</kbd>       | Toggle speech mode (on/off/beep)                 |
| <kbd>Tab</kbd>            | Move to next focusable element                   |
| <kbd>Shift+Tab</kbd>      | Move to previous focusable element               |
| <kbd>↑</kbd> <kbd>↓</kbd> | Navigate by line (browse mode)                   |
| <kbd>H</kbd>              | Jump to next heading                             |
| <kbd>L</kbd>              | Jump to next link                                |
| <kbd>F</kbd>              | Jump to next form field                          |
| <kbd>B</kbd>              | Jump to next button                              |
| <kbd>Insert+F7</kbd>      | List all elements (headings, links, form fields) |

**Testing workflow**:

1. Start NVDA (<kbd>Ctrl+Alt+N</kbd>)
2. Open your application in Firefox
3. Press <kbd>F</kbd> to jump to the first form field
4. Listen to the announcement (label, role, state, description)
5. Interact with the field (type, toggle, select)
6. Verify state changes are announced ("checked", "invalid", etc.)
7. Press <kbd>Tab</kbd> to move to the next field
8. Repeat for all interactive elements

**Common issues to listen for**:

- Missing labels ("edit, blank" with no label)
- Incorrect roles ("clickable" instead of "button")
- Missing states ("edit" but no "required" when required)
- Errors not announced (no `role="alert"`)

### VoiceOver Quick Start (macOS)

**Activation**:

- <kbd>Cmd+F5</kbd> — Toggle VoiceOver on/off
- Or: System Settings → Accessibility → VoiceOver → Enable

**Basic commands**:

| Key                 | Action                                        |
| ------------------- | --------------------------------------------- |
| <kbd>VO+H</kbd>     | VoiceOver help (press <kbd>Esc</kbd> to exit) |
| <kbd>VO</kbd>       | VoiceOver modifier (<kbd>Ctrl+Option</kbd>)   |
| <kbd>VO+→</kbd>     | Move to next element                          |
| <kbd>VO+←</kbd>     | Move to previous element                      |
| <kbd>VO+Space</kbd> | Activate current element                      |
| <kbd>VO+A</kbd>     | Read from current position                    |
| <kbd>Tab</kbd>      | Move to next focusable element                |
| <kbd>VO+Cmd+H</kbd> | Jump to next heading                          |
| <kbd>VO+Cmd+L</kbd> | Jump to next link                             |
| <kbd>VO+Cmd+J</kbd> | Jump to next form control                     |

**Testing workflow**:

1. Enable VoiceOver (<kbd>Cmd+F5</kbd>)
2. Open your application in Safari
3. Navigate to the first form field (<kbd>VO+Cmd+J</kbd>)
4. Listen to the announcement
5. Interact with the field
6. Verify state changes
7. Continue to the next field

**VoiceOver differences**:

- Announces role after label ("Email address, edit" vs. NVDA's "Email address, edit")
- Uses "dimmed" instead of "unavailable" for disabled elements
- May announce "group" for fieldsets differently

### JAWS Quick Start (Windows)

**Commercial license required** ($900-$1900). Available as a 40-minute demo mode (restarts required).

**Basic commands**:

| Key                  | Action                 |
| -------------------- | ---------------------- |
| <kbd>Insert</kbd>    | JAWS modifier key      |
| <kbd>Insert+F4</kbd> | Quit JAWS              |
| <kbd>Insert+Z</kbd>  | Toggle speech on/off   |
| <kbd>Tab</kbd>       | Next focusable element |
| <kbd>H</kbd>         | Next heading           |
| <kbd>F</kbd>         | Next form field        |
| <kbd>Insert+F5</kbd> | List all form fields   |

JAWS is similar to NVDA in functionality but includes additional features like OCR (for reading images) and advanced scripting.

### TalkBack Quick Start (Android)

**Activation**:

1. Settings → Accessibility → TalkBack → Toggle on
2. Follow setup wizard

**Basic gestures**:

- Swipe right — Next element
- Swipe left — Previous element
- Double-tap — Activate element
- Two-finger swipe down — Stop reading
- Three-finger swipe right — Next page

**Testing with TalkBack**: Use Chrome on Android to test mobile-responsive layouts. Touch and swipe gestures differ from desktop keyboard navigation.

### Testing Checklist

For each interactive component, verify:

#### Navigation

- [ ] Can reach the element with <kbd>Tab</kbd> (or VoiceOver equivalent)
- [ ] Tab order matches visual order
- [ ] Focus indicator is visible

#### Announcement Quality

- [ ] Label is announced clearly
- [ ] Role is announced correctly (button, checkbox, edit, etc.)
- [ ] Current value is announced (for inputs, selects, checkboxes)
- [ ] States are announced (required, invalid, disabled, checked)
- [ ] Help text and error messages are announced via `aria-describedby`

#### Interaction

- [ ] Can activate the element with <kbd>Enter</kbd> or <kbd>Space</kbd>
- [ ] State changes are announced immediately ("checked", "expanded", etc.)
- [ ] Error messages appear and are announced via `role="alert"`
- [ ] Success messages are announced via `role="status"`

#### Form Submission

- [ ] Can navigate through entire form with keyboard
- [ ] Can submit form with <kbd>Enter</kbd> on submit button
- [ ] Validation errors are announced and focus moves to first error
- [ ] Success confirmation is announced

## Real-World Examples from HELIX

### Example 1: Form Input with Error

**Component**: `hx-text-input`

```html
<hx-text-input
  label="Patient Medical Record Number"
  value="123"
  required
  error="MRN must be 8 digits"
  help-text="Enter the 8-digit MRN from the patient chart"
>
</hx-text-input>
```

**NVDA announcement on focus**:

```
Patient Medical Record Number
edit, required, invalid
123
MRN must be 8 digits. Enter the 8-digit MRN from the patient chart.
```

**Why it works**:

- `label` provides accessible name via `aria-labelledby`
- `required` adds `aria-required="true"` and is announced
- `error` triggers `aria-invalid="true"` and creates `role="alert"` element
- `help-text` is linked via `aria-describedby`

**Implementation**:

```typescript
const describedBy =
  [hasError ? this._errorId : null, this.helpText ? this._helpTextId : null]
    .filter(Boolean)
    .join(' ') || undefined;

return html`
  <label id=${this._labelId}>${this.label}</label>

  <input
    aria-labelledby=${this._labelId}
    aria-describedby=${ifDefined(describedBy)}
    aria-invalid=${hasError ? 'true' : nothing}
    aria-required=${this.required ? 'true' : nothing}
  />

  ${hasError
    ? html`<div id=${this._errorId} role="alert" aria-live="polite">${this.error}</div>`
    : nothing}
  ${this.helpText ? html`<div id=${this._helpTextId}>${this.helpText}</div>` : nothing}
`;
```

### Example 2: Radio Group with Roving Tabindex

**Component**: `hx-radio-group`

```html
<hx-radio-group label="Appointment type" value="in-person">
  <hx-radio value="in-person">In-person visit</hx-radio>
  <hx-radio value="telehealth">Telehealth video</hx-radio>
  <hx-radio value="phone">Phone call</hx-radio>
</hx-radio-group>
```

**NVDA announcement on initial focus**:

```
Appointment type, grouping
In-person visit, radio button, checked, 1 of 3
```

**NVDA announcement when pressing <kbd>↓</kbd>**:

```
Telehealth video, radio button, not checked, 2 of 3
```

**Why it works**:

- `<fieldset>` + `<legend>` provide group label
- `role="radiogroup"` on host element reinforces grouping
- Roving tabindex ensures only one radio is tabbable
- Arrow keys move focus and announce position ("2 of 3")

**Implementation**:

```typescript
<fieldset part="fieldset">
  ${this.label
    ? html`<legend part="legend">${this.label}</legend>`
    : nothing}
  <div role="none">
    <slot></slot>
  </div>
</fieldset>
```

### Example 3: Alert with Dynamic Content

**Component**: `hx-alert`

```typescript
// Initially not rendered
let alertEl = null;

// After user action
alertEl = document.createElement('hx-alert');
alertEl.variant = 'success';
alertEl.textContent = 'Appointment scheduled for March 15 at 2:00 PM.';
document.body.appendChild(alertEl);
```

**NVDA announcement (when alert appears)**:

```
[pause]
Appointment scheduled for March 15 at 2:00 PM.
```

**Why it works**:

- Success variant uses `role="status"` with `aria-live="polite"`
- Alert is inserted dynamically (not present on page load)
- Screen reader announces when user is idle (polite)

**Implementation**:

```typescript
private get _role(): string {
  return this._isAssertive ? 'alert' : 'status';
}

private get _ariaLive(): string {
  return this._isAssertive ? 'assertive' : 'polite';
}

render() {
  return html`
    <div
      role=${this._role}
      aria-live=${this._ariaLive}
      part="alert"
    >
      <slot></slot>
    </div>
  `;
}
```

### Example 4: Switch with Accessible Label

**Component**: `hx-switch`

```html
<hx-switch checked label="Enable email notifications"></hx-switch>
```

**NVDA announcement**:

```
Enable email notifications, switch, on
```

**NVDA announcement when toggled**:

```
off
```

**Why it works**:

- `role="switch"` identifies the control type
- `aria-checked="true"` conveys the current state
- `aria-labelledby` links to the label

**Implementation**:

```typescript
<button
  role="switch"
  aria-checked=${this.checked ? 'true' : 'false'}
  aria-labelledby=${ifDefined(hasLabel ? this._labelId : undefined)}
>
  <span part="thumb"></span>
</button>
<span id=${this._labelId}>
  <slot>${this.label}</slot>
</span>
```

### Example 5: Select with Options

**Component**: `hx-select`

```html
<hx-select label="State" value="CA">
  <option value="">Select a state</option>
  <option value="CA">California</option>
  <option value="NY">New York</option>
  <option value="TX">Texas</option>
</hx-select>
```

**NVDA announcement on focus**:

```
State, combo box, California
```

**NVDA announcement when opening dropdown**:

```
[after pressing ↓]
New York, 2 of 4
```

**Why it works**:

- Native `<select>` element has built-in screen reader support
- `<option>` elements are announced with position ("2 of 4")
- `label` provides accessible name via `<label>` element

**Implementation**:

```typescript
<label for="select">${this.label}</label>
<select
  id="select"
  aria-labelledby=${this._labelId}
  aria-describedby=${ifDefined(describedBy)}
  aria-invalid=${hasError ? 'true' : nothing}
>
  <slot></slot> <!-- Options cloned into shadow DOM -->
</select>
```

## Common Screen Reader Issues and Fixes

### Issue 1: Missing Label

**Problem**: Screen reader announces "edit, blank" with no label.

**Cause**: No accessible name provided.

**Fix**: Add `label` property or `aria-label` attribute:

```html
<!-- ❌ Bad -->
<hx-text-input></hx-text-input>

<!-- ✅ Good -->
<hx-text-input label="Username"></hx-text-input>
```

### Issue 2: Error Not Announced

**Problem**: Validation error appears visually but screen reader doesn't announce it.

**Cause**: Error message lacks `role="alert"` or `aria-live`.

**Fix**: Ensure error message uses `role="alert"`:

```typescript
${hasError
  ? html`<div role="alert" aria-live="polite">
      ${this.error}
    </div>`
  : nothing}
```

### Issue 3: State Change Not Announced

**Problem**: User toggles a checkbox, but screen reader doesn't announce "checked" or "unchecked".

**Cause**: State attribute (`aria-checked`, `aria-pressed`, `aria-expanded`) not updated.

**Fix**: Ensure state attributes are reactive:

```typescript
<button
  role="switch"
  aria-checked=${this.checked ? 'true' : 'false'}
>
```

### Issue 4: Description Not Announced

**Problem**: Help text visible but not announced when input receives focus.

**Cause**: Help text not linked via `aria-describedby`.

**Fix**: Link help text to input:

```typescript
<input aria-describedby=${this._helpTextId} />
<div id=${this._helpTextId}>${this.helpText}</div>
```

### Issue 5: Focus Order Incorrect

**Problem**: Tab order doesn't match visual order (jumps around unexpectedly).

**Cause**: DOM order doesn't match visual order, or positive `tabindex` values used.

**Fix**: Ensure DOM order matches visual order and avoid positive `tabindex`:

```html
<!-- ❌ Bad: positive tabindex -->
<button tabindex="3">Third</button>
<button tabindex="1">First</button>
<button tabindex="2">Second</button>

<!-- ✅ Good: natural order -->
<button>First</button>
<button>Second</button>
<button>Third</button>
```

### Issue 6: Custom Control Not Recognized

**Problem**: Screen reader announces "clickable" instead of "button".

**Cause**: Missing ARIA role.

**Fix**: Use native HTML elements or add explicit role:

```html
<!-- ❌ Bad: div as button -->
<div @click="${this.handleClick}">Submit</div>

<!-- ✅ Good: native button -->
<button @click="${this.handleClick}">Submit</button>

<!-- ✅ Acceptable: custom element with role -->
<div role="button" tabindex="0" @click="${this.handleClick}">Submit</div>
```

## Best Practices

### Do's

- **Use native HTML elements** (`<button>`, `<input>`, `<select>`) — they have built-in screen reader support
- **Provide labels for all form fields** — via `label` property or `aria-label`
- **Link help text and errors** — via `aria-describedby`
- **Use `role="alert"` for errors** — ensures immediate announcement
- **Test with real screen readers** — automated tools miss 70% of issues
- **Keep related elements in same shadow root** — for `aria-labelledby` to work
- **Announce state changes** — use reactive ARIA attributes

### Don'ts

- **Don't rely on placeholders as labels** — they disappear and fail WCAG
- **Don't use empty `aria-label=""` ** — removes accessible name entirely
- **Don't forget `aria-invalid`** — critical for announcing error states
- **Don't use positive `tabindex` values** — creates unpredictable tab order
- **Don't assume automated tests are sufficient** — manual screen reader testing is essential
- **Don't create custom controls without ARIA** — use native elements whenever possible
- **Don't forget to announce loading states** — use `aria-live` for async content

## Healthcare-Specific Considerations

### Clinical Workflows

Screen reader users in clinical settings need fast, accurate access to patient data. Consider:

- **Verbose labels** — "MRN" is ambiguous; "Patient Medical Record Number" is clear
- **Data format announcements** — Screen readers may announce "12 slash 15 slash 2025" for dates
- **Abbreviated terms** — Screen readers may not expand abbreviations ("BP" as "B P" not "blood pressure")

**Recommendation**: Provide `aria-label` with expanded terms when using abbreviations:

```html
<hx-text-input
  label="BP"
  aria-label="Blood pressure"
  help-text="Enter systolic/diastolic (e.g., 120/80)"
>
</hx-text-input>
```

### HIPAA Compliance

Screen readers do not pose HIPAA risks (they read only what's on screen), but consider:

- **Audio privacy** — Screen reader audio may be audible to others in shared spaces
- **Session timeouts** — Ensure timeout warnings are announced via `role="alert"`
- **Data entry errors** — Critical errors (e.g., incorrect medication dose) must be announced assertively

### Recommendations

1. **Hire users with disabilities** — Healthcare organizations must ensure their accessibility testing includes actual users with disabilities
2. **Document screen reader support** — Provide a "Screen Reader Guide" in your application's help documentation
3. **Train staff** — Educate developers, QA testers, and product managers on screen reader testing
4. **Test early and often** — Screen reader testing should happen during development, not just before release

## Summary

Screen reader support is a critical component of accessible healthcare applications. Every interactive element must have a clear accessible name, announce its role and state, and respond predictably to keyboard interactions. The HELIX component library achieves screen reader compatibility through:

- **Native HTML elements** with built-in semantics
- **ARIA attributes** that augment native functionality (`aria-invalid`, `aria-describedby`, `aria-required`)
- **Live regions** that announce dynamic content changes (`role="alert"`, `role="status"`)
- **Shadow DOM patterns** that work with assistive technologies
- **Manual testing** with NVDA, JAWS, and VoiceOver

By following the patterns demonstrated in HELIX components and testing with real screen readers, you can build healthcare applications that serve all users equitably and meet WCAG 2.1 AA requirements.

## References

- [Providing Accessible Names and Descriptions | APG | WAI | W3C](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
- [Understanding WCAG 2.1 | WAI | W3C](https://www.w3.org/WAI/WCAG21/Understanding/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [WebAIM: Using NVDA to Evaluate Web Accessibility](https://webaim.org/articles/nvda/)
- [WebAIM: Using VoiceOver to Evaluate Web Accessibility](https://webaim.org/articles/voiceover/)
- [Accessibility and the Shadow DOM - MarcySutton.com](https://marcysutton.com/accessibility-and-the-shadow-dom/)
- [Shadow DOM and accessibility: the trouble with ARIA | Read the Tea Leaves](https://nolanlawson.com/2022/11/28/shadow-dom-and-accessibility-the-trouble-with-aria/)
- [The Guide to Accessible Web Components | Erik Kroes](https://www.erikkroes.nl/blog/accessibility/the-guide-to-accessible-web-components-draft/)

---

**Next steps**: Review the [ARIA Patterns](/components/accessibility/aria) guide for detailed implementation patterns, and see [Keyboard Navigation](/components/accessibility/keyboard) for comprehensive keyboard accessibility guidance.

**Sources**:

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
- [Providing Accessible Names and Descriptions | APG | WAI | W3C](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/)
- [WCAG 2 Overview | Web Accessibility Initiative (WAI) | W3C](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Understanding WCAG 2.1 | WAI | W3C](https://www.w3.org/WAI/WCAG21/Understanding/)
