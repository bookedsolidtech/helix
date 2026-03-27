---
title: WCAG Compliance
description: The WCAG 2.1 AA requirements that every HELiX component is designed and tested to meet.
---

HELiX targets WCAG 2.1 Level AA across every component. This page explains what that means in practice, which criteria apply to web components, and how HELiX enforces compliance through automated testing and design decisions.

## What WCAG 2.1 AA Covers

WCAG 2.1 is organized around four principles — Perceivable, Operable, Understandable, and Robust (POUR). Level AA adds requirements on top of Level A.

## Perceivable

Content must be presentable to users in ways they can perceive.

| Criterion | Level | Requirement |
|---|---|---|
| 1.1.1 Non-text Content | A | All non-text content has a text alternative. Images need `alt`; decorative images use `alt=""`. |
| 1.3.1 Info and Relationships | A | Information conveyed through presentation is also available programmatically (ARIA roles, semantic HTML). |
| 1.3.3 Sensory Characteristics | A | Instructions do not rely solely on shape, color, size, visual location, or sound. |
| 1.4.1 Use of Color | A | Color is not the only visual means of conveying information. |
| 1.4.3 Contrast (Minimum) | AA | Text has a contrast ratio of at least 4.5:1 (3:1 for large text). |
| 1.4.4 Resize Text | AA | Text can be resized up to 200% without assistive technology and without loss of content or function. |
| 1.4.11 Non-text Contrast | AA | UI components and graphical objects meet 3:1 contrast against adjacent colors. |

HELiX tokens are validated against these thresholds. See [Color Contrast](/components-guide/accessibility/color-contrast/) for implementation details.

## Operable

Interface components and navigation must be operable.

| Criterion | Level | Requirement |
|---|---|---|
| 2.1.1 Keyboard | A | All functionality is available via keyboard. No keyboard trap (except where required, e.g., a modal dialog). |
| 2.1.2 No Keyboard Trap | A | Keyboard focus can always be moved away using standard keys. |
| 2.4.3 Focus Order | A | Focus order preserves meaning and operability. |
| 2.4.4 Link Purpose | A | The purpose of a link can be determined from its text or context. |
| 2.4.7 Focus Visible | AA | Any keyboard-operable interface has a visible focus indicator. |

All HELiX interactive elements have a visible focus ring, implemented using `--hx-focus-ring-color` and `outline` CSS. Dialogs and drawers implement focus traps that return focus to the trigger on close.

## Understandable

Content and operation must be understandable.

| Criterion | Level | Requirement |
|---|---|---|
| 3.2.1 On Focus | A | Components do not initiate a change of context when they receive focus. |
| 3.2.2 On Input | A | Changing a form control's value does not automatically change context unless the user has been advised. |
| 3.3.1 Error Identification | A | If an input error is detected, the error is identified in text. |
| 3.3.2 Labels or Instructions | A | Labels or instructions are provided when content requires user input. |

HELiX form components (`hx-field`, `hx-text-input`, `hx-select`, etc.) connect error messages and help text to inputs using `aria-describedby` so screen readers announce them automatically.

## Robust

Content must be robust enough to be interpreted by a wide variety of user agents.

| Criterion | Level | Requirement |
|---|---|---|
| 4.1.1 Parsing | A | Content does not contain parsing errors that affect AT. |
| 4.1.2 Name, Role, Value | A | Custom UI components have accessible names, roles, and state/property values. |
| 4.1.3 Status Messages | AA | Status messages are programmatically determined so they can be announced without receiving focus. |

Web components meet 4.1.2 when they correctly use ARIA roles and reflect state through ARIA attributes. HELiX uses `ElementInternals` and `mixinDelegatesAria` to expose accessible names and states that assistive technology can read.

## HELiX Enforcement Strategy

### Automated Testing

Every component's test suite includes axe-core audits via `checkA11y()`. These run in a real Chromium browser through Vitest's browser mode and cover `wcag2a`, `wcag2aa`, and `best-practice` rules. See [Accessibility Testing](/components-guide/testing/accessibility-testing/).

### Storybook Addon

`@storybook/addon-a11y` runs axe-core on every story in the Storybook panel. This provides immediate visual feedback while building new components.

### Token Validation

HELiX design tokens are pre-validated to meet contrast requirements. Using `var(--hx-color-*)` values on the appropriate backgrounds keeps you within WCAG AA automatically.

### Manual Review Checklist

Automated tools catch approximately 30–40% of WCAG issues. Every HELiX component also undergoes:

- Keyboard navigation review (Tab, Shift+Tab, arrow keys, Enter, Space, Escape)
- VoiceOver (macOS/iOS) testing for announcement accuracy
- NVDA (Windows) testing for focus and live region behavior
- High-contrast mode verification using Windows High Contrast and `forced-colors` CSS

## Next Steps

- [ARIA in Web Components](/components-guide/accessibility/aria/) — roles, states, and properties
- [Keyboard Navigation](/components-guide/accessibility/keyboard/) — tab order and key bindings
- [Focus Management](/components-guide/accessibility/focus-management/) — `delegatesFocus` and focus traps
- [Color Contrast](/components-guide/accessibility/color-contrast/) — token values and validation
