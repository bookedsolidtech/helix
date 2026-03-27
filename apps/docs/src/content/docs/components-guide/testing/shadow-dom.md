---
title: Testing Shadow DOM
description: Query and assert against the shadow root of HELiX web components using fixture and shadowQuery.
---

Shadow DOM encapsulation means that `document.querySelector()` cannot reach inside a component's shadow root. HELiX provides two utilities — `fixture` and `shadowQuery` — to render components into the real DOM and query their internals.

## `fixture<T>()` — Rendering a Component

`fixture` takes an HTML string, appends the element to the shared test container, waits for Lit's `updateComplete`, and returns a typed reference to the element:

```typescript
import { fixture, cleanup } from '../../test-utils.js';
import type { HelixButton } from './hx-button.js';
import './index.js';

afterEach(cleanup);

it('renders with shadow DOM', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  expect(el.shadowRoot).toBeTruthy();
});
```

The type parameter `<HelixButton>` is optional but enables full TypeScript autocomplete on properties, methods, and events specific to that component.

### Fixture with Attributes

Pass attributes and initial property values directly in the HTML string:

```typescript
it('applies secondary variant', async () => {
  const el = await fixture<HelixButton>('<hx-button variant="secondary">Click</hx-button>');
  expect(el.variant).toBe('secondary');
});

it('is disabled by default when attribute present', async () => {
  const el = await fixture<HelixButton>('<hx-button disabled>Click</hx-button>');
  expect(el.disabled).toBe(true);
});
```

## `shadowQuery<T>()` — Querying the Shadow Root

`shadowQuery` performs a `querySelector` inside the element's shadow root. It is equivalent to `el.shadowRoot!.querySelector(selector)` but handles the null-safety check for you:

```typescript
import { fixture, shadowQuery } from '../../test-utils.js';

it('exposes "button" CSS part', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  const btn = shadowQuery(el, '[part~="button"]');
  expect(btn).toBeTruthy();
});
```

### Type-Safe `shadowQuery`

Pass a type parameter to receive a typed result and avoid non-null assertions on DOM properties:

```typescript
it('sets native disabled attribute', async () => {
  const el = await fixture<HelixButton>('<hx-button disabled>Click</hx-button>');
  const btn = shadowQuery<HTMLButtonElement>(el, 'button')!;
  expect(btn.disabled).toBe(true); // .disabled is typed on HTMLButtonElement
});

it('sets href on anchor', async () => {
  const el = await fixture<HelixButton>(
    '<hx-button href="https://example.com">Link</hx-button>'
  );
  const anchor = shadowQuery<HTMLAnchorElement>(el, 'a')!;
  expect(anchor.getAttribute('href')).toBe('https://example.com');
});
```

## `el.shadowRoot!.querySelector()` Directly

For cases where the shadow root access is more natural — or when chaining multiple queries — you can use the `shadowRoot` property directly:

```typescript
it('renders nested structure inside shadow root', async () => {
  const el = await fixture<HelixButton>('<hx-button loading>Click</hx-button>');
  const spinner = el.shadowRoot!.querySelector('[part="spinner"]');
  expect(spinner).toBeTruthy();
});
```

## Testing Slotted Content

Slotted content lives in the light DOM (the component's children), not the shadow DOM. Query it directly on the element:

```typescript
it('renders slotted text content', async () => {
  const el = await fixture<HelixButton>('<hx-button>Hello World</hx-button>');
  expect(el.textContent?.trim()).toBe('Hello World');
});

it('renders slotted HTML', async () => {
  const el = await fixture<HelixButton>(
    '<hx-button><span class="icon">+</span> Add</hx-button>'
  );
  const icon = el.querySelector('span.icon');
  expect(icon).toBeTruthy();
  expect(icon?.textContent).toBe('+');
});

it('prefix slot renders slotted content', async () => {
  const el = await fixture<HelixButton>(
    '<hx-button><svg slot="prefix" aria-hidden="true"></svg>Label</hx-button>'
  );
  const prefix = el.querySelector('[slot="prefix"]');
  expect(prefix?.tagName.toLowerCase()).toBe('svg');
});
```

## CSS Part Assertions

HELiX components expose named CSS parts using the `part` attribute. Test for their presence with `[part~="name"]`:

```typescript
it('exposes "label" CSS part', async () => {
  const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
  expect(shadowQuery(el, '[part~="label"]')).toBeTruthy();
});

it('exposes "prefix" part', async () => {
  const el = await fixture<HelixButton>(
    '<hx-button><span slot="prefix">*</span>Click</hx-button>'
  );
  expect(shadowQuery(el, '[part~="prefix"]')).toBeTruthy();
});
```

Note the `~=` attribute selector — it matches `part` values in space-separated lists, so `[part~="button"]` matches both `part="button"` and `part="button label"`.

## `cleanup()` in `afterEach`

The `cleanup` function empties the shared fixture container between tests. Always register it in `afterEach`:

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '../../test-utils.js';

afterEach(cleanup);
```

Without cleanup, elements remain in the document across tests. This causes:

- Event listeners from a previous test still firing
- Focus state bleeding into the next test
- axe-core scanning elements it should not
- False failures or false passes

## Next Steps

- [Async Testing](/components-guide/testing/async/) — waiting for `updateComplete` and user interactions
- [Testing Events](/components-guide/testing/event-testing/) — `oneEvent` and custom event assertions
- [Component Fixtures and Test Utilities](/components-guide/testing/component-fixtures/) — full utility reference
