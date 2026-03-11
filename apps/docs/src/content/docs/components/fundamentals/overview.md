---
title: Component Fundamentals Overview
description: Learn the core concepts behind web components, custom elements, Shadow DOM, and Lit 3.x — the foundation for building enterprise-grade, reusable UI components.
sidebar:
  order: 1
---

# Component Fundamentals Overview

Web components represent a paradigm shift in how we build reusable user interface elements. Rather than relying on framework-specific abstractions, web components are built on open web standards that work in any JavaScript environment—with or without a framework. This guide introduces the core concepts you'll use when building components in HELiX.

## Web Components Standards

Web Components is a suite of technologies standardized by the W3C that enable you to create truly reusable, encapsulated elements. All major browsers now support Web Components natively without polyfills, making them a reliable foundation for production applications.

Web Components comprises three core technologies:

- **Custom Elements API** — Register new HTML elements with custom behavior
- **Shadow DOM** — Encapsulate DOM trees and styles inside an element
- **HTML Templates** — Define inert markup that can be cloned and inserted dynamically

These standards work together to solve a fundamental problem: how do you create a piece of UI that is truly reusable, portable, and doesn't leak styles or JavaScript into the global scope?

## Custom Elements

A custom element is a user-defined HTML element with its own behavior and API. Custom elements extend the `HTMLElement` class and are registered with the browser's custom element registry.

### Defining a Custom Element

```typescript
class MyButton extends HTMLElement {
  connectedCallback() {
    // Called when element is inserted into DOM
    this.innerHTML = '<button>Click me</button>';
  }
}

customElements.define('my-button', MyButton);
```

Once registered, you can use the element in HTML:

```html
<my-button></my-button>
```

### Properties and Attributes

Custom elements can expose properties (JavaScript) and attributes (HTML). By convention, reflected properties automatically synchronize with attributes:

```typescript
class MyButton extends HTMLElement {
  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }
}
```

This allows consumers to use your element declaratively:

```html
<my-button disabled></my-button>
```

## Shadow DOM

Shadow DOM creates a boundary between your component's internal DOM and the outside world. Styles and JavaScript inside the shadow tree don't leak out, and styles from the page don't leak in. This is critical for building reliable components.

### Attaching a Shadow Root

```typescript
class MyCard extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px solid var(--hx-color-border);
        }
      </style>
      <slot></slot>
    `;
  }
}
```

### Shadow DOM Terminology

- **Shadow host** — The element that has a shadow tree attached (the custom element itself)
- **Shadow tree** — The DOM tree inside the shadow DOM
- **Shadow root** — The root node of the shadow tree
- **Shadow boundary** — The encapsulation barrier where styles and JavaScript can't cross

### Styling with Design Tokens

Shadow DOM enables style encapsulation, but components still need to be themeable. In HELiX, we use CSS custom properties (design tokens) with the `--hx-` prefix to allow consumers to customize appearance:

```typescript
const styles = css`
  :host {
    --_bg: var(--hx-button-bg, var(--hx-color-primary));
    --_text: var(--hx-button-text, var(--hx-color-text));

    background-color: var(--_bg);
    color: var(--_text);
  }
`;
```

This pattern allows consumers to override at the semantic level:

```css
hx-button {
  --hx-color-primary: #0066cc;
}
```

## Lit 3.x Introduction

Lit is a lightweight JavaScript library (5KB minified + gzipped) that simplifies building web components. It's built directly on top of the Web Components standards and adds three key capabilities:

### Reactive Properties

Lit lets you declare reactive properties that automatically trigger re-renders when they change. This eliminates the need to manually manipulate the DOM:

```typescript
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';

class HxButton extends LitElement {
  @property({ type: String })
  label = 'Click me';

  @property({ type: Boolean })
  disabled = false;

  render() {
    return html` <button ?disabled="${this.disabled}">${this.label}</button> `;
  }
}
```

### Declarative Templates

Lit templates are written in JavaScript using tagged template literals. This means you get full access to JavaScript expressions without custom template syntax:

```typescript
render() {
  return html`
    <div>
      <h2>${this.title}</h2>
      <p>${this.description}</p>
      <button @click="${this.handleClick}">
        ${this.isOpen ? 'Close' : 'Open'}
      </button>
    </div>
  `;
}
```

### Efficient Rendering

Lit only updates the parts of the DOM that have changed. Rather than rebuilding the entire component, it patches only what's necessary. This results in better performance and a more predictable mental model.

### Built-in Shadow DOM

Lit automatically creates a shadow root for your component and provides a convenient way to scope styles:

```typescript
static styles = css`
  :host {
    display: block;
  }

  .card {
    padding: var(--hx-spacing-md);
    border: 1px solid var(--hx-color-border);
  }
`;
```

## Interoperability

Because HELiX components are built on web standards, they work everywhere HTML works—in React, Vue, Angular, Next.js, or vanilla JavaScript. No framework-specific wrappers needed.

```html
<!-- Works in any context -->
<hx-button label="Save" @hx-click="${handleSave}"></hx-button>

<!-- Works in React -->
<HxButton label="Save" onHxClick="{handleSave}" />

<!-- Works in Vue -->
<hx-button label="Save" @hx-click="handleSave"></hx-button>
```

## Next Steps

Now that you understand the foundations, explore the related documentation:

- **[Building Components](/components/building/)** — Walk through creating your first Lit component with HELiX conventions
- **[Component Lifecycle](/components/lifecycle/)** — Deep dive into Lit's lifecycle hooks and when to use them
- **Styling & Design Tokens** — Learn how to use the HELiX design token system for theming and customization

## References

- [Lit Documentation](https://lit.dev/)
- [Lit Learning Resources](https://lit.dev/learn/)
- [MDN: Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [MDN: Using Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [MDN: Using Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [Web Components on webcomponents.org](https://www.webcomponents.org/)
