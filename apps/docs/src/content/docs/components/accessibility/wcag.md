---
title: WCAG 2.1 AA Compliance
description: Comprehensive guide to WCAG 2.1 Level AA compliance for healthcare web components. Covers the four POUR principles, success criteria, healthcare mandate requirements, testing methodology, and compliance checklist for hx-library components.
sidebar:
  order: 1
---

# WCAG 2.1 AA Compliance

The Web Content Accessibility Guidelines (WCAG) 2.1 represent the international standard for web accessibility, and Level AA compliance is a legal requirement for healthcare organizations receiving federal funding. This guide provides comprehensive coverage of WCAG 2.1 AA requirements, healthcare-specific mandates, and how the hx-library component system ensures compliance.

## Healthcare Accessibility Mandate

On April 24, 2024, the U.S. Department of Health and Human Services (HHS) published a final rule under Section 504 of the Rehabilitation Act requiring healthcare providers to make their digital content accessible to people with disabilities. This rule mandates **WCAG 2.1 Level AA** as the technical standard for compliance.

### Compliance Deadlines

The enforcement timeline varies by organization size:

- **May 11, 2026** — Organizations with 15 or more employees must be compliant (State/county entities under Title II must comply by April 26, 2026)
- **May 10, 2027** — Organizations with fewer than 15 employees must be compliant

As of February 2026, the May 2026 deadline is rapidly approaching. Organizations that haven't begun compliance work face significant risk of investigations, corrective action requirements, and potential loss of federal funding including Medicare and Medicaid reimbursements.

### Covered Entities

The mandate applies to any organization that receives federal financial assistance from HHS, including:

- Hospitals and hospital systems
- Outpatient clinics and medical practices
- Mental health and substance abuse treatment facilities
- Health insurance providers
- Telehealth and telemedicine platforms
- Pharmacies and medical equipment suppliers
- Any entity participating in Medicare, Medicaid, or CHIP programs

### Enforcement Consequences

Failure to comply can result in:

- HHS Office for Civil Rights (OCR) investigations
- Mandatory corrective action plans
- Suspension or termination of federal funding (including Medicare and Medicaid reimbursements)
- Legal liability under Section 504 of the Rehabilitation Act

For healthcare organizations, this is not optional — WCAG 2.1 AA compliance is a **zero-tolerance requirement** where failures can directly impact patient care and organizational viability.

## WCAG 2.1 Overview

WCAG 2.1 is organized around four foundational principles known by the acronym **POUR**. Under these principles are 13 guidelines, and under those guidelines are testable success criteria at three conformance levels: A (minimum), AA (mid-range), and AAA (highest).

### Conformance Levels

- **Level A** — Essential accessibility features. Sites that fail Level A are fundamentally unusable for people with disabilities.
- **Level AA** — Deals with the biggest and most common barriers for disabled users. This is the **healthcare mandate standard** and the target for hx-library.
- **Level AAA** — The highest and most complex level of accessibility. Not required for healthcare compliance but may be achieved for specific criteria.

WCAG 2.1 Level AA includes all Level A success criteria plus additional AA criteria — a total of **50 success criteria** must be met for full AA compliance.

## The Four Principles (POUR)

### 1. Perceivable

Information and user interface components must be presentable to users in ways they can perceive. This means users must be able to perceive the information being presented — it cannot be invisible to all of their senses.

**Key concept:** If a user cannot perceive content, it does not exist for them.

### 2. Operable

User interface components and navigation must be operable. This means users must be able to operate the interface — the interface cannot require interaction that a user cannot perform.

**Key concept:** If a user cannot interact with a control, they cannot use the application.

### 3. Understandable

Information and the operation of the user interface must be understandable. This means users must be able to understand both the information and the operation of the user interface.

**Key concept:** Complexity, inconsistency, and unpredictability create barriers.

### 4. Robust

Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies. This means the content must work with current and future tools.

**Key concept:** Valid, semantic HTML and proper ARIA usage ensure compatibility with assistive technology.

## Perceivable Guidelines

### 1.1 Text Alternatives

**Guideline:** Provide text alternatives for any non-text content so that it can be changed into other forms people need, such as large print, braille, speech, symbols, or simpler language.

#### Success Criteria

**1.1.1 Non-text Content (Level A)**

All non-text content that is presented to the user has a text alternative that serves the equivalent purpose, except in specific situations (tests, CAPTCHA, decoration, etc.).

**Implementation in hx-library:**

```html
<!-- Decorative images use empty alt -->
<img src="decorative-pattern.svg" alt="" role="presentation" />

<!-- Functional images have descriptive alt text -->
<hx-button>
  <img src="download.svg" alt="Download report" />
</hx-button>

<!-- Icon-only buttons use aria-label -->
<hx-button aria-label="Close dialog">
  <hx-icon name="close"></hx-icon>
</hx-button>
```

### 1.2 Time-based Media

**Guideline:** Provide alternatives for time-based media (audio and video).

This guideline primarily applies to multimedia content. For component libraries, the relevant consideration is ensuring that any video or audio content integrated into components has captions, transcripts, or audio descriptions.

**hx-library approach:** Components that embed media must expose properties for caption tracks and alternative content.

### 1.3 Adaptable

**Guideline:** Create content that can be presented in different ways without losing information or structure.

#### Success Criteria

**1.3.1 Info and Relationships (Level A)**

Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.

**Implementation in hx-library:**

```typescript
// Form inputs expose label relationships
<hx-text-input
  label="Email address"
  helper-text="We'll never share your email"
  error="Please enter a valid email address">
</hx-text-input>

// Lists use semantic list markup internally
<hx-navigation>
  <ul role="list">
    <li><a href="/home">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</hx-navigation>
```

**1.3.2 Meaningful Sequence (Level A)**

When the sequence in which content is presented affects its meaning, a correct reading sequence can be programmatically determined.

**Implementation:** Ensure DOM order matches visual order. Use CSS for layout, not to reorder content in ways that break logical reading flow.

**1.3.3 Sensory Characteristics (Level A)**

Instructions provided for understanding and operating content do not rely solely on sensory characteristics like shape, size, visual location, orientation, or sound.

**Example:**

- **Bad:** "Click the green button on the right"
- **Good:** "Click the Submit button (green, located in the bottom right)"

**1.3.4 Orientation (Level AA, WCAG 2.1 addition)**

Content does not restrict its view and operation to a single display orientation (portrait or landscape) unless a specific orientation is essential.

**Implementation:** Components must be responsive and functional in both portrait and landscape orientations.

**1.3.5 Identify Input Purpose (Level AA, WCAG 2.1 addition)**

The purpose of each input field collecting information about the user can be programmatically determined when the input serves a purpose from the [Input Purposes for User Interface Components](https://www.w3.org/TR/WCAG21/#input-purposes) list.

**Implementation in hx-library:**

```html
<hx-text-input label="Email" name="email" autocomplete="email" type="email"> </hx-text-input>

<hx-text-input label="Phone" name="phone" autocomplete="tel" type="tel"> </hx-text-input>
```

### 1.4 Distinguishable

**Guideline:** Make it easier for users to see and hear content, including separating foreground from background.

#### Success Criteria

**1.4.1 Use of Color (Level A)**

Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.

**Implementation in hx-library:**

```typescript
// Error states use color + icon + aria-invalid
<hx-text-input
  error="Email is required"
  aria-invalid="true">
  <hx-icon name="alert-circle" slot="prefix"></hx-icon>
</hx-text-input>

// Required fields use asterisk + aria-required
<hx-text-input
  label="Name *"
  required
  aria-required="true">
</hx-text-input>
```

**1.4.2 Audio Control (Level A)**

If any audio on a page plays automatically for more than 3 seconds, provide a mechanism to pause, stop, or control volume.

**hx-library approach:** Components that play audio must include pause/stop controls.

**1.4.3 Contrast (Minimum) (Level AA)**

Text and images of text have a contrast ratio of at least:

- **4.5:1** for normal text (less than 18pt, or 14pt bold)
- **3:1** for large text (18pt and larger, or 14pt bold and larger)

**Implementation in hx-library:**

```css
/* Design tokens ensure compliant contrast ratios */
:root {
  --hx-color-text: #1a1a1a; /* 15.4:1 on white */
  --hx-color-text-secondary: #4a4a4a; /* 9.7:1 on white */
  --hx-color-primary: #0066cc; /* 4.58:1 on white */
  --hx-color-error: #d32f2f; /* 5.5:1 on white */
}
```

All color tokens are tested with automated contrast checkers and validated against WCAG AA requirements.

**1.4.4 Resize Text (Level AA)**

Text can be resized up to 200% without loss of content or functionality, except for captions and images of text.

**Implementation:** Components use relative units (`rem`, `em`, `%`) rather than fixed pixel values:

```css
:host {
  font-size: 1rem; /* Not 16px */
  padding: var(--hx-spacing-md); /* Not 16px */
  line-height: 1.5; /* Unitless for scalability */
}
```

**1.4.5 Images of Text (Level AA)**

Images of text are only used for decoration or where a particular presentation is essential (logos, branding).

**Implementation:** Use web fonts and styled text instead of images of text whenever possible.

**1.4.10 Reflow (Level AA, WCAG 2.1 addition)**

Content can be presented without loss of information or functionality and without requiring scrolling in two dimensions for:

- Vertical scrolling content at 320px width
- Horizontal scrolling content at 256px height

**Implementation:** Components are responsive and reflow at narrow widths:

```css
:host {
  display: block;
  max-width: 100%;
  overflow-wrap: break-word;
}
```

**1.4.11 Non-text Contrast (Level AA, WCAG 2.1 addition)**

Visual presentation of user interface components and graphical objects have a contrast ratio of at least **3:1** against adjacent colors.

**Implementation in hx-library:**

```css
/* Focus indicators meet 3:1 contrast */
:host(:focus-visible) {
  outline: 2px solid var(--hx-focus-ring-color); /* 4.5:1 */
  outline-offset: 2px;
}

/* Form control borders meet 3:1 contrast */
.input {
  border: 1px solid var(--hx-color-border); /* 3.2:1 */
}
```

**1.4.12 Text Spacing (Level AA, WCAG 2.1 addition)**

No loss of content or functionality occurs when users apply the following text spacing changes:

- Line height at least 1.5× the font size
- Paragraph spacing at least 2× the font size
- Letter spacing at least 0.12× the font size
- Word spacing at least 0.16× the font size

**Implementation:** Components must not break when users override spacing via browser extensions or custom stylesheets.

**1.4.13 Content on Hover or Focus (Level AA, WCAG 2.1 addition)**

When additional content appears on hover or focus (tooltips, submenus), it must be:

- **Dismissible** — without moving pointer or focus
- **Hoverable** — pointer can move over the additional content
- **Persistent** — remains visible until dismissed or no longer relevant

**Implementation in hx-library:**

```typescript
// Tooltips can be dismissed with Escape key
<hx-tooltip dismissable>
  Tooltip content here
</hx-tooltip>

// Pointer can hover over tooltip content
<hx-tooltip hoverable>
  <a href="/learn-more">Learn more</a>
</hx-tooltip>
```

## Operable Guidelines

### 2.1 Keyboard Accessible

**Guideline:** Make all functionality available from a keyboard.

#### Success Criteria

**2.1.1 Keyboard (Level A)**

All functionality is operable through a keyboard interface without requiring specific timings for individual keystrokes, except where the underlying function requires input that depends on the path of movement (e.g., freehand drawing).

**Implementation in hx-library:**

```typescript
// All interactive components are keyboard accessible
<hx-button @click="${this.handleClick}" @keydown="${this.handleKeydown}">
  Submit
</hx-button>

// Custom interactive elements support Enter and Space
private handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    this.handleClick();
  }
}
```

**2.1.2 No Keyboard Trap (Level A)**

If keyboard focus can be moved to a component, focus can be moved away from that component using only the keyboard. If it requires more than unmodified arrow or tab keys, the user is advised of the method.

**Implementation:** Modal dialogs and focus traps must allow Escape key to exit.

**2.1.4 Character Key Shortcuts (Level A, WCAG 2.1 addition)**

If a keyboard shortcut uses only character keys (letters, punctuation, numbers, symbols), then at least one of the following is true:

- It can be turned off
- It can be remapped
- It is only active when the component has focus

**Implementation:** Avoid single-key shortcuts unless they're scoped to focused components.

### 2.2 Enough Time

**Guideline:** Provide users enough time to read and use content.

#### Success Criteria

**2.2.1 Timing Adjustable (Level A)**

For each time limit set by the content, users can turn it off, adjust it, or extend it (except for real-time events, auctions, or limits over 20 hours).

**2.2.2 Pause, Stop, Hide (Level A)**

For moving, blinking, scrolling, or auto-updating information, users can pause, stop, or hide it if it starts automatically, lasts more than 5 seconds, and is presented alongside other content.

**Implementation in hx-library:**

```typescript
// Carousels must have pause/play controls
<hx-carousel autoplay pausable>
  <hx-carousel-item>Slide 1</hx-carousel-item>
  <hx-carousel-item>Slide 2</hx-carousel-item>
</hx-carousel>
```

### 2.3 Seizures and Physical Reactions

**Guideline:** Do not design content in a way that is known to cause seizures or physical reactions.

#### Success Criteria

**2.3.1 Three Flashes or Below Threshold (Level A)**

Pages do not contain anything that flashes more than three times in any one-second period, or the flash is below the general flash and red flash thresholds.

**Implementation:** Animations must respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2.4 Navigable

**Guideline:** Provide ways to help users navigate, find content, and determine where they are.

#### Success Criteria

**2.4.1 Bypass Blocks (Level A)**

A mechanism is available to bypass blocks of content that are repeated on multiple pages (skip links).

**2.4.2 Page Titled (Level A)**

Web pages have titles that describe topic or purpose.

**2.4.3 Focus Order (Level A)**

If a page can be navigated sequentially and the navigation sequences affect meaning or operation, focusable components receive focus in an order that preserves meaning and operability.

**Implementation in hx-library:**

```typescript
// DOM order matches visual order
<hx-dialog>
  <h2 slot="header">Dialog Title</h2>
  <div slot="body">Dialog content</div>
  <div slot="footer">
    <hx-button variant="secondary">Cancel</hx-button>
    <hx-button variant="primary">Confirm</hx-button>
  </div>
</hx-dialog>
```

**2.4.4 Link Purpose (In Context) (Level A)**

The purpose of each link can be determined from the link text alone or from the link text together with its programmatically determined context.

**2.4.5 Multiple Ways (Level AA)**

More than one way is available to locate a page within a set of pages (search, site map, table of contents, navigation menu).

**2.4.6 Headings and Labels (Level AA)**

Headings and labels describe topic or purpose.

**Implementation in hx-library:**

```typescript
// Form controls have descriptive labels
<hx-text-input
  label="Patient Medical Record Number"
  helper-text="Enter the 8-digit MRN from the patient chart">
</hx-text-input>
```

**2.4.7 Focus Visible (Level AA)**

Any keyboard operable interface has a mode of operation where the keyboard focus indicator is visible.

**Implementation in hx-library:**

```css
:host(:focus-visible) {
  outline: 2px solid var(--hx-focus-ring-color);
  outline-offset: var(--hx-focus-ring-offset);
  border-radius: var(--hx-focus-ring-radius);
}
```

### 2.5 Input Modalities

**Guideline:** Make it easier for users to operate functionality through various inputs beyond keyboard (WCAG 2.1 additions).

#### Success Criteria

**2.5.1 Pointer Gestures (Level A, WCAG 2.1 addition)**

All functionality that uses multipoint or path-based gestures can be operated with a single pointer without a path-based gesture, unless a multipoint or path-based gesture is essential.

**2.5.2 Pointer Cancellation (Level A, WCAG 2.1 addition)**

For functionality operated using a single pointer, at least one of the following is true:

- No down-event triggers action
- Action triggered on up-event with ability to abort
- Up-event reverses any down-event action
- Completing action on down-event is essential

**Implementation:** Use `click` events (fires on up-event) rather than `mousedown` or `touchstart` for most actions.

**2.5.3 Label in Name (Level A, WCAG 2.1 addition)**

For components with labels that include text or images of text, the accessible name contains the text that is presented visually.

**Implementation in hx-library:**

```html
<!-- Visual label matches accessible name -->
<hx-button aria-label="Submit form">Submit</hx-button>

<!-- Not: aria-label="Send" when visual text is "Submit" -->
```

**2.5.4 Motion Actuation (Level A, WCAG 2.1 addition)**

Functionality that can be operated by device motion or user motion can also be operated by user interface components, and responding to motion can be disabled.

## Understandable Guidelines

### 3.1 Readable

**Guideline:** Make text content readable and understandable.

#### Success Criteria

**3.1.1 Language of Page (Level A)**

The default human language of each page can be programmatically determined.

**Implementation:** Set `lang` attribute on `<html>` element.

**3.1.2 Language of Parts (Level AA)**

The human language of each passage or phrase in the content can be programmatically determined except for proper names, technical terms, or words of indeterminate language.

**Implementation:**

```html
<p>The patient was diagnosed with <span lang="la">Streptococcus pneumoniae</span></p>
```

### 3.2 Predictable

**Guideline:** Make web pages appear and operate in predictable ways.

#### Success Criteria

**3.2.1 On Focus (Level A)**

When any component receives focus, it does not initiate a change of context (e.g., opening a dialog, navigating away).

**3.2.2 On Input (Level A)**

Changing the setting of any component does not automatically cause a change of context unless the user has been advised beforehand.

**Implementation in hx-library:**

```typescript
// Select doesn't auto-submit form on change
<hx-select
  label="Country"
  @hx-change="${this.handleChange}">
  <!-- User must explicitly click Submit -->
</hx-select>
```

**3.2.3 Consistent Navigation (Level AA)**

Navigational mechanisms that are repeated on multiple pages occur in the same relative order each time, unless a change is initiated by the user.

**3.2.4 Consistent Identification (Level AA)**

Components that have the same functionality within a set of pages are identified consistently.

**Implementation:** Icons and labels for common actions (save, delete, close) are consistent across all components.

### 3.3 Input Assistance

**Guideline:** Help users avoid and correct mistakes.

#### Success Criteria

**3.3.1 Error Identification (Level A)**

If an input error is automatically detected, the item in error is identified and the error is described to the user in text.

**Implementation in hx-library:**

```typescript
<hx-text-input
  label="Email"
  value="${this.email}"
  error="${this.emailError}"
  aria-invalid="${this.emailError ? 'true' : 'false'}">
</hx-text-input>

<div role="alert" aria-live="polite" ?hidden="${!this.emailError}">
  ${this.emailError}
</div>
```

**3.3.2 Labels or Instructions (Level A)**

Labels or instructions are provided when content requires user input.

**3.3.3 Error Suggestion (Level AA)**

If an input error is automatically detected and suggestions for correction are known, the suggestions are provided to the user, unless it would jeopardize security or purpose.

**Implementation:**

```typescript
// Provide helpful error messages
error = this.validateEmail() ? '' : 'Please enter a valid email address (e.g., name@example.com)';
```

**3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)**

For pages that cause legal commitments or financial transactions, or modify/delete user-controllable data, at least one of the following is true:

- Submissions are reversible
- Data is checked and user can correct errors
- Confirmation mechanism is available

**Implementation in hx-library:**

```typescript
// Confirmation dialogs for destructive actions
<hx-dialog
  heading="Delete Patient Record?"
  confirm-text="Delete"
  cancel-text="Cancel"
  @hx-confirm="${this.handleDelete}">
  <p>This action cannot be undone. Are you sure?</p>
</hx-dialog>
```

## Robust Guidelines

### 4.1 Compatible

**Guideline:** Maximize compatibility with current and future user agents, including assistive technologies.

#### Success Criteria

**4.1.1 Parsing (Level A)**

In content implemented using markup languages, elements have complete start and end tags, are nested according to specifications, do not contain duplicate attributes, and IDs are unique.

**Note:** This criterion was marked obsolete in WCAG 2.2, but remains relevant for WCAG 2.1 compliance. Modern browsers and build tools handle this automatically.

**4.1.2 Name, Role, Value (Level A)**

For all user interface components, the name and role can be programmatically determined; states, properties, and values can be set programmatically; and notification of changes is available to user agents, including assistive technologies.

**Implementation in hx-library:**

```typescript
// Native elements provide role automatically
<button
  part="button"
  aria-disabled="${this.disabled ? 'true' : nothing}"
  aria-pressed="${this.pressed ? 'true' : nothing}">
  <slot></slot>
</button>

// Custom interactive elements need explicit roles
<div
  role="button"
  tabindex="0"
  aria-label="Toggle menu"
  @click="${this.handleClick}"
  @keydown="${this.handleKeydown}">
</div>
```

**4.1.3 Status Messages (Level AA, WCAG 2.1 addition)**

Status messages can be programmatically determined through role or properties such that they can be presented to the user by assistive technologies without receiving focus.

**Implementation in hx-library:**

```typescript
// Success messages use role="status"
<div role="status" aria-live="polite" ?hidden="${!this.successMessage}">
  ${this.successMessage}
</div>

// Error messages use role="alert"
<div role="alert" aria-live="assertive" ?hidden="${!this.errorMessage}">
  ${this.errorMessage}
</div>

// Progress indicators use aria-live
<div role="progressbar" aria-live="polite" aria-valuenow="${this.progress}">
  ${this.progress}% complete
</div>
```

## Shadow DOM and WCAG Compliance

Web components using Shadow DOM present unique accessibility challenges that require careful implementation.

### Cross-Root ARIA Relationships

ARIA attributes that reference element IDs (`aria-labelledby`, `aria-describedby`, `aria-controls`) do not work across shadow boundaries in current browsers.

**Problem:**

```html
<!-- This does NOT work -->
<label for="input-1">Email</label>
<hx-text-input id="input-1"></hx-text-input>
```

**Solution 1: Keep related elements in same shadow root**

```typescript
// Inside hx-text-input shadow DOM
<label for="input" part="label">${this.label}</label>
<input id="input" part="input" aria-describedby="helper" />
<div id="helper" part="helper">${this.helperText}</div>
```

**Solution 2: Use aria-label for cross-boundary labeling**

```html
<hx-text-input label="Email" helper-text="We'll never share your email"> </hx-text-input>
```

### Focus Management

Shadow DOM requires explicit focus delegation:

```typescript
static shadowRootOptions = {
  ...LitElement.shadowRootOptions,
  delegatesFocus: true
};
```

This ensures that when the host element receives focus, it's automatically delegated to the first focusable element in the shadow tree.

### Screen Reader Testing

Shadow DOM content is fully accessible to screen readers because assistive technologies traverse the rendered accessibility tree, which includes shadow roots. However, comprehensive testing across multiple browser and screen reader combinations is critical.

#### Browser and Assistive Technology Compatibility Matrix

| Platform    | Screen Reader | Browser | Support Level | Notes                                      |
| ----------- | ------------- | ------- | ------------- | ------------------------------------------ |
| **Windows** | NVDA (free)   | Firefox | Excellent     | Primary testing combination for hx-library |
| Windows     | NVDA          | Chrome  | Excellent     | Secondary testing target                   |
| Windows     | JAWS (paid)   | Chrome  | Excellent     | Most common enterprise screen reader       |
| Windows     | JAWS          | Edge    | Excellent     | Microsoft enterprise stack                 |
| Windows     | Narrator      | Edge    | Good          | Built-in Windows screen reader             |
| **macOS**   | VoiceOver     | Safari  | Excellent     | Primary macOS testing combination          |
| macOS       | VoiceOver     | Chrome  | Good          | Secondary testing target                   |
| **iOS**     | VoiceOver     | Safari  | Excellent     | Mobile testing required                    |
| **Android** | TalkBack      | Chrome  | Excellent     | Mobile testing required                    |

**Testing Priority for hx-library:**

1. NVDA + Firefox (Windows) — Primary
2. VoiceOver + Safari (macOS) — Primary
3. JAWS + Chrome (Windows) — Secondary
4. VoiceOver + Safari (iOS) — Mobile
5. TalkBack + Chrome (Android) — Mobile

## Testing Methodology

### Automated Testing

Automated tools can catch approximately 30-40% of WCAG issues. While this leaves 60-70% that requires manual testing, automated testing provides a critical first line of defense and enables continuous integration testing.

**Limitations of Automated Testing:**

- Cannot evaluate subjective criteria (e.g., link text is descriptive)
- Cannot test keyboard navigation workflows
- Cannot verify screen reader announcements
- Cannot assess color contrast in all contexts (gradients, images)
- Cannot evaluate cognitive load or reading level

The hx-library uses a multi-tool approach for automated testing:

#### axe-core via Storybook a11y Addon

```typescript
// apps/storybook/.storybook/preview.ts
import { withA11y } from '@storybook/addon-a11y';

export const decorators = [withA11y];

export const parameters = {
  a11y: {
    // axe-core configuration
    config: {
      rules: [
        {
          // Shadow DOM support requires explicit configuration
          id: 'color-contrast',
          enabled: true,
        },
      ],
    },
    options: {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    },
  },
};
```

The Storybook a11y addon provides real-time accessibility feedback during component development. Every story is automatically scanned for violations.

#### Vitest Integration with axe-core

```typescript
// packages/hx-library/src/components/hx-button/hx-button.test.ts
import { expect, test } from 'vitest';
import { fixture } from '../../test-utils.js';
import { axe } from 'axe-core';
import './hx-button.js';

test('should pass automated accessibility audit', async () => {
  const el = await fixture(html` <hx-button>Click me</hx-button> `);

  const results = await axe.run(el);
  expect(results.violations).toHaveLength(0);
});
```

#### CI/CD Integration

The hx-library includes accessibility testing in the continuous integration pipeline:

```yaml
# .github/workflows/ci.yml
- name: Run accessibility tests
  run: npm run test:a11y

- name: Generate accessibility report
  run: npm run test:a11y:report

- name: Upload accessibility report
  uses: actions/upload-artifact@v4
  with:
    name: a11y-report
    path: reports/accessibility/
```

#### Lighthouse CI

```bash
# Run Lighthouse accessibility audit
npm run audit

# Output includes:
# - Accessibility score (0-100)
# - Specific WCAG violations
# - Best practices recommendations
# - Performance impact of a11y features
```

### Manual Testing

Manual testing is essential for the remaining 60-70% of WCAG criteria. The testing checklist includes:

#### Keyboard Testing

1. Tab through all interactive elements
2. Verify focus order is logical
3. Verify focus indicators are visible
4. Test keyboard shortcuts (Enter, Space, Escape, Arrow keys)
5. Verify no keyboard traps

#### Screen Reader Testing

1. Navigate through content with screen reader
2. Verify all content is announced
3. Verify form labels and error messages
4. Verify dynamic content updates are announced
5. Verify ARIA roles and states

#### Visual Testing

1. Verify color contrast ratios (4.5:1 for text, 3:1 for UI)
2. Test with browser zoom at 200%
3. Test in high contrast mode (Windows High Contrast Mode)
4. Verify content reflows at 320px width
5. Test with custom text spacing

#### Motion Testing

1. Enable `prefers-reduced-motion`
2. Verify animations are reduced or removed
3. Verify no flashing content

## Healthcare-Specific Accessibility Considerations

Healthcare applications have unique accessibility requirements that go beyond general WCAG compliance. Patient safety, medical terminology, and complex workflows require additional attention.

### Medical Terminology and Plain Language

**Challenge:** Healthcare interfaces often use complex medical terminology that may be difficult for patients to understand, particularly those with cognitive disabilities or limited health literacy.

**Solution:**

```typescript
// Provide plain language alternatives
<hx-text-input
  label="Chief Complaint"
  helper-text="Briefly describe why you're seeking care today">
</hx-text-input>

// Not just:
<hx-text-input label="Chief Complaint"></hx-text-input>
```

### Time-Sensitive Actions

**Challenge:** Healthcare workflows often involve time-sensitive actions (medication orders, emergency alerts) that must be accessible under pressure.

**Solution:**

```typescript
// High-priority alerts use assertive aria-live
<hx-alert
  variant="critical"
  role="alert"
  aria-live="assertive"
  aria-atomic="true">
  <hx-icon name="alert-triangle" aria-hidden="true"></hx-icon>
  <strong>Critical Lab Result:</strong> Potassium level 6.2 mEq/L requires immediate attention.
</hx-alert>
```

### Patient Privacy in Shared Spaces

**Challenge:** Patients may access healthcare portals in shared or public spaces. Screen reader announcements could expose private health information.

**Solution:**

```typescript
// Provide privacy mode option
<hx-text-input
  type="password"
  label="Medical Record Number"
  privacy-mode="${this.privacyEnabled}"
  aria-label="${this.privacyEnabled ? 'Medical Record Number (hidden for privacy)' : 'Medical Record Number'}">
</hx-text-input>
```

### Multi-Step Forms for Complex Workflows

**Challenge:** Healthcare forms (intake, insurance, consent) are often long and complex. Users with cognitive disabilities need clear progress indicators.

**Solution:**

```typescript
// Progress indicator with semantic markup
<hx-progress-stepper
  current-step="2"
  total-steps="5"
  aria-label="Patient registration progress">
  <hx-step completed>Personal Information</hx-step>
  <hx-step current aria-current="step">Insurance Details</hx-step>
  <hx-step>Medical History</hx-step>
  <hx-step>Emergency Contact</hx-step>
  <hx-step>Review and Submit</hx-step>
</hx-progress-stepper>

<!-- Screen reader announcement -->
<div role="status" aria-live="polite" aria-atomic="true">
  Step 2 of 5: Insurance Details
</div>
```

### Medication Lists and Dosage Information

**Challenge:** Medication information must be clearly labeled and announced to prevent medication errors.

**Solution:**

```typescript
// Structured medication information
<hx-card role="article" aria-labelledby="med-1-name">
  <h3 id="med-1-name">Metformin</h3>
  <dl>
    <dt>Dosage:</dt>
    <dd>500mg</dd>
    <dt>Frequency:</dt>
    <dd>Twice daily with meals</dd>
    <dt>Prescribing physician:</dt>
    <dd>Dr. Jane Smith</dd>
  </dl>
</hx-card>
```

### Appointment Scheduling with Date/Time Pickers

**Challenge:** Date and time selection must be keyboard accessible and clearly announced.

**Solution:**

```typescript
<hx-date-picker
  label="Preferred appointment date"
  helper-text="Select a date within the next 30 days"
  min="${this.today}"
  max="${this.thirtyDaysFromNow}"
  format="MM/DD/YYYY"
  aria-describedby="date-help">
</hx-date-picker>

<div id="date-help" class="sr-only">
  Use arrow keys to navigate dates, Enter to select, Escape to close calendar
</div>
```

## Compliance Checklist for hx-library

This checklist applies to every component before it can be marked production-ready.

### Component Implementation

- [ ] Uses native HTML elements where possible (`<button>`, not `<div role="button">`)
- [ ] Interactive elements are keyboard accessible
- [ ] Focus delegation configured if needed (`delegatesFocus: true`)
- [ ] Focus visible styles use `--hx-focus-ring-*` tokens
- [ ] All interactive elements have visible focus indicators
- [ ] Touch targets are minimum 44×44px

### ARIA and Semantics

- [ ] Appropriate ARIA roles applied (or native elements used)
- [ ] `aria-label` or `aria-labelledby` provides accessible name
- [ ] `aria-describedby` links to helper text and errors
- [ ] `aria-invalid="true"` when input is in error state
- [ ] `aria-required="true"` for required form fields
- [ ] `aria-disabled="true"` alongside native `disabled`
- [ ] Dynamic content uses `aria-live` regions
- [ ] `role="alert"` for error messages
- [ ] No ARIA attributes use IDRef across shadow boundaries

### Visual and Color

- [ ] Color contrast meets 4.5:1 for normal text
- [ ] Color contrast meets 3:1 for large text and UI components
- [ ] Information not conveyed by color alone
- [ ] Component works with browser zoom at 200%
- [ ] Component reflows at 320px width without horizontal scroll
- [ ] Component works in Windows High Contrast Mode

### Motion and Animation

- [ ] Respects `prefers-reduced-motion: reduce`
- [ ] No content flashes more than 3 times per second
- [ ] Animations can be paused if auto-playing

### Forms and Input

- [ ] Labels are programmatically associated with inputs
- [ ] Error messages are announced to screen readers
- [ ] Suggestions provided for correctable errors
- [ ] Autocomplete attributes used for user data inputs
- [ ] No auto-submit on input change without warning

### Testing

- [ ] Passes axe-core automated audit (zero violations)
- [ ] Tested with keyboard only (no mouse)
- [ ] Tested with NVDA on Windows
- [ ] Tested with VoiceOver on macOS
- [ ] Tested in high contrast mode
- [ ] Visual regression tests include focus states

## Troubleshooting Common Shadow DOM Accessibility Issues

While Shadow DOM provides powerful encapsulation, it introduces unique accessibility challenges. Here are solutions to common problems encountered when building accessible web components.

### Issue 1: ARIA Relationships Don't Work Across Shadow Boundaries

**Problem:**

```html
<!-- Light DOM label -->
<label for="email-input">Email</label>

<!-- Shadow DOM inside hx-text-input -->
<hx-text-input id="email-input"></hx-text-input>
```

The `for` attribute cannot reference an `id` inside the component's shadow DOM, and `aria-labelledby` suffers the same limitation.

**Solution:**

Keep related elements in the same shadow root or use properties to pass label text:

```typescript
// ✅ Correct: Label and input in same shadow root
<hx-text-input label="Email"></hx-text-input>

// Inside shadow DOM:
<label for="input" part="label">${this.label}</label>
<input id="input" part="input" />
```

**Alternative:** Use `aria-label` for simple cases:

```html
<hx-text-input aria-label="Email address"></hx-text-input>
```

### Issue 2: Focus Is Not Visible When Tab Navigation Enters Component

**Problem:**

When users tab to a custom element, focus lands on the host element but no visual indicator appears because the actual focusable element is inside the shadow tree.

**Solution:**

Configure focus delegation:

```typescript
class HxTextInput extends LitElement {
  static shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };
}
```

This automatically delegates focus from the host to the first focusable element in the shadow tree.

### Issue 3: Screen Reader Announces Component Twice or Not at All

**Problem:**

Screen readers might announce the host element and internal elements separately, or skip the component entirely.

**Solution:**

Avoid adding ARIA roles to the host element when the internal element already has the appropriate role:

```typescript
// ❌ Wrong: Double announcement
:host {
  role: button;
}
<button part="button">Click me</button>

// ✅ Correct: Single native button
<button part="button">Click me</button>
```

For truly custom interactive elements, add role to host only:

```typescript
// ✅ Correct for custom interactive element
:host([role="switch"]) {
  display: inline-block;
}
<div part="track" @click="${this.toggle}">
  <div part="thumb"></div>
</div>
```

### Issue 4: Dynamic Content Changes Are Not Announced

**Problem:**

Error messages or status updates appear visually but screen readers don't announce them.

**Solution:**

Use `aria-live` regions with `role="alert"` for errors and `role="status"` for non-urgent updates:

```typescript
// Error messages (announced immediately)
<div
  role="alert"
  aria-live="assertive"
  ?hidden="${!this.error}">
  ${this.error}
</div>

// Status messages (announced politely)
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  ?hidden="${!this.statusMessage}">
  ${this.statusMessage}
</div>
```

**Important:** The live region must exist in the DOM before content changes. Don't conditionally render the container:

```typescript
// ❌ Wrong: Container is conditionally rendered
${this.error ? html`<div role="alert">${this.error}</div>` : nothing}

// ✅ Correct: Container always present, content conditionally shown
<div role="alert" ?hidden="${!this.error}">
  ${this.error}
</div>
```

### Issue 5: axe-core Doesn't Detect Violations in Shadow DOM

**Problem:**

Running axe-core on the document doesn't find violations inside shadow roots.

**Solution:**

Configure axe to scan shadow DOM:

```typescript
import axe from 'axe-core';

const results = await axe.run(element, {
  // Enable shadow DOM scanning
  shadowRoots: true,
  rules: {
    // Explicitly enable color contrast checking in shadow DOM
    'color-contrast': { enabled: true },
  },
});
```

In Vitest tests:

```typescript
test('should be accessible', async () => {
  const el = await fixture(html`<hx-button>Click me</hx-button>`);

  // Scan the element and its shadow tree
  const results = await axe.run(el, {
    shadowRoots: true,
  });

  expect(results.violations).toHaveLength(0);
});
```

### Issue 6: CSS Parts Don't Respect User's High Contrast Settings

**Problem:**

Custom CSS properties for colors don't adapt to Windows High Contrast Mode or other forced-colors modes.

**Solution:**

Use the `forced-colors` media query to provide system color fallbacks:

```css
:host {
  --_bg: var(--hx-button-bg, var(--hx-color-primary));
  --_text: var(--hx-button-text, var(--hx-color-text));

  background: var(--_bg);
  color: var(--_text);
}

@media (forced-colors: active) {
  :host {
    /* Use system colors in high contrast mode */
    background: ButtonFace;
    color: ButtonText;
    border: 1px solid ButtonText;
  }

  :host(:focus-visible) {
    outline: 2px solid Highlight;
  }
}
```

### Issue 7: Touch Targets Are Too Small on Mobile

**Problem:**

Buttons and interactive elements work on desktop but are difficult to tap on mobile devices.

**Solution:**

Ensure minimum 44×44px touch targets:

```css
:host {
  /* Visual size can be smaller */
  padding: var(--hx-spacing-sm);

  /* But hit area should be minimum 44px */
  min-width: 44px;
  min-height: 44px;

  /* Ensure inline-block or flex to respect dimensions */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

For small icons, add padding:

```css
/* Icon button */
.icon-button {
  padding: 12px; /* 20px icon + 12px padding = 44px */
  width: 44px;
  height: 44px;
}
```

### Issue 8: Component Breaks with Browser Zoom at 200%

**Problem:**

At 200% zoom, content overflows, overlaps, or becomes unusable.

**Solution:**

Use relative units and avoid fixed dimensions:

```css
/* ❌ Wrong: Fixed pixel dimensions */
:host {
  width: 320px;
  height: 48px;
  font-size: 16px;
}

/* ✅ Correct: Relative units */
:host {
  max-width: 100%;
  min-height: 3rem; /* Scales with user's font size */
  font-size: 1rem;
  padding: 0.75em 1.5em;
}
```

Test components at 200% zoom (Cmd+Plus/Ctrl+Plus in browser) to verify they remain usable.

### Issue 9: Error Messages Don't Get Associated with Input

**Problem:**

Error text appears visually but screen readers don't announce it when the input receives focus.

**Solution:**

Use `aria-describedby` to create the association:

```typescript
render() {
  const errorId = `${this.inputId}-error`;
  const hasError = !!this.error;

  return html`
    <input
      id="${this.inputId}"
      aria-invalid="${hasError ? 'true' : nothing}"
      aria-describedby="${hasError ? errorId : nothing}"
    />

    <div
      id="${errorId}"
      role="alert"
      aria-live="polite"
      ?hidden="${!hasError}">
      ${this.error}
    </div>
  `;
}
```

When the error changes, screen readers will announce it due to `aria-live`, and when users focus the input later, they'll hear the error via `aria-describedby`.

### Issue 10: Keyboard Navigation Skips or Traps Focus

**Problem:**

Tab key skips over interactive elements or gets trapped inside a component.

**Solution:**

For skip-over issues, ensure interactive elements have `tabindex="0"` or are native focusable elements:

```typescript
// ✅ Native button is automatically focusable
<button part="button">Click me</button>

// ✅ Custom interactive element with tabindex
<div role="button" tabindex="0" @click="${this.handleClick}">
  Click me
</div>
```

For focus trap issues, implement Escape key to exit:

```typescript
private handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    this.close();
    this.previouslyFocusedElement?.focus();
  }
}
```

## Resources and References

### Official Standards

- [WCAG 2.1 Specification](https://www.w3.org/TR/WCAG21/) — W3C Recommendation
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/) — Comprehensive guide to each success criterion
- [How to Meet WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) — Quick reference checklist
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) — Patterns for common UI components

### Healthcare Mandate

- [HHS Section 504 Final Rule](https://www.hhs.gov/civil-rights/for-providers/compliance-enforcement/rulemaking/section-504-final-rule/index.html) — Official HHS guidance
- [HHS Section 504 Digital Accessibility FAQ](https://blog.usablenet.com/hhs-section-504-digital-accessibility-faq) — Common questions answered

### Shadow DOM Accessibility

- [Accessibility and the Shadow DOM](https://marcysutton.com/accessibility-and-the-shadow-dom/) — Marcy Sutton
- [Shadow DOM and Accessibility: The Trouble with ARIA](https://nolanlawson.com/2022/11/28/shadow-dom-and-accessibility-the-trouble-with-aria/) — Nolan Lawson
- [The Guide to Accessible Web Components](https://www.erikkroes.nl/blog/accessibility/the-guide-to-accessible-web-components-draft/) — Erik Kroes

### Testing Tools

- [axe DevTools](https://www.deque.com/axe/devtools/) — Browser extension for automated testing
- [NVDA Screen Reader](https://www.nvaccess.org/) — Free Windows screen reader
- [Pa11y](https://pa11y.org/) — Automated accessibility testing tool
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) — Built into Chrome DevTools

## Summary

WCAG 2.1 Level AA compliance is not optional for healthcare organizations — it is a legal mandate with enforcement consequences that include loss of federal funding. The hx-library component system is designed from the ground up to meet these requirements through:

- Native HTML elements with built-in accessibility
- Proper ARIA implementation that works with Shadow DOM
- Design tokens that ensure color contrast compliance
- Keyboard accessibility for all interactive components
- Screen reader testing across major platforms
- Automated and manual testing at every stage

Every component must pass the comprehensive compliance checklist before release. This zero-tolerance approach ensures that organizations building on hx-library can confidently meet their accessibility obligations and serve all patients, regardless of disability.

---

---

## Sources

### Official WCAG Standards and Guidelines

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/) — W3C official specification
- [WCAG 2 Overview | Web Accessibility Initiative (WAI) | W3C](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [Introduction to Understanding WCAG 2.1 | WAI | W3C](https://www.w3.org/WAI/WCAG21/Understanding/intro)
- [Understanding Techniques for WCAG 2.1 Success Criteria | WAI | W3C](https://www.w3.org/WAI/WCAG21/Understanding/understanding-techniques)
- [How to Meet WCAG (Quickref Reference)](https://www.w3.org/WAI/WCAG22/quickref/)
- [What's New in WCAG 2.1 | Web Accessibility Initiative (WAI) | W3C](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-21/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) — Patterns for common UI components

### Healthcare Accessibility Mandate

- [What WCAG 2.1 AA Means for Healthcare Organizations in 2026 – Pilot Digital](https://pilotdigital.com/blog/what-wcag-2-1aa-means-for-healthcare-organizations-in-2026/)
- [New HHS Rule Summary: Web and Mobile App Accessibility (WCAG 2.1 AA) Required | Accessible.org](https://accessible.org/hhs-web-accessibility-wcag-21-aa/)
- [HHS Section 504 Final Rule](https://www.hhs.gov/civil-rights/for-providers/compliance-enforcement/rulemaking/section-504-final-rule/index.html) — Official HHS guidance
- [New Requirements on the Accessibility of Web Content, Mobile Apps, and Kiosks](https://www.hhs.gov/sites/default/files/new-requirements-accessibility-web-content-mobile-apps-kiosks.pdf) — HHS PDF guide
- [What the New HHS Rule Means for Healthcare Websites | Stamats](https://www.stamats.com/insights/what-new-hhs-rule-means-healthcare-websites/)
- [How to Meet the 2026 Accessibility Deadline: Step-by-Step Guide](https://www.reasononeinc.com/blog/how-to-meet-the-2026-accessibility-deadline-step-by-step-guide)
- [Healthcare Website Accessibility: The May 2026 Deadline - Carenetic Digital](https://careneticdigital.com/healthcare-website-accessibility-the-may-2026-deadline/)
- [HHS Section 504 Digital Accessibility FAQ for Healthcare Providers](https://blog.usablenet.com/hhs-section-504-digital-accessibility-faq)
- [Digital Accessibility in Healthcare: Compliance Tips](https://www.patientpartner.com/blog/digital-accessibility-in-healthcare-compliance-tips)

### Shadow DOM and Web Components Accessibility

- [Accessibility and the Shadow DOM - MarcySutton.com](https://marcysutton.com/accessibility-and-the-shadow-dom/)
- [Shadow DOM and accessibility: the trouble with ARIA | Read the Tea Leaves](https://nolanlawson.com/2022/11/28/shadow-dom-and-accessibility-the-trouble-with-aria/)
- [The Guide to Accessible Web Components | Erik Kroes](https://www.erikkroes.nl/blog/accessibility/the-guide-to-accessible-web-components-draft/)

### Testing Tools and Methodologies

- [Web Accessibility Evaluation Tools List | Web Accessibility Initiative (WAI) | W3C](https://www.w3.org/WAI/test-evaluate/tools/list/)
- [Automating Accessibility Testing in 2026 | BrowserStack](https://www.browserstack.com/guide/automate-accessibility-testing)
- [Web Content Accessibility Guidelines (WCAG) Testing | Deque](https://www.deque.com/wcag/testing/)
- [Accessibility Testing Guide: WCAG, Tools & Best Practices](https://blog.testunity.com/accessibility-testing-guide/)
- [What is Manual WCAG Website Accessibility Testing? | UsableNet](https://blog.usablenet.com/quick-guide-to-manual-accessibility-testing-and-why-its-important)
- [Screen Readers Approved By DOJ WCAG - Accessibility Spark](https://accessibilityspark.com/screen-readers-approved-by-doj-wcag/)
- [axe DevTools](https://www.deque.com/axe/devtools/) — Browser extension for automated testing
- [NVDA Screen Reader](https://www.nvaccess.org/) — Free Windows screen reader
- [Pa11y](https://pa11y.org/) — Automated accessibility testing tool
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) — Built into Chrome DevTools
