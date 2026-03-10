---
title: Accessibility Testing
description: Comprehensive guide to accessibility testing for healthcare web components covering axe-core automated testing, manual keyboard and screen reader testing, browser extensions, and establishing effective accessibility test coverage for hx-library components.
sidebar:
  order: 38
---

# Accessibility Testing

Accessibility testing is the systematic process of verifying that web components are usable by everyone, including people with disabilities. For healthcare organizations subject to WCAG 2.1 AA compliance mandates, accessibility testing is not optional—it is a legal and ethical requirement.

This guide covers the four-layer testing strategy used in the Helix component library: automated testing with axe-core, manual keyboard testing, screen reader verification, and browser-based accessibility audits. Together, these layers ensure comprehensive accessibility coverage and zero regressions.

## Why Accessibility Testing Matters

Accessibility issues are defects. In healthcare settings, they can:

- **Block critical workflows** — A clinician unable to navigate a form cannot document patient care
- **Create legal liability** — Section 504 violations can result in loss of federal funding
- **Damage patient outcomes** — Inaccessible interfaces delay care for patients and providers with disabilities
- **Erode trust** — Healthcare organizations must model inclusivity

The Helix library treats accessibility violations with the same severity as security vulnerabilities: **zero tolerance, immediate remediation**.

## Four-Layer Testing Strategy

No single testing method catches all accessibility issues. The Helix testing strategy combines automated tools, manual testing, and assistive technology verification.

| Layer                    | Coverage                     | Speed          | Detection Rate         |
| ------------------------ | ---------------------------- | -------------- | ---------------------- |
| **Automated (axe-core)** | WCAG rules automatable       | Fast (~100ms)  | ~30-50% of issues      |
| **Manual Keyboard**      | Focus, navigation, shortcuts | Medium (~5min) | ~20-30% of issues      |
| **Screen Reader**        | ARIA, announcements, labels  | Slow (~15min)  | ~30-40% of issues      |
| **Browser Extensions**   | Page-level audits            | Fast (~30sec)  | Overlaps with axe-core |

**Best practice:** Use all four layers. Automated tools catch low-hanging fruit. Manual testing catches context, usability, and edge cases.

## Automated Testing with axe-core

axe-core is the industry-standard accessibility testing engine developed by Deque Systems. It runs hundreds of WCAG 2.1 AA rules against DOM elements and returns actionable violations.

### Why axe-core?

- **Fast** — Runs in milliseconds, ideal for CI/CD pipelines
- **Accurate** — Near-zero false positives (unlike many browser extensions)
- **Comprehensive** — Covers 57% of WCAG 2.1 AA success criteria automatable via static analysis
- **Shadow DOM support** — Works with Lit components out of the box
- **Actionable results** — Reports include impact level, help text, and remediation links

### Integration with Vitest

The Helix library includes a `checkA11y()` helper in `test-utils.ts` that wraps axe-core for seamless test integration:

```typescript
// packages/hx-library/src/test-utils.ts
export async function checkA11y(
  el: HTMLElement,
  options?: { rules?: Record<string, { enabled: boolean }> },
): Promise<{ violations: AxeViolation[]; passes: AxePass[] }> {
  const axe = await import('axe-core');

  // Run on shadow root if available, otherwise on element itself
  const context = el.shadowRoot ?? el;

  const results = await axe.default.run(context as unknown as Node, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'best-practice'],
    },
    rules: options?.rules,
  });

  return {
    violations: results.violations as AxeViolation[],
    passes: results.passes as AxePass[],
  };
}
```

**Key features:**

- Targets WCAG 2.1 Level A, AA, and best practices
- Automatically scans shadow DOM
- Returns violations and passes for detailed reporting

### Writing axe-core Tests

Every component in `hx-library` includes an "Accessibility (axe-core)" test suite that verifies zero violations across all states.

#### Basic Pattern

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, checkA11y, cleanup } from '../../test-utils.js';
import type { HxButton } from './hx-button.js';
import './index.js';

afterEach(cleanup);

describe('Accessibility (axe-core)', () => {
  it('has no axe violations in default state', async () => {
    const el = await fixture<HxButton>('<hx-button>Click me</hx-button>');
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });
});
```

**What this tests:**

- Native `<button>` semantics
- Color contrast (via CSS computed styles)
- Touch target size
- Accessible name (via slot content)

#### Testing All Variants

Test every visual state to catch contrast, focus, and ARIA issues:

```typescript
it('has no axe violations for all variants', async () => {
  const variants = ['primary', 'secondary', 'ghost'];

  for (const variant of variants) {
    const el = await fixture<HxButton>(`<hx-button variant="${variant}">Click me</hx-button>`);
    const { violations } = await checkA11y(el);
    expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
    el.remove(); // Clean up between iterations
  }
});
```

**Why this matters:** Background colors change per variant. A passing test for `variant="primary"` does not guarantee `variant="ghost"` meets 4.5:1 contrast.

#### Testing State-Dependent ARIA

Components with conditional ARIA attributes need state-specific tests:

```typescript
describe('hx-text-input', () => {
  it('has no axe violations in default state', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input label="Name"></hx-text-input>');
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no axe violations in error state', async () => {
    const el = await fixture<HxTextInput>(
      '<hx-text-input label="Email" error="Invalid email"></hx-text-input>',
    );
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no axe violations when disabled', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input label="Name" disabled></hx-text-input>');
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no axe violations when required', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input label="Name" required></hx-text-input>');
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });
});
```

**What this catches:**

- `aria-invalid="true"` is present when error is set
- `aria-describedby` correctly links to error message ID
- `aria-required="true"` is set when required
- Error message has `role="alert"` and `aria-live="polite"`

#### Testing Form Components

Form-associated components must verify label association, validation states, and accessibility metadata:

```typescript
describe('hx-checkbox', () => {
  it('has no axe violations in default state', async () => {
    const el = await fixture<HxCheckbox>('<hx-checkbox label="Accept terms"></hx-checkbox>');
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no axe violations when checked', async () => {
    const el = await fixture<HxCheckbox>(
      '<hx-checkbox label="Accept terms" checked></hx-checkbox>',
    );
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no axe violations in error state', async () => {
    const el = await fixture<HxCheckbox>(
      '<hx-checkbox label="Accept terms" error="Required"></hx-checkbox>',
    );
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });

  it('has no axe violations when disabled', async () => {
    const el = await fixture<HxCheckbox>(
      '<hx-checkbox label="Accept terms" disabled></hx-checkbox>',
    );
    const { violations } = await checkA11y(el);
    expect(violations).toEqual([]);
  });
});
```

**Critical checks:**

- Native `<input type="checkbox">` is present
- Label is properly associated (within same shadow root)
- `aria-describedby` links to error/help text when present
- Required indicator is communicated accessibly

### Custom axe-core Rules

You can enable or disable specific rules for context-specific testing:

```typescript
it('allows specific rule exception with justification', async () => {
  const el = await fixture<HxCustomComponent>('<hx-custom-component></hx-custom-component>');

  // Disable 'region' rule for this component (not applicable)
  const { violations } = await checkA11y(el, {
    rules: {
      region: { enabled: false },
    },
  });

  expect(violations).toEqual([]);
});
```

**Warning:** Only disable rules with documented justification. Every exception must be reviewed during code review.

### Debugging axe Violations

When a test fails, axe provides detailed violation data:

```typescript
it('has no axe violations', async () => {
  const el = await fixture<HxButton>('<hx-button></hx-button>');
  const { violations } = await checkA11y(el);

  // Violation structure when test fails:
  // [
  //   {
  //     id: 'button-name',
  //     impact: 'critical',
  //     description: 'Buttons must have discernible text',
  //     help: 'Button has a discernible text',
  //     helpUrl: 'https://dequeuniversity.com/rules/axe/4.11/button-name',
  //     nodes: [
  //       {
  //         html: '<button part="button"></button>',
  //         failureSummary: 'Fix any of the following:\n  Element does not have inner text...'
  //       }
  //     ]
  //   }
  // ]

  expect(violations).toEqual([]);
});
```

**How to fix:**

1. Read `violations[0].description` for the issue summary
2. Check `violations[0].helpUrl` for Deque University documentation
3. Inspect `violations[0].nodes[0].html` to see the exact element
4. Apply the fix (in this case: add slot content or aria-label)
5. Re-run test

## Manual Keyboard Testing

Automated tools cannot verify keyboard navigation quality. Manual testing ensures all interactive elements are reachable and operable via keyboard alone.

### Testing Checklist

For every interactive component, verify:

- [ ] **Tab order is logical** — Focus moves in a predictable sequence matching visual layout
- [ ] **All interactive elements are focusable** — No "keyboard traps" or unreachable controls
- [ ] **Focus indicator is visible** — `:focus-visible` outline is clearly visible (3:1 contrast minimum)
- [ ] **Activation keys work** — Enter/Space activate buttons, Space toggles checkboxes, arrows navigate selects
- [ ] **Escape closes dialogs** — Modal components dismiss on Escape
- [ ] **No unexpected focus changes** — Focus doesn't jump unexpectedly during interaction

### Keyboard Test Procedure

1. **Start outside the component** — Click in the address bar or another field
2. **Tab into the component** — Press <kbd>Tab</kbd> until focus enters the component
3. **Verify focus visibility** — Check for clear focus ring (use `--hx-focus-ring-color` token)
4. **Test activation** — Press <kbd>Enter</kbd> and <kbd>Space</kbd> to activate controls
5. **Tab through internal elements** — If component has multiple focusable elements, verify tab order
6. **Tab out** — Ensure focus exits cleanly to next external element

### Example: hx-button

```typescript
describe('Keyboard', () => {
  it('Enter activates native button', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    btn.click();

    const event = await eventPromise;
    expect(event).toBeTruthy();
  });

  it('Space activates native button', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

    const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    btn.click();

    const event = await eventPromise;
    expect(event).toBeTruthy();
  });
});
```

**Note:** These tests verify behavior, not UX. Manual testing still required to confirm focus visibility and navigation feel.

### Example: hx-checkbox

```typescript
describe('Keyboard', () => {
  it('Space key toggles checked', async () => {
    const el = await fixture<HxCheckbox>('<hx-checkbox label="Test"></hx-checkbox>');
    const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;

    control.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    await el.updateComplete;

    expect(el.checked).toBe(true);
  });

  it('Enter key does NOT toggle checked', async () => {
    const el = await fixture<HxCheckbox>('<hx-checkbox label="Test"></hx-checkbox>');
    const control = shadowQuery<HTMLElement>(el, '.checkbox__control')!;

    control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;

    expect(el.checked).toBe(false); // Enter should not toggle checkbox
  });
});
```

**ARIA pattern:** Checkboxes toggle on <kbd>Space</kbd>, not <kbd>Enter</kbd>. This matches native `<input type="checkbox">` behavior.

### Focus Management Testing

Components that manage focus (modals, dropdowns, tabs) need additional tests:

```typescript
describe('Focus Management', () => {
  it('focus() moves focus to native input', async () => {
    const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');

    el.focus();
    await new Promise((r) => setTimeout(r, 50)); // Allow focus to settle

    const input = shadowQuery<HTMLInputElement>(el, 'input')!;
    expect(el.shadowRoot?.activeElement).toBe(input);
  });
});
```

**Why this matters:** Shadow DOM requires explicit focus delegation. Calling `el.focus()` on the custom element must focus the internal `<input>`.

## Screen Reader Testing

Screen readers are the primary assistive technology for blind and low-vision users. Testing with actual screen readers is the only way to verify ARIA implementation, announcements, and label associations.

### Recommended Screen Readers

| Platform    | Screen Reader | Free?          | Market Share |
| ----------- | ------------- | -------------- | ------------ |
| **Windows** | NVDA          | Yes            | ~41%         |
| **Windows** | JAWS          | No             | ~40%         |
| **macOS**   | VoiceOver     | Yes (built-in) | ~11%         |
| **iOS**     | VoiceOver     | Yes (built-in) | ~5%          |
| **Android** | TalkBack      | Yes (built-in) | ~3%          |

**Helix testing standard:** Verify all components with at least **NVDA (Windows)** and **VoiceOver (macOS)**.

### Screen Reader Testing Procedure

#### Setup (VoiceOver on macOS)

1. Enable VoiceOver: <kbd>Cmd+F5</kbd>
2. Open Safari (best VoiceOver compatibility)
3. Navigate to Storybook story or test page
4. Use <kbd>VO+A</kbd> to start reading

#### Setup (NVDA on Windows)

1. Install NVDA from nvaccess.org
2. Launch NVDA (<kbd>Ctrl+Alt+N</kbd>)
3. Open Firefox or Chrome
4. Use <kbd>NVDA+Space</kbd> to toggle browse/focus mode

#### Testing Checklist

For each component, verify:

- [ ] **Accessible name is announced** — Role + label are read (e.g., "Accept terms, checkbox, not checked")
- [ ] **State changes are announced** — Checking a checkbox announces "checked"
- [ ] **Error messages are announced** — Setting `error` property triggers `role="alert"` announcement
- [ ] **Help text is associated** — `aria-describedby` links are read after label
- [ ] **Required fields are announced** — `aria-required="true"` is conveyed
- [ ] **Disabled state is announced** — Disabled controls are identified as dimmed/disabled

### Example: Testing hx-text-input

**Component:**

```html
<hx-text-input
  label="Email Address"
  help-text="We'll never share your email"
  required
></hx-text-input>
```

**Expected VoiceOver announcement (macOS):**

> "Email Address, required, edit text. We'll never share your email."

**Expected NVDA announcement (Windows):**

> "Email Address, edit, required, We'll never share your email."

**What to listen for:**

- "Email Address" — Label from `label` property
- "required" — From `aria-required="true"`
- "edit" / "edit text" — Native `<input type="text">` role
- Help text — From `aria-describedby` linking to help text element

### Example: Testing hx-checkbox in Error State

**Component:**

```html
<hx-checkbox label="Accept terms" error="You must accept the terms to continue"></hx-checkbox>
```

**Expected announcement:**

1. On focus: "Accept terms, checkbox, not checked, invalid entry, You must accept the terms to continue"
2. `role="alert"` fires immediately when error is set, announcing the error text

**Implementation:**

```typescript
// Inside hx-checkbox.ts
${this.error ? html`
  <div
    part="error"
    class="checkbox__error"
    id=${this.errorId}
    role="alert"
    aria-live="polite"
  >
    ${this.error}
  </div>
` : ''}
```

**Why `role="alert"` + `aria-live="polite"`?**

- `role="alert"` triggers immediate announcement when error appears
- `aria-live="polite"` waits for current speech to finish before announcing
- Combined: ensures error is heard without interrupting critical information

### Common Screen Reader Issues

| Issue                     | Symptom                          | Fix                                                 |
| ------------------------- | -------------------------------- | --------------------------------------------------- |
| **Unlabeled input**       | "Edit text" (no label)           | Add `label` property or `aria-label`                |
| **Wrong role**            | "Group" instead of "button"      | Use native `<button>`, not `<div role="button">`    |
| **Silent state changes**  | Toggle checkbox, no announcement | Ensure native `<input>` is used (state is implicit) |
| **Orphaned descriptions** | Help text not read               | Link via `aria-describedby="${helpId}"`             |
| **Error not announced**   | Error text visible but silent    | Add `role="alert"` to error container               |

## Browser Extensions for Accessibility Audits

Browser extensions provide quick accessibility scans during development. They complement automated tests but do not replace them.

### Recommended Extensions

#### axe DevTools (Chrome/Firefox/Edge)

**Download:** [deque.com/axe/devtools](https://www.deque.com/axe/devtools/)

**Features:**

- One-click WCAG 2.1 AA scan
- Highlights violations inline on page
- Provides fix recommendations
- Exports results as JSON/CSV

**How to use:**

1. Install extension
2. Open DevTools (F12)
3. Click "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review violations, sorted by impact

**Best for:** Page-level audits, catching issues in application context

#### WAVE (Web Accessibility Evaluation Tool)

**Download:** [wave.webaim.org/extension](https://wave.webaim.org/extension/)

**Features:**

- Visual overlay showing errors, alerts, and features
- Sidebar with detailed report
- Contrast checker
- Structure view (headings, landmarks, lists)

**How to use:**

1. Install extension
2. Navigate to page
3. Click WAVE icon in toolbar
4. Review color-coded icons overlaid on page

**Best for:** Visual learners, understanding document structure

#### Lighthouse (Built into Chrome DevTools)

**Location:** Chrome DevTools > Lighthouse tab

**Features:**

- Accessibility score (0-100)
- Automated WCAG checks
- Manual checks checklist
- Performance, SEO, and best practices audits

**How to use:**

1. Open DevTools (F12)
2. Click "Lighthouse" tab
3. Check "Accessibility"
4. Click "Analyze page load"

**Best for:** Comprehensive page-level audits, CI integration via Lighthouse CI

### Extension Limitations

**What extensions CAN'T catch:**

- **Shadow DOM internals** — Most extensions can't penetrate shadow roots (axe DevTools can)
- **Keyboard navigation quality** — Tools see `tabindex`, not whether order makes sense
- **Screen reader announcements** — Tools see ARIA, not what users hear
- **Color contrast in complex gradients** — Automated tools check flat colors, not overlays
- **Cognitive load and readability** — Tools can't assess if content is understandable

**Best practice:** Use extensions as **first-pass filters**, not **final verification**.

## Accessibility Testing Workflow

### During Development

1. **Write component** with semantic HTML and ARIA
2. **Add axe-core test** to verify zero violations in all states
3. **Run test suite** (`npm run test:library`) before commit
4. **Manual keyboard test** in Storybook to verify focus and activation
5. **Screen reader spot-check** with VoiceOver/NVDA on key flows

### Before Pull Request

1. **Run full test suite** (`npm run test`) — All axe tests must pass
2. **Run type-check** (`npm run type-check`) — No TypeScript errors
3. **Keyboard test all stories** — Verify every Storybook variant is keyboard-accessible
4. **axe DevTools scan** in Storybook — Catch page-level issues
5. **Document any a11y patterns** in story docs or component JSDoc

### Code Review (Accessibility Engineer)

1. **Verify axe tests exist** for all component states (default, error, disabled, etc.)
2. **Check ARIA usage** — Prefer native HTML over ARIA where possible
3. **Verify keyboard patterns** — Confirm behavior matches ARIA Authoring Practices Guide
4. **Review focus management** — Ensure focus is visible and logical
5. **Test with screen reader** — NVDA or VoiceOver verification for complex components

### Continuous Integration

The CI pipeline enforces accessibility as a **blocking gate**:

```yaml
# .github/workflows/ci.yml
- name: Run Tests
  run: npm run test
  # Includes all axe-core tests — failures block merge

- name: Type Check
  run: npm run type-check
  # Strict TypeScript prevents runtime errors affecting a11y
```

**Policy:** If axe tests fail, the build fails. No exceptions. Fix forward.

## Common Accessibility Test Patterns

### Pattern: Form Input with Label

**Component:**

```html
<hx-text-input label="Username" name="username" required></hx-text-input>
```

**Test:**

```typescript
it('has no axe violations when required', async () => {
  const el = await fixture<HxTextInput>(
    '<hx-text-input label="Username" required></hx-text-input>',
  );
  const { violations } = await checkA11y(el);
  expect(violations).toEqual([]);
});
```

**What it verifies:**

- Label is associated with input (within shadow DOM)
- `aria-required="true"` is set
- Required indicator (`*`) has `aria-label` or is hidden from screen readers

### Pattern: Error State Announcement

**Component:**

```html
<hx-text-input label="Email" error="Please enter a valid email address"></hx-text-input>
```

**Test:**

```typescript
it('has no axe violations in error state', async () => {
  const el = await fixture<HxTextInput>(
    '<hx-text-input label="Email" error="Invalid email"></hx-text-input>',
  );
  const { violations } = await checkA11y(el);
  expect(violations).toEqual([]);
});
```

**What it verifies:**

- `aria-invalid="true"` is set on input
- `aria-describedby` links to error message
- Error message has `role="alert"` and `aria-live="polite"`

### Pattern: Button with Icon Only

**Component:**

```html
<hx-button aria-label="Close dialog">
  <svg aria-hidden="true"><!-- X icon --></svg>
</hx-button>
```

**Test:**

```typescript
it('icon-only button has accessible name', async () => {
  const el = await fixture<HxButton>(
    '<hx-button aria-label="Close"><svg aria-hidden="true"></svg></hx-button>',
  );
  const { violations } = await checkA11y(el);
  expect(violations).toEqual([]);
});
```

**What it verifies:**

- Button has accessible name via `aria-label`
- Icon is hidden from screen readers via `aria-hidden="true"`

### Pattern: Disabled State

**Component:**

```html
<hx-button disabled>Save</hx-button>
```

**Test:**

```typescript
it('has no axe violations when disabled', async () => {
  const el = await fixture<HxButton>('<hx-button disabled>Save</hx-button>');
  const { violations } = await checkA11y(el);
  expect(violations).toEqual([]);
});
```

**What it verifies:**

- Native `disabled` attribute is set on `<button>`
- `aria-disabled="true"` is set for screen reader support
- Element is removed from tab order

## Accessibility Test Coverage Goals

| Component Type        | Minimum Test Coverage                                             |
| --------------------- | ----------------------------------------------------------------- |
| **Buttons**           | Default, all variants, disabled, icon-only (if supported)         |
| **Form Inputs**       | Default, error, disabled, required, with help text                |
| **Checkboxes/Radios** | Unchecked, checked, indeterminate (if supported), error, disabled |
| **Selects/Dropdowns** | Closed, open, selected, error, disabled                           |
| **Alerts/Messages**   | All severity levels (info, success, warning, error)               |
| **Cards/Containers**  | Default, interactive (if clickable/linkable)                      |
| **Modals/Dialogs**    | Open, closed, focus trap, keyboard dismissal                      |

**Rule:** If a component has a visual state, it must have an axe test for that state.

## Resources and References

### Official Standards

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) — Complete WCAG 2.1 quick reference
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) — Keyboard patterns and ARIA usage
- [Section 508 Standards](https://www.section508.gov/) — U.S. federal accessibility requirements

### Testing Tools and Documentation

- [axe-core Documentation](https://github.com/dequelabs/axe-core) — API reference and rule descriptions
- [Deque University](https://dequeuniversity.com/) — Accessibility training and rule explanations
- [WebAIM Articles](https://webaim.org/articles/) — Practical accessibility guidance
- [a11ysupport.io](https://a11ysupport.io/) — Screen reader compatibility data

### Screen Reader Guides

- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html) — Complete NVDA documentation
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac) — Apple's official VoiceOver guide
- [JAWS Keyboard Shortcuts](https://www.freedomscientific.com/training/jaws/hotkeys/) — Quick reference for JAWS users

### Related Documentation

- [WCAG 2.1 AA Compliance](/components/accessibility/wcag) — Healthcare mandate and conformance levels
- [ARIA Patterns](/components/accessibility/aria) — ARIA roles, states, and properties
- [Keyboard Navigation](/components/accessibility/keyboard) — Keyboard interaction patterns and focus management
- [Writing Component Tests](/components/testing/vitest) — Vitest browser mode test setup and utilities

---

**Remember:** Accessibility testing is not a checklist. It is a continuous practice. Automated tools catch syntax. Manual testing catches usability. Screen readers catch real-world experience. Use all three, every time.
