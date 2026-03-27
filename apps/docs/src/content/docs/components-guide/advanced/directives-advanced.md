---
title: Custom Directives
description: Write Lit custom directives for DOM access, cleanup, and reusable template expressions in HELiX components.
---

Lit's built-in directives (`classMap`, `ifDefined`, `repeat`, `guard`) cover the majority of use cases. Custom directives are appropriate when you need to perform raw DOM manipulation inside a template expression, or when you need cleanup logic that runs when the directive is disconnected.

## The `Directive` Base Class

```typescript
import { Directive, PartType, directive } from 'lit/directive.js';
import type { DirectiveParameters, DirectiveResult, Part } from 'lit/directive.js';
import type { ElementPart } from 'lit';
```

A directive class extends `Directive` and implements `render()` and optionally `update()`:

```typescript
import { Directive, directive, PartType } from 'lit/directive.js';
import type { ElementPart, PartInfo } from 'lit/directive.js';

class FocusTrapDirective extends Directive {
  constructor(partInfo: PartInfo) {
    super(partInfo);
    // Validate that this directive is used on an element binding, not a text node
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('focusTrap directive must be used on an element: <div ${focusTrap()}>');
    }
  }

  render(_active: boolean): typeof nothing {
    return nothing;
  }

  override update(part: ElementPart, [active]: [boolean]) {
    const el = part.element as HTMLElement;
    if (active) {
      el.setAttribute('data-focus-trap', 'true');
      // additional focus trap logic
    } else {
      el.removeAttribute('data-focus-trap');
    }
    return this.render(active);
  }
}

export const focusTrap = directive(FocusTrapDirective);
```

`directive(DirectiveClass)` wraps the class in a factory function that Lit calls inside template expressions.

## `render()` — Returning Values

The `render()` method is called during normal rendering. It returns the value that replaces the directive expression in the template:

```typescript
import { Directive, directive, PartType } from 'lit/directive.js';
import type { PartInfo } from 'lit/directive.js';
import { noChange } from 'lit';

class AbsoluteDateDirective extends Directive {
  private _lastTimestamp: number | null = null;
  private _lastFormatted: string = '';

  constructor(partInfo: PartInfo) {
    super(partInfo);
  }

  render(timestamp: number, locale: string = 'en-US'): string {
    // Avoid re-formatting if the value has not changed
    if (timestamp === this._lastTimestamp) {
      return this._lastFormatted;
    }
    this._lastTimestamp = timestamp;
    this._lastFormatted = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(timestamp));
    return this._lastFormatted;
  }
}

export const absoluteDate = directive(AbsoluteDateDirective);
```

Usage in a component:

```typescript
import { absoluteDate } from './directives/absolute-date.js';

override render() {
  return html`
    <time datetime=${new Date(this.timestamp).toISOString()}>
      ${absoluteDate(this.timestamp, 'en-US')}
    </time>
  `;
}
```

## `update()` — DOM Access via `Part`

The `update()` method gives you access to the `Part` object, which has a reference to the real DOM node. Use `update()` for imperative DOM manipulation that cannot be expressed as a return value:

```typescript
import { Directive, directive, PartType } from 'lit/directive.js';
import type { PartInfo, ElementPart } from 'lit/directive.js';
import { noChange } from 'lit';

class AutoResizeDirective extends Directive {
  private _observer: ResizeObserver | null = null;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('autoResize directive must be used on an element binding.');
    }
  }

  render(_minHeight: number = 0): typeof noChange {
    return noChange;
  }

  override update(part: ElementPart, [minHeight]: [number]) {
    const textarea = part.element as HTMLTextAreaElement;

    if (!this._observer) {
      textarea.style.overflow = 'hidden';
      this._resizeToFit(textarea, minHeight);

      textarea.addEventListener('input', () => this._resizeToFit(textarea, minHeight));
    }

    return noChange; // tell Lit not to update the DOM node for this expression
  }

  private _resizeToFit(el: HTMLTextAreaElement, minHeight: number): void {
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  }
}

export const autoResize = directive(AutoResizeDirective);
```

Returning `noChange` from `update()` tells Lit that no DOM update is needed for this expression, avoiding unnecessary work.

## `AsyncDirective` — Cleanup in `disconnected()`

When a directive subscribes to external sources (events, observables, timers), use `AsyncDirective` to clean up in `disconnected()`:

```typescript
import { AsyncDirective, directive } from 'lit/async-directive.js';
import type { PartInfo } from 'lit/directive.js';

class LiveClockDirective extends AsyncDirective {
  private _intervalId: ReturnType<typeof setInterval> | null = null;
  private _locale: string = 'en-US';

  constructor(partInfo: PartInfo) {
    super(partInfo);
  }

  render(locale: string = 'en-US'): string {
    this._locale = locale;
    if (!this._intervalId) {
      this._intervalId = setInterval(() => {
        this.setValue(this._formatTime());
      }, 1000);
    }
    return this._formatTime();
  }

  // Called when the directive is disconnected from the DOM
  override disconnected(): void {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  // Called when the directive reconnects after being moved
  override reconnected(): void {
    if (!this._intervalId) {
      this._intervalId = setInterval(() => {
        this.setValue(this._formatTime());
      }, 1000);
    }
  }

  private _formatTime(): string {
    return new Intl.DateTimeFormat(this._locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());
  }
}

export const liveClock = directive(LiveClockDirective);
```

Usage:

```typescript
import { liveClock } from './directives/live-clock.js';

override render() {
  return html`
    <time class="clock">${liveClock('en-US')}</time>
  `;
}
```

## Tooltip Directive Example

A tooltip directive that attaches a lightweight floating tooltip to an element and cleans up when the element is removed:

```typescript
import { AsyncDirective, directive } from 'lit/async-directive.js';
import type { ElementPart, PartInfo } from 'lit/directive.js';
import { PartType } from 'lit/directive.js';
import { noChange } from 'lit';

class TooltipDirective extends AsyncDirective {
  private _tooltip: HTMLElement | null = null;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('tooltip directive must be used on an element: <button ${tooltip("text")}>');
    }
  }

  render(_text: string): typeof noChange {
    return noChange;
  }

  override update(part: ElementPart, [text]: [string]) {
    const anchor = part.element as HTMLElement;
    if (!this._tooltip) {
      this._tooltip = document.createElement('div');
      this._tooltip.setAttribute('role', 'tooltip');
      this._tooltip.style.cssText =
        'position:absolute;background:#333;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px;pointer-events:none;opacity:0;transition:opacity 0.15s';
      document.body.appendChild(this._tooltip);

      anchor.addEventListener('mouseenter', () => {
        this._tooltip!.textContent = text;
        this._tooltip!.style.opacity = '1';
      });
      anchor.addEventListener('mouseleave', () => {
        this._tooltip!.style.opacity = '0';
      });
    } else {
      this._tooltip.textContent = text;
    }
    return noChange;
  }

  override disconnected(): void {
    this._tooltip?.remove();
    this._tooltip = null;
  }
}

export const tooltip = directive(TooltipDirective);
```

## When to Write a Directive vs a Controller

| Situation | Use |
|---|---|
| Need to pass a value back into the template via an expression | Directive |
| Need access to a specific DOM node within a template | Directive with `update()` |
| Need cleanup logic tied to an expression position (not the whole element) | `AsyncDirective` |
| Need behavior that spans the full element lifecycle | Controller |
| Need to share state across multiple components | Controller or Context |
| Need to react to property changes on the host | Controller (`hostUpdated`) |

## Next Steps

- [Reactive Controllers](/components-guide/advanced/controllers/) — lifecycle-aware behavior classes
- [Rendering Performance](/components-guide/performance/rendering/) — `guard`, `cache`, and `repeat` built-in directives
- [Composition Patterns](/components-guide/advanced/composition-patterns/) — the broader landscape of composition approaches
