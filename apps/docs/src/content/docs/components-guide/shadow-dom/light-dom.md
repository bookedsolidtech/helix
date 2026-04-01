---
title: Light DOM vs Shadow DOM
description: Understand the difference between light DOM and shadow DOM, when to use each, and hybrid rendering patterns in LitElement.
---

Every web component involves two DOM trees: the **light DOM** (the element's regular children and slotted content) and the **shadow DOM** (the component's encapsulated internal template). Understanding where your content lives — and how the browser composites them — is fundamental to building and consuming HELiX components correctly.

## Definitions

### Light DOM

The light DOM is the standard, visible DOM content that:

- Consumers write in their HTML markup between the component's open and closing tags.
- Lives as actual children of the custom element in the regular document tree.
- Is visible to `document.querySelector()` and `element.children`.
- Is styled by the host document's CSS.
- Gets projected into shadow DOM slots but is never moved — the light DOM stays where it is.

```html
<!-- This content is the light DOM of hx-card -->
<hx-card>
  <h2 slot="header">Patient Summary</h2>  <!-- light DOM node -->
  <p>Last updated January 15.</p>          <!-- light DOM node -->
  <hx-button slot="actions">Edit</hx-button> <!-- light DOM node -->
</hx-card>
```

```javascript
const card = document.querySelector('hx-card');
card.children; // NodeList [h2, p, hx-button] — all light DOM nodes
```

### Shadow DOM

The shadow DOM is the component's encapsulated internal template:

- Defined by the component author in `render()`.
- Lives in a shadow root attached to the host element.
- **Not** accessible via regular `document.querySelector()`.
- Styled by the component's own `static styles` only.
- Provides `<slot>` elements that render light DOM content as viewports.

```typescript
// This template defines the shadow DOM of hx-card
override render() {
  return html`
    <article class="card">                    <!-- shadow DOM node -->
      <header class="card__header">           <!-- shadow DOM node -->
        <slot name="header"></slot>           <!-- shadow DOM slot -->
      </header>
      <div class="card__body">               <!-- shadow DOM node -->
        <slot></slot>                         <!-- shadow DOM slot -->
      </div>
      <footer class="card__footer">          <!-- shadow DOM node -->
        <slot name="actions"></slot>          <!-- shadow DOM slot -->
      </footer>
    </article>
  `;
}
```

## The Flattened Tree

The browser composites the light DOM and shadow DOM into a **flattened tree** for rendering, styling, and accessibility. Content flows from light DOM into shadow DOM slot positions without being copied:

```
Flattened tree:
  hx-card (host)
  └── article.card (shadow)
      ├── header.card__header (shadow)
      │   └── h2 "Patient Summary"   ← light DOM, projected here
      ├── div.card__body (shadow)
      │   └── p "Last updated..."    ← light DOM, projected here
      └── footer.card__footer (shadow)
          └── hx-button "Edit"       ← light DOM, projected here
```

## When Content Lives in Each DOM

| Content | Where it lives | Visible to | Styled by |
|---|---|---|---|
| Slotted consumer markup | Light DOM | `document.querySelector()`, outer CSS | Host document CSS, `::slotted()` |
| Component template | Shadow DOM | `element.shadowRoot` only | Component's `static styles` |
| Shadow host element | Both (bridge) | Regular DOM | Both `:host` (inside) and element selectors (outside) |

## When to Use Light DOM (Slots)

Use slots when the content:

- Is owned by the consumer and may contain semantic HTML they control.
- Varies significantly between usages (headings, body text, icons, form fields).
- Needs to be searchable, indexable, or accessible at the document level.
- Benefits from consumer-defined styling.

```html
<!-- Good use of light DOM slot: consumer owns the content -->
<hx-dialog>
  <h2 slot="header">Confirm Deletion</h2>
  <p>This action cannot be undone. Are you sure?</p>
  <hx-button slot="footer" variant="danger">Delete</hx-button>
  <hx-button slot="footer" variant="secondary">Cancel</hx-button>
</hx-dialog>
```

## When to Use Shadow DOM (Internal Template)

Use shadow DOM for content that:

- Is structural/presentational boilerplate owned by the component (wrappers, icons, decorations).
- Must always render the same way regardless of consumer.
- Should be protected from accidental CSS or JS interference.
- Is an implementation detail that consumers should not depend on.

```typescript
// Good use of shadow DOM: structural chrome the consumer should not touch
override render() {
  return html`
    <div class="input-wrapper">    <!-- structural — shadow DOM -->
      <span class="prefix-icon">  <!-- decorative — shadow DOM -->
        <hx-icon name=${this.icon}></hx-icon>
      </span>
      <input                       <!-- functional — shadow DOM -->
        part="input"
        class="input"
        .value=${this.value}
      />
      <span class="suffix-icon">  <!-- decorative — shadow DOM -->
        ${this.loading ? html`<hx-spinner size="xs"></hx-spinner>` : nothing}
      </span>
    </div>
    <slot name="hint"></slot>      <!-- hint content — light DOM slot -->
    <slot name="error"></slot>     <!-- error content — light DOM slot -->
  `;
}
```

## Hybrid Patterns

Most HELiX components use both: shadow DOM for structural chrome, light DOM slots for consumer content.

```typescript
@customElement('hx-expandable-section')
export class HelixExpandableSection extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host { display: block; }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--hx-spacing-md);
        cursor: pointer;
        border-bottom: 1px solid var(--hx-color-neutral-200);
      }
      .body {
        padding: var(--hx-spacing-md);
      }
      .chevron {
        transition: transform var(--hx-duration-fast) var(--hx-easing-standard);
      }
      :host([open]) .chevron {
        transform: rotate(180deg);
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  open = false;

  private _toggle() {
    this.open = !this.open;
    this.dispatchEvent(
      new CustomEvent(this.open ? 'hx-open' : 'hx-close', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <!-- Shadow DOM: structural chrome -->
      <div
        class="header"
        role="button"
        tabindex="0"
        aria-expanded=${this.open}
        @click=${this._toggle}
        @keydown=${this._handleKeyDown}
      >
        <!-- Light DOM slot: consumer owns the header content -->
        <slot name="header"></slot>

        <!-- Shadow DOM: decorative chevron icon -->
        <hx-icon class="chevron" name="chevron-down" aria-hidden="true"></hx-icon>
      </div>

      <!-- Shadow DOM: structural body wrapper -->
      <div class="body" ?hidden=${!this.open}>
        <!-- Light DOM slot: consumer owns the body content -->
        <slot></slot>
      </div>
    `;
  }

  private _handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this._toggle();
    }
  }
}
```

## Light DOM Rendering (No Shadow DOM)

You can opt out of shadow DOM entirely by overriding `createRenderRoot()` to return the element itself. The component renders directly into the light DOM:

```typescript
@customElement('hx-no-shadow')
export class HelixNoShadow extends LitElement {
  // Override createRenderRoot to skip shadow DOM
  override createRenderRoot(): HTMLElement {
    return this; // render directly into the element
  }

  override render() {
    return html`<p>I live in the light DOM!</p>`;
  }
}
```

**Trade-offs of light DOM rendering:**

| Aspect | Light DOM | Shadow DOM |
|---|---|---|
| Style encapsulation | None | Full |
| CSS targeting | Standard selectors work | Only `:host`, `::part()`, custom properties |
| Framework compatibility | Better (Vue, Angular templates can select inside) | May need extra config |
| Global CSS exposure | Yes — page styles can affect | No — isolated |
| `slot` support | No | Yes |

HELiX components exclusively use shadow DOM for consistency and encapsulation. Light DOM rendering is only appropriate for thin wrapper or utility components where style encapsulation provides no benefit.

## Accessing Light DOM vs Shadow DOM in JavaScript

```javascript
const card = document.querySelector('hx-card');

// Light DOM — regular children
card.children;                        // light DOM children
card.querySelector('h2');             // finds light DOM h2
card.innerHTML;                       // light DOM markup only

// Shadow DOM — internal template
card.shadowRoot;                      // shadow root
card.shadowRoot.querySelector('div'); // finds shadow DOM div
card.shadowRoot.innerHTML;            // shadow DOM markup
```

## Next Steps

- [Shadow DOM Architecture](/components-guide/shadow-dom/architecture/) — shadow host, root, and tree
- [Slots and Content Projection](/components-guide/shadow-dom/slots/) — advanced slot patterns
- [Styling Shadow DOM](/components-guide/shadow-dom/styling/) — `::slotted()`, custom properties, and `::part()`
- [Your First Web Component](/components-guide/fundamentals/first-component/) — build a complete component from scratch
