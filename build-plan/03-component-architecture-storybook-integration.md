# 3. Component Architecture & Storybook Integration

> **Section Owner**: Senior Frontend Engineer
> **Last Updated**: 2026-02-13
> **Interview Relevance**: This section demonstrates deep expertise in Lit Web Components, modern Storybook patterns, enterprise-grade component architecture, Drupal integration strategy, and healthcare-compliant accessibility -- the core technical differentiators for establishing a prime contractor foothold.

---

## Table of Contents

1. [Lit 3.x Component Architecture](#31-lit-3x-component-architecture)
2. [Component Library Structure](#32-component-library-structure)
3. [Storybook Integration](#33-storybook-integration)
4. [TypeScript & JSDoc Strategy](#34-typescript--jsdoc-strategy)
5. [Drupal Integration Documentation Strategy](#35-drupal-integration-documentation-strategy)
6. [Testing Implementation](#36-testing-implementation)
7. [Theming & Design Tokens](#37-theming--design-tokens)

---

## 3.1 Lit 3.x Component Architecture

### 3.1.1 Why Lit for This Project

Lit is the optimal choice for an enterprise healthcare content hub targeting Drupal integration for several reasons:

- **Framework-agnostic**: Lit components are standard Web Components. They work in Drupal TWIG templates, React portals, Angular wrappers, or plain HTML with zero framework coupling.
- **Lightweight**: The core library is approximately 5KB minified and compressed. For a public-facing healthcare content hub where performance directly impacts user trust and SEO, this matters.
- **Google-backed with enterprise adoption**: UI5 Web Components (SAP), Vaadin, and numerous enterprise design systems are built on Lit.
- **Native browser APIs**: No virtual DOM diffing. Lit touches only the dynamic parts of the UI during updates, yielding predictable performance.
- **Shadow DOM encapsulation**: Critical when injecting components into a Drupal theme where CSS conflicts are common.

### 3.1.2 Core Architectural Principles

Every component in this library follows these principles:

1. **Single Responsibility**: Each component does one thing well. A `chc-content-card` renders a content card -- it does not fetch data, manage routing, or handle global state.
2. **Composition Over Inheritance**: Use slot-based composition and reactive controllers rather than deep class hierarchies.
3. **Progressive Enhancement**: Components must render meaningful content even before JavaScript executes (critical for healthcare SEO and accessibility).
4. **Explicit Contracts**: Every public property, event, slot, and CSS custom property is documented in JSDoc, enforced by TypeScript, and surfaced in the Custom Elements Manifest.

### 3.1.3 Reactive Property Patterns

Lit's reactive properties form the data-binding contract between a component and its consumers (including Drupal TWIG templates).

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * A content card component for healthcare article previews.
 *
 * @element chc-content-card
 * @slot - Default slot for card body content
 * @slot media - Slot for hero image or video
 * @slot actions - Slot for CTA buttons
 *
 * @csspart card - The outer card container
 * @csspart header - The card header area
 * @csspart body - The card body area
 *
 * @cssprop [--chc-card-radius=8px] - Card border radius
 * @cssprop [--chc-card-padding=1.5rem] - Card internal padding
 * @cssprop [--chc-card-bg=var(--chc-surface)] - Card background color
 * @cssprop [--chc-card-shadow=0 2px 8px rgba(0,0,0,0.1)] - Card shadow
 *
 * @fires chc-card-click - Fired when the card is activated (click or Enter key)
 */
@customElement('chc-content-card')
export class ChcContentCard extends LitElement {
  /**
   * The card's heading text. Required.
   * Maps to Drupal field: `node.title`
   */
  @property({ type: String })
  heading = '';

  /**
   * Summary or teaser text for the card.
   * Maps to Drupal field: `node.field_summary.value`
   */
  @property({ type: String })
  summary = '';

  /**
   * URL for the full article. When set, the entire card becomes a link.
   * Maps to Drupal path: `node.url`
   */
  @property({ type: String })
  href = '';

  /**
   * Publication date in ISO 8601 format.
   * Maps to Drupal field: `node.created`
   */
  @property({ type: String, attribute: 'publish-date' })
  publishDate = '';

  /**
   * Content category label (e.g., "Mental Health", "Patient Resources").
   * Maps to Drupal field: `node.field_category.name`
   */
  @property({ type: String })
  category = '';

  /**
   * Estimated reading time in minutes.
   * Maps to Drupal computed field or custom module.
   */
  @property({ type: Number, attribute: 'read-time' })
  readTime = 0;

  /**
   * Visual variant of the card.
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'featured' | 'compact' = 'default';

  /** Internal loading state -- not exposed as attribute. */
  @state()
  private _imageLoaded = false;

  // ... render method below in section 3.1.6
}
```

**Key patterns demonstrated above:**

- **Attribute naming**: Use kebab-case attributes (`publish-date`, `read-time`) that map to camelCase properties. This is critical for Drupal TWIG templates where attributes are the primary interface.
- **Reflect**: Use `reflect: true` only for properties that affect CSS selectors (like `variant`), not for data properties.
- **@state()**: Internal state that should not be set externally. Never creates an HTML attribute.
- **Default values**: Every property has a sensible default so the component never renders in an undefined state.

### 3.1.4 Reactive Controllers for Shared Behavior

Reactive controllers are the primary mechanism for code reuse across components. They are preferred over mixins because they maintain their own identity, support multiple instances per component, and avoid prototype chain pollution.

```typescript
import { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Controller that detects reduced-motion preference and exposes it to the host.
 * Critical for healthcare accessibility -- users with vestibular disorders
 * must not be subjected to unexpected motion.
 */
export class ReducedMotionController implements ReactiveController {
  host: ReactiveControllerHost;

  /** Whether the user prefers reduced motion. */
  prefersReducedMotion = false;

  private _mediaQuery: MediaQueryList | null = null;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    this._mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this._mediaQuery.matches;
    this._mediaQuery.addEventListener('change', this._onChange);
  }

  hostDisconnected(): void {
    this._mediaQuery?.removeEventListener('change', this._onChange);
  }

  private _onChange = (e: MediaQueryListEvent): void => {
    this.prefersReducedMotion = e.matches;
    this.host.requestUpdate();
  };
}
```

```typescript
/**
 * Controller that manages intersection observer for lazy loading.
 * Reused across content cards, media components, and image galleries.
 */
export class IntersectionController implements ReactiveController {
  host: ReactiveControllerHost & HTMLElement;
  isVisible = false;

  private _observer: IntersectionObserver | null = null;
  private _options: IntersectionObserverInit;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: IntersectionObserverInit = { threshold: 0.1 }
  ) {
    this.host = host;
    this._options = options;
    host.addController(this);
  }

  hostConnected(): void {
    this._observer = new IntersectionObserver(([entry]) => {
      this.isVisible = entry.isIntersecting;
      this.host.requestUpdate();
    }, this._options);
    this._observer.observe(this.host);
  }

  hostDisconnected(): void {
    this._observer?.disconnect();
  }
}
```

**Controllers we will build for this project:**

| Controller | Purpose | Used By |
|---|---|---|
| `IntersectionController` | Lazy loading, scroll-triggered animations | Cards, media, images |
| `ReducedMotionController` | Accessibility: respect `prefers-reduced-motion` | All animated components |
| `FormValidationController` | Shared validation logic with `ElementInternals` | All form components |
| `MediaQueryController` | Responsive behavior without CSS-only solutions | Navigation, layouts |
| `FocusTrapController` | Modal/dialog focus management | Modals, menus, drawers |
| `AnnounceController` | Screen reader live region announcements | Forms, notifications |

### 3.1.5 Context Protocol for Shared State

The `@lit/context` package implements the W3C Community Context Protocol, enabling data sharing across component subtrees without manual property threading. This is particularly valuable in a Drupal context where component nesting is determined by TWIG templates, not JavaScript.

```typescript
import { createContext } from '@lit/context';

/** Theme context shared across the entire component tree. */
export interface ChcTheme {
  mode: 'light' | 'dark' | 'high-contrast';
  scale: 'default' | 'large';
  locale: string;
}

export const themeContext = createContext<ChcTheme>(Symbol('chc-theme'));
```

```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { themeContext, type ChcTheme } from './contexts/theme-context.js';

/**
 * Theme provider that wraps the component tree.
 * Placed once in the Drupal theme's page template.
 *
 * @element chc-theme-provider
 * @slot - All themed content
 */
@customElement('chc-theme-provider')
export class ChcThemeProvider extends LitElement {
  @provide({ context: themeContext })
  @property({ attribute: false })
  theme: ChcTheme = {
    mode: 'light',
    scale: 'default',
    locale: 'en-US',
  };

  render() {
    return html`<slot></slot>`;
  }
}
```

```typescript
import { consume } from '@lit/context';
import { themeContext, type ChcTheme } from './contexts/theme-context.js';

// Inside any descendant component:
@consume({ context: themeContext, subscribe: true })
@property({ attribute: false })
theme?: ChcTheme;
```

**When to use Context vs. Properties vs. Events:**

| Mechanism | Use When | Healthcare Example |
|---|---|---|
| **Properties** | Direct parent-child data binding | Card receiving `heading` from TWIG |
| **Context** | Data needed by many descendants, set once at top | Theme mode, locale, analytics config |
| **Events** | Child communicates upward to unknown ancestors | Card click, form submission, navigation |

### 3.1.6 Event System Architecture

Custom events follow a strict contract. Every event type is defined in TypeScript, documented in JSDoc, and surfaced in the Custom Elements Manifest.

```typescript
/**
 * Event detail for card interaction events.
 */
export interface CardClickDetail {
  /** The href of the clicked card */
  href: string;
  /** The card heading text */
  heading: string;
  /** Whether the user used keyboard activation */
  keyboard: boolean;
}

/**
 * Custom event map for chc-content-card.
 * Enables type-safe addEventListener in TypeScript consumers.
 */
export interface ChcContentCardEventMap {
  'chc-card-click': CustomEvent<CardClickDetail>;
}
```

```typescript
// Inside the component's render method:

render() {
  const tag = this.href ? 'a' : 'div';

  return html`
    <${tag}
      part="card"
      class="card card--${this.variant}"
      href=${this.href || nothing}
      role=${this.href ? nothing : 'button'}
      tabindex=${this.href ? nothing : '0'}
      @click=${this._handleActivate}
      @keydown=${this._handleKeydown}
    >
      <div part="header" class="card__header">
        <slot name="media"></slot>
        ${this.category ? html`
          <span class="card__category">${this.category}</span>
        ` : nothing}
      </div>
      <div part="body" class="card__body">
        <h3 class="card__heading">${this.heading}</h3>
        ${this.summary ? html`
          <p class="card__summary">${this.summary}</p>
        ` : nothing}
        <slot></slot>
      </div>
      <div class="card__footer">
        ${this.readTime > 0 ? html`
          <span class="card__read-time">${this.readTime} min read</span>
        ` : nothing}
        ${this.publishDate ? html`
          <time class="card__date" datetime=${this.publishDate}>
            ${this._formatDate(this.publishDate)}
          </time>
        ` : nothing}
        <slot name="actions"></slot>
      </div>
    </${tag}>
  `;
}

private _handleActivate(e: Event): void {
  this.dispatchEvent(new CustomEvent<CardClickDetail>('chc-card-click', {
    bubbles: true,
    composed: true, // Crosses shadow DOM boundaries
    detail: {
      href: this.href,
      heading: this.heading,
      keyboard: false,
    },
  }));
}

private _handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    this.dispatchEvent(new CustomEvent<CardClickDetail>('chc-card-click', {
      bubbles: true,
      composed: true,
      detail: {
        href: this.href,
        heading: this.heading,
        keyboard: true,
      },
    }));
  }
}
```

**Event naming conventions:**
- Prefix all events with `chc-` to prevent collision with native events and other libraries
- Use kebab-case: `chc-card-click`, `chc-form-submit`, `chc-nav-toggle`
- Always set `composed: true` so events cross shadow DOM boundaries (required for Drupal event listeners)
- Always set `bubbles: true` so events can be caught at any ancestor level

### 3.1.7 Slot-Based Composition Patterns

Slots are the primary composition mechanism. They allow Drupal TWIG templates to inject arbitrary content into predefined areas of a component.

**Named Slot Strategy:**

```typescript
/**
 * Article layout component that structures long-form healthcare content.
 *
 * @element chc-article-layout
 * @slot hero - Full-width hero image or video area
 * @slot breadcrumb - Breadcrumb navigation
 * @slot sidebar - Sidebar content (table of contents, related articles)
 * @slot author - Author bio section
 * @slot - Default slot for article body content
 * @slot footer - Article footer (tags, share buttons, related content)
 */
@customElement('chc-article-layout')
export class ChcArticleLayout extends LitElement {
  static styles = css`
    :host {
      display: block;
      max-width: var(--chc-article-max-width, 1200px);
      margin: 0 auto;
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--chc-spacing-lg, 2rem);
    }

    @media (min-width: 768px) {
      .layout--with-sidebar {
        grid-template-columns: 1fr var(--chc-sidebar-width, 300px);
      }
    }
  `;

  @property({ type: Boolean, attribute: 'has-sidebar', reflect: true })
  hasSidebar = false;

  render() {
    return html`
      <slot name="breadcrumb"></slot>
      <slot name="hero"></slot>
      <div class="layout ${this.hasSidebar ? 'layout--with-sidebar' : ''}">
        <article class="layout__main">
          <slot name="author"></slot>
          <div class="layout__content">
            <slot></slot>
          </div>
        </article>
        ${this.hasSidebar ? html`
          <aside class="layout__sidebar">
            <slot name="sidebar"></slot>
          </aside>
        ` : nothing}
      </div>
      <slot name="footer"></slot>
    `;
  }
}
```

**Slotchange Detection for Progressive Enhancement:**

```typescript
connectedCallback(): void {
  super.connectedCallback();
  this.shadowRoot?.addEventListener('slotchange', this._onSlotChange);
}

private _onSlotChange = (e: Event): void => {
  const slot = e.target as HTMLSlot;
  const assignedNodes = slot.assignedNodes({ flatten: true });
  // Adjust layout based on which slots have content
  if (slot.name === 'sidebar') {
    this.hasSidebar = assignedNodes.length > 0;
  }
};
```

### 3.1.8 Shadow DOM Strategy

Not every component needs Shadow DOM. The decision matrix:

| Use Shadow DOM | Use Light DOM | Rationale |
|---|---|---|
| Design system primitives (buttons, cards, inputs) | Layout wrappers | Encapsulation protects internal styles |
| Components with complex internal structure | Simple text formatting components | Prevents Drupal theme CSS bleed |
| Components with internal state/logic | Components that primarily pass through content | Shadow DOM provides clean internal API |

**Light DOM opt-in (when needed):**

```typescript
@customElement('chc-prose')
export class ChcProse extends LitElement {
  /** Render to light DOM so Drupal CKEditor content styles apply. */
  protected createRenderRoot(): HTMLElement {
    return this;
  }

  render() {
    return html`<slot></slot>`;
  }
}
```

### 3.1.9 Form-Associated Custom Elements

Healthcare forms (patient intake, appointment requests, feedback) require full form participation. Lit components achieve this through the `ElementInternals` API.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

/**
 * Accessible text input for healthcare forms.
 * Fully participates in native <form> elements and FormData.
 *
 * @element chc-text-input
 * @fires chc-input - Fired on each input event with current value
 * @fires chc-change - Fired on blur when value has changed
 */
@customElement('chc-text-input')
export class ChcTextInput extends LitElement {
  /** Enable form association. */
  static formAssociated = true;

  private _internals: ElementInternals;

  @property({ type: String }) label = '';
  @property({ type: String }) name = '';
  @property({ type: String }) value = '';
  @property({ type: String }) type: 'text' | 'email' | 'tel' | 'url' = 'text';
  @property({ type: Boolean }) required = false;
  @property({ type: String, attribute: 'error-message' }) errorMessage = '';
  @property({ type: String, attribute: 'help-text' }) helpText = '';

  @state() private _touched = false;
  @state() private _invalid = false;

  @query('input') private _input!: HTMLInputElement;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  /** Allow the form to read this component's value. */
  get form(): HTMLFormElement | null { return this._internals.form; }
  get validity(): ValidityState { return this._internals.validity; }
  get validationMessage(): string { return this._internals.validationMessage; }

  private _updateFormValue(): void {
    this._internals.setFormValue(this.value);
  }

  private _validate(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.errorMessage || `${this.label} is required`,
        this._input
      );
      this._invalid = true;
    } else {
      this._internals.setValidity({});
      this._invalid = false;
    }
  }

  private _onInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._updateFormValue();
    this._validate();
    this.dispatchEvent(new CustomEvent('chc-input', {
      bubbles: true,
      composed: true,
      detail: { value: this.value, name: this.name },
    }));
  }

  private _onBlur(): void {
    this._touched = true;
    this._validate();
    this.dispatchEvent(new CustomEvent('chc-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.value, name: this.name },
    }));
  }

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('value')) {
      this._updateFormValue();
    }
  }

  render() {
    const inputId = `input-${this.name}`;
    const helpId = `help-${this.name}`;
    const errorId = `error-${this.name}`;
    const showError = this._touched && this._invalid;

    return html`
      <div class="field ${showError ? 'field--error' : ''}">
        <label for=${inputId} class="field__label">
          ${this.label}
          ${this.required ? html`<span class="field__required" aria-hidden="true">*</span>` : nothing}
        </label>
        ${this.helpText ? html`
          <div id=${helpId} class="field__help">${this.helpText}</div>
        ` : nothing}
        <input
          id=${inputId}
          type=${this.type}
          name=${this.name}
          .value=${this.value}
          ?required=${this.required}
          aria-invalid=${showError ? 'true' : 'false'}
          aria-describedby=${[
            this.helpText ? helpId : '',
            showError ? errorId : '',
          ].filter(Boolean).join(' ') || nothing}
          @input=${this._onInput}
          @blur=${this._onBlur}
        />
        ${showError ? html`
          <div id=${errorId} class="field__error" role="alert">
            ${this._internals.validationMessage}
          </div>
        ` : nothing}
      </div>
    `;
  }
}
```

**Key accessibility requirements for healthcare forms (WCAG 2.1 AA minimum):**

- Every input must have a visible, programmatically-associated `<label>` (WCAG 1.3.1)
- Error messages must be announced via `role="alert"` or `aria-live` (WCAG 3.3.1)
- Error messages must describe what went wrong, not just flag the error (WCAG 3.3.3)
- Required fields must be indicated both visually and programmatically (WCAG 3.3.2)
- Focus must move to the first error field on form submission (WCAG 3.3.1)
- Color alone must not indicate state -- errors need icons and text, not just red borders (WCAG 1.4.1)

---

## 3.2 Component Library Structure

### 3.2.1 Atomic Design Hierarchy

The library follows an adapted Atomic Design methodology. The hierarchy maps directly to Drupal's content architecture.

```
src/
  components/
    atoms/                      # Smallest indivisible UI elements
      chc-button/
        chc-button.ts           # Component class
        chc-button.styles.ts    # Scoped styles
        chc-button.test.ts      # Unit tests
        chc-button.stories.ts   # Storybook stories
        index.ts                # Public exports
      chc-icon/
      chc-badge/
      chc-text-input/
      chc-textarea/
      chc-select/
      chc-checkbox/
      chc-radio/
      chc-toggle/
      chc-avatar/
      chc-spinner/
      chc-tag/
      chc-tooltip/
      chc-sr-only/              # Screen-reader-only text

    molecules/                  # Combinations of atoms
      chc-search-bar/           # Input + button + icon
      chc-form-field/           # Label + input + help + error
      chc-breadcrumb/
      chc-pagination/
      chc-media-object/         # Image + text layout
      chc-alert/                # Icon + message + dismiss
      chc-accordion-item/
      chc-tab-item/
      chc-dropdown-menu/

    organisms/                  # Complex, self-contained sections
      chc-content-card/         # Hero slot + heading + summary + meta
      chc-article-layout/       # Full article page structure
      chc-header/               # Site header with nav
      chc-footer/               # Site footer
      chc-nav-primary/          # Primary navigation with mega-menu
      chc-nav-mobile/           # Mobile navigation drawer
      chc-hero-banner/          # Full-width hero with CTA
      chc-card-grid/            # Responsive grid of content cards
      chc-form/                 # Form wrapper with validation
      chc-accordion/            # Accordion group
      chc-tabs/                 # Tab group
      chc-modal/                # Modal dialog
      chc-media-gallery/        # Image/video gallery
      chc-table/                # Accessible data table
      chc-sidebar/              # Sidebar widget area

    templates/                  # Page-level layout components
      chc-page-layout/          # Base page grid (header/main/footer)
      chc-article-page/         # Article content page layout
      chc-landing-page/         # Landing page layout
      chc-search-results-page/  # Search results layout

  controllers/                  # Reactive controllers
    intersection.controller.ts
    reduced-motion.controller.ts
    form-validation.controller.ts
    media-query.controller.ts
    focus-trap.controller.ts
    announce.controller.ts

  contexts/                     # Lit context definitions
    theme-context.ts
    locale-context.ts

  directives/                   # Custom Lit directives
    safe-html.directive.ts      # Sanitized HTML rendering
    external-link.directive.ts  # Auto-add external link indicators

  styles/                       # Shared styles and design tokens
    tokens/
      colors.ts
      spacing.ts
      typography.ts
      elevation.ts
      breakpoints.ts
    shared/
      reset.styles.ts           # Minimal reset for shadow DOM
      typography.styles.ts      # Shared type styles
      focus.styles.ts           # Focus ring styles (critical for a11y)
    themes/
      light.css                 # Light mode token values
      dark.css                  # Dark mode token values
      high-contrast.css         # High contrast mode (WCAG AAA)

  types/                        # Shared TypeScript types
    events.ts                   # All custom event detail interfaces
    props.ts                    # Shared property type unions
    a11y.ts                     # ARIA attribute type helpers

  utils/                        # Pure utility functions
    date-format.ts
    string-sanitize.ts
    id-generator.ts

  index.ts                      # Main entry -- exports all components
```

### 3.2.2 Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Custom element tag | `chc-[name]` (kebab-case, `chc` prefix) | `chc-content-card` |
| TypeScript class | `Chc[Name]` (PascalCase with `Chc` prefix) | `ChcContentCard` |
| File names | `chc-[name].ts` (match tag name) | `chc-content-card.ts` |
| CSS custom properties | `--chc-[component]-[property]` | `--chc-card-radius` |
| CSS parts | Descriptive, no prefix needed | `card`, `header`, `body` |
| Events | `chc-[component]-[action]` | `chc-card-click` |
| Slots | Semantic name or empty for default | `media`, `actions`, (default) |
| Controllers | `[Name]Controller` | `IntersectionController` |
| Contexts | `[name]Context` | `themeContext` |

### 3.2.3 Healthcare Content Hub Component Inventory

These components are designed specifically for the healthcare content hub use case:

**Content Discovery Components:**

| Component | Drupal Mapping | Purpose |
|---|---|---|
| `chc-content-card` | Node teaser view mode | Blog/article preview card |
| `chc-card-grid` | Views block output | Responsive grid of content cards |
| `chc-hero-banner` | Paragraph: Hero | Full-width hero with CTA |
| `chc-search-bar` | Search API form | Site search with autocomplete |
| `chc-breadcrumb` | System breadcrumb block | Navigation breadcrumbs |
| `chc-pagination` | Views pager | Page navigation for lists |

**Content Consumption Components:**

| Component | Drupal Mapping | Purpose |
|---|---|---|
| `chc-article-layout` | Node full view mode | Long-form article structure |
| `chc-accordion` | Paragraph: FAQ | Expandable FAQ sections |
| `chc-tabs` | Paragraph: Tabbed Content | Tabbed information panels |
| `chc-table` | Field: Table | Accessible data tables |
| `chc-media-gallery` | Paragraph: Gallery | Image/video galleries |

**Navigation Components:**

| Component | Drupal Mapping | Purpose |
|---|---|---|
| `chc-header` | Header block region | Site header |
| `chc-nav-primary` | Main menu block | Desktop navigation |
| `chc-nav-mobile` | Main menu block (mobile) | Mobile navigation drawer |
| `chc-footer` | Footer block region | Site footer |

**Form Components (Accessibility-Critical):**

| Component | Drupal Mapping | Purpose |
|---|---|---|
| `chc-text-input` | Form API: textfield | Text input with validation |
| `chc-textarea` | Form API: textarea | Multi-line text input |
| `chc-select` | Form API: select | Dropdown selection |
| `chc-checkbox` | Form API: checkbox | Checkbox with label |
| `chc-radio` | Form API: radios | Radio button group |
| `chc-form` | Webform / Form API | Form wrapper with submit handling |

---

## 3.3 Storybook Integration

### 3.3.1 Storybook Configuration

The project now uses **Storybook 10.x** (10.2.8) with CSF Factories support. The upgrade from 8.x brings improved performance, better Web Components integration, and native support for modern story formats.

**`.storybook/main.ts`:**

```typescript
import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: [
    '@storybook/addon-essentials',    // Controls, actions, viewport, backgrounds
    '@storybook/addon-a11y',          // axe-core accessibility audit per story
    '@storybook/addon-links',         // Cross-story navigation
    '@storybook/addon-designs',       // Figma embed integration
    '@storybook/addon-interactions',  // Play function testing
  ],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  docs: {
    autodocs: true,                   // Auto-generate docs from CEM
  },
};

export default config;
```

**`.storybook/preview.ts`:**

```typescript
import type { Preview } from '@storybook/web-components';
import { setCustomElementsManifest } from '@storybook/web-components';
import customElements from '../custom-elements.json';

// Register the Custom Elements Manifest so Storybook can
// auto-generate controls, docs tables, and source snippets.
setCustomElementsManifest(customElements);

// Import global design tokens
import '../src/styles/themes/light.css';
import '../src/styles/themes/dark.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    // Healthcare-specific viewport presets
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '900px' } },
        largeDesktop: { name: 'Large Desktop', styles: { width: '1920px', height: '1080px' } },
      },
    },
    backgrounds: {
      values: [
        { name: 'Light', value: '#ffffff' },
        { name: 'Dark', value: '#1a1a2e' },
        { name: 'High Contrast', value: '#000000' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  // Global decorators for theme wrapping
  decorators: [
    (story, context) => {
      const theme = context.globals.theme ?? 'light';
      return `
        <chc-theme-provider>
          <div data-theme="${theme}" style="padding: 1rem;">
            ${story()}
          </div>
        </chc-theme-provider>
      `;
    },
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'high-contrast', title: 'High Contrast' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
```

### 3.3.2 Custom Elements Manifest Generation

The Custom Elements Manifest (CEM) is the bridge between component source code and Storybook's auto-documentation. It is generated from JSDoc annotations and TypeScript types -- this is why 100% JSDoc coverage is non-negotiable.

**`custom-elements-manifest.config.mjs`:**

```javascript
import { litPlugin } from '@custom-elements-manifest/analyzer/src/features/analyse-phase/creators/lit.js';

export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.stories.ts', '**/*.styles.ts'],
  outdir: '.',
  litelement: true,
  plugins: [
    litPlugin(),
    // Plugin to extract @fires, @slot, @csspart, @cssprop JSDoc tags
  ],
};
```

**Build integration:**

```json
{
  "scripts": {
    "cem": "cem analyze",
    "cem:watch": "cem analyze --watch",
    "storybook": "npm run cem && storybook dev -p 6006",
    "build-storybook": "npm run cem && storybook build"
  }
}
```

The CEM is regenerated before every Storybook session, ensuring documentation always reflects the current source code.

### 3.3.3 Story Structure with wc-storybook-helpers

The `wc-storybook-helpers` package by Burton Smith auto-generates Storybook controls from the Custom Elements Manifest, eliminating manual `argTypes` maintenance.

```typescript
// src/components/organisms/chc-content-card/chc-content-card.stories.ts

import type { Meta, StoryObj } from '@storybook/web-components';
import { getWcStorybookHelpers } from 'wc-storybook-helpers';
import './chc-content-card.js';

const { events, args, argTypes, template } =
  getWcStorybookHelpers('chc-content-card');

const meta: Meta = {
  title: 'Organisms/Content Card',
  component: 'chc-content-card',
  args: {
    ...args,
    heading: 'Understanding Anxiety: A Patient Guide',
    summary: 'Learn about the symptoms, causes, and evidence-based treatments for anxiety disorders.',
    category: 'Mental Health',
    href: '/articles/understanding-anxiety',
    publishDate: '2026-02-10',
    readTime: 8,
    variant: 'default',
  },
  argTypes,
  parameters: {
    actions: { handles: events },
    docs: {
      description: {
        component: `
A content card for healthcare article previews. Used in content listing pages,
search results, and related content sections.

**Drupal Integration**: Maps to the \`node--article--teaser\` view mode.
See the [Drupal Integration](#drupal-integration) tab for TWIG examples.
        `,
      },
    },
  },
  render: (renderArgs) => template(renderArgs),
};

export default meta;
type Story = StoryObj;

/**
 * Default card with all required props.
 * This is the most common usage in article listing pages.
 */
export const Default: Story = {};

/**
 * Featured variant with larger visual treatment.
 * Used for hero articles and editorial picks.
 */
export const Featured: Story = {
  args: {
    variant: 'featured',
    heading: 'New Telehealth Services Now Available',
    summary: 'We are expanding our virtual care options to serve you better, including mental health counseling and specialist consultations.',
    category: 'Announcements',
  },
};

/**
 * Compact variant for sidebar and related content areas.
 */
export const Compact: Story = {
  args: {
    variant: 'compact',
    heading: '5 Tips for Better Sleep',
    category: 'Wellness',
    readTime: 3,
  },
};

/**
 * Card with media slot populated (hero image).
 */
export const WithImage: Story = {
  render: (renderArgs) => `
    <chc-content-card
      heading="${renderArgs.heading}"
      summary="${renderArgs.summary}"
      category="${renderArgs.category}"
      href="${renderArgs.href}"
      publish-date="${renderArgs.publishDate}"
      read-time="${renderArgs.readTime}"
    >
      <img
        slot="media"
        src="https://placehold.co/600x300/e2e8f0/64748b?text=Health+Article"
        alt=""
        loading="lazy"
      />
    </chc-content-card>
  `,
};

/**
 * Card without optional props, demonstrating graceful degradation.
 * Components must remain visually coherent with minimal data.
 */
export const MinimalData: Story = {
  args: {
    heading: 'Article Title Only',
    summary: '',
    category: '',
    href: '',
    publishDate: '',
    readTime: 0,
  },
};

/**
 * Accessibility: Focus state demonstration.
 * Interactive test showing keyboard navigation behavior.
 */
export const FocusState: Story = {
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('chc-content-card');
    card?.focus();
  },
};

/**
 * Grid of cards demonstrating responsive layout.
 */
export const CardGrid: Story = {
  render: () => `
    <chc-card-grid columns="3">
      <chc-content-card
        heading="Understanding Anxiety"
        summary="Learn about symptoms, causes, and treatments."
        category="Mental Health"
        read-time="8"
      ></chc-content-card>
      <chc-content-card
        heading="Heart Health Basics"
        summary="Preventive care for cardiovascular wellness."
        category="Cardiology"
        read-time="5"
      ></chc-content-card>
      <chc-content-card
        heading="Nutrition After 50"
        summary="Dietary guidelines for healthy aging."
        category="Nutrition"
        read-time="6"
      ></chc-content-card>
    </chc-card-grid>
  `,
};
```

### 3.3.4 Documentation Strategy in Storybook

Each component has multiple documentation surfaces:

**Auto-generated (from CEM + JSDoc):**
- Props/attributes table with types, defaults, and descriptions
- Events table
- Slots table
- CSS custom properties table
- CSS parts table
- Source code snippets

**Hand-written (in stories file or MDX):**
- Usage guidelines and when to use vs. not use
- Drupal integration examples (TWIG templates)
- Accessibility notes specific to the component
- Design rationale and UX guidelines

**MDX Documentation Page Example:**

```mdx
{/* src/components/organisms/chc-content-card/chc-content-card.docs.mdx */}

import { Meta, Canvas, Story, Controls, Source } from '@storybook/blocks';
import * as CardStories from './chc-content-card.stories';

<Meta of={CardStories} />

# Content Card

The content card is the primary content discovery element in the healthcare
content hub. It renders article previews in listing pages, search results,
and sidebar widgets.

## Usage Guidelines

### When to Use
- Article listing pages (blog index, category pages)
- Search result items
- Related content sections in article sidebars
- Editorial pick sections on landing pages

### When NOT to Use
- Navigational links (use `chc-nav-*` components)
- Alert/notification content (use `chc-alert`)
- Promotional banners (use `chc-hero-banner`)

## Interactive Demo

<Canvas of={CardStories.Default} />
<Controls of={CardStories.Default} />

## Variants

<Canvas of={CardStories.Featured} />
<Canvas of={CardStories.Compact} />

## Drupal Integration

In your Drupal theme, override the node teaser template:

<Source language="twig" code={`
{# templates/node--article--teaser.html.twig #}
<chc-content-card
  heading="{{ label[0]['#title'] ?? node.label }}"
  summary="{{ content.field_summary|render|striptags|trim }}"
  category="{{ node.field_category.entity.label }}"
  href="{{ url }}"
  publish-date="{{ node.createdtime|date('c') }}"
  read-time="{{ content.field_read_time|render|striptags|trim }}"
  variant="{{ is_promoted ? 'featured' : 'default' }}"
>
  {% if content.field_media|render|trim is not empty %}
    <div slot="media">
      {{ content.field_media }}
    </div>
  {% endif %}

  {% if content.field_tags|render|trim is not empty %}
    <div slot="actions">
      {{ content.field_tags }}
    </div>
  {% endif %}
</chc-content-card>
`} />

## Accessibility Checklist

| Requirement | Implementation | WCAG |
|---|---|---|
| Card heading is semantic | Uses `<h3>` inside shadow DOM | 1.3.1 |
| Interactive card is keyboard accessible | `tabindex="0"`, Enter/Space activation | 2.1.1 |
| Focus indicator visible | Custom focus ring via `:focus-visible` | 2.4.7 |
| Color is not sole indicator | Category uses text + optional color | 1.4.1 |
| Link purpose clear from context | Heading text describes destination | 2.4.4 |
| Images have appropriate alt text | Consumer responsibility via slot | 1.1.1 |
```

### 3.3.5 Storybook Add-ons for Healthcare Context

| Add-on | Purpose | Healthcare Relevance |
|---|---|---|
| `@storybook/addon-a11y` | axe-core accessibility audit | WCAG 2.1 AA compliance is mandatory for healthcare |
| `@storybook/addon-viewport` | Responsive testing | Patients access on mobile, tablet, desktop |
| `@storybook/addon-interactions` | Play function test execution | Verify keyboard navigation, form flows |
| `@storybook/addon-designs` | Figma frame embedding | Design review in context |
| `@storybook/addon-links` | Cross-story navigation | Link related components (card -> card grid) |

---

## 3.4 TypeScript & JSDoc Strategy

### 3.4.1 TypeScript Configuration

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    // Strict mode -- every flag enabled, no exceptions
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,

    // Lit decorator support
    "experimentalDecorators": true,
    "useDefineForClassFields": false,

    // Output
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",

    // No implicit any -- the entire library is fully typed
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    // Plugin for template type checking
    "plugins": [
      {
        "name": "ts-lit-plugin",
        "strict": true,
        "rules": {
          "no-unknown-tag-name": "error",
          "no-missing-import": "error",
          "no-unknown-attribute": "error",
          "no-unknown-property": "error",
          "no-unknown-event": "error",
          "no-unknown-slot": "error",
          "no-invalid-css": "warning"
        }
      }
    ]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/*.stories.ts"]
}
```

**Key decisions:**

- **`experimentalDecorators: true`** with **`useDefineForClassFields: false`**: Required for Lit's decorator syntax. Standard TC39 decorators with the `accessor` keyword are supported in Lit but produce less optimal compiler output as of 2026. We will migrate to standard decorators when the output matches.
- **`ts-lit-plugin`**: Provides template-level type checking inside `html` tagged template literals. It validates tag names, attributes, properties, events, and slot names against the Custom Elements Manifest. This catches errors at author time rather than runtime.
- **Full strict mode**: No exceptions. Healthcare software demands the highest confidence in type safety.

### 3.4.2 JSDoc Coverage Requirements

Every public API surface must have JSDoc documentation. The CEM analyzer extracts this documentation to generate Storybook controls, IDE autocomplete, and API docs.

**Required JSDoc tags by entity:**

| Entity | Required Tags | Example |
|---|---|---|
| Component class | `@element`, `@slot`, `@csspart`, `@cssprop`, `@fires` | See section 3.1.3 |
| Public property | Description, Drupal field mapping | `/** The card heading. Maps to node.title */` |
| Public method | `@param`, `@returns` | Standard JSDoc |
| Custom event | `@fires` on class, interface for detail | See section 3.1.6 |
| Controller | Class description, public property/method docs | See section 3.1.4 |
| Type/Interface | Description of each property | Standard JSDoc |

**Enforcement:**

```json
{
  "scripts": {
    "lint:jsdoc": "eslint --rule '{\"jsdoc/require-jsdoc\": \"error\", \"jsdoc/require-description\": \"error\", \"jsdoc/require-param\": \"error\", \"jsdoc/require-returns\": \"error\"}' src/"
  }
}
```

### 3.4.3 Type Definitions for Consumers

The library ships TypeScript declarations so that TypeScript-based consumers get full type safety.

```typescript
// src/types/events.ts

/**
 * Union of all custom event names emitted by CHC components.
 * Useful for creating type-safe event listeners.
 */
export type ChcEventName =
  | 'chc-card-click'
  | 'chc-form-submit'
  | 'chc-nav-toggle'
  | 'chc-modal-open'
  | 'chc-modal-close'
  | 'chc-input'
  | 'chc-change'
  | 'chc-search-submit'
  | 'chc-accordion-toggle'
  | 'chc-tab-change';

/**
 * Maps event names to their detail types.
 * Enables type-safe event handling:
 *
 * @example
 * ```typescript
 * element.addEventListener('chc-card-click', (e: ChcEvent<'chc-card-click'>) => {
 *   console.log(e.detail.href); // fully typed
 * });
 * ```
 */
export interface ChcEventDetailMap {
  'chc-card-click': CardClickDetail;
  'chc-form-submit': FormSubmitDetail;
  'chc-nav-toggle': NavToggleDetail;
  'chc-modal-open': ModalEventDetail;
  'chc-modal-close': ModalEventDetail;
  'chc-input': InputChangeDetail;
  'chc-change': InputChangeDetail;
  'chc-search-submit': SearchSubmitDetail;
  'chc-accordion-toggle': AccordionToggleDetail;
  'chc-tab-change': TabChangeDetail;
}

/**
 * Type-safe custom event helper.
 */
export type ChcEvent<T extends ChcEventName> = CustomEvent<ChcEventDetailMap[T]>;
```

**Global type augmentation for HTML element references:**

```typescript
// src/types/global.d.ts

declare global {
  interface HTMLElementTagNameMap {
    'chc-content-card': import('../components/organisms/chc-content-card/chc-content-card.js').ChcContentCard;
    'chc-button': import('../components/atoms/chc-button/chc-button.js').ChcButton;
    'chc-text-input': import('../components/atoms/chc-text-input/chc-text-input.js').ChcTextInput;
    // ... all components
  }
}
```

This enables `document.querySelector('chc-content-card')` to return the correct type in consuming applications.

---

## 3.5 Drupal Integration Documentation Strategy

### 3.5.1 Where Documentation Lives

Drupal integration documentation exists in **three places**, each serving a different audience:

| Location | Audience | Content |
|---|---|---|
| **Storybook MDX pages** | Frontend developers, Drupal themers | TWIG template examples, prop mapping tables |
| **`drupal/` directory in repo** | Drupal site builders | Reference TWIG templates, library definitions, README |
| **Custom Elements Manifest** | IDEs, tooling, automated docs | Machine-readable API surface |

### 3.5.2 Prop Mapping Strategy (Web Component Attributes <-> Drupal Field Data)

Every component includes a **Drupal Integration** section in its Storybook documentation with a prop mapping table:

```markdown
## Drupal Prop Mapping

| WC Attribute    | Type   | Drupal Source                          | TWIG Expression                                    |
|-----------------|--------|----------------------------------------|----------------------------------------------------|
| `heading`       | String | Node title                             | `{{ label[0]['#title'] \| default(node.label) }}`   |
| `summary`       | String | field_summary (Plain text)             | `{{ content.field_summary\|render\|striptags\|trim }}` |
| `category`      | String | field_category (Term reference)        | `{{ node.field_category.entity.label }}`            |
| `href`          | String | Node canonical URL                     | `{{ url }}`                                         |
| `publish-date`  | String | Node created date (ISO 8601)           | `{{ node.createdtime\|date('c') }}`                 |
| `read-time`     | Number | field_read_time (Integer)              | `{{ content.field_read_time\|render\|striptags }}`  |
| `variant`       | String | Derived from view mode or is_promoted  | `{{ is_promoted ? 'featured' : 'default' }}`        |
```

### 3.5.3 Reference TWIG Templates

The repository includes a `drupal/` directory with reference TWIG templates that Drupal themers can copy and adapt.

```
drupal/
  README.md                           # Setup instructions
  chc-components.libraries.yml        # Drupal library definition
  templates/
    node--article--teaser.html.twig   # Content card integration
    node--article--full.html.twig     # Article layout integration
    block--system-main-menu.html.twig # Navigation integration
    views-view-unformatted.html.twig  # Card grid integration
    page.html.twig                    # Page layout integration
  modules/
    chc_components/                   # Optional Drupal module
      chc_components.info.yml
      chc_components.libraries.yml
      chc_components.module
```

**Example: Content Card in Node Teaser Template:**

```twig
{# drupal/templates/node--article--teaser.html.twig #}

{#
  Content Card Integration
  ========================
  This template maps Drupal's article node fields to the
  chc-content-card web component attributes.

  Required fields:
    - title (core)
    - field_summary (Plain text, required)
    - field_category (Term reference, required)

  Optional fields:
    - field_media (Media reference)
    - field_read_time (Integer)
    - field_tags (Term reference, multi-value)

  Component docs: [Storybook URL]/organisms-content-card--docs
#}

{%- set card_heading = label[0]['#title'] | default(node.label) -%}
{%- set card_summary = content.field_summary|render|striptags|trim -%}
{%- set card_category = node.field_category.entity.label -%}
{%- set card_href = url -%}
{%- set card_date = node.createdtime|date('c') -%}
{%- set card_read_time = content.field_read_time|render|striptags|trim -%}
{%- set card_variant = is_promoted ? 'featured' : 'default' -%}

<chc-content-card
  heading="{{ card_heading }}"
  summary="{{ card_summary }}"
  category="{{ card_category }}"
  href="{{ card_href }}"
  publish-date="{{ card_date }}"
  read-time="{{ card_read_time }}"
  variant="{{ card_variant }}"
  {{ attributes }}
>
  {# Media slot: hero image/video #}
  {% if content.field_media|render|trim is not empty %}
    <div slot="media">
      {{ content.field_media }}
    </div>
  {% endif %}

  {# Actions slot: tags, share button, etc. #}
  {% if content.field_tags|render|trim is not empty %}
    <div slot="actions">
      {{ content.field_tags }}
    </div>
  {% endif %}
</chc-content-card>
```

### 3.5.4 Drupal Library Definition

```yaml
# drupal/chc-components.libraries.yml

chc-components:
  version: VERSION
  js:
    /path/to/dist/chc-components.js:
      type: external
      minified: true
      attributes:
        type: module
  css:
    theme:
      /path/to/dist/themes/light.css: {}
  dependencies:
    - core/once
```

### 3.5.5 Event Handling in Drupal Context

Web component events cross shadow DOM boundaries (due to `composed: true`) and can be caught by Drupal behaviors.

```javascript
// drupal/js/chc-behaviors.js

(function (Drupal) {
  'use strict';

  /**
   * Behavior: Track content card clicks for analytics.
   */
  Drupal.behaviors.chcCardTracking = {
    attach(context) {
      const cards = once('chc-card-tracking', 'chc-content-card', context);
      cards.forEach((card) => {
        card.addEventListener('chc-card-click', (event) => {
          const { href, heading, keyboard } = event.detail;

          // Google Analytics 4 event
          if (typeof gtag === 'function') {
            gtag('event', 'content_card_click', {
              content_title: heading,
              content_url: href,
              interaction_method: keyboard ? 'keyboard' : 'mouse',
            });
          }

          // Drupal event for other modules to hook into
          const drupalEvent = new CustomEvent('chc:analytics', {
            bubbles: true,
            detail: { type: 'card_click', ...event.detail },
          });
          document.dispatchEvent(drupalEvent);
        });
      });
    },
  };

  /**
   * Behavior: Handle search form submission.
   */
  Drupal.behaviors.chcSearch = {
    attach(context) {
      const searchBars = once('chc-search', 'chc-search-bar', context);
      searchBars.forEach((searchBar) => {
        searchBar.addEventListener('chc-search-submit', (event) => {
          const { query } = event.detail;
          // Redirect to Drupal Search API results page
          window.location.href = `/search?keys=${encodeURIComponent(query)}`;
        });
      });
    },
  };
})(Drupal);
```

### 3.5.6 Server-Side Rendering Considerations

Lit provides experimental SSR support via `@lit-labs/ssr`, which renders web components to Declarative Shadow DOM on the server. For Drupal integration, this would involve a containerized Node.js service that processes the page HTML before it reaches the client.

**Current recommendation: Do not implement SSR for initial delivery.** The reasons:

1. `@lit-labs/ssr` is still experimental and does not support `@lit/context`.
2. The containerized service architecture adds operational complexity.
3. Lit components with proper `loading="lazy"` images and meaningful fallback content in slots perform adequately for Core Web Vitals without SSR.
4. SSR can be added later as a performance optimization once the component library is stable.

**Progressive enhancement strategy instead:**

- Use meaningful HTML in slots (not empty slots) so content is visible before JS loads.
- Use `<noscript>` fallbacks for critical content.
- Ensure the Drupal TWIG template renders useful content even if the web component JS fails to load.

---

## 3.6 Testing Implementation

### 3.6.1 Testing Pyramid

```
                    /\
                   /  \          E2E Tests (Playwright)
                  /    \         Cross-browser, full user flows
                 /______\        ~10% of test effort
                /        \
               /          \      Integration Tests (WTR)
              /            \     Component composition, slot behavior,
             /______________\    form participation, event bubbling
            /                \   ~30% of test effort
           /                  \
          /                    \  Unit Tests (WTR + @open-wc/testing)
         /                      \ Property reactivity, rendering,
        /__________________________\ internal state, controllers
                                   ~60% of test effort
```

### 3.6.2 Web Test Runner Configuration

Web Test Runner (WTR) executes tests in real browsers, which is essential for web components that depend on Shadow DOM, Custom Elements, and browser APIs.

```typescript
// web-test-runner.config.mjs
import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  plugins: [
    esbuildPlugin({ ts: true, target: 'auto' }),
  ],
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ],
  coverageConfig: {
    report: true,
    reportDir: 'coverage',
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  testFramework: {
    config: {
      timeout: 5000,
    },
  },
};
```

### 3.6.3 Component Unit Test Example

```typescript
// src/components/organisms/chc-content-card/chc-content-card.test.ts

import { html, fixture, expect, oneEvent } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import type { ChcContentCard } from './chc-content-card.js';
import './chc-content-card.js';

describe('chc-content-card', () => {
  // ── Rendering ──────────────────────────────────────────────

  it('renders with default properties', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="Test Heading"></chc-content-card>
    `);

    expect(el).to.exist;
    expect(el.heading).to.equal('Test Heading');
    expect(el.variant).to.equal('default');
  });

  it('renders heading text in shadow DOM', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="My Article"></chc-content-card>
    `);

    const heading = el.shadowRoot?.querySelector('.card__heading');
    expect(heading?.textContent).to.equal('My Article');
  });

  it('does not render summary when empty', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="Title" summary=""></chc-content-card>
    `);

    const summary = el.shadowRoot?.querySelector('.card__summary');
    expect(summary).to.be.null;
  });

  it('renders read time when greater than zero', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="Title" read-time="5"></chc-content-card>
    `);

    const readTime = el.shadowRoot?.querySelector('.card__read-time');
    expect(readTime?.textContent).to.contain('5 min read');
  });

  // ── Variants ───────────────────────────────────────────────

  it('reflects variant attribute', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="Title" variant="featured"></chc-content-card>
    `);

    expect(el.getAttribute('variant')).to.equal('featured');
  });

  // ── Events ─────────────────────────────────────────────────

  it('fires chc-card-click on click', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card
        heading="Click Test"
        href="/test"
      ></chc-content-card>
    `);

    const listener = oneEvent(el, 'chc-card-click');
    el.click();
    const event = await listener;

    expect(event.detail.href).to.equal('/test');
    expect(event.detail.heading).to.equal('Click Test');
    expect(event.detail.keyboard).to.be.false;
  });

  it('fires chc-card-click with keyboard=true on Enter', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="KB Test" href="/kb"></chc-content-card>
    `);

    const card = el.shadowRoot?.querySelector('[part="card"]') as HTMLElement;
    card.focus();

    const listener = oneEvent(el, 'chc-card-click');
    await sendKeys({ press: 'Enter' });
    const event = await listener;

    expect(event.detail.keyboard).to.be.true;
  });

  it('event is composed (crosses shadow DOM boundary)', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="Composed Test"></chc-content-card>
    `);

    const listener = oneEvent(el, 'chc-card-click');
    el.click();
    const event = await listener;

    expect(event.composed).to.be.true;
    expect(event.bubbles).to.be.true;
  });

  // ── Slots ──────────────────────────────────────────────────

  it('renders slotted media content', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="Slot Test">
        <img slot="media" src="test.jpg" alt="Test" />
      </chc-content-card>
    `);

    const slot = el.shadowRoot?.querySelector('slot[name="media"]') as HTMLSlotElement;
    const assigned = slot.assignedElements();
    expect(assigned).to.have.length(1);
    expect(assigned[0].tagName).to.equal('IMG');
  });

  // ── Accessibility ──────────────────────────────────────────

  it('is accessible with default props', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card
        heading="Accessible Card"
        summary="This card should pass axe checks."
        category="Health"
        href="/article"
      ></chc-content-card>
    `);

    await expect(el).to.be.accessible();
  });

  it('has role=button when no href is provided', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="No Link"></chc-content-card>
    `);

    const card = el.shadowRoot?.querySelector('[part="card"]');
    expect(card?.getAttribute('role')).to.equal('button');
  });

  it('has no role when href is provided (native link semantics)', async () => {
    const el = await fixture<ChcContentCard>(html`
      <chc-content-card heading="With Link" href="/article"></chc-content-card>
    `);

    const card = el.shadowRoot?.querySelector('[part="card"]');
    expect(card?.getAttribute('role')).to.be.null;
  });
});
```

### 3.6.4 Controller Unit Test Example

```typescript
// src/controllers/intersection.controller.test.ts

import { html, fixture, expect, waitUntil } from '@open-wc/testing';
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { IntersectionController } from './intersection.controller.js';

@customElement('test-intersection-host')
class TestHost extends LitElement {
  intersection = new IntersectionController(this);

  render() {
    return html`<div>${this.intersection.isVisible ? 'visible' : 'hidden'}</div>`;
  }
}

describe('IntersectionController', () => {
  it('initializes with isVisible=false', async () => {
    const el = await fixture<TestHost>(html`
      <test-intersection-host></test-intersection-host>
    `);

    expect(el.intersection.isVisible).to.be.false;
  });

  it('cleans up observer on disconnect', async () => {
    const el = await fixture<TestHost>(html`
      <test-intersection-host></test-intersection-host>
    `);

    el.remove();
    // Verify no errors occur after disconnect
    expect(() => el.intersection.isVisible).to.not.throw();
  });
});
```

### 3.6.5 Visual Regression Testing

**Chromatic** integrates directly with Storybook to capture visual snapshots of every story across browsers.

**Setup:**

```json
{
  "scripts": {
    "chromatic": "npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN",
    "chromatic:ci": "npx chromatic --project-token=$CHROMATIC_PROJECT_TOKEN --exit-zero-on-changes --auto-accept-changes main"
  }
}
```

**What gets tested:**
- Every story in every theme (light, dark, high-contrast)
- Every viewport size (mobile, tablet, desktop)
- Every variant of every component
- Hover/focus/active states via play functions

**Workflow:**
1. Developer creates/modifies a component
2. PR triggers Chromatic build
3. Chromatic captures screenshots of all affected stories
4. Visual diffs are reviewed in Chromatic UI
5. Approved changes become the new baseline

### 3.6.6 Accessibility Testing Strategy

Accessibility testing happens at three levels:

**Level 1: Author-Time (IDE)**

- `ts-lit-plugin` warns about missing ARIA attributes and invalid roles in templates.
- ESLint with `eslint-plugin-lit-a11y` catches common accessibility issues.

**Level 2: Story-Time (Storybook)**

- `@storybook/addon-a11y` runs axe-core against every story on each load.
- Every component has a dedicated "Accessibility" story that demonstrates focus management, keyboard navigation, and screen reader behavior.

**Level 3: CI/CD (Automated)**

- Chromatic accessibility regression testing detects new WCAG violations per pull request.
- Web Test Runner runs `@open-wc/testing`'s `expect(el).to.be.accessible()` assertion (powered by axe-core) in every component test.

**Level 4: Manual Audit (Quarterly)**

- Screen reader testing with NVDA (Windows), VoiceOver (macOS/iOS), TalkBack (Android).
- Keyboard-only navigation audit of all interactive components.
- Color contrast verification at all three theme modes.
- Focus order verification in complex component compositions.

**Healthcare-specific accessibility requirements:**

| Requirement | Standard | Our Approach |
|---|---|---|
| Form error identification | WCAG 3.3.1 | `role="alert"` on error messages, `aria-invalid` on inputs |
| Labels and instructions | WCAG 3.3.2 | Every input has visible label + `help-text` attribute |
| Error suggestion | WCAG 3.3.3 | Error messages describe how to fix, not just what's wrong |
| Error prevention | WCAG 3.3.4 | Confirmation dialogs on destructive actions |
| Consistent navigation | WCAG 3.2.3 | Navigation components render identically across pages |
| Focus visible | WCAG 2.4.7 | Custom focus ring on all interactive elements, 3:1 contrast ratio |
| Target size | WCAG 2.5.8 | Minimum 44x44px touch targets on all interactive elements |

### 3.6.7 Test Script Configuration

```json
{
  "scripts": {
    "test": "wtr",
    "test:watch": "wtr --watch",
    "test:coverage": "wtr --coverage",
    "test:ci": "wtr --ci",
    "test:a11y": "wtr --grep 'accessible'",
    "test:e2e": "playwright test",
    "test:visual": "npm run chromatic",
    "test:all": "npm run test:ci && npm run test:e2e && npm run test:visual"
  }
}
```

---

## 3.7 Theming & Design Tokens

### 3.7.1 Token Architecture

Design tokens are defined as CSS custom properties, organized by category. They form the contract between the design system and the component library.

```css
/* src/styles/themes/light.css */

:root,
[data-theme="light"] {
  /* ── Color Tokens ────────────────────────────────────── */
  --chc-color-primary: #1e40af;
  --chc-color-primary-hover: #1e3a8a;
  --chc-color-primary-active: #1d4ed8;
  --chc-color-on-primary: #ffffff;

  --chc-color-secondary: #059669;
  --chc-color-secondary-hover: #047857;

  --chc-color-surface: #ffffff;
  --chc-color-surface-raised: #f8fafc;
  --chc-color-on-surface: #1e293b;
  --chc-color-on-surface-muted: #64748b;

  --chc-color-border: #e2e8f0;
  --chc-color-border-strong: #cbd5e1;

  --chc-color-error: #dc2626;
  --chc-color-warning: #d97706;
  --chc-color-success: #16a34a;
  --chc-color-info: #2563eb;

  /* ── Typography Tokens ───────────────────────────────── */
  --chc-font-family-body: 'Inter', system-ui, -apple-system, sans-serif;
  --chc-font-family-heading: 'Inter', system-ui, -apple-system, sans-serif;

  --chc-font-size-xs: 0.75rem;
  --chc-font-size-sm: 0.875rem;
  --chc-font-size-base: 1rem;
  --chc-font-size-lg: 1.125rem;
  --chc-font-size-xl: 1.25rem;
  --chc-font-size-2xl: 1.5rem;
  --chc-font-size-3xl: 1.875rem;
  --chc-font-size-4xl: 2.25rem;

  --chc-line-height-tight: 1.25;
  --chc-line-height-normal: 1.5;
  --chc-line-height-relaxed: 1.75;

  /* ── Spacing Tokens ──────────────────────────────────── */
  --chc-spacing-xs: 0.25rem;
  --chc-spacing-sm: 0.5rem;
  --chc-spacing-md: 1rem;
  --chc-spacing-lg: 1.5rem;
  --chc-spacing-xl: 2rem;
  --chc-spacing-2xl: 3rem;
  --chc-spacing-3xl: 4rem;

  /* ── Elevation Tokens ────────────────────────────────── */
  --chc-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --chc-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --chc-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* ── Border Tokens ───────────────────────────────────── */
  --chc-radius-sm: 4px;
  --chc-radius-md: 8px;
  --chc-radius-lg: 12px;
  --chc-radius-full: 9999px;

  /* ── Focus Token (critical for a11y) ─────────────────── */
  --chc-focus-ring: 0 0 0 3px rgba(30, 64, 175, 0.4);
  --chc-focus-ring-offset: 2px;

  /* ── Transition Tokens ───────────────────────────────── */
  --chc-transition-fast: 150ms ease;
  --chc-transition-normal: 250ms ease;
  --chc-transition-slow: 350ms ease;
}
```

```css
/* src/styles/themes/dark.css */

[data-theme="dark"] {
  --chc-color-primary: #60a5fa;
  --chc-color-primary-hover: #93bbfd;
  --chc-color-primary-active: #3b82f6;
  --chc-color-on-primary: #1e293b;

  --chc-color-surface: #1e293b;
  --chc-color-surface-raised: #334155;
  --chc-color-on-surface: #f1f5f9;
  --chc-color-on-surface-muted: #94a3b8;

  --chc-color-border: #334155;
  --chc-color-border-strong: #475569;

  --chc-color-error: #f87171;
  --chc-color-warning: #fbbf24;
  --chc-color-success: #4ade80;
  --chc-color-info: #60a5fa;

  --chc-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --chc-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --chc-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);

  --chc-focus-ring: 0 0 0 3px rgba(96, 165, 250, 0.4);
}
```

```css
/* src/styles/themes/high-contrast.css */

[data-theme="high-contrast"] {
  --chc-color-primary: #ffffff;
  --chc-color-on-primary: #000000;

  --chc-color-surface: #000000;
  --chc-color-surface-raised: #1a1a1a;
  --chc-color-on-surface: #ffffff;
  --chc-color-on-surface-muted: #e5e5e5;

  --chc-color-border: #ffffff;
  --chc-color-border-strong: #ffffff;

  --chc-color-error: #ff6b6b;
  --chc-color-warning: #ffd93d;
  --chc-color-success: #6bff6b;
  --chc-color-info: #6bb5ff;

  --chc-focus-ring: 0 0 0 3px #ffffff;
}
```

### 3.7.2 Theme Switching at Component Level

Components consume tokens via CSS custom properties with fallback values. Theme switching requires zero JavaScript inside components -- it is purely CSS.

```typescript
// Shared focus styles used by all interactive components
import { css } from 'lit';

export const focusStyles = css`
  :host(:focus-visible) {
    outline: none;
    box-shadow: var(--chc-focus-ring);
    outline-offset: var(--chc-focus-ring-offset, 2px);
  }
`;
```

```typescript
// Component using design tokens
static styles = [
  focusStyles,
  css`
    :host {
      display: block;
      font-family: var(--chc-font-family-body);
      color: var(--chc-color-on-surface);
    }

    .card {
      background: var(--chc-card-bg, var(--chc-color-surface));
      border: 1px solid var(--chc-color-border);
      border-radius: var(--chc-card-radius, var(--chc-radius-md));
      padding: var(--chc-card-padding, var(--chc-spacing-lg));
      box-shadow: var(--chc-card-shadow, var(--chc-shadow-sm));
      transition: box-shadow var(--chc-transition-fast);
    }

    .card:hover {
      box-shadow: var(--chc-shadow-md);
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .card {
        transition: none;
      }
    }
  `,
];
```

### 3.7.3 CSS Shadow Parts for External Styling

CSS Shadow Parts expose internal elements for targeted styling by consumers, providing a controlled escape hatch from Shadow DOM encapsulation.

```css
/* In the consuming Drupal theme's CSS */

/* Style the card header area differently for featured content */
chc-content-card[variant="featured"]::part(header) {
  min-height: 200px;
  background: linear-gradient(135deg, var(--chc-color-primary), var(--chc-color-secondary));
}

/* Style the card body in a sidebar context */
.sidebar chc-content-card::part(body) {
  padding: var(--chc-spacing-sm);
}
```

---

## Summary: Interview Talking Points

When presenting this architecture in the tech lead interview, emphasize these differentiators:

1. **Custom Elements Manifest as the single source of truth**: One `cem analyze` command generates the JSON that powers Storybook controls, IDE autocomplete, Drupal documentation, and API reference. This eliminates documentation drift.

2. **Reactive controllers over mixins**: Controllers are composable, testable, and avoid prototype chain pollution. The healthcare-specific controllers (form validation, screen reader announcements, reduced motion) demonstrate domain expertise.

3. **Form-associated custom elements with ElementInternals**: Native `<form>` participation without wrapper components or hidden inputs. This is a significant technical advantage over competing approaches and critical for healthcare form compliance.

4. **Three-layer accessibility strategy**: Author-time (IDE), story-time (Storybook addon), and CI (Chromatic regression) catch accessibility issues before they reach production. Healthcare demands this rigor.

5. **Drupal integration is first-class, not an afterthought**: Prop mapping tables, reference TWIG templates, and Drupal behavior examples ship with the component library. The Storybook documentation includes TWIG examples alongside JavaScript examples.

6. **Progressive enhancement over SSR**: Rather than adding the operational complexity of a containerized SSR service, components are designed to degrade gracefully with meaningful slot content. SSR can be layered on later when `@lit-labs/ssr` matures.

7. **Token-based theming with zero-JS switching**: Light, dark, and high-contrast themes are pure CSS custom property overrides. Components do not need to know or care which theme is active.

---

## Sources

- [Lit Official Documentation](https://lit.dev/docs/)
- [Lit Cheat Sheet](https://lit.dev/articles/lit-cheat-sheet/)
- [Reactive Controllers - Lit](https://lit.dev/docs/composition/controllers/)
- [Context - Lit](https://lit.dev/docs/data/context/)
- [Styles - Lit](https://lit.dev/docs/components/styles/)
- [Decorators - Lit](https://lit.dev/docs/components/decorators/)
- [Documenting Web Components With Storybook (James Ives, 2025)](https://jamesiv.es/blog/frontend/javascript/2025/02/19/documenting-web-components-with-storybook/)
- [Custom Elements Manifest: The Killer Feature (Dave Rupert, 2025)](https://daverupert.com/2025/10/custom-elements-manifest-killer-feature)
- [Custom Elements Manifest Analyzer](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
- [Server Rendering Lit Web Components with Drupal (Benny Powers)](https://bennypowers.dev/posts/drupal-lit-ssr/)
- [Storybook Documentation](https://storybook.js.org)
- [CSF Factories Documentation](https://storybook.js.org/docs/api/csf)
- [Chromatic Accessibility Regression Testing](https://www.chromatic.com/blog/sneak-peek-accessibility-regression-testing/)
- [Storybook Accessibility Testing Docs](https://storybook.js.org/docs/writing-tests/accessibility-testing)
- [Testing - Lit](https://lit.dev/docs/tools/testing/)
- [Open WC Testing Helpers](https://open-wc.org/docs/testing/helpers/)
- [Form-Associated Custom Elements (Benny Powers)](https://bennypowers.dev/posts/form-associated-custom-elements/)
- [ElementInternals - MDN](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [Drupal Single-Directory Components](https://www.drupal.org/docs/develop/theming-drupal/using-single-directory-components/quickstart)
- [Drupal Twig Components Module](https://www.drupal.org/project/twig_components)
- [Web Components Drupal Module](https://www.drupal.org/project/webcomponents)
- [Lit Starter TypeScript (GitHub)](https://github.com/lit/lit-element-starter-ts)
- [Why Web Components are Making a Comeback in 2025](https://medium.com/@ishanbagchi/why-web-components-are-making-a-comeback-in-2025-e874eb8c9ceb)
- [Atomic Design Methodology (Brad Frost)](https://atomicdesign.bradfrost.com/chapter-2/)
- [ARIA Authoring Practices Guide (W3C)](https://www.w3.org/WAI/ARIA/apg/)
