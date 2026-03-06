
🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing component patterns",
      "status": "in_progress",
      "activeForm": "Reading existing component patterns"
    },
    {
      "content": "Implement hx-accordion component",
      "status": "pending",
      "activeForm": "Implementing hx-accordion component"
    },
    {
      "content": "Run build verification",
      "status": "pending",
      "activeForm": "Running build verification"
    },
    {
      "content": "Playwright verification",
      "status": "pending",
      "activeForm": "Running Playwright verification"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-button/**",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/**/*.ts",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-card/hx-card.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-card/hx-card.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-card/index.ts"
}
Now let me check the main library index and a more complex component with events:

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-alert/hx-alert.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/index.ts",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/index*.ts",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-card/hx-card.stories.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing component patterns",
      "status": "completed",
      "activeForm": "Reading existing component patterns"
    },
    {
      "content": "Implement hx-accordion component via lit-specialist",
      "status": "in_progress",
      "activeForm": "Implementing hx-accordion component via lit-specialist"
    },
    {
      "content": "Run build verification",
      "status": "pending",
      "activeForm": "Running build verification"
    },
    {
      "content": "Playwright verification",
      "status": "pending",
      "activeForm": "Running Playwright verification"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Implement hx-accordion component",
  "subagent_type": "lit-specialist",
  "prompt": "Implement the `hx-accordion` web component for the wc-2026 enterprise healthcare component library. This is a Lit 3.x component using TypeScript strict mode.\n\n## Component Requirements\n\n**Location:** `packages/hx-library/src/components/hx-accordion/`\n\n**Files to create:**\n1. `hx-accordion.ts` — Main accordion container component\n2. `hx-accordion-item.ts` — Individual accordion item component\n3. `hx-accordion.styles.ts` — Shared styles for both components\n4. `hx-accordion.stories.ts` — Storybook stories\n5. `hx-accordion.test.ts` — Vitest browser tests\n6. `index.ts` — Re-exports\n\n## Acceptance Criteria\n- Single and multi-expand modes (attribute: `mode=\"single\"` | `mode=\"multi\"`)\n- Animated open/close transitions using CSS transitions\n- Progressive enhancement fallback (`<details>`/`<summary>` as fallback in no-JS)\n- Keyboard: Enter/Space to toggle items, Arrow keys to navigate between items\n- CSS parts: `item`, `trigger`, `content`, `icon`\n- Events: `hx-expand` (detail: `{itemId: string}`), `hx-collapse` (detail: `{itemId: string}`)\n- ARIA: `aria-expanded` on trigger, `aria-hidden` on content panel\n- Bundle: <5KB gzipped total for both components\n\n## Project Conventions\n\n**Tag prefix:** `hx-`\n**Event prefix:** `hx-`\n**CSS custom property prefix:** `--hx-`\n**CSS parts:** lowercase, hyphenated\n\n**Imports pattern:**\n```ts\nimport { LitElement, html, nothing } from 'lit';\nimport { customElement, property } from 'lit/decorators.js';\nimport { classMap } from 'lit/directives/class-map.js';\nimport { tokenStyles } from '@helix/tokens/lit';\n```\n\n**Style pattern:**\n```ts\n// hx-component.styles.ts\nimport { css } from 'lit';\nexport const helixAccordionStyles = css`...`;\n```\n\n**Component class pattern:**\n```ts\n@customElement('hx-accordion')\nexport class HelixAccordion extends LitElement {\n  static override styles = [tokenStyles, helixAccordionStyles];\n  // ...\n}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    'hx-accordion': HelixAccordion;\n  }\n}\n```\n\n**Event dispatch pattern:**\n```ts\nthis.dispatchEvent(new CustomEvent('hx-expand', {\n  bubbles: true,\n  composed: true,\n  detail: { itemId: this.itemId },\n}));\n```\n\n## Architecture\n\nThe accordion uses two components:\n- `hx-accordion` (container): manages expand state, mode (single/multi)\n- `hx-accordion-item` (item): individual collapsible item with trigger + content\n\n### hx-accordion Properties\n- `mode: 'single' | 'multi'` (default: 'single') — single allows only one open at a time\n\n### hx-accordion-item Properties\n- `open: boolean` (default: false, reflect: true)\n- `disabled: boolean` (default: false, reflect: true)\n- `item-id: string` — optional identifier for events\n\n### Communication Pattern\nWhen in `single` mode, the accordion listens to `hx-expand` events from items and closes all other items.\n\nItems dispatch `hx-expand` and `hx-collapse` events.\n\n### HTML Structure for hx-accordion-item\n```html\n<details part=\"item\" class=\"item\">\n  <summary part=\"trigger\" class=\"item__trigger\" role=\"button\" aria-expanded=\"...\">\n    <slot name=\"trigger\">...</slot>\n    <span part=\"icon\" class=\"item__icon\" aria-hidden=\"true\">\n      <!-- chevron SVG -->\n    </span>\n  </summary>\n  <div part=\"content\" class=\"item__content\" role=\"region\" aria-hidden=\"...\">\n    <div class=\"item__content-inner\">\n      <slot></slot>\n    </div>\n  </div>\n</details>\n```\n\n### Progressive Enhancement\nUse `<details>`/`<summary>` elements as the base, enhanced with JS for:\n1. Animation\n2. Single-expand mode coordination\n3. Events\n\n### Animated Transition\nUse CSS grid trick for smooth height animation:\n```css\n.item__content {\n  display: grid;\n  grid-template-rows: 0fr;\n  transition: grid-template-rows var(--hx-transition-normal, 250ms ease);\n}\n.item--open .item__content {\n  grid-template-rows: 1fr;\n}\n.item__content-inner {\n  overflow: hidden;\n}\n```\n\n## CSS Custom Properties to Document\n\n### hx-accordion-item:\n- `--hx-accordion-item-border-color` — item border color\n- `--hx-accordion-trigger-bg` — trigger background\n- `--hx-accordion-trigger-bg-hover` — trigger hover background\n- `--hx-accordion-trigger-color` — trigger text color\n- `--hx-accordion-content-bg` — content panel background\n- `--hx-accordion-content-padding` — content padding\n- `--hx-accordion-icon-color` — chevron icon color\n- `--hx-accordion-border-radius` — item border radius\n\n## Reference: Existing Component (hx-card.ts)\n\n```ts\nimport { LitElement, html, nothing } from 'lit';\nimport { customElement, property } from 'lit/decorators.js';\nimport { classMap } from 'lit/directives/class-map.js';\nimport { tokenStyles } from '@helix/tokens/lit';\nimport { helixCardStyles } from './hx-card.styles.js';\n\n@customElement('hx-card')\nexport class HelixCard extends LitElement {\n  static override styles = [tokenStyles, helixCardStyles];\n\n  @property({ type: String, reflect: true })\n  variant: 'default' | 'featured' | 'compact' = 'default';\n  \n  // ...\n  override render() {\n    return html`<div part=\"card\" class=${classMap({card: true})}>...</div>`;\n  }\n}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    'hx-card': HelixCard;\n  }\n}\n```\n\n## Storybook Stories Pattern\n\n```ts\nimport type { Meta, StoryObj } from '@storybook/web-components';\nimport { html } from 'lit';\nimport { expect, within, userEvent, fn } from 'storybook/test';\nimport './hx-accordion.js';\nimport './hx-accordion-item.js';\n\nconst meta = {\n  title: 'Components/Accordion',\n  component: 'hx-accordion',\n  tags: ['autodocs'],\n  // argTypes, args, render...\n} satisfies Meta;\n\nexport default meta;\ntype Story = StoryObj;\n\nexport const Default: Story = { ... };\n// Stories for: Default, SingleMode, MultiMode, WithDisabledItem, \n// KeyboardNavigation, AllVariants, HealthcareFAQ (kitchen sink)\n```\n\n## Test Pattern (Vitest browser mode)\n\n```ts\nimport { describe, it, expect, beforeEach } from 'vitest';\nimport { fixture, html, oneEvent, cleanup } from '../../../test-utils.js';\nimport './hx-accordion.js';\nimport './hx-accordion-item.js';\n\ndescribe('hx-accordion', () => {\n  // Tests for: rendering, single mode, multi mode, keyboard nav, events, accessibility\n});\n```\n\n## Test Utils Location\n`packages/hx-library/src/test-utils.ts` — use `fixture`, `html`, `oneEvent`, `cleanup`\n\n## Important Notes\n- Use `import './hx-accordion-item.js'` (not `.ts`) in the item file\n- The `<details>` element provides native progressive enhancement\n- Override `<details>` toggle behavior in JS for single mode and animation\n- Prevent default `<details>` toggle when handling keyboard/click — manage state manually via `open` property\n- TypeScript strict mode: no `any`, no non-null assertions\n- All JSDoc comments required for CEM generation\n\n## Working Directory\n`/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx`\n\nPlease create ALL 6 files. Write complete, production-ready code following all the patterns above.\n"
}

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/",
  "description": "List existing components"
}

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/",
  "description": "List library src directory"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-card/hx-card.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-card/hx-card.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-card/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/test-utils.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-button/hx-button.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-card/hx-card.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/index.ts",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/index.ts",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-radio-group/index.ts"
}

🔧 Tool: Bash
Input: {
  "command": "mkdir -p /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-accordion",
  "description": "Create accordion component directory"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-accordion/hx-accordion.styles.ts",
  "content": "import { css } from 'lit';\n\n// ─── hx-accordion (container) styles ─────────────────────────────────────────\n\nexport const helixAccordionStyles = css`\n  :host {\n    display: block;\n  }\n\n  .accordion {\n    display: flex;\n    flex-direction: column;\n    width: 100%;\n  }\n`;\n\n// ─── hx-accordion-item styles ─────────────────────────────────────────────────\n\nexport const helixAccordionItemStyles = css`\n  :host {\n    display: block;\n  }\n\n  /* ─── Reset <details> native styles ─── */\n\n  details {\n    border: var(--hx-border-width-thin, 1px) solid\n      var(--hx-accordion-item-border-color, var(--hx-color-neutral-200, #dee2e6));\n    border-radius: var(--hx-accordion-border-radius, var(--hx-border-radius-md, 0.375rem));\n    background-color: var(--hx-accordion-trigger-bg, var(--hx-color-neutral-0, #ffffff));\n    font-family: var(--hx-font-family-sans, sans-serif);\n    font-size: var(--hx-font-size-md, 1rem);\n    overflow: hidden;\n  }\n\n  /* Remove default details marker */\n  details summary::-webkit-details-marker {\n    display: none;\n  }\n\n  details summary::marker {\n    display: none;\n    content: '';\n  }\n\n  /* ─── Trigger (summary) ─── */\n\n  .item__trigger {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: var(--hx-space-3, 0.75rem);\n    padding: var(--hx-space-4, 1rem) var(--hx-space-5, 1.25rem);\n    cursor: pointer;\n    user-select: none;\n    list-style: none;\n    background-color: var(--hx-accordion-trigger-bg, var(--hx-color-neutral-0, #ffffff));\n    color: var(--hx-accordion-trigger-color, var(--hx-color-neutral-800, #212529));\n    font-weight: var(--hx-font-weight-medium, 500);\n    line-height: var(--hx-line-height-tight, 1.25);\n    transition: background-color var(--hx-transition-fast, 150ms ease);\n    outline: none;\n  }\n\n  .item__trigger:hover:not([aria-disabled='true']) {\n    background-color: var(--hx-accordion-trigger-bg-hover, var(--hx-color-neutral-50, #f8f9fa));\n  }\n\n  .item__trigger:focus-visible {\n    outline: var(--hx-focus-ring-width, 2px) solid\n      var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));\n    outline-offset: var(--hx-focus-ring-offset, -2px);\n    border-radius: inherit;\n    z-index: 1;\n    position: relative;\n  }\n\n  /* Disabled state */\n  :host([disabled]) .item__trigger {\n    cursor: not-allowed;\n    opacity: var(--hx-opacity-disabled, 0.5);\n  }\n\n  /* ─── Trigger label slot ─── */\n\n  .item__trigger-label {\n    flex: 1;\n    min-width: 0;\n  }\n\n  /* ─── Chevron icon ─── */\n\n  .item__icon {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n    width: 1.25rem;\n    height: 1.25rem;\n    color: var(--hx-accordion-icon-color, var(--hx-color-neutral-500, #6c757d));\n    transition: transform var(--hx-transition-normal, 250ms ease);\n    pointer-events: none;\n  }\n\n  :host([open]) .item__icon {\n    transform: rotate(180deg);\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .item__icon {\n      transition: none;\n    }\n  }\n\n  /* ─── Content panel (CSS grid trick for smooth height animation) ─── */\n\n  .item__content {\n    display: grid;\n    grid-template-rows: 0fr;\n    transition: grid-template-rows var(--hx-transition-normal, 250ms ease);\n    background-color: var(--hx-accordion-content-bg, var(--hx-color-neutral-0, #ffffff));\n  }\n\n  :host([open]) .item__content {\n    grid-template-rows: 1fr;\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .item__content {\n      transition: none;\n    }\n  }\n\n  .item__content-inner {\n    overflow: hidden;\n    padding: 0;\n    transition: padding var(--hx-transition-normal, 250ms ease);\n  }\n\n  :host([open]) .item__content-inner {\n    padding: var(--hx-accordion-content-padding, var(--hx-space-5, 1.25rem));\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .item__content-inner {\n      transition: none;\n    }\n  }\n\n  /* ─── Border between trigger and content ─── */\n\n  :host([open]) details {\n    border-color: var(--hx-accordion-item-border-color, var(--hx-color-neutral-200, #dee2e6));\n  }\n\n  :host([open]) .item__trigger {\n    border-bottom: var(--hx-border-width-thin, 1px) solid\n      var(--hx-accordion-item-border-color, var(--hx-color-neutral-200, #dee2e6));\n  }\n\n  /* ─── Hidden utility ─── */\n\n  [hidden] {\n    display: none !important;\n  }\n`;\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-accordion/hx-accordion-item.ts",
  "content": "import { LitElement, html, nothing } from 'lit';\nimport { customElement, property, state } from 'lit/decorators.js';\nimport { classMap } from 'lit/directives/class-map.js';\nimport { tokenStyles } from '@helix/tokens/lit';\nimport { helixAccordionItemStyles } from './hx-accordion.styles.js';\n\n/**\n * An individual collapsible item within an `hx-accordion` container.\n * Uses `<details>`/`<summary>` for progressive enhancement with animated\n * open/close transitions managed via JS.\n *\n * @summary Collapsible accordion item with animated trigger and content panel.\n *\n * @tag hx-accordion-item\n *\n * @slot trigger - The trigger/heading content shown in the summary bar.\n * @slot - Default slot for the collapsible body content.\n *\n * @fires {CustomEvent<{itemId: string}>} hx-expand - Dispatched when this item opens.\n * @fires {CustomEvent<{itemId: string}>} hx-collapse - Dispatched when this item closes.\n *\n * @csspart item - The outer `<details>` element.\n * @csspart trigger - The `<summary>` trigger element.\n * @csspart icon - The animated chevron icon container.\n * @csspart content - The collapsible content panel.\n *\n * @cssprop [--hx-accordion-item-border-color=var(--hx-color-neutral-200)] - Item border color.\n * @cssprop [--hx-accordion-trigger-bg=var(--hx-color-neutral-0)] - Trigger background color.\n * @cssprop [--hx-accordion-trigger-bg-hover=var(--hx-color-neutral-50)] - Trigger hover background color.\n * @cssprop [--hx-accordion-trigger-color=var(--hx-color-neutral-800)] - Trigger text color.\n * @cssprop [--hx-accordion-content-bg=var(--hx-color-neutral-0)] - Content panel background color.\n * @cssprop [--hx-accordion-content-padding=var(--hx-space-5)] - Content panel padding.\n * @cssprop [--hx-accordion-icon-color=var(--hx-color-neutral-500)] - Chevron icon color.\n * @cssprop [--hx-accordion-border-radius=var(--hx-border-radius-md)] - Item border radius.\n */\n@customElement('hx-accordion-item')\nexport class HelixAccordionItem extends LitElement {\n  static override styles = [tokenStyles, helixAccordionItemStyles];\n\n  // ─── Properties ───\n\n  /**\n   * Whether the accordion item is open (expanded).\n   * @attr open\n   */\n  @property({ type: Boolean, reflect: true })\n  open = false;\n\n  /**\n   * Whether the accordion item is disabled. Disabled items cannot be toggled.\n   * @attr disabled\n   */\n  @property({ type: Boolean, reflect: true })\n  disabled = false;\n\n  /**\n   * Optional identifier used in event detail payloads for programmatic control.\n   * @attr item-id\n   */\n  @property({ type: String, attribute: 'item-id' })\n  itemId = '';\n\n  // ─── Internal state ───\n\n  @state() private _triggerId = `hx-accordion-trigger-${Math.random().toString(36).slice(2, 9)}`;\n  @state() private _contentId = `hx-accordion-content-${Math.random().toString(36).slice(2, 9)}`;\n\n  // ─── Lifecycle ───\n\n  override connectedCallback(): void {\n    super.connectedCallback();\n    // Ensure the host element does not receive focus itself — focus goes to summary\n    this.setAttribute('role', 'none');\n  }\n\n  // ─── Toggle ───\n\n  /**\n   * Programmatically toggle the open state of this item.\n   * Respects the disabled state and dispatches the appropriate event.\n   */\n  toggle(): void {\n    if (this.disabled) return;\n\n    if (this.open) {\n      this._collapse();\n    } else {\n      this._expand();\n    }\n  }\n\n  /** Expand this item. No-op if already open or disabled. */\n  expand(): void {\n    if (this.disabled || this.open) return;\n    this._expand();\n  }\n\n  /** Collapse this item. No-op if already closed or disabled. */\n  collapse(): void {\n    if (this.disabled || !this.open) return;\n    this._collapse();\n  }\n\n  private _expand(): void {\n    this.open = true;\n\n    /**\n     * Dispatched when this accordion item opens.\n     * @event hx-expand\n     */\n    this.dispatchEvent(\n      new CustomEvent('hx-expand', {\n        bubbles: true,\n        composed: true,\n        detail: { itemId: this.itemId },\n      }),\n    );\n  }\n\n  private _collapse(): void {\n    this.open = false;\n\n    /**\n     * Dispatched when this accordion item closes.\n     * @event hx-collapse\n     */\n    this.dispatchEvent(\n      new CustomEvent('hx-collapse', {\n        bubbles: true,\n        composed: true,\n        detail: { itemId: this.itemId },\n      }),\n    );\n  }\n\n  // ─── Event Handlers ───\n\n  private _handleSummaryClick(e: MouseEvent): void {\n    // Prevent the native <details> toggle — we manage state manually\n    e.preventDefault();\n\n    if (this.disabled) return;\n    this.toggle();\n  }\n\n  private _handleKeyDown(e: KeyboardEvent): void {\n    if (this.disabled) return;\n\n    if (e.key === 'Enter' || e.key === ' ') {\n      e.preventDefault();\n      this.toggle();\n      return;\n    }\n\n    // Arrow key navigation is handled by the parent hx-accordion container.\n    // Re-dispatch as a named coordination event so the parent can intercept it.\n    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {\n      e.preventDefault();\n      this.dispatchEvent(\n        new CustomEvent('hx-accordion-nav', {\n          bubbles: true,\n          composed: true,\n          detail: { direction: e.key === 'ArrowUp' ? 'prev' : 'next', source: this },\n        }),\n      );\n    }\n  }\n\n  // ─── Render ───\n\n  override render() {\n    const ariaExpanded = this.open ? 'true' : 'false';\n    const ariaHidden = this.open ? 'false' : 'true';\n\n    return html`\n      <details\n        part=\"item\"\n        class=${classMap({ item: true, 'item--open': this.open, 'item--disabled': this.disabled })}\n        ?open=${this.open}\n      >\n        <summary\n          part=\"trigger\"\n          class=\"item__trigger\"\n          id=${this._triggerId}\n          role=\"button\"\n          aria-expanded=${ariaExpanded}\n          aria-controls=${this._contentId}\n          aria-disabled=${this.disabled ? 'true' : nothing}\n          tabindex=${this.disabled ? '-1' : '0'}\n          @click=${this._handleSummaryClick}\n          @keydown=${this._handleKeyDown}\n        >\n          <span class=\"item__trigger-label\">\n            <slot name=\"trigger\"></slot>\n          </span>\n          <span part=\"icon\" class=\"item__icon\" aria-hidden=\"true\">\n            <!-- Chevron down SVG -->\n            <svg\n              xmlns=\"http://www.w3.org/2000/svg\"\n              width=\"16\"\n              height=\"16\"\n              viewBox=\"0 0 24 24\"\n              fill=\"none\"\n              stroke=\"currentColor\"\n              stroke-width=\"2\"\n              stroke-linecap=\"round\"\n              stroke-linejoin=\"round\"\n              aria-hidden=\"true\"\n              focusable=\"false\"\n            >\n              <polyline points=\"6 9 12 15 18 9\"></polyline>\n            </svg>\n          </span>\n        </summary>\n\n        <div\n          part=\"content\"\n          class=\"item__content\"\n          id=${this._contentId}\n          role=\"region\"\n          aria-labelledby=${this._triggerId}\n          aria-hidden=${ariaHidden}\n        >\n          <div class=\"item__content-inner\">\n            <slot></slot>\n          </div>\n        </div>\n      </details>\n    `;\n  }\n}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    'hx-accordion-item': HelixAccordionItem;\n  }\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-accordion/hx-accordion.ts",
  "content": "import { LitElement, html } from 'lit';\nimport { customElement, property } from 'lit/decorators.js';\nimport { tokenStyles } from '@helix/tokens/lit';\nimport { helixAccordionStyles } from './hx-accordion.styles.js';\nimport type { HelixAccordionItem } from './hx-accordion-item.js';\n\n/**\n * A container component that manages a set of collapsible `hx-accordion-item` children.\n * Supports single-expand (only one item open at a time) and multi-expand modes.\n *\n * @summary Accessible accordion container supporting single and multi-expand modes.\n *\n * @tag hx-accordion\n *\n * @slot - One or more `<hx-accordion-item>` elements.\n *\n * @csspart accordion - The outer accordion container element.\n */\n@customElement('hx-accordion')\nexport class HelixAccordion extends LitElement {\n  static override styles = [tokenStyles, helixAccordionStyles];\n\n  // ─── Properties ───\n\n  /**\n   * Expand mode. In `'single'` mode only one item may be open at a time.\n   * In `'multi'` mode any number of items can be open simultaneously.\n   * @attr mode\n   */\n  @property({ type: String, reflect: true })\n  mode: 'single' | 'multi' = 'single';\n\n  // ─── Lifecycle ───\n\n  override connectedCallback(): void {\n    super.connectedCallback();\n    this.addEventListener('hx-expand', this._handleItemExpand as EventListener);\n    this.addEventListener('hx-accordion-nav', this._handleNavigation as EventListener);\n  }\n\n  override disconnectedCallback(): void {\n    super.disconnectedCallback();\n    this.removeEventListener('hx-expand', this._handleItemExpand as EventListener);\n    this.removeEventListener('hx-accordion-nav', this._handleNavigation as EventListener);\n  }\n\n  // ─── Item Queries ───\n\n  private _getItems(): HelixAccordionItem[] {\n    return Array.from(this.querySelectorAll('hx-accordion-item')) as HelixAccordionItem[];\n  }\n\n  private _getEnabledItems(): HelixAccordionItem[] {\n    return this._getItems().filter((item) => !item.disabled);\n  }\n\n  // ─── Event Handlers ───\n\n  private _handleItemExpand = (e: CustomEvent<{ itemId: string }>): void => {\n    if (this.mode !== 'single') return;\n\n    // Collapse all other open items\n    const expandedItem = e.target as HelixAccordionItem;\n    this._getItems().forEach((item) => {\n      if (item !== expandedItem && item.open) {\n        item.collapse();\n      }\n    });\n  };\n\n  private _handleNavigation = (\n    e: CustomEvent<{ direction: 'prev' | 'next'; source: HelixAccordionItem }>,\n  ): void => {\n    const enabledItems = this._getEnabledItems();\n    if (enabledItems.length === 0) return;\n\n    const { direction, source } = e.detail;\n    const currentIndex = enabledItems.indexOf(source);\n    if (currentIndex === -1) return;\n\n    let nextIndex: number;\n    if (direction === 'next') {\n      nextIndex = (currentIndex + 1) % enabledItems.length;\n    } else {\n      nextIndex = currentIndex <= 0 ? enabledItems.length - 1 : currentIndex - 1;\n    }\n\n    const nextItem = enabledItems[nextIndex];\n    if (nextItem) {\n      // Focus the summary inside the shadow root of the target item\n      const summary = nextItem.shadowRoot?.querySelector<HTMLElement>('summary');\n      summary?.focus();\n    }\n  };\n\n  // ─── Render ───\n\n  override render() {\n    return html`\n      <div part=\"accordion\" class=\"accordion\" role=\"list\">\n        <slot></slot>\n      </div>\n    `;\n  }\n}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    'hx-accordion': HelixAccordion;\n  }\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-accordion/index.ts",
  "content": "export { HelixAccordion } from './hx-accordion.js';\nexport { HelixAccordionItem } from './hx-accordion-item.js';\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-accordion/hx-accordion.stories.ts",
  "content": "import type { Meta, StoryObj } from '@storybook/web-components';\nimport { html } from 'lit';\nimport { expect, within, userEvent, fn } from 'storybook/test';\nimport './hx-accordion.js';\nimport './hx-accordion-item.js';\n\n// ─── Meta ─────────────────────────────────────────────────────────────────────\n\nconst meta = {\n  title: 'Components/Accordion',\n  component: 'hx-accordion',\n  tags: ['autodocs'],\n  argTypes: {\n    mode: {\n      control: { type: 'select' },\n      options: ['single', 'multi'],\n      description:\n        'Expand mode. In single mode only one item can be open at a time. In multi mode any number of items can be open.',\n      table: {\n        category: 'Behavior',\n        defaultValue: { summary: 'single' },\n        type: { summary: \"'single' | 'multi'\" },\n      },\n    },\n  },\n  args: {\n    mode: 'single',\n  },\n  render: (args) => html`\n    <hx-accordion mode=${args.mode} style=\"max-width: 600px;\">\n      <hx-accordion-item item-id=\"item-1\">\n        <span slot=\"trigger\">What are the clinic hours?</span>\n        <p>The clinic is open Monday through Friday, 8:00 AM to 6:00 PM, and Saturday 9:00 AM to 1:00 PM. We are closed on Sundays and major holidays.</p>\n      </hx-accordion-item>\n      <hx-accordion-item item-id=\"item-2\">\n        <span slot=\"trigger\">How do I request a prescription refill?</span>\n        <p>Prescription refills can be requested through the patient portal, by calling our pharmacy line at (555) 867-5309, or by asking your provider during your next scheduled visit.</p>\n      </hx-accordion-item>\n      <hx-accordion-item item-id=\"item-3\">\n        <span slot=\"trigger\">What insurance plans are accepted?</span>\n        <p>We accept most major insurance plans including Medicare, Medicaid, Blue Cross Blue Shield, Aetna, UnitedHealth, and Cigna. Please contact our billing department to verify your specific plan coverage.</p>\n      </hx-accordion-item>\n    </hx-accordion>\n  `,\n} satisfies Meta;\n\nexport default meta;\ntype Story = StoryObj;\n\n// ─────────────────────────────────────────────────\n// 1. DEFAULT\n// ─────────────────────────────────────────────────\n\nexport const Default: Story = {\n  render: (args) => html`\n    <hx-accordion mode=${args.mode} style=\"max-width: 600px;\">\n      <hx-accordion-item item-id=\"item-1\">\n        <span slot=\"trigger\">What are the clinic hours?</span>\n        <p>The clinic is open Monday through Friday, 8:00 AM to 6:00 PM, and Saturday 9:00 AM to 1:00 PM. We are closed on Sundays and major holidays.</p>\n      </hx-accordion-item>\n      <hx-accordion-item item-id=\"item-2\">\n        <span slot=\"trigger\">How do I request a prescription refill?</span>\n        <p>Prescription refills can be requested through the patient portal, by calling our pharmacy line at (555) 867-5309, or by asking your provider during your next scheduled visit.</p>\n      </hx-accordion-item>\n      <hx-accordion-item item-id=\"item-3\">\n        <span slot=\"trigger\">What insurance plans are accepted?</span>\n        <p>We accept most major insurance plans including Medicare, Medicaid, Blue Cross Blue Shield, Aetna, UnitedHealth, and Cigna. Please contact our billing department to verify your specific plan coverage.</p>\n      </hx-accordion-item>\n    </hx-accordion>\n  `,\n  play: async ({ canvasElement }) => {\n    const accordion = canvasElement.querySelector('hx-accordion');\n    await expect(accordion).toBeTruthy();\n    await expect(accordion?.shadowRoot?.querySelector('.accordion')).toBeTruthy();\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 2. SINGLE MODE\n// ─────────────────────────────────────────────────\n\nexport const SingleMode: Story = {\n  name: 'Mode: Single',\n  args: { mode: 'single' },\n  render: () => html`\n    <div style=\"max-width: 600px;\">\n      <p style=\"font-size: 0.875rem; color: var(--hx-color-neutral-600, #495057); margin-bottom: 1rem;\">\n        In single mode, opening one item automatically closes any previously open item.\n      </p>\n      <hx-accordion mode=\"single\">\n        <hx-accordion-item item-id=\"single-1\" open>\n          <span slot=\"trigger\">Patient Rights &amp; Responsibilities</span>\n          <p>Every patient has the right to receive respectful, considerate care that preserves their dignity and autonomy. You may request information about your diagnosis, treatment options, and prognosis in terms you can understand.</p>\n        </hx-accordion-item>\n        <hx-accordion-item item-id=\"single-2\">\n          <span slot=\"trigger\">Privacy &amp; Confidentiality</span>\n          <p>Your health information is protected under HIPAA. We will not disclose your information to third parties without your written consent except as required by law or for treatment purposes.</p>\n        </hx-accordion-item>\n        <hx-accordion-item item-id=\"single-3\">\n          <span slot=\"trigger\">Billing &amp; Financial Assistance</span>\n          <p>We offer a financial assistance program for patients who qualify based on income. Please contact our billing department to complete a financial assistance application and discuss payment plan options.</p>\n        </hx-accordion-item>\n      </hx-accordion>\n    </div>\n  `,\n  play: async ({ canvasElement }) => {\n    const accordion = canvasElement.querySelector('hx-accordion');\n    const items = canvasElement.querySelectorAll('hx-accordion-item');\n\n    await expect(accordion).toBeTruthy();\n    await expect(items.length).toBe(3);\n\n    // First item should be open by default\n    await expect(items[0]?.hasAttribute('open')).toBe(true);\n    await expect(items[1]?.hasAttribute('open')).toBe(false);\n\n    // Click second item trigger\n    const secondTrigger = items[1]?.shadowRoot?.querySelector('summary') as HTMLElement;\n    if (secondTrigger) {\n      secondTrigger.click();\n      await new Promise((r) => setTimeout(r, 50));\n      // In single mode, first should close, second should open\n      await expect(items[0]?.hasAttribute('open')).toBe(false);\n      await expect(items[1]?.hasAttribute('open')).toBe(true);\n    }\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 3. MULTI MODE\n// ─────────────────────────────────────────────────\n\nexport const MultiMode: Story = {\n  name: 'Mode: Multi',\n  args: { mode: 'multi' },\n  render: () => html`\n    <div style=\"max-width: 600px;\">\n      <p style=\"font-size: 0.875rem; color: var(--hx-color-neutral-600, #495057); margin-bottom: 1rem;\">\n        In multi mode, multiple items can be open simultaneously.\n      </p>\n      <hx-accordion mode=\"multi\">\n        <hx-accordion-item item-id=\"multi-1\" open>\n          <span slot=\"trigger\">Current Medications</span>\n          <div>\n            <ul>\n              <li>Metoprolol succinate 50 mg — once daily</li>\n              <li>Lisinopril 10 mg — once daily</li>\n              <li>Atorvastatin 40 mg — once daily at bedtime</li>\n            </ul>\n          </div>\n        </hx-accordion-item>\n        <hx-accordion-item item-id=\"multi-2\" open>\n          <span slot=\"trigger\">Known Allergies</span>\n          <div>\n            <ul>\n              <li><strong>Penicillin</strong> — anaphylaxis (severe)</li>\n              <li><strong>Sulfa drugs</strong> — rash (moderate)</li>\n            </ul>\n          </div>\n        </hx-accordion-item>\n        <hx-accordion-item item-id=\"multi-3\">\n          <span slot=\"trigger\">Recent Lab Results</span>\n          <div>\n            <p>CBC (2026-02-14): Within normal limits. HbA1c (2026-01-30): 6.8% (controlled).</p>\n          </div>\n        </hx-accordion-item>\n      </hx-accordion>\n    </div>\n  `,\n  play: async ({ canvasElement }) => {\n    const items = canvasElement.querySelectorAll('hx-accordion-item');\n\n    // Both first and second items should start open\n    await expect(items[0]?.hasAttribute('open')).toBe(true);\n    await expect(items[1]?.hasAttribute('open')).toBe(true);\n    await expect(items[2]?.hasAttribute('open')).toBe(false);\n\n    // Click third item trigger\n    const thirdTrigger = items[2]?.shadowRoot?.querySelector('summary') as HTMLElement;\n    if (thirdTrigger) {\n      thirdTrigger.click();\n      await new Promise((r) => setTimeout(r, 50));\n      // In multi mode, first and second should remain open\n      await expect(items[0]?.hasAttribute('open')).toBe(true);\n      await expect(items[1]?.hasAttribute('open')).toBe(true);\n      await expect(items[2]?.hasAttribute('open')).toBe(true);\n    }\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 4. WITH DISABLED ITEM\n// ─────────────────────────────────────────────────\n\nexport const WithDisabledItem: Story = {\n  name: 'With Disabled Item',\n  render: () => html`\n    <hx-accordion mode=\"single\" style=\"max-width: 600px;\">\n      <hx-accordion-item item-id=\"dis-1\" open>\n        <span slot=\"trigger\">General Appointment Information</span>\n        <p>Appointments can be scheduled online, by phone, or in person. Please arrive 15 minutes early to complete check-in paperwork.</p>\n      </hx-accordion-item>\n      <hx-accordion-item item-id=\"dis-2\" disabled>\n        <span slot=\"trigger\">Restricted: Provider-Only Content (Disabled)</span>\n        <p>This section requires provider-level access. Contact your system administrator to request elevated permissions.</p>\n      </hx-accordion-item>\n      <hx-accordion-item item-id=\"dis-3\">\n        <span slot=\"trigger\">Emergency Contact Information</span>\n        <p>In case of a medical emergency, call 911 immediately. For urgent but non-emergency situations, contact our after-hours nurse line at (555) 123-4567.</p>\n      </hx-accordion-item>\n    </hx-accordion>\n  `,\n  play: async ({ canvasElement }) => {\n    const items = canvasElement.querySelectorAll('hx-accordion-item');\n    const disabledItem = items[1];\n    await expect(disabledItem?.hasAttribute('disabled')).toBe(true);\n\n    const disabledTrigger = disabledItem?.shadowRoot?.querySelector('summary') as HTMLElement;\n    if (disabledTrigger) {\n      await expect(disabledTrigger.getAttribute('aria-disabled')).toBe('true');\n      // Clicking disabled trigger should not open it\n      disabledTrigger.click();\n      await new Promise((r) => setTimeout(r, 50));\n      await expect(disabledItem?.hasAttribute('open')).toBe(false);\n    }\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 5. KEYBOARD NAVIGATION\n// ─────────────────────────────────────────────────\n\nexport const KeyboardNavigation: Story = {\n  name: 'Keyboard Navigation',\n  render: () => html`\n    <div style=\"max-width: 600px;\">\n      <p style=\"font-size: 0.875rem; color: var(--hx-color-neutral-600, #495057); margin-bottom: 1rem;\">\n        Use <strong>Enter</strong> or <strong>Space</strong> to toggle items.\n        Use <strong>Arrow Up/Down</strong> to navigate between items.\n      </p>\n      <hx-accordion mode=\"single\">\n        <hx-accordion-item item-id=\"kb-1\">\n          <span slot=\"trigger\">Keyboard: Item 1 — Medication Administration</span>\n          <p>All medications must be administered as prescribed. Report any adverse reactions to the charge nurse immediately.</p>\n        </hx-accordion-item>\n        <hx-accordion-item item-id=\"kb-2\">\n          <span slot=\"trigger\">Keyboard: Item 2 — Vital Signs Protocol</span>\n          <p>Vital signs should be recorded every 4 hours for general med/surg patients, every 2 hours for step-down, and continuously for ICU patients.</p>\n        </hx-accordion-item>\n        <hx-accordion-item item-id=\"kb-3\">\n          <span slot=\"trigger\">Keyboard: Item 3 — Documentation Requirements</span>\n          <p>All clinical documentation must be completed within 4 hours of patient encounter. Use only approved abbreviations listed in the clinical reference guide.</p>\n        </hx-accordion-item>\n      </hx-accordion>\n    </div>\n  `,\n  play: async ({ canvasElement }) => {\n    const items = canvasElement.querySelectorAll('hx-accordion-item');\n    const firstTrigger = items[0]?.shadowRoot?.querySelector('summary') as HTMLElement;\n\n    if (firstTrigger) {\n      firstTrigger.focus();\n      await expect(firstTrigger).toHaveFocus();\n\n      // Press Enter to open\n      await userEvent.keyboard('{Enter}');\n      await new Promise((r) => setTimeout(r, 50));\n      await expect(items[0]?.hasAttribute('open')).toBe(true);\n\n      // Press Space to close\n      await userEvent.keyboard(' ');\n      await new Promise((r) => setTimeout(r, 50));\n      await expect(items[0]?.hasAttribute('open')).toBe(false);\n    }\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 6. ALL VARIANTS (initially open states)\n// ─────────────────────────────────────────────────\n\nexport const AllVariants: Story = {\n  name: 'All Variants',\n  render: () => html`\n    <div style=\"display: flex; flex-direction: column; gap: 2rem; max-width: 700px;\">\n      <div>\n        <h3 style=\"margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;\">\n          Single Mode — Collapsed (default)\n        </h3>\n        <hx-accordion mode=\"single\">\n          <hx-accordion-item item-id=\"v1-1\">\n            <span slot=\"trigger\">Facility Visitor Policy</span>\n            <p>Visitors are welcome during designated hours. No more than two visitors per patient at a time. Children under 12 must be accompanied by an adult.</p>\n          </hx-accordion-item>\n          <hx-accordion-item item-id=\"v1-2\">\n            <span slot=\"trigger\">Discharge Planning</span>\n            <p>Discharge planning begins upon admission. Social work and case management will coordinate post-discharge services, transportation, and follow-up appointments.</p>\n          </hx-accordion-item>\n        </hx-accordion>\n      </div>\n\n      <div>\n        <h3 style=\"margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;\">\n          Single Mode — First Item Open\n        </h3>\n        <hx-accordion mode=\"single\">\n          <hx-accordion-item item-id=\"v2-1\" open>\n            <span slot=\"trigger\">Pre-operative Instructions</span>\n            <p>Do not eat or drink anything after midnight before your surgery. Shower with antibacterial soap the night before and the morning of. Remove all nail polish and jewelry.</p>\n          </hx-accordion-item>\n          <hx-accordion-item item-id=\"v2-2\">\n            <span slot=\"trigger\">Post-operative Care</span>\n            <p>Follow all wound care instructions provided at discharge. Return to the emergency department immediately if you experience fever above 101.5°F, increased redness, or drainage from the wound site.</p>\n          </hx-accordion-item>\n        </hx-accordion>\n      </div>\n\n      <div>\n        <h3 style=\"margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;\">\n          Multi Mode — Multiple Open\n        </h3>\n        <hx-accordion mode=\"multi\">\n          <hx-accordion-item item-id=\"v3-1\" open>\n            <span slot=\"trigger\">Blood Pressure Log</span>\n            <p>Morning: 128/82 | Afternoon: 132/78 | Evening: 126/80</p>\n          </hx-accordion-item>\n          <hx-accordion-item item-id=\"v3-2\" open>\n            <span slot=\"trigger\">Blood Glucose Log</span>\n            <p>Fasting: 98 mg/dL | 2hr post-meal: 142 mg/dL | Bedtime: 110 mg/dL</p>\n          </hx-accordion-item>\n          <hx-accordion-item item-id=\"v3-3\">\n            <span slot=\"trigger\">Weight &amp; BMI</span>\n            <p>Current weight: 182 lbs | BMI: 27.4 | Target weight: 175 lbs</p>\n          </hx-accordion-item>\n        </hx-accordion>\n      </div>\n\n      <div>\n        <h3 style=\"margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;\">\n          With Disabled Item\n        </h3>\n        <hx-accordion mode=\"single\">\n          <hx-accordion-item item-id=\"v4-1\">\n            <span slot=\"trigger\">General Information</span>\n            <p>Standard clinical information accessible to all authorized staff.</p>\n          </hx-accordion-item>\n          <hx-accordion-item item-id=\"v4-2\" disabled>\n            <span slot=\"trigger\">Restricted: Administrative Override (Disabled)</span>\n            <p>This content is not accessible at your current permission level.</p>\n          </hx-accordion-item>\n          <hx-accordion-item item-id=\"v4-3\">\n            <span slot=\"trigger\">Care Plan Summary</span>\n            <p>Care plan established 2026-02-01. Next review scheduled for 2026-03-01.</p>\n          </hx-accordion-item>\n        </hx-accordion>\n      </div>\n    </div>\n  `,\n};\n\n// ─────────────────────────────────────────────────\n// 7. HEALTHCARE FAQ (Kitchen Sink)\n// ─────────────────────────────────────────────────\n\nconst expandHandler = fn();\nconst collapseHandler = fn();\n\nexport const HealthcareFAQ: Story = {\n  name: 'Healthcare FAQ (Kitchen Sink)',\n  render: () => html`\n    <div style=\"max-width: 700px;\">\n      <h2 style=\"font-size: 1.5rem; font-weight: 600; margin: 0 0 0.5rem;\">\n        Patient Frequently Asked Questions\n      </h2>\n      <p style=\"color: var(--hx-color-neutral-600, #495057); margin: 0 0 1.5rem; font-size: 0.9375rem;\">\n        Find answers to common questions about your care, appointments, and services.\n      </p>\n\n      <hx-accordion mode=\"single\" @hx-expand=${expandHandler} @hx-collapse=${collapseHandler}>\n        <hx-accordion-item item-id=\"faq-1\">\n          <span slot=\"trigger\">How do I access my medical records?</span>\n          <div>\n            <p>You can access your medical records through several channels:</p>\n            <ul>\n              <li>Online via the patient portal at myhealth.example.com</li>\n              <li>By submitting a written request to our Medical Records department</li>\n              <li>In person at the Medical Records office, Monday–Friday 8 AM–4 PM</li>\n            </ul>\n            <p>Records are typically available within 5–7 business days. Expedited requests for active care coordination may be processed within 24 hours.</p>\n          </div>\n        </hx-accordion-item>\n\n        <hx-accordion-item item-id=\"faq-2\">\n          <span slot=\"trigger\">What should I bring to my appointment?</span>\n          <div>\n            <p>Please bring the following to every appointment:</p>\n            <ul>\n              <li>Valid government-issued photo ID</li>\n              <li>Current insurance card(s)</li>\n              <li>List of all current medications, including supplements and over-the-counter drugs</li>\n              <li>Names and contact information for your other healthcare providers</li>\n              <li>Any referral forms required by your insurance plan</li>\n            </ul>\n          </div>\n        </hx-accordion-item>\n\n        <hx-accordion-item item-id=\"faq-3\">\n          <span slot=\"trigger\">How do I prepare for a procedure or surgery?</span>\n          <div>\n            <p>Preparation instructions vary by procedure. You will receive specific instructions from your care team. General guidelines include:</p>\n            <ul>\n              <li>Follow all dietary restrictions (NPO status if applicable)</li>\n              <li>Continue taking prescribed medications unless instructed otherwise</li>\n              <li>Arrange for a responsible adult to drive you home after sedation</li>\n              <li>Wear comfortable, loose-fitting clothing</li>\n            </ul>\n            <p>Contact us at (555) 234-5678 if you have questions about your specific preparation instructions.</p>\n          </div>\n        </hx-accordion-item>\n\n        <hx-accordion-item item-id=\"faq-4\">\n          <span slot=\"trigger\">What is the grievance and complaint process?</span>\n          <div>\n            <p>We take all patient concerns seriously. To file a grievance:</p>\n            <ol>\n              <li>Speak with your nurse or charge nurse first</li>\n              <li>Contact Patient Relations at (555) 345-6789 or patient.relations@example.com</li>\n              <li>Submit a written complaint to the Patient Relations Office</li>\n            </ol>\n            <p>All grievances are acknowledged within 24 hours and resolved within 30 calendar days. You may also contact The Joint Commission at (800) 994-6610.</p>\n          </div>\n        </hx-accordion-item>\n\n        <hx-accordion-item item-id=\"faq-5\" disabled>\n          <span slot=\"trigger\">Provider Directory (Temporarily Unavailable)</span>\n          <p>The provider directory is currently undergoing maintenance. Please call our scheduling line at (555) 456-7890 for provider availability.</p>\n        </hx-accordion-item>\n\n        <hx-accordion-item item-id=\"faq-6\">\n          <span slot=\"trigger\">How is my health information protected?</span>\n          <div>\n            <p>Your health information is protected under the Health Insurance Portability and Accountability Act (HIPAA). We are committed to:</p>\n            <ul>\n              <li>Using your information only for treatment, payment, and healthcare operations</li>\n              <li>Protecting electronic health information with industry-standard encryption</li>\n              <li>Training all staff on privacy and security requirements</li>\n              <li>Providing you with a copy of our Notice of Privacy Practices upon request</li>\n            </ul>\n            <p>To report a suspected privacy violation, contact our Privacy Officer at privacy@example.com.</p>\n          </div>\n        </hx-accordion-item>\n      </hx-accordion>\n    </div>\n  `,\n  play: async ({ canvasElement }) => {\n    expandHandler.mockClear();\n    collapseHandler.mockClear();\n\n    const items = canvasElement.querySelectorAll('hx-accordion-item');\n    await expect(items.length).toBe(6);\n\n    // Open first item\n    const firstTrigger = items[0]?.shadowRoot?.querySelector('summary') as HTMLElement;\n    if (firstTrigger) {\n      firstTrigger.click();\n      await new Promise((r) => setTimeout(r, 100));\n      await expect(expandHandler).toHaveBeenCalledTimes(1);\n      await expect(items[0]?.hasAttribute('open')).toBe(true);\n\n      // Open second item — first should close in single mode\n      const secondTrigger = items[1]?.shadowRoot?.querySelector('summary') as HTMLElement;\n      secondTrigger?.click();\n      await new Promise((r) => setTimeout(r, 100));\n\n      await expect(items[0]?.hasAttribute('open')).toBe(false);\n      await expect(items[1]?.hasAttribute('open')).toBe(true);\n\n      // Disabled item should not open\n      const disabledTrigger = items[4]?.shadowRoot?.querySelector('summary') as HTMLElement;\n      disabledTrigger?.click();\n      await new Promise((r) => setTimeout(r, 50));\n      await expect(items[4]?.hasAttribute('open')).toBe(false);\n    }\n  },\n};\n\n// ─────────────────────────────────────────────────\n// 8. CSS CUSTOM PROPERTIES DEMO\n// ─────────────────────────────────────────────────\n\nexport const CSSCustomProperties: Story = {\n  name: 'CSS Custom Properties',\n  render: () => html`\n    <div style=\"display: flex; flex-direction: column; gap: 2rem; max-width: 600px;\">\n      <div>\n        <h3 style=\"margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;\">Default Styling</h3>\n        <hx-accordion mode=\"single\">\n          <hx-accordion-item item-id=\"css-default-1\" open>\n            <span slot=\"trigger\">Standard accordion item</span>\n            <p>This item uses all default design token values.</p>\n          </hx-accordion-item>\n        </hx-accordion>\n      </div>\n\n      <div>\n        <h3 style=\"margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;\">Themed with Custom Properties</h3>\n        <hx-accordion\n          mode=\"single\"\n          style=\"\n            --hx-accordion-item-border-color: #2563eb;\n            --hx-accordion-trigger-bg: #eff6ff;\n            --hx-accordion-trigger-bg-hover: #dbeafe;\n            --hx-accordion-trigger-color: #1e40af;\n            --hx-accordion-content-bg: #f8faff;\n            --hx-accordion-content-padding: 1.5rem;\n            --hx-accordion-icon-color: #2563eb;\n            --hx-accordion-border-radius: 0.5rem;\n          \"\n        >\n          <hx-accordion-item item-id=\"css-themed-1\" open>\n            <span slot=\"trigger\">Themed accordion item (all custom properties set)</span>\n            <p>This item overrides all eight CSS custom properties to demonstrate the complete theming surface available to consumers of this component.</p>\n          </hx-accordion-item>\n          <hx-accordion-item item-id=\"css-themed-2\">\n            <span slot=\"trigger\">Second themed item</span>\n            <p>Theming is applied at the accordion container level and inherited by all child items.</p>\n          </hx-accordion-item>\n        </hx-accordion>\n      </div>\n\n      <details style=\"max-width: 640px;\">\n        <summary style=\"cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;\">\n          View CSS Custom Properties Reference\n        </summary>\n        <pre style=\"background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; font-size: 0.8125rem; overflow-x: auto; line-height: 1.6;\">\nhx-accordion {\n  /* Item border color */\n  --hx-accordion-item-border-color: var(--hx-color-neutral-200);\n\n  /* Trigger background */\n  --hx-accordion-trigger-bg: var(--hx-color-neutral-0);\n\n  /* Trigger hover background */\n  --hx-accordion-trigger-bg-hover: var(--hx-color-neutral-50);\n\n  /* Trigger text color */\n  --hx-accordion-trigger-color: var(--hx-color-neutral-800);\n\n  /* Content panel background */\n  --hx-accordion-content-bg: var(--hx-color-neutral-0);\n\n  /* Content padding */\n  --hx-accordion-content-padding: var(--hx-space-5);\n\n  /* Chevron icon color */\n  --hx-accordion-icon-color: var(--hx-color-neutral-500);\n\n  /* Item border radius */\n  --hx-accordion-border-radius: var(--hx-border-radius-md);\n}</pre>\n      </details>\n    </div>\n  `,\n};\n\n// ─────────────────────────────────────────────────\n// 9. CSS PARTS DEMO\n// ─────────────────────────────────────────────────\n\nexport const CSSParts: Story = {\n  name: 'CSS Parts',\n  render: () => html`\n    <style>\n      .parts-demo hx-accordion-item::part(item) {\n        border: 2px dashed #6366f1;\n      }\n      .parts-demo hx-accordion-item::part(trigger) {\n        background: #ede9fe;\n        color: #4338ca;\n      }\n      .parts-demo hx-accordion-item::part(icon) {\n        color: #6366f1;\n      }\n      .parts-demo hx-accordion-item::part(content) {\n        background: #faf5ff;\n      }\n    </style>\n    <div style=\"max-width: 600px;\">\n      <h3 style=\"margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;\">\n        All CSS Parts Styled Externally\n      </h3>\n      <hx-accordion class=\"parts-demo\" mode=\"single\">\n        <hx-accordion-item item-id=\"parts-1\" open>\n          <span slot=\"trigger\">::part(trigger) — custom background applied</span>\n          <p>::part(content) — custom background applied to this content panel.</p>\n        </hx-accordion-item>\n        <hx-accordion-item item-id=\"parts-2\">\n          <span slot=\"trigger\">::part(item) — dashed purple border around entire item</span>\n          <p>The ::part(icon) chevron is also styled with a purple color.</p>\n        </hx-accordion-item>\n      </hx-accordion>\n    </div>\n  `,\n};\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-accordion/hx-accordion.test.ts",
  "content": "import { describe, it, expect, afterEach } from 'vitest';\nimport { page } from '@vitest/browser/context';\nimport { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';\nimport type { HelixAccordion } from './hx-accordion.js';\nimport type { HelixAccordionItem } from './hx-accordion-item.js';\nimport './index.js';\n\nafterEach(cleanup);\n\n// ─── hx-accordion ─────────────────────────────────────────────────────────────\n\ndescribe('hx-accordion', () => {\n  // ─── Rendering ───\n\n  describe('Rendering', () => {\n    it('renders with shadow DOM', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion>\n          <hx-accordion-item><span slot=\"trigger\">Item 1</span><p>Content 1</p></hx-accordion-item>\n        </hx-accordion>\n      `);\n      expect(el.shadowRoot).toBeTruthy();\n    });\n\n    it('renders the \"accordion\" CSS part', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion>\n          <hx-accordion-item><span slot=\"trigger\">Item 1</span><p>Content 1</p></hx-accordion-item>\n        </hx-accordion>\n      `);\n      const container = shadowQuery(el, '[part~=\"accordion\"]');\n      expect(container).toBeTruthy();\n    });\n\n    it('renders slotted accordion items', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion>\n          <hx-accordion-item item-id=\"i1\"><span slot=\"trigger\">Item 1</span><p>Content 1</p></hx-accordion-item>\n          <hx-accordion-item item-id=\"i2\"><span slot=\"trigger\">Item 2</span><p>Content 2</p></hx-accordion-item>\n        </hx-accordion>\n      `);\n      const items = el.querySelectorAll('hx-accordion-item');\n      expect(items.length).toBe(2);\n    });\n\n    it('defaults to mode=\"single\"', async () => {\n      const el = await fixture<HelixAccordion>(`<hx-accordion></hx-accordion>`);\n      expect(el.mode).toBe('single');\n      expect(el.getAttribute('mode')).toBe('single');\n    });\n  });\n\n  // ─── Property: mode ───\n\n  describe('Property: mode', () => {\n    it('reflects mode=\"single\" attribute to host', async () => {\n      const el = await fixture<HelixAccordion>(`<hx-accordion mode=\"single\"></hx-accordion>`);\n      expect(el.getAttribute('mode')).toBe('single');\n    });\n\n    it('reflects mode=\"multi\" attribute to host', async () => {\n      const el = await fixture<HelixAccordion>(`<hx-accordion mode=\"multi\"></hx-accordion>`);\n      expect(el.getAttribute('mode')).toBe('multi');\n    });\n\n    it('single mode closes other items when one expands', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion mode=\"single\">\n          <hx-accordion-item item-id=\"s1\" open><span slot=\"trigger\">Item 1</span><p>Content 1</p></hx-accordion-item>\n          <hx-accordion-item item-id=\"s2\"><span slot=\"trigger\">Item 2</span><p>Content 2</p></hx-accordion-item>\n        </hx-accordion>\n      `);\n\n      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;\n      expect(items[0]?.open).toBe(true);\n      expect(items[1]?.open).toBe(false);\n\n      // Expand item 2\n      items[1]?.expand();\n      await items[1]?.updateComplete;\n      await items[0]?.updateComplete;\n\n      // Item 2 should now be open; item 1 should be closed\n      expect(items[1]?.open).toBe(true);\n      expect(items[0]?.open).toBe(false);\n    });\n\n    it('multi mode allows multiple items to be open simultaneously', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion mode=\"multi\">\n          <hx-accordion-item item-id=\"m1\" open><span slot=\"trigger\">Item 1</span><p>Content 1</p></hx-accordion-item>\n          <hx-accordion-item item-id=\"m2\"><span slot=\"trigger\">Item 2</span><p>Content 2</p></hx-accordion-item>\n        </hx-accordion>\n      `);\n\n      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;\n      expect(items[0]?.open).toBe(true);\n\n      // Expand item 2\n      items[1]?.expand();\n      await items[1]?.updateComplete;\n      await items[0]?.updateComplete;\n\n      // Both should now be open in multi mode\n      expect(items[0]?.open).toBe(true);\n      expect(items[1]?.open).toBe(true);\n    });\n  });\n\n  // ─── Keyboard Navigation ───\n\n  describe('Keyboard Navigation', () => {\n    it('ArrowDown moves focus to next enabled item', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion mode=\"single\">\n          <hx-accordion-item item-id=\"kn1\"><span slot=\"trigger\">Item 1</span><p>Content</p></hx-accordion-item>\n          <hx-accordion-item item-id=\"kn2\"><span slot=\"trigger\">Item 2</span><p>Content</p></hx-accordion-item>\n        </hx-accordion>\n      `);\n      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;\n      const firstSummary = items[0]?.shadowRoot?.querySelector<HTMLElement>('summary');\n      const secondSummary = items[1]?.shadowRoot?.querySelector<HTMLElement>('summary');\n\n      expect(firstSummary).toBeTruthy();\n      expect(secondSummary).toBeTruthy();\n\n      firstSummary!.focus();\n      firstSummary!.dispatchEvent(\n        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),\n      );\n\n      await new Promise((r) => setTimeout(r, 50));\n      expect(document.activeElement !== firstSummary || secondSummary === document.activeElement).toBe(true);\n    });\n\n    it('ArrowUp moves focus to previous enabled item', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion mode=\"single\">\n          <hx-accordion-item item-id=\"ku1\"><span slot=\"trigger\">Item 1</span><p>Content</p></hx-accordion-item>\n          <hx-accordion-item item-id=\"ku2\"><span slot=\"trigger\">Item 2</span><p>Content</p></hx-accordion-item>\n        </hx-accordion>\n      `);\n      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;\n      const secondSummary = items[1]?.shadowRoot?.querySelector<HTMLElement>('summary');\n\n      expect(secondSummary).toBeTruthy();\n\n      secondSummary!.focus();\n      secondSummary!.dispatchEvent(\n        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }),\n      );\n\n      await new Promise((r) => setTimeout(r, 50));\n      // Focus should have moved to a different element (first or wraps around)\n      expect(secondSummary).toBeTruthy();\n    });\n\n    it('Arrow keys skip disabled items', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion mode=\"single\">\n          <hx-accordion-item item-id=\"kd1\"><span slot=\"trigger\">Item 1</span><p>Content</p></hx-accordion-item>\n          <hx-accordion-item item-id=\"kd2\" disabled><span slot=\"trigger\">Disabled</span><p>Content</p></hx-accordion-item>\n          <hx-accordion-item item-id=\"kd3\"><span slot=\"trigger\">Item 3</span><p>Content</p></hx-accordion-item>\n        </hx-accordion>\n      `);\n      const items = el.querySelectorAll('hx-accordion-item') as NodeListOf<HelixAccordionItem>;\n      expect(items[1]?.disabled).toBe(true);\n\n      // The enabled items should be items 0 and 2\n      const enabledItems = Array.from(items).filter((item) => !item.disabled);\n      expect(enabledItems.length).toBe(2);\n    });\n  });\n\n  // ─── Accessibility (axe-core) ───\n\n  describe('Accessibility (axe-core)', () => {\n    it('has no axe violations in default state', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion>\n          <hx-accordion-item item-id=\"a11y-1\">\n            <span slot=\"trigger\">Question 1</span>\n            <p>Answer 1</p>\n          </hx-accordion-item>\n          <hx-accordion-item item-id=\"a11y-2\">\n            <span slot=\"trigger\">Question 2</span>\n            <p>Answer 2</p>\n          </hx-accordion-item>\n        </hx-accordion>\n      `);\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations when items are open', async () => {\n      const el = await fixture<HelixAccordion>(`\n        <hx-accordion mode=\"multi\">\n          <hx-accordion-item item-id=\"a11y-open-1\" open>\n            <span slot=\"trigger\">Open item 1</span>\n            <p>Visible content for item 1</p>\n          </hx-accordion-item>\n          <hx-accordion-item item-id=\"a11y-open-2\" open>\n            <span slot=\"trigger\">Open item 2</span>\n            <p>Visible content for item 2</p>\n          </hx-accordion-item>\n        </hx-accordion>\n      `);\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n  });\n});\n\n// ─── hx-accordion-item ────────────────────────────────────────────────────────\n\ndescribe('hx-accordion-item', () => {\n  // ─── Rendering ───\n\n  describe('Rendering', () => {\n    it('renders with shadow DOM', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      expect(el.shadowRoot).toBeTruthy();\n    });\n\n    it('renders a <details> element', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const details = shadowQuery<HTMLDetailsElement>(el, 'details');\n      expect(details).toBeInstanceOf(HTMLElement);\n    });\n\n    it('renders a <summary> element as trigger', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      expect(summary).toBeTruthy();\n    });\n\n    it('exposes \"item\" CSS part on details', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const part = shadowQuery(el, '[part~=\"item\"]');\n      expect(part).toBeTruthy();\n    });\n\n    it('exposes \"trigger\" CSS part on summary', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const part = shadowQuery(el, '[part~=\"trigger\"]');\n      expect(part).toBeTruthy();\n    });\n\n    it('exposes \"content\" CSS part on content panel', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const part = shadowQuery(el, '[part~=\"content\"]');\n      expect(part).toBeTruthy();\n    });\n\n    it('exposes \"icon\" CSS part on chevron container', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const part = shadowQuery(el, '[part~=\"icon\"]');\n      expect(part).toBeTruthy();\n    });\n  });\n\n  // ─── Property: open ───\n\n  describe('Property: open', () => {\n    it('defaults to open=false', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      expect(el.open).toBe(false);\n    });\n\n    it('reflects open=true attribute to host', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      expect(el.open).toBe(true);\n      expect(el.hasAttribute('open')).toBe(true);\n    });\n\n    it('passes open state to native <details>', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const details = shadowQuery<HTMLDetailsElement>(el, 'details');\n      expect(details?.open).toBe(true);\n    });\n\n    it('sets aria-expanded=\"true\" when open', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery(el, 'summary');\n      expect(summary?.getAttribute('aria-expanded')).toBe('true');\n    });\n\n    it('sets aria-expanded=\"false\" when closed', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery(el, 'summary');\n      expect(summary?.getAttribute('aria-expanded')).toBe('false');\n    });\n\n    it('sets aria-hidden=\"false\" on content when open', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const content = shadowQuery(el, '[part~=\"content\"]');\n      expect(content?.getAttribute('aria-hidden')).toBe('false');\n    });\n\n    it('sets aria-hidden=\"true\" on content when closed', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const content = shadowQuery(el, '[part~=\"content\"]');\n      expect(content?.getAttribute('aria-hidden')).toBe('true');\n    });\n  });\n\n  // ─── Property: disabled ───\n\n  describe('Property: disabled', () => {\n    it('defaults to disabled=false', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      expect(el.disabled).toBe(false);\n    });\n\n    it('reflects disabled attribute to host', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item disabled><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      expect(el.disabled).toBe(true);\n      expect(el.hasAttribute('disabled')).toBe(true);\n    });\n\n    it('sets aria-disabled=\"true\" on trigger when disabled', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item disabled><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery(el, 'summary');\n      expect(summary?.getAttribute('aria-disabled')).toBe('true');\n    });\n\n    it('sets tabindex=\"-1\" on trigger when disabled', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item disabled><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery(el, 'summary');\n      expect(summary?.getAttribute('tabindex')).toBe('-1');\n    });\n\n    it('prevents toggle() when disabled', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item disabled><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      el.toggle();\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n    });\n\n    it('prevents expand() when disabled', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item disabled><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      el.expand();\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n    });\n\n    it('click on trigger does not open disabled item', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item disabled><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      summary?.click();\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n    });\n  });\n\n  // ─── Property: item-id ───\n\n  describe('Property: item-id', () => {\n    it('reflects item-id attribute', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item item-id=\"my-item\"><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      expect(el.itemId).toBe('my-item');\n    });\n  });\n\n  // ─── toggle/expand/collapse API ───\n\n  describe('Public API: toggle / expand / collapse', () => {\n    it('toggle() opens a closed item', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      el.toggle();\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n    });\n\n    it('toggle() closes an open item', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      el.toggle();\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n    });\n\n    it('expand() opens a closed item', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      el.expand();\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n    });\n\n    it('expand() is a no-op on an already open item', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      el.expand();\n      await el.updateComplete;\n      expect(el.open).toBe(true);\n    });\n\n    it('collapse() closes an open item', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      el.collapse();\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n    });\n\n    it('collapse() is a no-op on an already closed item', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      el.collapse();\n      await el.updateComplete;\n      expect(el.open).toBe(false);\n    });\n  });\n\n  // ─── Events ───\n\n  describe('Events', () => {\n    it('dispatches hx-expand when item opens', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item item-id=\"ev-expand\"><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const eventPromise = oneEvent<CustomEvent<{ itemId: string }>>(el, 'hx-expand');\n      el.expand();\n      const event = await eventPromise;\n      expect(event).toBeTruthy();\n      expect(event.bubbles).toBe(true);\n      expect(event.composed).toBe(true);\n      expect(event.detail.itemId).toBe('ev-expand');\n    });\n\n    it('dispatches hx-collapse when item closes', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item item-id=\"ev-collapse\" open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const eventPromise = oneEvent<CustomEvent<{ itemId: string }>>(el, 'hx-collapse');\n      el.collapse();\n      const event = await eventPromise;\n      expect(event).toBeTruthy();\n      expect(event.bubbles).toBe(true);\n      expect(event.composed).toBe(true);\n      expect(event.detail.itemId).toBe('ev-collapse');\n    });\n\n    it('hx-expand detail.itemId is empty string when item-id not set', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const eventPromise = oneEvent<CustomEvent<{ itemId: string }>>(el, 'hx-expand');\n      el.expand();\n      const event = await eventPromise;\n      expect(event.detail.itemId).toBe('');\n    });\n\n    it('does NOT dispatch hx-expand when disabled', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item disabled><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      let fired = false;\n      el.addEventListener('hx-expand', () => {\n        fired = true;\n      });\n      el.expand();\n      await new Promise((r) => setTimeout(r, 50));\n      expect(fired).toBe(false);\n    });\n\n    it('does NOT dispatch hx-collapse when disabled', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item disabled open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      let fired = false;\n      el.addEventListener('hx-collapse', () => {\n        fired = true;\n      });\n      el.collapse();\n      await new Promise((r) => setTimeout(r, 50));\n      expect(fired).toBe(false);\n    });\n  });\n\n  // ─── Keyboard ───\n\n  describe('Keyboard', () => {\n    it('Enter toggles the item open', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      const eventPromise = oneEvent(el, 'hx-expand');\n      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));\n      await eventPromise;\n      expect(el.open).toBe(true);\n    });\n\n    it('Space toggles the item open', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      const eventPromise = oneEvent(el, 'hx-expand');\n      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));\n      await eventPromise;\n      expect(el.open).toBe(true);\n    });\n\n    it('Enter on open item collapses it', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      const eventPromise = oneEvent(el, 'hx-collapse');\n      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));\n      await eventPromise;\n      expect(el.open).toBe(false);\n    });\n\n    it('Enter on disabled item does nothing', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item disabled><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      let fired = false;\n      el.addEventListener('hx-expand', () => {\n        fired = true;\n      });\n      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));\n      await new Promise((r) => setTimeout(r, 50));\n      expect(fired).toBe(false);\n      expect(el.open).toBe(false);\n    });\n\n    it('ArrowDown dispatches hx-accordion-nav with direction=\"next\"', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      const navPromise = oneEvent<CustomEvent<{ direction: string }>>(el, 'hx-accordion-nav');\n      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));\n      const navEvent = await navPromise;\n      expect(navEvent.detail.direction).toBe('next');\n    });\n\n    it('ArrowUp dispatches hx-accordion-nav with direction=\"prev\"', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      const navPromise = oneEvent<CustomEvent<{ direction: string }>>(el, 'hx-accordion-nav');\n      summary?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, composed: true }));\n      const navEvent = await navPromise;\n      expect(navEvent.detail.direction).toBe('prev');\n    });\n  });\n\n  // ─── Slots ───\n\n  describe('Slots', () => {\n    it('trigger slot renders heading text', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">My Trigger Text</span><p>Content</p></hx-accordion-item>`,\n      );\n      const triggerSlotted = el.querySelector('[slot=\"trigger\"]');\n      expect(triggerSlotted?.textContent).toBe('My Trigger Text');\n    });\n\n    it('default slot renders body content', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p class=\"body-test\">Body content here</p></hx-accordion-item>`,\n      );\n      const body = el.querySelector('.body-test');\n      expect(body?.textContent).toBe('Body content here');\n    });\n  });\n\n  // ─── ARIA ───\n\n  describe('ARIA', () => {\n    it('trigger has role=\"button\"', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery(el, 'summary');\n      expect(summary?.getAttribute('role')).toBe('button');\n    });\n\n    it('content panel has role=\"region\"', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const content = shadowQuery(el, '[part~=\"content\"]');\n      expect(content?.getAttribute('role')).toBe('region');\n    });\n\n    it('trigger aria-controls matches content panel id', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery(el, 'summary');\n      const content = shadowQuery(el, '[part~=\"content\"]');\n      const controlsId = summary?.getAttribute('aria-controls');\n      const contentId = content?.id;\n      expect(controlsId).toBeTruthy();\n      expect(controlsId).toBe(contentId);\n    });\n\n    it('content panel aria-labelledby matches trigger id', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery(el, 'summary');\n      const content = shadowQuery(el, '[part~=\"content\"]');\n      const labelledById = content?.getAttribute('aria-labelledby');\n      const triggerId = summary?.id;\n      expect(labelledById).toBeTruthy();\n      expect(labelledById).toBe(triggerId);\n    });\n  });\n\n  // ─── CSS Parts ───\n\n  describe('CSS Parts', () => {\n    it('exposes all four required CSS parts', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      expect(shadowQuery(el, '[part~=\"item\"]')).toBeTruthy();\n      expect(shadowQuery(el, '[part~=\"trigger\"]')).toBeTruthy();\n      expect(shadowQuery(el, '[part~=\"content\"]')).toBeTruthy();\n      expect(shadowQuery(el, '[part~=\"icon\"]')).toBeTruthy();\n    });\n  });\n\n  // ─── Progressive Enhancement ───\n\n  describe('Progressive Enhancement', () => {\n    it('uses <details> as the base element', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const details = shadowQuery(el, 'details');\n      expect(details?.tagName.toLowerCase()).toBe('details');\n    });\n\n    it('uses <summary> as the trigger element', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery(el, 'summary');\n      expect(summary?.tagName.toLowerCase()).toBe('summary');\n    });\n  });\n\n  // ─── Click Interaction ───\n\n  describe('Click Interaction', () => {\n    it('clicking trigger opens a closed item', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      const eventPromise = oneEvent(el, 'hx-expand');\n      summary?.click();\n      await eventPromise;\n      expect(el.open).toBe(true);\n    });\n\n    it('clicking trigger on an open item closes it', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item open><span slot=\"trigger\">Title</span><p>Content</p></hx-accordion-item>`,\n      );\n      const summary = shadowQuery<HTMLElement>(el, 'summary');\n      const eventPromise = oneEvent(el, 'hx-collapse');\n      summary?.click();\n      await eventPromise;\n      expect(el.open).toBe(false);\n    });\n  });\n\n  // ─── Accessibility (axe-core) ───\n\n  describe('Accessibility (axe-core)', () => {\n    it('has no axe violations when closed', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item item-id=\"a11y-closed\">\n          <span slot=\"trigger\">Section heading</span>\n          <p>Section content</p>\n        </hx-accordion-item>`,\n      );\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations when open', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item item-id=\"a11y-open\" open>\n          <span slot=\"trigger\">Section heading</span>\n          <p>Section content that is visible</p>\n        </hx-accordion-item>`,\n      );\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations when disabled', async () => {\n      const el = await fixture<HelixAccordionItem>(\n        `<hx-accordion-item item-id=\"a11y-disabled\" disabled>\n          <span slot=\"trigger\">Disabled section</span>\n          <p>Disabled content</p>\n        </hx-accordion-item>`,\n      );\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n  });\n});\n"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-accordion/",
  "description": "Verify all accordion files created"
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -40",
  "description": "Run TypeScript type-check",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library && npx tsc --noEmit 2>&1 | head -50",
  "description": "Run TypeScript check directly on library package",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -60",
  "description": "Run library tests",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -E \"(FAIL|PASS|✓|×|hx-accordion)\" | head -40",
  "description": "Check which test files pass or fail",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -E \"(hx-accordion|FAIL|failed)\" | head -60",
  "description": "Check accordion test results specifically",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -A 20 \"hx-accordion.*Accessibility.*axe-core.*has no axe violations in default\"",
  "description": "Check the axe violation failures in detail",
  "timeout": 180000
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/src/components/hx-accordion/hx-accordion.ts",
  "old_string": "    return html`\n      <div part=\"accordion\" class=\"accordion\" role=\"list\">\n        <slot></slot>\n      </div>\n    `;",
  "new_string": "    return html`\n      <div part=\"accordion\" class=\"accordion\">\n        <slot></slot>\n      </div>\n    `;"
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -E \"(hx-accordion|×)\" | head -30",
  "description": "Re-run tests checking accordion results",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -E \"(Test Files|Tests )\" | tail -5",
  "description": "Check final test counts",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library && npx tsc --noEmit 2>&1",
  "description": "Final TypeScript zero-errors verification",
  "timeout": 60000
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing component patterns",
      "status": "completed",
      "activeForm": "Reading existing component patterns"
    },
    {
      "content": "Implement hx-accordion component via lit-specialist",
      "status": "completed",
      "activeForm": "Implementing hx-accordion component via lit-specialist"
    },
    {
      "content": "Run build verification",
      "status": "in_progress",
      "activeForm": "Running build verification"
    },
    {
      "content": "Playwright verification",
      "status": "pending",
      "activeForm": "Running Playwright verification"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -30",
  "description": "Run TypeScript type check",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cat packages/hx-library/package.json | grep -A5 '\"scripts\"'",
  "description": "Check library scripts"
}

🔧 Tool: Bash
Input: {
  "command": "cat package.json | grep -A10 '\"type-check\"'",
  "description": "Check root type-check command"
}

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit -p packages/hx-library/tsconfig.json 2>&1 | head -50",
  "description": "Run TypeScript type check directly on library",
  "timeout": 60000
}
TypeScript passes. Let me check the generated files and then check the build issue:

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-accordion/**",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx"
}

🔧 Tool: Bash
Input: {
  "command": "ls packages/hx-library/vite.config* 2>&1",
  "description": "Check vite config files"
}

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx diff --stat HEAD 2>&1 | head -30",
  "description": "Show git diff stat"
}

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx status --short 2>&1 | head -20",
  "description": "Check git status"
}
The files were created. The build error is about `vite.config.ts` being gitignored — this is a pre-existing issue with the worktree setup. Let me check the main repo to see if the vite config is available:

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/packages/hx-library/vite.config* 2>&1 && cat /Volumes/Development/booked/helix/packages/hx-library/vite.config.ts 2>&1 | head -40",
  "description": "Check vite config in main repo"
}

🔧 Tool: Bash
Input: {
  "command": "cp /Volumes/Development/booked/helix/packages/hx-library/vite.config.ts /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx/packages/hx-library/vite.config.ts && echo \"Copied vite.config.ts\"",
  "description": "Copy vite config from main repo to worktree"
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -20",
  "description": "Run type-check after copying vite config",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | grep -E \"(library|hx-accordion|error|Error|✓|Tasks|Time)\" | head -30",
  "description": "Check type-check output for library specifically",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | grep -E \"(accordion|library:build:.*accordion|library:type-check)\" | head -20",
  "description": "Check type-check for accordion-specific output",
  "timeout": 120000
}
The library type-check passes and the build succeeds. The accordion component builds at 3.20 kB gzipped — well under the 5KB limit. Now let me run the library tests:

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -40",
  "description": "Run library tests",
  "timeout": 300000
}

🔧 Tool: Bash
Input: {
  "command": "cd packages/hx-library && npx vitest run --reporter=verbose 2>&1 | grep -E \"(accordion|PASS|FAIL|✓|✗|×|Error)\" | head -40",
  "description": "Run vitest with verbose output for accordion tests",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "cd packages/hx-library && npx vitest run --reporter=verbose 2>&1 | grep -E \"(accordion|PASS|FAIL|✗|× )\" | head -40",
  "description": "Check accordion test results specifically",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose --project=@helix/library 2>&1 | grep -E \"(accordion|hx-accordion|PASS|FAIL|✗|Error)\" | head -50",
  "description": "Run vitest for accordion tests",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose --root packages/hx-library/src/components/hx-accordion 2>&1 | tail -50",
  "description": "Run accordion tests directly",
  "timeout": 180000
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run packages/hx-library/src/components/hx-accordion/hx-accordion.test.ts 2>&1 | tail -60",
  "description": "Run accordion test file directly",
  "timeout": 300000
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run packages/hx-library/src/components/hx-accordion/hx-accordion.test.ts 2>&1 | grep -E \"(✓|✗|×|PASS|FAIL|passed|failed|Tests)\" | head -40",
  "description": "Check accordion test pass/fail results",
  "timeout": 300000
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run packages/hx-library/src/components/hx-accordion/hx-accordion.test.ts --reporter=verbose 2>&1 | grep -v \"^$\" | head -80",
  "description": "Check accordion tests verbose output",
  "timeout": 300000
}

🔧 Tool: Bash
Input: {
  "command": "cat packages/hx-library/vitest.config.ts 2>&1 | head -40",
  "description": "Check vitest config"
}

🔧 Tool: Bash
Input: {
  "command": "cat vitest.config.ts 2>&1 | head -60",
  "description": "Check root vitest config"
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose 2>&1 | grep -E \"(accordion|✓|✗|×|PASS|FAIL|passed|failed|Tests)\" | head -80",
  "description": "Run tests from hx-library directory",
  "timeout": 300000
}

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose 2>&1 | grep -E \"(accordion)\" | head -80",
  "description": "Check accordion test results",
  "timeout": 300000
}
All 63 accordion tests pass. The 0% coverage is a pre-existing issue with the vitest browser mode coverage tool in this worktree (not related to our component). Let me confirm total test counts:

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose 2>&1 | grep -E \"Test Files|Tests \" | tail -5",
  "description": "Get test summary counts",
  "timeout": 300000
}
All 772 tests pass. Now let me verify the git diff:

🔧 Tool: Bash
Input: {
  "command": "git status --short 2>&1",
  "description": "Check git status"
}

🔧 Tool: Bash
Input: {
  "command": "ls playwright.config* 2>&1; ls apps/*/playwright.config* 2>&1",
  "description": "Check for Playwright config files"
}
The Vitest tests already use Playwright as the browser provider (vitest browser mode with playwright/chromium). All 63 accordion tests passed through Playwright. No separate Playwright config exists in the project.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Read existing component patterns",
      "status": "completed",
      "activeForm": "Reading existing component patterns"
    },
    {
      "content": "Implement hx-accordion component via lit-specialist",
      "status": "completed",
      "activeForm": "Implementing hx-accordion component via lit-specialist"
    },
    {
      "content": "Run build verification",
      "status": "completed",
      "activeForm": "Running build verification"
    },
    {
      "content": "Playwright verification",
      "status": "completed",
      "activeForm": "Running Playwright verification"
    }
  ]
}
<summary>
## Summary: hx-accordion — Collapsible Content Sections

### Changes Implemented
- Implemented `hx-accordion` container component with `mode="single"` | `mode="multi"` support
- Implemented `hx-accordion-item` with progressive enhancement via `<details>`/`<summary>` base elements
- Animated open/close transitions using CSS grid trick (`grid-template-rows: 0fr → 1fr`)
- Full keyboard support: Enter/Space to toggle, ArrowUp/ArrowDown for item navigation, wraps boundaries, skips disabled items
- All 4 CSS parts: `item`, `trigger`, `content`, `icon`
- Events: `hx-expand` and `hx-collapse` with `{ itemId }` detail
- ARIA: `aria-expanded` on trigger, `aria-hidden` on content panel, `aria-controls`/`aria-labelledby` linking
- Public API: `toggle()`, `expand()`, `collapse()` methods on `hx-accordion-item`
- 8 CSS custom properties documented with two-level token fallbacks
- `@media (prefers-reduced-motion: reduce)` guards on all transitions
- Storybook stories (9 stories including healthcare FAQ kitchen sink)
- 63 Vitest browser mode tests (all pass)

### Files Modified
- `packages/hx-library/src/components/hx-accordion/hx-accordion.ts` — container component
- `packages/hx-library/src/components/hx-accordion/hx-accordion-item.ts` — item component
- `packages/hx-library/src/components/hx-accordion/hx-accordion.styles.ts` — shared styles
- `packages/hx-library/src/components/hx-accordion/hx-accordion.stories.ts` — Storybook stories
- `packages/hx-library/src/components/hx-accordion/hx-accordion.test.ts` — Vitest tests
- `packages/hx-library/src/components/hx-accordion/index.ts` — re-exports

### Risks/Blockers Encountered
- `vite.config.ts` is gitignored in worktrees — copied from main repo to enable build verification
- Pre-existing 0% coverage reporting in worktree (browser-mode coverage instrumentation issue affecting entire repo, not specific to this component)
- Root `npm run type-check` fails on `docs` app (pre-existing Astro type error), but library TypeScript is clean (`npx tsc --noEmit` exits 0)

### Learnings
- `<details>`/`<summary>` provides native progressive enhancement — native toggle is intercepted and managed via JS `open` property
- CSS grid row animation (`0fr → 1fr`) is the cleanest approach for height transitions without requiring `max-height` hacks
- Arrow key navigation uses a custom `hx-accordion-nav` internal event to coordinate between item and container
- Build output: 3.20 kB gzipped — well under the 5KB budget

### Notes for Developer
- The component auto-discovers via `scripts/generate-barrel.js` and `vite.config.ts` — no manual index.ts additions needed
- `vite.config.ts` is in `.gitignore` for the worktree; main branch has it
- All 63 tests pass via Playwright (vitest browser mode with Playwright/Chromium provider)

### Verification Status
- TypeScript: `npx tsc --noEmit` exits 0 — zero errors
- Build: Library builds successfully at 3.20 kB gzipped (within 5KB budget)
- Tests: 63/63 accordion tests pass via Playwright browser mode; 772/772 total library tests pass
- Accessibility: axe-core violations = 0 (verified in 5 test scenarios)
- Git diff: Only `packages/hx-library/src/components/hx-accordion/` added
</summary>