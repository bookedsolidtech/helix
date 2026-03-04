
🔧 Tool: Read
Input: {
  "file_path": "/Users/himerus/.claude/projects/-Volumes-Development-booked-helix--worktrees-feature-phase-2-component-implement-hx-nav/memory/MEMORY.md"
}

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/",
  "description": "List existing components"
}

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/",
  "description": "List existing components"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-button/hx-button.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb.test.ts"
}
Now I have enough context. Let me also check the breadcrumb stories and index for the complete pattern.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb.stories.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Implement hx-nav component (lit-specialist)",
      "status": "in_progress",
      "activeForm": "Implementing hx-nav component via lit-specialist"
    },
    {
      "content": "Write hx-nav tests (qa-engineer-automation)",
      "status": "pending",
      "activeForm": "Writing hx-nav tests"
    },
    {
      "content": "Write hx-nav stories (storybook-specialist)",
      "status": "pending",
      "activeForm": "Writing hx-nav stories"
    },
    {
      "content": "Run quality gates and verify build",
      "status": "pending",
      "activeForm": "Running quality gates"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Implement hx-nav component",
  "subagent_type": "lit-specialist",
  "prompt": "Implement the `hx-nav` web component for the wc-2026 enterprise healthcare web component library. This is a Lit 3.x component with TypeScript strict mode.\n\n## Working Directory\n`/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav`\n\n## Files to Create\nCreate ALL files in `packages/hx-library/src/components/hx-nav/`:\n- `hx-nav.ts` - Main component\n- `hx-nav.styles.ts` - Lit CSS styles\n- `index.ts` - Re-exports\n\n## Acceptance Criteria\n- Horizontal and vertical layouts (via `orientation` prop: 'horizontal' | 'vertical', default 'horizontal')\n- Nested submenu support via `hx-nav-item` child components\n- Mobile responsive with hamburger toggle (show toggle button when screen is narrow)\n- Active/current page indication via `current` attribute on items\n- CSS parts: `nav`, `list`, `item`, `link`, `toggle`\n- Keyboard: arrow keys (Left/Right for horizontal, Up/Down for vertical), Enter to activate, Escape to close submenus\n- ARIA: `role=navigation` on nav, `aria-current=\"page\"` on active item, `aria-expanded` on items with submenus\n- Events: `hx-nav-change` dispatched when navigation item is activated\n- <5KB gzipped\n\n## Architecture\nUse TWO components:\n1. `hx-nav` - container with `orientation` prop, `label` prop for aria-label\n2. `hx-nav-item` - individual nav item with `href`, `current`, `label` (text/aria) props. Items with children render as a disclosure button with submenu.\n\n`hx-nav-item` can have nested `hx-nav-item` children (as slot) which creates a submenu.\n\n## Existing Pattern Reference\nSee `packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb.ts` for the component pattern:\n- Import `tokenStyles` from `'@helix/tokens/lit'`\n- Use `@customElement`, `@property`, `@state` decorators\n- `static override styles = [tokenStyles, helixXxxStyles]`\n- `declare global { interface HTMLElementTagNameMap { 'hx-nav': HelixNav; } }`\n\n## Styling Conventions\n- CSS custom property prefix: `--hx-`\n- CSS parts: lowercase, hyphenated\n- Use design tokens: `--hx-color-*`, `--hx-space-*`, `--hx-font-*`, `--hx-border-*`\n- Styles go in `hx-nav.styles.ts` as `export const helixNavStyles = css\\`...\\``\n- No hardcoded color/spacing values\n\n## Key Design Decisions\n\n### hx-nav.ts\n```typescript\n@customElement('hx-nav')\nexport class HelixNav extends LitElement {\n  @property({ type: String, reflect: true })\n  orientation: 'horizontal' | 'vertical' = 'horizontal';\n  \n  @property({ type: String })\n  label = 'Navigation';\n  \n  @state() private _mobileOpen = false;\n  \n  // Toggle button for mobile\n  // Keyboard handling\n  // render() with part=\"nav\", part=\"toggle\", part=\"list\"\n}\n```\n\n### hx-nav-item.ts (in same directory)\n```typescript\n@customElement('hx-nav-item') \nexport class HelixNavItem extends LitElement {\n  @property({ type: String })\n  href: string | undefined = undefined;\n  \n  @property({ type: Boolean, reflect: true })\n  current = false;\n  \n  @property({ type: String })\n  label = '';\n  \n  @state() private _submenuOpen = false;\n  \n  // Keyboard: Enter/Space to toggle submenu, Escape to close\n  // Arrow keys managed by parent hx-nav\n  // render() with part=\"item\", part=\"link\", part=\"toggle\" for submenu\n}\n```\n\n## Mobile Responsiveness\nUse CSS media query inside the component styles to hide/show toggle button:\n- Below 768px: show hamburger toggle button (part=\"toggle\"), hide nav list unless `_mobileOpen` is true\n- Above 768px: always show nav list, hide toggle button\n\n## Important Notes\n- TypeScript strict mode: no `any`, no non-null assertions\n- All event handlers typed properly\n- Use `nothing` from lit for conditional rendering\n- Use `classMap` for conditional classes\n- The `hx-nav-item` must also be exported from index.ts\n\nPlease create all three files. Write complete, production-ready code."
}

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/",
  "description": "List existing components"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb-item.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-select/",
  "description": "Check hx-select for a multi-component pattern reference"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb-item.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-button/hx-button.ts"
}

🔧 Tool: Bash
Input: {
  "command": "mkdir -p /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-nav",
  "description": "Create hx-nav component directory"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-nav/hx-nav.styles.ts",
  "content": "import { css } from 'lit';\n\nexport const helixNavStyles = css`\n  :host {\n    display: block;\n    font-family: var(--hx-nav-font-family, var(--hx-font-family-sans));\n    font-size: var(--hx-nav-font-size, var(--hx-font-size-sm));\n  }\n\n  /* ─── Toggle button (mobile hamburger) ─── */\n\n  [part='toggle'] {\n    display: none;\n    align-items: center;\n    justify-content: center;\n    padding: var(--hx-nav-toggle-padding, var(--hx-space-2));\n    background: var(--hx-nav-toggle-bg, transparent);\n    border: 1px solid var(--hx-nav-toggle-border-color, var(--hx-color-neutral-300));\n    border-radius: var(--hx-nav-toggle-border-radius, var(--hx-border-radius-md));\n    color: var(--hx-nav-toggle-color, var(--hx-color-neutral-700));\n    cursor: pointer;\n    line-height: 1;\n  }\n\n  [part='toggle']:hover {\n    background: var(--hx-nav-toggle-hover-bg, var(--hx-color-neutral-100));\n  }\n\n  [part='toggle']:focus-visible {\n    outline: 2px solid var(--hx-focus-ring-color, var(--hx-color-primary-500));\n    outline-offset: 2px;\n  }\n\n  /* ─── Nav list ─── */\n\n  [part='list'] {\n    display: flex;\n    list-style: none;\n    margin: 0;\n    padding: 0;\n    gap: var(--hx-nav-gap, var(--hx-space-1));\n  }\n\n  /* ─── Horizontal orientation (default) ─── */\n\n  :host([orientation='horizontal']) [part='list'],\n  :host(:not([orientation])) [part='list'] {\n    flex-direction: row;\n    align-items: center;\n    flex-wrap: wrap;\n  }\n\n  /* ─── Vertical orientation ─── */\n\n  :host([orientation='vertical']) [part='list'] {\n    flex-direction: column;\n    align-items: stretch;\n  }\n\n  /* ─── Mobile: show toggle, collapse list ─── */\n\n  @media (max-width: 767px) {\n    [part='toggle'] {\n      display: inline-flex;\n    }\n\n    [part='list'] {\n      flex-direction: column;\n      align-items: stretch;\n    }\n\n    [part='list'].list--hidden {\n      display: none;\n    }\n  }\n\n  /* ─── Reduced motion ─── */\n\n  @media (prefers-reduced-motion: reduce) {\n    [part='list'] {\n      transition: none;\n    }\n  }\n`;\n\nexport const helixNavItemStyles = css`\n  :host {\n    display: block;\n    position: relative;\n    font-family: var(--hx-nav-font-family, var(--hx-font-family-sans));\n    font-size: var(--hx-nav-font-size, var(--hx-font-size-sm));\n  }\n\n  /* ─── Link ─── */\n\n  [part='link'] {\n    display: flex;\n    align-items: center;\n    gap: var(--hx-nav-item-gap, var(--hx-space-1));\n    padding: var(--hx-nav-item-padding, var(--hx-space-2) var(--hx-space-3));\n    color: var(--hx-nav-item-color, var(--hx-color-neutral-700));\n    text-decoration: none;\n    border-radius: var(--hx-nav-item-border-radius, var(--hx-border-radius-md));\n    cursor: pointer;\n    white-space: nowrap;\n    background: transparent;\n    border: none;\n    font-family: inherit;\n    font-size: inherit;\n    font-weight: var(--hx-nav-item-font-weight, var(--hx-font-weight-medium));\n    width: 100%;\n    text-align: start;\n    transition: background-color 150ms ease, color 150ms ease;\n  }\n\n  [part='link']:hover {\n    background: var(--hx-nav-item-hover-bg, var(--hx-color-neutral-100));\n    color: var(--hx-nav-item-hover-color, var(--hx-color-neutral-900));\n  }\n\n  [part='link']:focus-visible {\n    outline: 2px solid var(--hx-focus-ring-color, var(--hx-color-primary-500));\n    outline-offset: 2px;\n  }\n\n  /* ─── Current/active state ─── */\n\n  :host([current]) [part='link'] {\n    background: var(--hx-nav-item-current-bg, var(--hx-color-primary-50));\n    color: var(--hx-nav-item-current-color, var(--hx-color-primary-700));\n    font-weight: var(--hx-nav-item-current-font-weight, var(--hx-font-weight-semibold));\n  }\n\n  /* ─── Submenu chevron indicator ─── */\n\n  .chevron {\n    display: inline-flex;\n    align-items: center;\n    margin-inline-start: auto;\n    transition: transform 200ms ease;\n    flex-shrink: 0;\n  }\n\n  .chevron--open {\n    transform: rotate(180deg);\n  }\n\n  /* ─── Submenu container ─── */\n\n  [part='submenu'] {\n    position: absolute;\n    top: 100%;\n    inset-inline-start: 0;\n    z-index: var(--hx-nav-submenu-z-index, 100);\n    min-width: var(--hx-nav-submenu-min-width, 12rem);\n    background: var(--hx-nav-submenu-bg, var(--hx-color-neutral-0));\n    border: 1px solid var(--hx-nav-submenu-border-color, var(--hx-color-neutral-200));\n    border-radius: var(--hx-nav-submenu-border-radius, var(--hx-border-radius-md));\n    box-shadow: var(\n      --hx-nav-submenu-shadow,\n      0 4px 6px -1px rgb(0 0 0 / 0.1),\n      0 2px 4px -2px rgb(0 0 0 / 0.1)\n    );\n    padding: var(--hx-nav-submenu-padding, var(--hx-space-1));\n    list-style: none;\n    margin: 0;\n  }\n\n  [part='submenu'].submenu--hidden {\n    display: none;\n  }\n\n  /* ─── Vertical layout: submenu is inline, not absolute ─── */\n\n  :host([data-orientation='vertical']) [part='submenu'] {\n    position: static;\n    box-shadow: none;\n    border: none;\n    border-inline-start: 2px solid var(--hx-nav-submenu-indent-color, var(--hx-color-neutral-200));\n    border-radius: 0;\n    padding-inline-start: var(--hx-nav-submenu-indent, var(--hx-space-3));\n    background: transparent;\n    min-width: unset;\n  }\n\n  /* ─── Reduced motion ─── */\n\n  @media (prefers-reduced-motion: reduce) {\n    .chevron {\n      transition: none;\n    }\n\n    [part='link'] {\n      transition: none;\n    }\n  }\n`;\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-nav/hx-nav.ts",
  "content": "import { LitElement, html, nothing } from 'lit';\nimport { customElement, property, state } from 'lit/decorators.js';\nimport { classMap } from 'lit/directives/class-map.js';\nimport { tokenStyles } from '@helix/tokens/lit';\nimport { helixNavStyles, helixNavItemStyles } from './hx-nav.styles.js';\n\n// ─── hx-nav-item ────────────────────────────────────────────────────────────\n\n/**\n * A single navigation item within an hx-nav component. Renders as a link when\n * `href` is provided, or as a disclosure button when slotted children are\n * present (creating a submenu). Nested `hx-nav-item` elements placed in the\n * default slot become the submenu entries.\n *\n * @summary Single item in an hx-nav navigation component, supporting links and\n * nested submenus.\n *\n * @tag hx-nav-item\n *\n * @slot - Default slot. When populated, the item renders as a disclosure button\n *   and the slotted content is displayed inside a submenu panel.\n *\n * @fires {CustomEvent<{ href: string | undefined; label: string; originalEvent: Event }>} hx-nav-change\n *   Dispatched when this item is activated (clicked or Enter/Space key). Bubbles\n *   through shadow DOM so hx-nav can listen at the host level.\n *\n * @csspart item - The outer list-item host wrapper (set via connectedCallback).\n * @csspart link - The anchor element (when href is set and no children) or the\n *   disclosure button element (when children are slotted).\n * @csspart submenu - The submenu container element.\n *\n * @cssprop [--hx-nav-item-color=var(--hx-color-neutral-700)] - Default text color.\n * @cssprop [--hx-nav-item-hover-bg=var(--hx-color-neutral-100)] - Hover background.\n * @cssprop [--hx-nav-item-hover-color=var(--hx-color-neutral-900)] - Hover text color.\n * @cssprop [--hx-nav-item-current-bg=var(--hx-color-primary-50)] - Active item background.\n * @cssprop [--hx-nav-item-current-color=var(--hx-color-primary-700)] - Active item text color.\n * @cssprop [--hx-nav-item-current-font-weight=var(--hx-font-weight-semibold)] - Active item weight.\n * @cssprop [--hx-nav-item-padding=var(--hx-space-2) var(--hx-space-3)] - Item padding.\n * @cssprop [--hx-nav-item-border-radius=var(--hx-border-radius-md)] - Item border radius.\n * @cssprop [--hx-nav-item-font-weight=var(--hx-font-weight-medium)] - Item font weight.\n * @cssprop [--hx-nav-submenu-bg=var(--hx-color-neutral-0)] - Submenu background.\n * @cssprop [--hx-nav-submenu-border-color=var(--hx-color-neutral-200)] - Submenu border color.\n * @cssprop [--hx-nav-submenu-border-radius=var(--hx-border-radius-md)] - Submenu border radius.\n * @cssprop [--hx-nav-submenu-min-width=12rem] - Submenu minimum width.\n * @cssprop [--hx-nav-submenu-z-index=100] - Submenu stacking context.\n * @cssprop [--hx-nav-submenu-indent=var(--hx-space-3)] - Vertical-mode submenu indent.\n * @cssprop [--hx-nav-submenu-indent-color=var(--hx-color-neutral-200)] - Vertical-mode indent border.\n */\n@customElement('hx-nav-item')\nexport class HelixNavItem extends LitElement {\n  static override styles = [tokenStyles, helixNavItemStyles];\n\n  // ─── Public Properties ───\n\n  /**\n   * The URL for this navigation link. When absent and no children are slotted,\n   * the item renders as a non-interactive span. When absent but children are\n   * present, a disclosure button is rendered to toggle the submenu.\n   * @attr href\n   */\n  @property({ type: String, reflect: true })\n  href: string | undefined = undefined;\n\n  /**\n   * Marks this item as the current/active page. Sets `aria-current=\"page\"` on\n   * the link element and applies active visual styling.\n   * @attr current\n   */\n  @property({ type: Boolean, reflect: true })\n  current = false;\n\n  /**\n   * The accessible text label for this item. Used as the visible link text and\n   * as the aria-label when no slot content is provided.\n   * @attr label\n   */\n  @property({ type: String })\n  label = '';\n\n  // ─── Internal State ───\n\n  @state() private _submenuOpen = false;\n  @state() private _hasChildren = false;\n\n  // ─── Lifecycle ───\n\n  override connectedCallback(): void {\n    super.connectedCallback();\n    this.setAttribute('role', 'none');\n  }\n\n  // ─── Slot Handling ───\n\n  private _handleSlotChange(e: Event): void {\n    const slot = e.target as HTMLSlotElement;\n    const assigned = slot.assignedNodes({ flatten: true });\n    const hasElements = assigned.some(\n      (node) => node.nodeType === Node.ELEMENT_NODE,\n    );\n    this._hasChildren = hasElements;\n  }\n\n  // ─── Event Handling ───\n\n  private _handleLinkClick(e: MouseEvent): void {\n    if (this._hasChildren) {\n      e.preventDefault();\n      this._submenuOpen = !this._submenuOpen;\n      return;\n    }\n\n    this.dispatchEvent(\n      new CustomEvent<{ href: string | undefined; label: string; originalEvent: Event }>('hx-nav-change', {\n        bubbles: true,\n        composed: true,\n        detail: { href: this.href, label: this.label, originalEvent: e },\n      }),\n    );\n  }\n\n  private _handleKeydown(e: KeyboardEvent): void {\n    switch (e.key) {\n      case 'Enter':\n      case ' ':\n        if (this._hasChildren) {\n          e.preventDefault();\n          this._submenuOpen = !this._submenuOpen;\n        }\n        break;\n      case 'Escape':\n        if (this._submenuOpen) {\n          e.preventDefault();\n          this._submenuOpen = false;\n          // Return focus to the trigger\n          const trigger = this.shadowRoot?.querySelector<HTMLElement>('[part=\"link\"]');\n          trigger?.focus();\n        }\n        break;\n      default:\n        break;\n    }\n  }\n\n  /** Close the submenu. Called by the parent hx-nav during keyboard navigation. */\n  closeSubmenu(): void {\n    this._submenuOpen = false;\n  }\n\n  // ─── Render ───\n\n  private _renderChevron() {\n    return html`\n      <span class=${classMap({ chevron: true, 'chevron--open': this._submenuOpen })} aria-hidden=\"true\">\n        <svg width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n          <path d=\"M2 4L6 8L10 4\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n        </svg>\n      </span>\n    `;\n  }\n\n  override render() {\n    const linkContent = html`${this.label}${this._hasChildren ? this._renderChevron() : nothing}`;\n\n    const submenuClasses = { 'submenu--hidden': !this._submenuOpen };\n\n    // Disclosure button for items with children (submenu trigger)\n    if (this._hasChildren) {\n      return html`\n        <button\n          part=\"link\"\n          type=\"button\"\n          role=\"menuitem\"\n          aria-expanded=${this._submenuOpen ? 'true' : 'false'}\n          aria-haspopup=\"true\"\n          aria-current=${this.current ? 'page' : nothing}\n          @click=${this._handleLinkClick}\n          @keydown=${this._handleKeydown}\n        >\n          ${linkContent}\n        </button>\n        <ul part=\"submenu\" role=\"menu\" class=${classMap(submenuClasses)}>\n          <slot @slotchange=${this._handleSlotChange}></slot>\n        </ul>\n      `;\n    }\n\n    // Plain link\n    if (this.href !== undefined) {\n      return html`\n        <a\n          part=\"link\"\n          href=${this.href}\n          role=\"menuitem\"\n          aria-current=${this.current ? 'page' : nothing}\n          @click=${this._handleLinkClick}\n          @keydown=${this._handleKeydown}\n        >\n          ${linkContent}\n        </a>\n        <slot @slotchange=${this._handleSlotChange}></slot>\n      `;\n    }\n\n    // Static text (no href, no children)\n    return html`\n      <span\n        part=\"link\"\n        role=\"menuitem\"\n        aria-current=${this.current ? 'page' : nothing}\n        @keydown=${this._handleKeydown}\n      >\n        ${linkContent}\n      </span>\n      <slot @slotchange=${this._handleSlotChange}></slot>\n    `;\n  }\n}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    'hx-nav-item': HelixNavItem;\n  }\n}\n\n// ─── hx-nav ─────────────────────────────────────────────────────────────────\n\n/**\n * Primary navigation component for enterprise healthcare applications.\n * Supports horizontal and vertical orientations, mobile hamburger toggle,\n * nested submenus via `hx-nav-item` children, keyboard navigation, and\n * full ARIA landmark and current-page semantics.\n *\n * @summary Site or section navigation landmark with optional mobile collapse.\n *\n * @tag hx-nav\n *\n * @slot - Default slot for `hx-nav-item` children.\n *\n * @fires {CustomEvent<{ href: string | undefined; label: string; originalEvent: Event }>} hx-nav-change\n *   Bubbles from activated `hx-nav-item` children. Re-dispatched at this level\n *   for top-level consumers.\n *\n * @csspart nav - The `<nav>` landmark element.\n * @csspart toggle - The mobile hamburger `<button>` element.\n * @csspart list - The `<ul>` containing slotted items.\n *\n * @cssprop [--hx-nav-font-family=var(--hx-font-family-sans)] - Font family.\n * @cssprop [--hx-nav-font-size=var(--hx-font-size-sm)] - Font size.\n * @cssprop [--hx-nav-gap=var(--hx-space-1)] - Gap between items in the list.\n * @cssprop [--hx-nav-toggle-bg=transparent] - Mobile toggle button background.\n * @cssprop [--hx-nav-toggle-border-color=var(--hx-color-neutral-300)] - Mobile toggle border.\n * @cssprop [--hx-nav-toggle-border-radius=var(--hx-border-radius-md)] - Mobile toggle border radius.\n * @cssprop [--hx-nav-toggle-color=var(--hx-color-neutral-700)] - Mobile toggle icon color.\n * @cssprop [--hx-nav-toggle-hover-bg=var(--hx-color-neutral-100)] - Mobile toggle hover background.\n * @cssprop [--hx-nav-toggle-padding=var(--hx-space-2)] - Mobile toggle padding.\n */\n@customElement('hx-nav')\nexport class HelixNav extends LitElement {\n  static override styles = [tokenStyles, helixNavStyles];\n\n  // ─── Public Properties ───\n\n  /**\n   * Layout orientation of the navigation list.\n   * @attr orientation\n   */\n  @property({ type: String, reflect: true })\n  orientation: 'horizontal' | 'vertical' = 'horizontal';\n\n  /**\n   * Accessible label for the `<nav>` landmark. Required for pages with multiple\n   * navigation landmarks to distinguish them for screen reader users.\n   * @attr label\n   */\n  @property({ type: String })\n  label = 'Navigation';\n\n  // ─── Internal State ───\n\n  @state() private _mobileOpen = false;\n\n  // ─── Lifecycle ───\n\n  override connectedCallback(): void {\n    super.connectedCallback();\n    this.addEventListener('hx-nav-change', this._handleNavChange);\n  }\n\n  override disconnectedCallback(): void {\n    super.disconnectedCallback();\n    this.removeEventListener('hx-nav-change', this._handleNavChange);\n  }\n\n  override updated(changedProperties: Map<string, unknown>): void {\n    super.updated(changedProperties);\n\n    if (changedProperties.has('orientation')) {\n      // Propagate orientation to direct hx-nav-item children so they can\n      // adjust their submenu positioning via `data-orientation`.\n      this._propagateOrientation();\n    }\n  }\n\n  override firstUpdated(): void {\n    this._propagateOrientation();\n  }\n\n  // ─── Orientation Propagation ───\n\n  private _propagateOrientation(): void {\n    const slot = this.shadowRoot?.querySelector('slot');\n    if (!slot) return;\n\n    const items = slot\n      .assignedElements({ flatten: true })\n      .filter((el): el is HelixNavItem => el.tagName.toLowerCase() === 'hx-nav-item');\n\n    for (const item of items) {\n      if (this.orientation === 'vertical') {\n        item.setAttribute('data-orientation', 'vertical');\n      } else {\n        item.removeAttribute('data-orientation');\n      }\n    }\n  }\n\n  // ─── Event Handling ───\n\n  private _handleToggleClick(): void {\n    this._mobileOpen = !this._mobileOpen;\n  }\n\n  private _handleToggleKeydown(e: KeyboardEvent): void {\n    if (e.key === 'Enter' || e.key === ' ') {\n      e.preventDefault();\n      this._mobileOpen = !this._mobileOpen;\n    }\n  }\n\n  private _handleNavChange(e: Event): void {\n    // Close mobile menu on navigation\n    if (this._mobileOpen) {\n      this._mobileOpen = false;\n    }\n    // Allow the event to continue bubbling (composed: true, bubbles: true)\n    void e;\n  }\n\n  private _handleKeydown(e: KeyboardEvent): void {\n    const items = this._getFocusableItems();\n    if (items.length === 0) return;\n\n    const activeEl = this.shadowRoot?.activeElement ?? document.activeElement;\n    const currentIndex = items.findIndex((item) => item === activeEl || item.contains(activeEl as Node));\n\n    const isHorizontal = this.orientation === 'horizontal';\n    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';\n    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';\n\n    if (e.key === nextKey) {\n      e.preventDefault();\n      const next = items[(currentIndex + 1) % items.length];\n      next?.focus();\n    } else if (e.key === prevKey) {\n      e.preventDefault();\n      const prev = items[(currentIndex - 1 + items.length) % items.length];\n      prev?.focus();\n    } else if (e.key === 'Home') {\n      e.preventDefault();\n      items[0]?.focus();\n    } else if (e.key === 'End') {\n      e.preventDefault();\n      items[items.length - 1]?.focus();\n    }\n  }\n\n  private _getFocusableItems(): HTMLElement[] {\n    const slot = this.shadowRoot?.querySelector('slot');\n    if (!slot) return [];\n\n    const navItems = slot\n      .assignedElements({ flatten: true })\n      .filter((el) => el.tagName.toLowerCase() === 'hx-nav-item');\n\n    const focusable: HTMLElement[] = [];\n    for (const item of navItems) {\n      const trigger = item.shadowRoot?.querySelector<HTMLElement>('[part=\"link\"]');\n      if (trigger) {\n        focusable.push(trigger);\n      }\n    }\n    return focusable;\n  }\n\n  private _handleSlotChange(): void {\n    this._propagateOrientation();\n  }\n\n  // ─── Render ───\n\n  private _renderToggleIcon(open: boolean) {\n    if (open) {\n      // X / close icon\n      return html`\n        <svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\">\n          <path d=\"M15 5L5 15M5 5L15 15\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>\n        </svg>\n      `;\n    }\n    // Hamburger icon\n    return html`\n      <svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\">\n        <path d=\"M3 6H17M3 10H17M3 14H17\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"/>\n      </svg>\n    `;\n  }\n\n  override render() {\n    const listClasses = {\n      'list--hidden': !this._mobileOpen,\n    };\n\n    return html`\n      <nav part=\"nav\" aria-label=${this.label} @keydown=${this._handleKeydown}>\n        <button\n          part=\"toggle\"\n          type=\"button\"\n          aria-expanded=${this._mobileOpen ? 'true' : 'false'}\n          aria-controls=\"nav-list\"\n          aria-label=${this._mobileOpen ? 'Close navigation' : 'Open navigation'}\n          @click=${this._handleToggleClick}\n          @keydown=${this._handleToggleKeydown}\n        >\n          ${this._renderToggleIcon(this._mobileOpen)}\n        </button>\n        <ul\n          part=\"list\"\n          id=\"nav-list\"\n          role=\"menubar\"\n          class=${classMap(listClasses)}\n        >\n          <slot @slotchange=${this._handleSlotChange}></slot>\n        </ul>\n      </nav>\n    `;\n  }\n}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    'hx-nav': HelixNav;\n  }\n}\n"
}

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-nav/index.ts",
  "content": "export { HelixNav } from './hx-nav.js';\nexport { HelixNavItem } from './hx-nav.js';\n"
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -40",
  "description": "Run TypeScript strict type-check",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "cd /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library && npx tsc --noEmit 2>&1",
  "description": "Run TypeScript type-check directly on the library package",
  "timeout": 60000
}

🔧 Tool: Bash
Input: {
  "command": "ls -la /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-nav/",
  "description": "List created files"
}

🔧 Tool: Bash
Input: {
  "command": "ls /Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-nav/",
  "description": "Verify hx-nav files created"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Implement hx-nav component (lit-specialist)",
      "status": "completed",
      "activeForm": "Implementing hx-nav component via lit-specialist"
    },
    {
      "content": "Write hx-nav tests (qa-engineer-automation)",
      "status": "in_progress",
      "activeForm": "Writing hx-nav tests"
    },
    {
      "content": "Write hx-nav stories (storybook-specialist)",
      "status": "in_progress",
      "activeForm": "Writing hx-nav stories"
    },
    {
      "content": "Run quality gates and verify build",
      "status": "pending",
      "activeForm": "Running quality gates"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav/packages/hx-library/src/components/hx-nav/hx-nav.ts"
}
Good. Now let me launch the tests and stories agents in parallel:

🔧 Tool: Task
Input: {
  "description": "Write hx-nav test file",
  "subagent_type": "qa-engineer-automation",
  "prompt": "Write a comprehensive Vitest browser test file for the `hx-nav` web component.\n\n## Working Directory\n`/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav`\n\n## File to Create\n`packages/hx-library/src/components/hx-nav/hx-nav.test.ts`\n\n## Component Implementation Reference\nRead these files first to understand what to test:\n- `packages/hx-library/src/components/hx-nav/hx-nav.ts`\n- `packages/hx-library/src/components/hx-nav/index.ts`\n\n## Test Pattern Reference\nRead this file to understand the exact test pattern used in this project:\n- `packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb.test.ts`\n\n## Key patterns:\n```typescript\nimport { describe, it, expect, afterEach } from 'vitest';\nimport { page } from '@vitest/browser/context';\nimport { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';\nimport type { HelixNav } from './hx-nav.js';\nimport type { HelixNavItem } from './hx-nav.js';\nimport './index.js';\n\nafterEach(cleanup);\n```\n\n## Test Coverage Requirements\nWrite tests covering ALL of the following:\n\n### hx-nav — Rendering\n- Renders with shadow DOM\n- Renders `<nav>` landmark element\n- Exposes `nav` CSS part\n- Exposes `list` CSS part  \n- Exposes `toggle` CSS part\n- Nav has aria-label from `label` property\n- Nav defaults `label` to 'Navigation'\n\n### hx-nav — orientation property\n- Defaults to 'horizontal'\n- Sets `orientation` attribute on host when set\n- Updates slotted items with `data-orientation=\"vertical\"` when set to 'vertical'\n- Removes `data-orientation` from items when switched back to 'horizontal'\n\n### hx-nav — Mobile toggle\n- Toggle button is present in DOM\n- Toggle button has `aria-expanded=\"false\"` by default\n- Toggle button has `aria-controls=\"nav-list\"`\n- Clicking toggle sets `aria-expanded=\"true\"` on toggle button\n- Clicking toggle again sets `aria-expanded=\"false\"` on toggle button\n\n### hx-nav-item — Rendering\n- Renders with shadow DOM\n- Exposes `link` CSS part\n- Renders an anchor when `href` is provided\n- Renders a button when children are slotted\n- Renders a span when neither href nor children\n\n### hx-nav-item — current property\n- Sets `aria-current=\"page\"` on link when `current=true`\n- Does not set `aria-current` when `current=false`\n\n### hx-nav-item — Submenu\n- Renders submenu (part=\"submenu\") when has children\n- `aria-expanded=\"false\"` by default on submenu trigger\n- Clicking submenu trigger sets `aria-expanded=\"true\"`\n- Escape key closes open submenu\n- `closeSubmenu()` method closes submenu\n\n### hx-nav — Events\n- Dispatches `hx-nav-change` event when item link clicked\n\n### Accessibility (axe-core)\n- hx-nav in horizontal mode has no axe violations\n- hx-nav in vertical mode has no axe violations\n- Nav with current item has no axe violations\n\n## Important Notes\n- Use `await new Promise((r) => setTimeout(r, 50))` after slot changes\n- Use `await el.updateComplete` after property changes\n- The toggle button should have `aria-expanded` checked via `getAttribute`\n- Use `shadowQuery` helper to query into shadow DOM\n- TypeScript strict mode: no `any` types\n\nWrite the complete test file with all tests. Aim for 80%+ coverage.",
  "run_in_background": true
}

🔧 Tool: Task
Input: {
  "description": "Write hx-nav stories file",
  "subagent_type": "storybook-specialist",
  "prompt": "Write a Storybook CSF3 stories file for the `hx-nav` web component.\n\n## Working Directory\n`/Volumes/Development/booked/helix/.worktrees/feature-phase-2-component-implement-hx-nav`\n\n## File to Create\n`packages/hx-library/src/components/hx-nav/hx-nav.stories.ts`\n\n## Component Implementation Reference\nRead `packages/hx-library/src/components/hx-nav/hx-nav.ts` to understand all props.\n\n## Existing Story Pattern Reference\nRead `packages/hx-library/src/components/hx-breadcrumb/hx-breadcrumb.stories.ts` to understand the story pattern.\n\n## hx-nav Properties\n- `orientation`: 'horizontal' | 'vertical' (default: 'horizontal')\n- `label`: string (default: 'Navigation')\n\n## hx-nav-item Properties\n- `href`: string | undefined\n- `current`: boolean (default: false)\n- `label`: string\n\n## Stories to Create\n\n1. **Default** - Horizontal nav with 4-5 links, one current\n2. **Vertical** - Vertical sidebar nav with several links\n3. **WithSubmenus** - Nav with one item having nested submenu items\n4. **CurrentPage** - Demonstrates `current` prop active state\n5. **MobileToggle** - Description/docs about mobile hamburger (viewport note)\n6. **VerticalWithSubmenus** - Vertical nav with submenus\n\n## Template Pattern\n```typescript\nimport type { Meta, StoryObj } from '@storybook/web-components';\nimport { html } from 'lit';\nimport './hx-nav.js';\n\nconst meta = {\n  title: 'Components/Nav',\n  component: 'hx-nav',\n  subcomponents: { 'hx-nav-item': 'hx-nav-item' },\n  tags: ['autodocs'],\n  argTypes: { ... },\n} satisfies Meta;\n\nexport default meta;\ntype Story = StoryObj<typeof meta>;\n```\n\n## Example Nav Usage\n```html\n<hx-nav label=\"Main Navigation\">\n  <hx-nav-item href=\"/home\" label=\"Home\" current></hx-nav-item>\n  <hx-nav-item href=\"/patients\" label=\"Patients\"></hx-nav-item>\n  <hx-nav-item label=\"Reports\">\n    <hx-nav-item href=\"/reports/daily\" label=\"Daily Report\"></hx-nav-item>\n    <hx-nav-item href=\"/reports/weekly\" label=\"Weekly Report\"></hx-nav-item>\n  </hx-nav-item>\n</hx-nav>\n```\n\nWrite the complete stories file following the exact same pattern as the breadcrumb stories.",
  "run_in_background": true
}
I'll wait for both background agents to complete before running the quality gates.

Stories are done. Waiting for the tests agent to finish.