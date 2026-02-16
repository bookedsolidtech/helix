---
title: Testing Shadow DOM
description: Comprehensive guide to testing Shadow DOM-encapsulated web components in HELIX
sidebar:
  order: 44
---

Testing Shadow DOM requires specialized techniques to access encapsulated content, verify style isolation, and validate component internals. This guide covers Shadow DOM testing patterns used throughout HELIX, based on our test utilities and real-world component tests.

## Shadow DOM Testing Challenges

Shadow DOM encapsulation creates several testing challenges:

1. **Encapsulation barrier** — Standard `querySelector()` cannot penetrate shadow boundaries
2. **Style isolation** — CSS from light DOM and shadow DOM don't interact (by design)
3. **Slot projection** — Content must cross the shadow boundary via slots
4. **Event retargeting** — Events crossing shadow boundaries have their `target` retargeted
5. **Focus delegation** — Focus management requires understanding `delegatesFocus`
6. **Nested shadows** — Components composed of other shadow-DOM components require deep queries

These aren't bugs—they're features. Shadow DOM provides style isolation and encapsulation guarantees critical for enterprise component libraries. Tests must respect these boundaries while still verifying component behavior.

## Accessing the Shadow Root

Every HELIX component uses Shadow DOM. The first step in any test is confirming the shadow root exists:

```typescript
import { fixture } from '../../test-utils.js';
import type { HxButton } from './hx-button.js';
import './index.js';

it('renders with shadow DOM', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  expect(el.shadowRoot).toBeTruthy();
});
```

### Why Shadow Root Access Matters

The shadow root is the entry point to all encapsulated content. Without it:

- You cannot query internal elements
- You cannot verify CSS parts
- You cannot test event handlers on internal nodes
- You cannot access focus state within the shadow tree

**Rule:** Never assume `shadowRoot` is non-null. Always guard access or use TypeScript non-null assertion (`!`) only after explicit verification.

## The shadowQuery Helper

HELIX provides `shadowQuery()` and `shadowQueryAll()` helpers to safely traverse shadow boundaries:

```typescript
/**
 * Query a single element inside a host's shadow DOM.
 */
export function shadowQuery<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T | null {
  return host.shadowRoot?.querySelector<T>(selector) ?? null;
}

/**
 * Query all elements inside a host's shadow DOM.
 */
export function shadowQueryAll<T extends Element = Element>(
  host: HTMLElement,
  selector: string,
): T[] {
  return Array.from(host.shadowRoot?.querySelectorAll<T>(selector) ?? []);
}
```

### Usage Patterns

#### Single Element Query

```typescript
it('renders native <button> element', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery(el, 'button');
  expect(btn).toBeInstanceOf(HTMLButtonElement);
});
```

#### Typed Queries

TypeScript generics provide type safety:

```typescript
it('sets disabled attr on native input', async () => {
  const el = await fixture<HxTextInput>('<hx-text-input disabled></hx-text-input>');
  const input = shadowQuery<HTMLInputElement>(el, 'input')!;
  expect(input.disabled).toBe(true);
});
```

#### Multiple Element Query

```typescript
it('renders all slot wrappers', async () => {
  const el = await fixture<HxCard>('<hx-card>Content</hx-card>');
  const slots = shadowQueryAll(el, 'slot');
  expect(slots.length).toBeGreaterThan(0);
});
```

### Why Not Use `querySelector()` Directly?

You _could_ write `el.shadowRoot?.querySelector()`, but `shadowQuery()` provides:

1. **Null safety** — Returns `null` if shadow root doesn't exist
2. **Consistency** — Same API across all test files
3. **Type safety** — TypeScript generic support
4. **Readability** — Intent is clear: "I'm querying shadow DOM"

## Deep Queries into Nested Shadows

When testing components composed of other components, you need to traverse multiple shadow boundaries.

### The Problem

Consider a form with nested components:

```html
<hx-form>
  <hx-text-input name="email"></hx-text-input>
  <hx-button type="submit">Submit</hx-button>
</hx-form>
```

Each component has its own shadow root:

```
hx-form (shadowRoot)
  └─ <slot>
       ├─ hx-text-input (shadowRoot)
       │    └─ <input>
       └─ hx-button (shadowRoot)
            └─ <button>
```

To access the native `<input>`, you must traverse two shadow boundaries:

```typescript
it('accesses nested input in form', async () => {
  const form = await fixture<HxForm>(`
    <hx-form>
      <hx-text-input name="email"></hx-text-input>
    </hx-form>
  `);

  // Step 1: Query light DOM of hx-form for the slotted hx-text-input
  const textInput = form.querySelector('hx-text-input') as HxTextInput;
  expect(textInput).toBeTruthy();

  // Step 2: Query shadow DOM of hx-text-input for the native input
  const input = shadowQuery<HTMLInputElement>(textInput, 'input')!;
  expect(input).toBeInstanceOf(HTMLInputElement);
});
```

### Pattern: Light → Shadow → Light → Shadow

When components use slots:

1. **Light DOM query** — Find slotted child component
2. **Shadow DOM query** — Access child's internal elements
3. Repeat for deeper nesting

**Key insight:** Slots project light DOM content _into_ shadow DOM, but the slotted elements remain in the light DOM. Use `querySelector()` for slotted content, `shadowQuery()` for encapsulated content.

## Testing Slots and Slotted Content

Slots are the primary mechanism for composing content across shadow boundaries.

### Default Slot

The default (unnamed) slot accepts any content:

```typescript
it('default slot renders text', async () => {
  const el = await fixture<HxButton>('<hx-button>Hello World</hx-button>');
  expect(el.textContent?.trim()).toBe('Hello World');
});

it('default slot renders HTML', async () => {
  const el = await fixture<HxButton>('<hx-button><span class="icon">+</span> Add</hx-button>');
  const span = el.querySelector('span.icon');
  expect(span).toBeTruthy();
  expect(span?.textContent).toBe('+');
});
```

**Pattern:** Query the host element (light DOM) to verify slotted content. Do _not_ use `shadowQuery()` for slotted elements—they're not in the shadow tree.

### Named Slots

Named slots require `slot="name"` attribute:

```typescript
it('heading content renders', async () => {
  const el = await fixture<HxCard>('<hx-card><span slot="heading">Title</span>Body</hx-card>');
  const headingSlot = el.querySelector('[slot="heading"]');
  expect(headingSlot).toBeTruthy();
  expect(headingSlot?.textContent).toBe('Title');
});
```

### Empty Slot Detection

Many components hide sections when slots are empty:

```typescript
it('heading section hidden when empty', async () => {
  const el = await fixture<HxCard>('<hx-card>Body only</hx-card>');
  const headingDiv = shadowQuery(el, '.card__heading')!;
  expect(headingDiv.hasAttribute('hidden')).toBe(true);
});
```

**Pattern:** Query the shadow DOM for the slot _wrapper_ (the element with the `<slot>` inside), then verify its `hidden` attribute.

### Slot Change Events

Components that react to slot changes use the `slotchange` event:

```typescript
it('clones slotted options into native select', async () => {
  const el = await fixture<HxSelect>(`
    <hx-select>
      <option value="x">X</option>
      <option value="y">Y</option>
      <option value="z">Z</option>
    </hx-select>
  `);
  await el.updateComplete;
  // Wait for slotchange to fire
  await new Promise((r) => setTimeout(r, 50));

  const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
  const clonedOptions = select.querySelectorAll('option[data-cloned]');
  expect(clonedOptions.length).toBe(3);
});
```

**Pattern:** When testing slot-dependent behavior, wait for Lit's `updateComplete` _and_ allow time for `slotchange` handlers to execute.

## Testing CSS Parts

CSS parts are the _only_ way external consumers can style shadow-encapsulated elements. Every HELIX component exposes parts for customization.

### Verifying Part Existence

```typescript
it('exposes "button" CSS part', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery(el, '[part="button"]');
  expect(btn).toBeTruthy();
});

it('exposes "input" CSS part', async () => {
  const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');
  const input = shadowQuery(el, '[part="input"]');
  expect(input).toBeTruthy();
});
```

### Multiple Parts Coverage

Components with complex structure expose multiple parts:

```typescript
describe('CSS Parts', () => {
  it('heading part exposed', async () => {
    const el = await fixture<HxCard>('<hx-card>Content</hx-card>');
    const heading = shadowQuery(el, '[part="heading"]');
    expect(heading).toBeTruthy();
  });

  it('body part exposed', async () => {
    const el = await fixture<HxCard>('<hx-card>Content</hx-card>');
    const body = shadowQuery(el, '[part="body"]');
    expect(body).toBeTruthy();
  });

  it('footer part exposed', async () => {
    const el = await fixture<HxCard>('<hx-card>Content</hx-card>');
    const footer = shadowQuery(el, '[part="footer"]');
    expect(footer).toBeTruthy();
  });
});
```

**Why test parts?** CSS parts are public API. Breaking a part name is a breaking change. Tests ensure parts remain stable across refactors.

### Part Naming Conventions

HELIX follows strict part naming:

- **Lowercase** — `part="button"`, not `part="Button"`
- **Hyphenated** — `part="input-wrapper"`, not `part="inputWrapper"`
- **Semantic** — `part="field"` (what it is), not `part="container"` (implementation detail)

## Testing Encapsulated Styles

Shadow DOM provides style encapsulation. Styles inside the shadow tree don't leak out; styles outside don't leak in.

### Computed Style Verification

```typescript
it('has cursor:pointer when interactive', async () => {
  const el = await fixture<HxCard>('<hx-card hx-href="/test">Content</hx-card>');
  const card = shadowQuery(el, '.card')!;
  const styles = getComputedStyle(card);
  expect(styles.cursor).toBe('pointer');
});
```

### Class Application

Test that internal classes are applied correctly:

```typescript
it('applies default variant + elevation classes', async () => {
  const el = await fixture<HxCard>('<hx-card>Content</hx-card>');
  const card = shadowQuery(el, '.card')!;
  expect(card.classList.contains('card--default')).toBe(true);
  expect(card.classList.contains('card--flat')).toBe(true);
});

it('applies secondary class', async () => {
  const el = await fixture<HxButton>('<hx-button variant="secondary">Click</hx-button>');
  const btn = shadowQuery(el, 'button')!;
  expect(btn.classList.contains('button--secondary')).toBe(true);
});
```

### Host Attribute Styling

Many components apply styles via host attributes:

```typescript
it('applies host opacity via disabled attribute', async () => {
  const el = await fixture<HxButton>('<hx-button disabled>Click</hx-button>');
  expect(el.hasAttribute('disabled')).toBe(true);
});
```

The corresponding CSS uses `:host([disabled])` selector:

```css
:host([disabled]) {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Pattern:** Test that the _attribute_ is set. Let visual regression tests (Chromatic) catch rendering bugs.

## Testing Event Retargeting

Events crossing shadow boundaries have their `event.target` retargeted to the host element.

### Event Bubbling and Composition

```typescript
it('hx-click bubbles and is composed', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.click();
  const event = await eventPromise;
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
});
```

**Why `composed: true` matters:** Events with `composed: false` stop at the shadow boundary. Components dispatching events across shadow boundaries _must_ set `composed: true`.

### Event Detail Payload

HELIX events include original event for debugging:

```typescript
it('hx-click detail contains originalEvent', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  const eventPromise = oneEvent<CustomEvent>(el, 'hx-click');
  btn.click();
  const event = await eventPromise;
  expect(event.detail.originalEvent).toBeInstanceOf(MouseEvent);
});
```

### Disabled State Suppression

Interactive components suppress events when disabled:

```typescript
it('does NOT dispatch hx-click when disabled', async () => {
  const el = await fixture<HxButton>('<hx-button disabled>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  let fired = false;
  el.addEventListener('hx-click', () => {
    fired = true;
  });
  btn.click();
  // Give time for any async dispatch
  await new Promise((r) => setTimeout(r, 50));
  expect(fired).toBe(false);
});
```

**Pattern:** When testing event suppression, wait for async event dispatch to ensure the event truly didn't fire.

## Examples from HELIX Tests

Real-world patterns from production test suites.

### hx-button: Shadow Root + Part Verification

```typescript
describe('Rendering', () => {
  it('renders with shadow DOM', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    expect(el.shadowRoot).toBeTruthy();
  });

  it('exposes "button" CSS part', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery(el, '[part="button"]');
    expect(btn).toBeTruthy();
  });

  it('renders native <button> element', async () => {
    const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
    const btn = shadowQuery(el, 'button');
    expect(btn).toBeInstanceOf(HTMLButtonElement);
  });
});
```

### hx-card: Slot Visibility Testing

```typescript
describe('Slot: heading', () => {
  it('heading content renders', async () => {
    const el = await fixture<HxCard>('<hx-card><span slot="heading">Title</span>Body</hx-card>');
    const headingSlot = el.querySelector('[slot="heading"]');
    expect(headingSlot).toBeTruthy();
    expect(headingSlot?.textContent).toBe('Title');
  });

  it('heading section hidden when empty', async () => {
    const el = await fixture<HxCard>('<hx-card>Body only</hx-card>');
    const headingDiv = shadowQuery(el, '.card__heading')!;
    expect(headingDiv.hasAttribute('hidden')).toBe(true);
  });
});
```

### hx-select: Nested Select Options

```typescript
it('clones slotted options into native select', async () => {
  const el = await fixture<HxSelect>(`
    <hx-select>
      <option value="x">X</option>
      <option value="y">Y</option>
      <option value="z">Z</option>
    </hx-select>
  `);
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 50));

  const select = shadowQuery<HTMLSelectElement>(el, 'select')!;
  const clonedOptions = select.querySelectorAll('option[data-cloned]');
  expect(clonedOptions.length).toBe(3);
});
```

### hx-text-input: Focus Delegation

```typescript
it('focus() moves focus to native input', async () => {
  const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');
  el.focus();
  await new Promise((r) => setTimeout(r, 50));
  const input = shadowQuery<HTMLInputElement>(el, 'input')!;
  expect(el.shadowRoot?.activeElement).toBe(input);
});
```

**Pattern:** To verify focus delegation, check `shadowRoot.activeElement`. The focused element is _inside_ the shadow tree, invisible to `document.activeElement`.

## Best Practices

### 1. Always Verify Shadow Root Exists

```typescript
// ✅ Good
it('renders with shadow DOM', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  expect(el.shadowRoot).toBeTruthy();
});

// ❌ Bad: Assumes shadowRoot exists without verification
it('renders button', async () => {
  const el = await fixture<HxButton>('<hx-button>Click</hx-button>');
  const btn = el.shadowRoot!.querySelector('button'); // Unsafe!
  expect(btn).toBeTruthy();
});
```

### 2. Use shadowQuery for Encapsulated Content

```typescript
// ✅ Good
const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;

// ❌ Bad: Direct shadowRoot access
const btn = el.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
```

### 3. Use querySelector for Slotted Content

```typescript
// ✅ Good: Slotted content is in light DOM
const icon = el.querySelector('.icon');

// ❌ Bad: Slotted content is NOT in shadow DOM
const icon = shadowQuery(el, '.icon');
```

### 4. Wait for Async Slot Changes

```typescript
// ✅ Good
await el.updateComplete;
await new Promise((r) => setTimeout(r, 50));

// ❌ Bad: Race condition
await el.updateComplete;
// Slot handler may not have fired yet
```

### 5. Test Parts as Public API

```typescript
// ✅ Good: Verify all exposed parts
it('exposes "field" CSS part', async () => {
  const el = await fixture<HxTextInput>('<hx-text-input></hx-text-input>');
  const field = shadowQuery(el, '[part="field"]');
  expect(field).toBeTruthy();
});

// ❌ Bad: No part verification
// Breaking a part name becomes a silent regression
```

### 6. Verify Event Composition

```typescript
// ✅ Good: Verify bubbles + composed
expect(event.bubbles).toBe(true);
expect(event.composed).toBe(true);

// ❌ Bad: Only verify event fired
expect(event).toBeTruthy();
```

### 7. Use TypeScript Generics

```typescript
// ✅ Good: Type-safe query
const input = shadowQuery<HTMLInputElement>(el, 'input')!;
expect(input.value).toBe('hello');

// ❌ Bad: Untyped query
const input = shadowQuery(el, 'input')!;
expect((input as any).value).toBe('hello');
```

### 8. Test Host Attributes, Not Computed Styles

```typescript
// ✅ Good: Test attribute application
expect(el.hasAttribute('disabled')).toBe(true);

// ⚠️ Acceptable: Test critical computed styles
const styles = getComputedStyle(card);
expect(styles.cursor).toBe('pointer');

// ❌ Bad: Testing implementation details
expect(el.shadowRoot!.innerHTML).toContain('class="button--disabled"');
```

### 9. Separate Rendering Tests from Behavior Tests

```typescript
// ✅ Good: Logical grouping
describe('Rendering', () => {
  it('renders with shadow DOM', async () => {
    /* ... */
  });
  it('exposes "button" CSS part', async () => {
    /* ... */
  });
});

describe('Events', () => {
  it('dispatches hx-click on click', async () => {
    /* ... */
  });
});

// ❌ Bad: Mixed concerns
describe('hx-button', () => {
  it('renders shadow DOM and dispatches click', async () => {
    // Too much in one test
  });
});
```

### 10. Use Non-Null Assertions Carefully

```typescript
// ✅ Good: Non-null assertion after explicit check
const btn = shadowQuery(el, 'button');
expect(btn).toBeTruthy();
const typedBtn = btn as HTMLButtonElement;

// ⚠️ Acceptable: Non-null assertion when failure is obvious
const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
btn.click();

// ❌ Bad: Non-null assertion without verification
const btn = el.shadowRoot!.querySelector('button')!;
```

## Summary

Shadow DOM testing in HELIX follows these principles:

1. **Use test utilities** — `fixture()`, `shadowQuery()`, `shadowQueryAll()`, `oneEvent()`
2. **Respect encapsulation** — Query shadow DOM for internals, light DOM for slots
3. **Test boundaries** — Verify shadow root, slots, parts, and event composition
4. **Wait for async** — Lit's `updateComplete` and slot change handlers
5. **Type safety** — Use TypeScript generics for queries
6. **Public API first** — Test parts and attributes, not internal DOM structure
7. **Separate concerns** — Rendering, events, keyboard, slots, forms, accessibility

Shadow DOM encapsulation is not an obstacle—it's the feature. Tests that work with Shadow DOM boundaries produce more resilient, maintainable test suites that align with web standards.

---

**Next Steps:**

- [Testing Accessibility](/components/testing/accessibility) — WCAG 2.1 AA compliance with axe-core
- [Testing Forms](/components/testing/forms) — ElementInternals, validation, form participation
- [Visual Regression Testing](/components/testing/visual-regression) — Playwright + Chromatic workflow
