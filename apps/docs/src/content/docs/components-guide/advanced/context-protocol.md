---
title: Context Protocol
description: Share data across the HELiX component tree without prop drilling using the @lit/context package's provide and consume decorators.
---

The Lit Context Protocol lets a parent component make a value available to any descendant, regardless of how deeply nested. This is the correct pattern for cross-cutting concerns like theming, user session, feature flags, and design system configuration — values that many components need but that would be cumbersome to pass through every layer of the tree.

## Installation

```bash
npm install @lit/context
```

## Core API

```typescript
import { createContext, provide, consume, ContextProvider, ContextConsumer } from '@lit/context';
```

### `createContext<T>(key)`

Creates a typed context object. The key must be unique — use a Symbol or a namespaced string:

```typescript
import { createContext } from '@lit/context';

// Prefer Symbol keys to avoid name collisions across packages
export const themeContext = createContext<'light' | 'dark'>('hx-theme');
export const localeContext = createContext<string>('hx-locale');
export const featureFlagsContext = createContext<FeatureFlags>('hx-feature-flags');
```

The generic type parameter `T` is the type of the value provided and consumed.

## Providing Context

Use the `@provide` decorator (or the `ContextProvider` controller) to make a value available to descendants:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { themeContext, localeContext } from './contexts.js';

@customElement('hx-design-system-provider')
export class HelixDesignSystemProvider extends LitElement {

  // The @provide decorator makes this.theme available to all descendants
  // that consume themeContext
  @provide({ context: themeContext })
  @property({ type: String, reflect: true })
  theme: 'light' | 'dark' = 'light';

  @provide({ context: localeContext })
  @property({ type: String })
  locale: string = 'en-US';

  override render(): TemplateResult {
    return html`
      <div class="provider" data-theme=${this.theme}>
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-design-system-provider': HelixDesignSystemProvider;
  }
}
```

When `this.theme` changes, Lit's context protocol propagates the new value to all registered consumers automatically.

## Consuming Context

Use the `@consume` decorator to receive a context value from the nearest ancestor that provides it:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { themeContext } from './contexts.js';

@customElement('hx-themed-button')
export class HelixThemedButton extends LitElement {

  // Receives theme from the nearest ancestor hx-design-system-provider
  // The ! (definite assignment) is required because the value arrives after construction
  @consume({ context: themeContext, subscribe: true })
  theme!: 'light' | 'dark';

  override render(): TemplateResult {
    return html`
      <button class="btn btn--${this.theme}">
        <slot></slot>
      </button>
    `;
  }
}
```

The `subscribe: true` option causes the consumer to re-render whenever the provided value changes. Without it, the consumer only reads the value once on connect.

## Feature Flags Context

Context is well-suited to feature flags because many components throughout the tree may need to gate behavior, but the flag values should be managed in one place:

```typescript
// contexts.ts
import { createContext } from '@lit/context';

export interface HelixFeatureFlags {
  newNavigationEnabled: boolean;
  animationsEnabled: boolean;
  betaComponentsEnabled: boolean;
}

export const featureFlagsContext = createContext<HelixFeatureFlags>('hx-feature-flags');

// The provider — typically at the application root
@customElement('hx-app-shell')
export class HelixAppShell extends LitElement {
  @provide({ context: featureFlagsContext })
  featureFlags: HelixFeatureFlags = {
    newNavigationEnabled: false,
    animationsEnabled: true,
    betaComponentsEnabled: false,
  };

  override render() {
    return html`<slot></slot>`;
  }
}

// A consumer anywhere in the tree
@customElement('hx-nav')
export class HelixNav extends LitElement {
  @consume({ context: featureFlagsContext, subscribe: true })
  featureFlags!: HelixFeatureFlags;

  override render() {
    return html`
      ${this.featureFlags.newNavigationEnabled
        ? html`<hx-new-nav></hx-new-nav>`
        : html`<hx-classic-nav></hx-classic-nav>`}
    `;
  }
}
```

## Design System Configuration Context

HELiX uses context to share design system configuration across a component tree without requiring prop drilling through every level:

```typescript
import { createContext } from '@lit/context';

export interface HelixConfig {
  /** Default button variant when variant is not explicitly set. */
  defaultButtonVariant: 'primary' | 'secondary';
  /** Default icon size scale. */
  defaultIconSize: 'sm' | 'md' | 'lg';
  /** Whether to use reduced motion by default (overrides prefers-reduced-motion). */
  reducedMotion: boolean;
}

export const helixConfigContext = createContext<HelixConfig>('hx-config');

const DEFAULT_CONFIG: HelixConfig = {
  defaultButtonVariant: 'primary',
  defaultIconSize: 'md',
  reducedMotion: false,
};

@customElement('hx-provider')
export class HelixProvider extends LitElement {
  @provide({ context: helixConfigContext })
  @property({ attribute: false })
  config: HelixConfig = DEFAULT_CONFIG;

  override render() {
    return html`<slot></slot>`;
  }
}
```

## Context Without a Common Ancestor

When components need to share context but don't have a shared ancestor in the DOM, use the `ContextProvider` controller imperatively:

```typescript
import { ContextProvider } from '@lit/context';
import { themeContext } from './contexts.js';

// Create a provider attached to document.body — available to all elements
const provider = new ContextProvider(document.body, {
  context: themeContext,
  initialValue: 'light',
});

// Update from anywhere
function setTheme(theme: 'light' | 'dark'): void {
  provider.setValue(theme);
}
```

## Next Steps

- [Reactive Controllers](/components-guide/advanced/controllers/) — controller-based behavior, the mechanism `ContextProvider` uses internally
- [Composition Patterns](/components-guide/advanced/composition-patterns/) — when context is the right tool vs props or events
- [Async Tasks](/components-guide/advanced/tasks/) — loading context-dependent data asynchronously
