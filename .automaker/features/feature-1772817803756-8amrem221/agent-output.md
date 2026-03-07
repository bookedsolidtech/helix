
🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Bash,Write,Edit,TodoWrite,Agent",
  "max_results": 8
}
Let me start by exploring the hx-image component and gathering context.

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-image/**/*"
}

🔧 Tool: ToolSearch
Input: {
  "query": "select:mcp__wc-mcp__score_component,mcp__wc-mcp__get_component,mcp__wc-mcp__analyze_accessibility",
  "max_results": 3
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/index.ts"
}

🔧 Tool: mcp__wc-mcp__score_component
Input: {
  "tagName": "hx-image"
}

🔧 Tool: mcp__wc-mcp__get_component
Input: {
  "tagName": "hx-image"
}

🔧 Tool: mcp__wc-mcp__analyze_accessibility
Input: {
  "tagName": "hx-image"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/AUDIT.md"
}

🔧 Tool: Grep
Input: {
  "pattern": "@internal",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components",
  "output_mode": "content",
  "head_limit": 10
}
I've read all the component files and the existing AUDIT.md. The component scores 95/A in CEM but has 2 P0 blockers and 5 P1 defects identified. Let me create a plan and fix them.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Add `decorative` prop, fix silent decorative default",
      "status": "pending",
      "activeForm": "Fixing P0-01: decorative prop and alt default"
    },
    {
      "content": "Fix P0-02: Add `srcset` and `sizes` property support",
      "status": "pending",
      "activeForm": "Fixing P0-02: adding srcset/sizes support"
    },
    {
      "content": "Fix P1-01: Add caption slot with figure/figcaption semantics",
      "status": "pending",
      "activeForm": "Fixing P1-01: adding caption support"
    },
    {
      "content": "Fix P1-02: Add ARIA live region to error state",
      "status": "pending",
      "activeForm": "Fixing P1-02: adding ARIA live to error container"
    },
    {
      "content": "Fix P1-03/P1-05: Fix tests — add rounded tests, remove duplicate, strengthen fallback test",
      "status": "pending",
      "activeForm": "Fixing tests: rounded coverage, dedup, fallback assertion"
    },
    {
      "content": "Fix P1-04: Fix Storybook play function attribute assertion",
      "status": "pending",
      "activeForm": "Fixing P1-04: Storybook play function"
    },
    {
      "content": "Fix P2 items: display block, min-height on error, property reflection, empty src handling",
      "status": "pending",
      "activeForm": "Fixing P2 items"
    },
    {
      "content": "Add missing test coverage for ratio, fit, width, height, srcset, sizes, decorative, caption",
      "status": "pending",
      "activeForm": "Adding missing test coverage"
    },
    {
      "content": "Add missing Storybook stories (lazy loading, responsive, caption)",
      "status": "pending",
      "activeForm": "Adding missing stories"
    },
    {
      "content": "Update AUDIT.md with findings and resolutions",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build, tests, and verify",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Add `decorative` prop, fix silent decorative default",
      "status": "in_progress",
      "activeForm": "Fixing P0-01: decorative prop and alt default"
    },
    {
      "content": "Fix P0-02: Add `srcset` and `sizes` property support",
      "status": "pending",
      "activeForm": "Fixing P0-02: adding srcset/sizes support"
    },
    {
      "content": "Fix P1-01: Add caption slot with figure/figcaption semantics",
      "status": "pending",
      "activeForm": "Fixing P1-01: adding caption support"
    },
    {
      "content": "Fix P1-02: Add ARIA live region to error state",
      "status": "pending",
      "activeForm": "Fixing P1-02: adding ARIA live to error container"
    },
    {
      "content": "Fix P1-03/P1-05: Fix tests — add rounded tests, remove duplicate, strengthen fallback test",
      "status": "pending",
      "activeForm": "Fixing tests: rounded coverage, dedup, fallback assertion"
    },
    {
      "content": "Fix P1-04: Fix Storybook play function attribute assertion",
      "status": "pending",
      "activeForm": "Fixing P1-04: Storybook play function"
    },
    {
      "content": "Fix P2 items: display block, min-height on error, property reflection, empty src handling",
      "status": "pending",
      "activeForm": "Fixing P2 items"
    },
    {
      "content": "Add missing test coverage for ratio, fit, width, height, srcset, sizes, decorative, caption",
      "status": "pending",
      "activeForm": "Adding missing test coverage"
    },
    {
      "content": "Add missing Storybook stories (lazy loading, responsive, caption)",
      "status": "pending",
      "activeForm": "Adding missing stories"
    },
    {
      "content": "Update AUDIT.md with findings and resolutions",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build, tests, and verify",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
Let me check one reference component for the `reflect: true` pattern and token usage before I start implementing.

🔧 Tool: Grep
Input: {
  "pattern": "reflect: true",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components",
  "output_mode": "content",
  "head_limit": 10
}

🔧 Tool: Grep
Input: {
  "pattern": "--hx-color-neutral",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components",
  "output_mode": "content",
  "head_limit": 10
}
Good. Now I have enough context. Let me implement all the fixes to the component file first.

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.ts",
  "content": "import { LitElement, html, nothing } from 'lit';\nimport { customElement, property, state } from 'lit/decorators.js';\nimport { styleMap } from 'lit/directives/style-map.js';\nimport { tokenStyles } from '@helix/tokens/lit';\nimport { helixImageStyles } from './hx-image.styles.js';\n\n/**\n * An accessible image wrapper with lazy loading, fallback support, aspect ratio control,\n * and optional caption. Handles decorative images (via `decorative` prop) and informative\n * images (alt text required). Supports responsive images via `srcset` and `sizes`.\n *\n * @summary Accessible image wrapper with lazy loading, fallback, aspect ratio, and caption support.\n *\n * @tag hx-image\n *\n * @slot fallback - Custom content shown when the image fails to load and no fallback-src is set.\n * @slot caption - Optional caption content rendered inside a `<figcaption>`. When provided, the component wraps in `<figure>`.\n *\n * @csspart base - The inner img element.\n * @csspart container - The image container div.\n * @csspart caption - The figcaption element when a caption slot is used.\n *\n * @cssprop [--hx-image-object-fit] - Controls how the image fills its container. Maps to object-fit.\n * @cssprop [--hx-image-border-radius] - Border radius of the image. Overridden by the `rounded` prop.\n * @cssprop [--hx-image-aspect-ratio] - Aspect ratio of the image container. Overridden by the `ratio` prop.\n * @cssprop [--hx-image-fallback-min-height] - Minimum height for the error/fallback container. Prevents collapse when no ratio/height is set.\n * @cssprop [--hx-image-fallback-bg] - Background color for the error/fallback container.\n * @cssprop [--hx-image-fallback-color] - Text color for the error/fallback container.\n * @cssprop [--hx-image-caption-color] - Text color for the caption.\n * @cssprop [--hx-image-caption-font-size] - Font size for the caption.\n *\n * @fires hx-load - Dispatched when the image has successfully loaded.\n * @fires hx-error - Dispatched when the image fails to load (after all fallbacks exhausted).\n */\n@customElement('hx-image')\nexport class HelixImage extends LitElement {\n  static override styles = [tokenStyles, helixImageStyles];\n\n  /**\n   * The URL of the image to display.\n   * @attr src\n   */\n  @property({ type: String, reflect: true })\n  src = '';\n\n  /**\n   * Accessible text description of the image.\n   * Required for informative images. Ignored when `decorative` is true.\n   * @attr alt\n   */\n  @property({ type: String, reflect: true })\n  alt = '';\n\n  /**\n   * Marks the image as decorative. When true, the image is hidden from\n   * assistive technology via role=\"presentation\" and alt=\"\".\n   * @attr decorative\n   */\n  @property({ type: Boolean, reflect: true })\n  decorative = false;\n\n  /**\n   * Width of the image element.\n   * @attr width\n   */\n  @property()\n  width: number | string | undefined = undefined;\n\n  /**\n   * Height of the image element.\n   * @attr height\n   */\n  @property()\n  height: number | string | undefined = undefined;\n\n  /**\n   * Loading strategy for the image.\n   * @attr loading\n   */\n  @property({ type: String, reflect: true })\n  loading: 'lazy' | 'eager' = 'lazy';\n\n  /**\n   * How the image should be resized to fit its container.\n   * Maps to CSS object-fit.\n   * @attr fit\n   */\n  @property({ type: String, reflect: true })\n  fit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down' | undefined = undefined;\n\n  /**\n   * CSS aspect-ratio value (e.g. \"16/9\", \"1\", \"4/3\").\n   * When set, the container maintains this ratio.\n   * @attr ratio\n   */\n  @property({ type: String, reflect: true })\n  ratio: string | undefined = undefined;\n\n  /**\n   * Border radius for the image.\n   * Boolean true applies the theme's medium radius token.\n   * A string value is used directly as a CSS border-radius value.\n   * @attr rounded\n   */\n  @property({ type: String, reflect: true })\n  rounded: string | undefined = undefined;\n\n  /**\n   * Fallback image URL shown when the primary src fails to load.\n   * @attr fallback-src\n   */\n  @property({ type: String, attribute: 'fallback-src' })\n  fallbackSrc: string | undefined = undefined;\n\n  /**\n   * Responsive image source set. Passed directly to the img srcset attribute.\n   * @attr srcset\n   */\n  @property({ type: String, reflect: true })\n  srcset: string | undefined = undefined;\n\n  /**\n   * Responsive image sizes descriptor. Passed directly to the img sizes attribute.\n   * @attr sizes\n   */\n  @property({ type: String, reflect: true })\n  sizes: string | undefined = undefined;\n\n  /** @internal */\n  @state()\n  private _error = false;\n\n  /** @internal */\n  @state()\n  private _usedFallbackSrc = false;\n\n  /** @internal */\n  @state()\n  private _hasCaption = false;\n\n  private _handleLoad(): void {\n    this.dispatchEvent(new CustomEvent('hx-load', { bubbles: true, composed: true }));\n  }\n\n  private _handleError(): void {\n    if (!this._error && this.fallbackSrc && !this._usedFallbackSrc) {\n      this._usedFallbackSrc = true;\n      return;\n    }\n    this._error = true;\n    this.dispatchEvent(new CustomEvent('hx-error', { bubbles: true, composed: true }));\n  }\n\n  private _computeBorderRadius(): string | undefined {\n    if (this.rounded === '' || this.rounded === 'true') {\n      return 'var(--hx-border-radius-md, 0.375rem)';\n    }\n    if (this.rounded && this.rounded !== 'false') {\n      return this.rounded;\n    }\n    return undefined;\n  }\n\n  private _currentSrc(): string {\n    if (this._usedFallbackSrc && this.fallbackSrc) {\n      return this.fallbackSrc;\n    }\n    return this.src;\n  }\n\n  private _handleCaptionSlotChange(e: Event): void {\n    const slot = e.target as HTMLSlotElement;\n    this._hasCaption = slot.assignedNodes({ flatten: true }).length > 0;\n  }\n\n  override render() {\n    const isDecorative = this.decorative;\n    const effectiveAlt = isDecorative ? '' : this.alt;\n    const borderRadius = this._computeBorderRadius();\n\n    const containerStyles = {\n      ...(this.ratio ? { '--_ratio': this.ratio } : {}),\n      ...(this.fit ? { '--_fit': this.fit } : {}),\n      ...(borderRadius ? { '--_radius': borderRadius } : {}),\n      ...(this.width != null\n        ? { width: typeof this.width === 'number' ? `${this.width}px` : this.width }\n        : {}),\n      ...(this.height != null\n        ? { height: typeof this.height === 'number' ? `${this.height}px` : this.height }\n        : {}),\n    };\n\n    let content;\n\n    if (this._error) {\n      content = html`\n        <div\n          part=\"container\"\n          class=\"image__container image__container--error\"\n          style=${styleMap(containerStyles)}\n          role=\"status\"\n          aria-live=\"polite\"\n        >\n          <slot name=\"fallback\">\n            <span class=\"image__fallback-text\">Image unavailable</span>\n          </slot>\n        </div>\n      `;\n    } else if (!this.src) {\n      content = html`\n        <div\n          part=\"container\"\n          class=\"image__container image__container--error\"\n          style=${styleMap(containerStyles)}\n          role=\"status\"\n          aria-live=\"polite\"\n        >\n          <slot name=\"fallback\">\n            <span class=\"image__fallback-text\">No image source</span>\n          </slot>\n        </div>\n      `;\n    } else {\n      content = html`\n        <div part=\"container\" class=\"image__container\" style=${styleMap(containerStyles)}>\n          <img\n            part=\"base\"\n            class=\"image__img\"\n            src=${this._currentSrc()}\n            alt=${effectiveAlt}\n            role=${isDecorative ? 'presentation' : nothing}\n            aria-hidden=${isDecorative ? 'true' : nothing}\n            loading=${this.loading}\n            srcset=${this.srcset || nothing}\n            sizes=${this.sizes || nothing}\n            width=${this.width != null ? this.width : nothing}\n            height=${this.height != null ? this.height : nothing}\n            @load=${this._handleLoad}\n            @error=${this._handleError}\n          />\n        </div>\n      `;\n    }\n\n    if (this._hasCaption || this.querySelector('[slot=\"caption\"]')) {\n      return html`\n        <figure class=\"image__figure\">\n          ${content}\n          <figcaption part=\"caption\" class=\"image__caption\">\n            <slot name=\"caption\" @slotchange=${this._handleCaptionSlotChange}></slot>\n          </figcaption>\n        </figure>\n      `;\n    }\n\n    return html`\n      ${content}\n      <slot name=\"caption\" @slotchange=${this._handleCaptionSlotChange} style=\"display:none\"></slot>\n    `;\n  }\n}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    'hx-image': HelixImage;\n  }\n}\n"
}
Now update the styles file with all P2 fixes (display: block, min-height, token-based colors, caption styles).

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.styles.ts",
  "content": "import { css } from 'lit';\n\nexport const helixImageStyles = css`\n  :host {\n    display: block;\n  }\n\n  .image__figure {\n    margin: 0;\n    display: block;\n  }\n\n  .image__container {\n    position: relative;\n    display: block;\n    overflow: hidden;\n    aspect-ratio: var(--_ratio, var(--hx-image-aspect-ratio));\n    border-radius: var(--_radius, var(--hx-image-border-radius, 0));\n  }\n\n  .image__container--error {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    min-height: var(--hx-image-fallback-min-height, 3rem);\n    background-color: var(--hx-image-fallback-bg, var(--hx-color-neutral-100, #f3f4f6));\n    color: var(--hx-image-fallback-color, var(--hx-color-neutral-500, #6b7280));\n  }\n\n  .image__fallback-text {\n    font-size: 0.875rem;\n  }\n\n  .image__img {\n    display: block;\n    width: 100%;\n    height: 100%;\n    object-fit: var(--_fit, var(--hx-image-object-fit, cover));\n  }\n\n  .image__caption {\n    padding-block: 0.5rem;\n    color: var(--hx-image-caption-color, var(--hx-color-neutral-600, #6b7280));\n    font-size: var(--hx-image-caption-font-size, 0.875rem);\n  }\n`;\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Add `decorative` prop, fix silent decorative default",
      "status": "completed",
      "activeForm": "Fixing P0-01: decorative prop and alt default"
    },
    {
      "content": "Fix P0-02: Add `srcset` and `sizes` property support",
      "status": "completed",
      "activeForm": "Fixing P0-02: adding srcset/sizes support"
    },
    {
      "content": "Fix P1-01: Add caption slot with figure/figcaption semantics",
      "status": "completed",
      "activeForm": "Fixing P1-01: adding caption support"
    },
    {
      "content": "Fix P1-02: Add ARIA live region to error state",
      "status": "completed",
      "activeForm": "Fixing P1-02: adding ARIA live to error container"
    },
    {
      "content": "Fix P1-03/P1-05: Fix tests — add rounded tests, remove duplicate, strengthen fallback test",
      "status": "in_progress",
      "activeForm": "Fixing tests: rounded coverage, dedup, fallback assertion"
    },
    {
      "content": "Fix P1-04: Fix Storybook play function attribute assertion",
      "status": "pending",
      "activeForm": "Fixing P1-04: Storybook play function"
    },
    {
      "content": "Fix P2 items: display block, min-height on error, property reflection, empty src handling",
      "status": "completed",
      "activeForm": "Fixing P2 items"
    },
    {
      "content": "Add missing test coverage for ratio, fit, width, height, srcset, sizes, decorative, caption",
      "status": "pending",
      "activeForm": "Adding missing test coverage"
    },
    {
      "content": "Add missing Storybook stories (lazy loading, responsive, caption)",
      "status": "pending",
      "activeForm": "Adding missing stories"
    },
    {
      "content": "Update AUDIT.md with findings and resolutions",
      "status": "pending",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build, tests, and verify",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
Now let me rewrite the test file with comprehensive coverage.

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.test.ts",
  "content": "import { describe, it, expect, afterEach } from 'vitest';\nimport { page } from '@vitest/browser/context';\nimport { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';\nimport type { HelixImage } from './hx-image.js';\nimport './index.js';\n\nafterEach(cleanup);\n\ndescribe('hx-image', () => {\n  // ─── Rendering ───\n\n  describe('Rendering', () => {\n    it('renders with shadow DOM', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"></hx-image>',\n      );\n      expect(el.shadowRoot).toBeTruthy();\n    });\n\n    it('renders an img element inside shadow DOM', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img).toBeTruthy();\n    });\n\n    it('exposes \"base\" CSS part on the img element', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery(el, '[part=\"base\"]');\n      expect(img).toBeTruthy();\n      expect(img?.tagName.toLowerCase()).toBe('img');\n    });\n\n    it('exposes \"container\" CSS part on the container div', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const container = shadowQuery(el, '[part=\"container\"]');\n      expect(container).toBeTruthy();\n    });\n\n    it('applies default loading=lazy to the img', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('loading')).toBe('lazy');\n    });\n\n    it('shows error state when src is empty', async () => {\n      const el = await fixture<HelixImage>('<hx-image alt=\"Test\"></hx-image>');\n      await el.updateComplete;\n      const errorContainer = shadowQuery(el, '.image__container--error');\n      expect(errorContainer).toBeTruthy();\n    });\n  });\n\n  // ─── Property: src ───\n\n  describe('Property: src', () => {\n    it('sets the src attribute on the img element', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/photo.jpg\" alt=\"Photo\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('src')).toBe('https://example.com/photo.jpg');\n    });\n\n    it('reflects property to img src when changed', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/a.jpg\" alt=\"A\"></hx-image>',\n      );\n      el.src = 'https://example.com/b.jpg';\n      await el.updateComplete;\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('src')).toBe('https://example.com/b.jpg');\n    });\n\n    it('reflects src to host attribute', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/a.jpg\" alt=\"A\"></hx-image>',\n      );\n      expect(el.getAttribute('src')).toBe('https://example.com/a.jpg');\n    });\n  });\n\n  // ─── Property: alt / decorative / ARIA ───\n\n  describe('Property: alt and decorative', () => {\n    it('sets alt text on the img element', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Descriptive text\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('alt')).toBe('Descriptive text');\n    });\n\n    it('does NOT add role=presentation when decorative is false', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Descriptive text\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('role')).toBeNull();\n    });\n\n    it('adds role=presentation when decorative is set', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"ignored\" decorative></hx-image>',\n      );\n      await el.updateComplete;\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('role')).toBe('presentation');\n    });\n\n    it('sets alt=\"\" on decorative images regardless of alt prop value', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Some text\" decorative></hx-image>',\n      );\n      await el.updateComplete;\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('alt')).toBe('');\n    });\n\n    it('sets aria-hidden on decorative images', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" decorative></hx-image>',\n      );\n      await el.updateComplete;\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('aria-hidden')).toBe('true');\n    });\n\n    it('does NOT add aria-hidden on informative images', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Photo\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.hasAttribute('aria-hidden')).toBe(false);\n    });\n  });\n\n  // ─── Property: loading ───\n\n  describe('Property: loading', () => {\n    it('defaults to loading=lazy', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('loading')).toBe('lazy');\n    });\n\n    it('sets loading=eager when specified', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" loading=\"eager\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('loading')).toBe('eager');\n    });\n\n    it('reflects loading to host attribute', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" loading=\"eager\"></hx-image>',\n      );\n      expect(el.getAttribute('loading')).toBe('eager');\n    });\n  });\n\n  // ─── Property: ratio ───\n\n  describe('Property: ratio', () => {\n    it('sets --_ratio CSS variable on the container', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" ratio=\"16/9\"></hx-image>',\n      );\n      const container = shadowQuery(el, '.image__container');\n      expect(container?.getAttribute('style')).toContain('--_ratio: 16/9');\n    });\n\n    it('reflects ratio to host attribute', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" ratio=\"4/3\"></hx-image>',\n      );\n      expect(el.getAttribute('ratio')).toBe('4/3');\n    });\n  });\n\n  // ─── Property: fit ───\n\n  describe('Property: fit', () => {\n    it('sets --_fit CSS variable on the container', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" fit=\"contain\"></hx-image>',\n      );\n      const container = shadowQuery(el, '.image__container');\n      expect(container?.getAttribute('style')).toContain('--_fit: contain');\n    });\n\n    it('reflects fit to host attribute', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" fit=\"cover\"></hx-image>',\n      );\n      expect(el.getAttribute('fit')).toBe('cover');\n    });\n  });\n\n  // ─── Property: rounded ───\n\n  describe('Property: rounded', () => {\n    it('applies theme radius token when rounded is set (boolean attribute)', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" rounded></hx-image>',\n      );\n      const container = shadowQuery(el, '.image__container');\n      const style = container?.getAttribute('style') ?? '';\n      expect(style).toContain('--_radius');\n      expect(style).toContain('var(--hx-border-radius-md');\n    });\n\n    it('uses custom CSS value when rounded is a string', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" rounded=\"1rem\"></hx-image>',\n      );\n      const container = shadowQuery(el, '.image__container');\n      expect(container?.getAttribute('style')).toContain('--_radius: 1rem');\n    });\n\n    it('applies 50% for circular images', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" rounded=\"50%\"></hx-image>',\n      );\n      const container = shadowQuery(el, '.image__container');\n      expect(container?.getAttribute('style')).toContain('--_radius: 50%');\n    });\n\n    it('does not apply radius when rounded is \"false\"', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" rounded=\"false\"></hx-image>',\n      );\n      const container = shadowQuery(el, '.image__container');\n      const style = container?.getAttribute('style') ?? '';\n      expect(style).not.toContain('--_radius');\n    });\n  });\n\n  // ─── Property: width/height ───\n\n  describe('Property: width and height', () => {\n    it('passes width to the img element', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" width=\"400\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('width')).toBe('400');\n    });\n\n    it('passes height to the img element', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" height=\"300\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('height')).toBe('300');\n    });\n\n    it('sets container width style when width is provided', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" width=\"400\"></hx-image>',\n      );\n      const container = shadowQuery(el, '.image__container');\n      expect(container?.getAttribute('style')).toContain('width');\n    });\n  });\n\n  // ─── Property: srcset/sizes ───\n\n  describe('Property: srcset and sizes', () => {\n    it('passes srcset to the img element', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" srcset=\"img-320.jpg 320w, img-640.jpg 640w\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('srcset')).toBe('img-320.jpg 320w, img-640.jpg 640w');\n    });\n\n    it('passes sizes to the img element', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" sizes=\"(max-width: 600px) 100vw, 50vw\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.getAttribute('sizes')).toBe('(max-width: 600px) 100vw, 50vw');\n    });\n\n    it('does not set srcset when not provided', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery(el, 'img');\n      expect(img?.hasAttribute('srcset')).toBe(false);\n    });\n  });\n\n  // ─── Events ───\n\n  describe('Events', () => {\n    it('dispatches hx-load when image loads', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery<HTMLImageElement>(el, 'img');\n      expect(img).toBeTruthy();\n\n      const loadPromise = oneEvent(el, 'hx-load');\n      img!.dispatchEvent(new Event('load'));\n      const event = await loadPromise;\n      expect(event).toBeTruthy();\n      expect(event.type).toBe('hx-load');\n    });\n\n    it('dispatches hx-error when image fails to load (no fallback)', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://broken.url/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery<HTMLImageElement>(el, 'img');\n      expect(img).toBeTruthy();\n\n      const errorPromise = oneEvent(el, 'hx-error');\n      img!.dispatchEvent(new Event('error'));\n      const event = await errorPromise;\n      expect(event).toBeTruthy();\n      expect(event.type).toBe('hx-error');\n    });\n\n    it('dispatches hx-error after fallback-src also fails', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://broken.url/img.png\" fallback-src=\"https://also-broken.url/fb.jpg\" alt=\"Test\"></hx-image>',\n      );\n\n      const firstImg = shadowQuery<HTMLImageElement>(el, 'img');\n      firstImg!.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n\n      const errorPromise = oneEvent(el, 'hx-error');\n      const secondImg = shadowQuery<HTMLImageElement>(el, 'img');\n      secondImg!.dispatchEvent(new Event('error'));\n      const event = await errorPromise;\n      expect(event.type).toBe('hx-error');\n    });\n  });\n\n  // ─── Fallback ───\n\n  describe('Fallback', () => {\n    it('shows fallback slot when image fails and no fallback-src is set', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://broken.url/img.png\" alt=\"Test\"><span slot=\"fallback\" class=\"fb\">Broken</span></hx-image>',\n      );\n      const img = shadowQuery<HTMLImageElement>(el, 'img');\n      img!.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n\n      const errorContainer = shadowQuery(el, '.image__container--error');\n      expect(errorContainer).toBeTruthy();\n\n      const fallbackContent = el.querySelector('.fb');\n      expect(fallbackContent).toBeTruthy();\n      expect(fallbackContent?.textContent).toBe('Broken');\n    });\n\n    it('switches to fallback-src when primary src fails', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://broken.url/img.png\" fallback-src=\"https://example.com/fallback.jpg\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery<HTMLImageElement>(el, 'img');\n\n      img!.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n\n      const updatedImg = shadowQuery<HTMLImageElement>(el, 'img');\n      expect(updatedImg?.getAttribute('src')).toBe('https://example.com/fallback.jpg');\n    });\n\n    it('shows fallback slot after fallback-src also fails', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://broken.url/img.png\" fallback-src=\"https://also-broken.url/fallback.jpg\" alt=\"Test\"><span slot=\"fallback\" class=\"fb2\">Unavailable</span></hx-image>',\n      );\n\n      const firstImg = shadowQuery<HTMLImageElement>(el, 'img');\n      firstImg!.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n\n      const secondImg = shadowQuery<HTMLImageElement>(el, 'img');\n      secondImg!.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n\n      const errorContainer = shadowQuery(el, '.image__container--error');\n      expect(errorContainer).toBeTruthy();\n    });\n\n    it('error container has role=status and aria-live', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://broken.url/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery<HTMLImageElement>(el, 'img');\n      img!.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n\n      const errorContainer = shadowQuery(el, '.image__container--error');\n      expect(errorContainer?.getAttribute('role')).toBe('status');\n      expect(errorContainer?.getAttribute('aria-live')).toBe('polite');\n    });\n\n    it('shows default fallback text when no fallback slot is provided', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://broken.url/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery<HTMLImageElement>(el, 'img');\n      img!.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n\n      const fallbackText = shadowQuery(el, '.image__fallback-text');\n      expect(fallbackText).toBeTruthy();\n      expect(fallbackText?.textContent).toBe('Image unavailable');\n    });\n\n    it('error container has min-height to prevent collapse', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://broken.url/img.png\" alt=\"Test\"></hx-image>',\n      );\n      const img = shadowQuery<HTMLImageElement>(el, 'img');\n      img!.dispatchEvent(new Event('error'));\n      await el.updateComplete;\n\n      const errorContainer = shadowQuery(el, '.image__container--error') as HTMLElement;\n      expect(errorContainer).toBeTruthy();\n      const computedStyle = getComputedStyle(errorContainer);\n      expect(computedStyle.minHeight).not.toBe('0px');\n    });\n  });\n\n  // ─── Caption ───\n\n  describe('Caption', () => {\n    it('wraps in figure when caption slot is used', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"><span slot=\"caption\">A caption</span></hx-image>',\n      );\n      await el.updateComplete;\n      // Wait for slotchange to fire\n      await new Promise((r) => setTimeout(r, 0));\n      await el.updateComplete;\n\n      const figure = shadowQuery(el, 'figure');\n      expect(figure).toBeTruthy();\n    });\n\n    it('renders figcaption with caption part', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"><span slot=\"caption\">A caption</span></hx-image>',\n      );\n      await el.updateComplete;\n      await new Promise((r) => setTimeout(r, 0));\n      await el.updateComplete;\n\n      const figcaption = shadowQuery(el, 'figcaption[part=\"caption\"]');\n      expect(figcaption).toBeTruthy();\n    });\n\n    it('does not render figure when no caption slot is used', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\"></hx-image>',\n      );\n      await el.updateComplete;\n      const figure = shadowQuery(el, 'figure');\n      expect(figure).toBeNull();\n    });\n  });\n\n  // ─── Accessibility (axe-core) ───\n\n  describe('Accessibility (axe-core)', () => {\n    it('has no axe violations with informative image (alt provided)', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"A descriptive label\"></hx-image>',\n      );\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations with decorative image', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" decorative></hx-image>',\n      );\n      await el.updateComplete;\n      await page.screenshot();\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n  });\n});\n"
}
Now update the Storybook stories with all missing stories.

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.stories.ts",
  "content": "import type { Meta, StoryObj } from '@storybook/web-components';\nimport { html } from 'lit';\nimport { expect } from 'storybook/test';\nimport './hx-image.js';\n\n// ─────────────────────────────────────────────────\n// Meta\n// ─────────────────────────────────────────────────\n\nconst meta = {\n  title: 'Components/Image',\n  component: 'hx-image',\n  tags: ['autodocs'],\n  argTypes: {\n    src: {\n      control: 'text',\n      description: 'The URL of the image to display.',\n      table: {\n        category: 'Content',\n        defaultValue: { summary: \"''\" },\n        type: { summary: 'string' },\n      },\n    },\n    alt: {\n      control: 'text',\n      description: 'Accessible description. Required for informative images.',\n      table: {\n        category: 'Accessibility',\n        defaultValue: { summary: \"''\" },\n        type: { summary: 'string' },\n      },\n    },\n    decorative: {\n      control: 'boolean',\n      description:\n        'Marks image as decorative (role=\"presentation\", alt=\"\"). Use for background/ornamental images.',\n      table: {\n        category: 'Accessibility',\n        defaultValue: { summary: 'false' },\n        type: { summary: 'boolean' },\n      },\n    },\n    width: {\n      control: 'text',\n      description: 'Width of the image (number in px or CSS string).',\n      table: {\n        category: 'Layout',\n        type: { summary: 'number | string' },\n      },\n    },\n    height: {\n      control: 'text',\n      description: 'Height of the image (number in px or CSS string).',\n      table: {\n        category: 'Layout',\n        type: { summary: 'number | string' },\n      },\n    },\n    loading: {\n      control: { type: 'select' },\n      options: ['lazy', 'eager'],\n      description: 'Loading strategy for the image.',\n      table: {\n        category: 'Behavior',\n        defaultValue: { summary: 'lazy' },\n        type: { summary: \"'lazy' | 'eager'\" },\n      },\n    },\n    fit: {\n      control: { type: 'select' },\n      options: [undefined, 'contain', 'cover', 'fill', 'none', 'scale-down'],\n      description: 'How the image fills its container. Maps to CSS object-fit.',\n      table: {\n        category: 'Visual',\n        type: { summary: \"'contain' | 'cover' | 'fill' | 'none' | 'scale-down'\" },\n      },\n    },\n    ratio: {\n      control: 'text',\n      description: \"CSS aspect-ratio value (e.g. '16/9', '1', '4/3').\",\n      table: {\n        category: 'Layout',\n        type: { summary: 'string' },\n      },\n    },\n    rounded: {\n      control: 'text',\n      description:\n        'Border radius. Set to \"\" (boolean attribute) for theme token; a string for custom CSS value.',\n      table: {\n        category: 'Visual',\n        type: { summary: 'string' },\n      },\n    },\n    fallbackSrc: {\n      name: 'fallback-src',\n      control: 'text',\n      description: 'Fallback image URL shown when the primary src fails to load.',\n      table: {\n        category: 'Behavior',\n        type: { summary: 'string' },\n      },\n    },\n    srcset: {\n      control: 'text',\n      description: 'Responsive image source set. Passed to the img srcset attribute.',\n      table: {\n        category: 'Responsive',\n        type: { summary: 'string' },\n      },\n    },\n    sizes: {\n      control: 'text',\n      description: 'Responsive image sizes descriptor. Passed to the img sizes attribute.',\n      table: {\n        category: 'Responsive',\n        type: { summary: 'string' },\n      },\n    },\n  },\n  args: {\n    src: 'https://picsum.photos/seed/helix/800/600',\n    alt: 'A sample image',\n    loading: 'lazy',\n  },\n  render: (args) => html`\n    <hx-image\n      src=${args.src}\n      alt=${args.alt}\n      loading=${args.loading}\n      ?decorative=${args.decorative}\n      fit=${args.fit ?? ''}\n      ratio=${args.ratio ?? ''}\n      rounded=${args.rounded ?? ''}\n      fallback-src=${args.fallbackSrc ?? ''}\n      srcset=${args.srcset ?? ''}\n      sizes=${args.sizes ?? ''}\n      width=${args.width ?? ''}\n      height=${args.height ?? ''}\n      style=\"width: 400px;\"\n    ></hx-image>\n  `,\n} satisfies Meta;\n\nexport default meta;\n\ntype Story = StoryObj<typeof meta>;\n\n// ════════════════════════════════════════════════════════════════════════════\n// 1. DEFAULT\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * Default image with alt text provided. Renders with lazy loading.\n */\nexport const Default: Story = {\n  play: async ({ canvasElement }) => {\n    const img = canvasElement.querySelector('hx-image');\n    await expect(img).toBeTruthy();\n    await expect(img?.src).toBe('https://picsum.photos/seed/helix/800/600');\n  },\n};\n\n// ════════════════════════════════════════════════════════════════════════════\n// 2. DECORATIVE\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * Decorative image using the `decorative` prop.\n * The inner img receives role=\"presentation\" and aria-hidden=\"true\"\n * to suppress screen reader announcements.\n */\nexport const Decorative: Story = {\n  args: {\n    src: 'https://picsum.photos/seed/decorative/800/400',\n    alt: '',\n    decorative: true,\n  },\n  render: (args) => html`\n    <hx-image src=${args.src} decorative style=\"width: 400px;\"></hx-image>\n  `,\n  play: async ({ canvasElement }) => {\n    const img = canvasElement.querySelector('hx-image');\n    await expect(img).toBeTruthy();\n    const innerImg = img?.shadowRoot?.querySelector('img');\n    await expect(innerImg?.getAttribute('role')).toBe('presentation');\n    await expect(innerImg?.getAttribute('alt')).toBe('');\n  },\n};\n\n// ════════════════════════════════════════════════════════════════════════════\n// 3. ASPECT RATIOS\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * Common aspect ratios side-by-side: 16/9, 4/3, 1/1.\n */\nexport const AspectRatios: Story = {\n  render: () => html`\n    <div style=\"display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;\">\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem; width: 240px;\">\n        <hx-image\n          src=\"https://picsum.photos/seed/a/480/270\"\n          alt=\"16:9 ratio\"\n          ratio=\"16/9\"\n          style=\"width: 240px;\"\n        ></hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">16/9</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem; width: 240px;\">\n        <hx-image\n          src=\"https://picsum.photos/seed/b/480/360\"\n          alt=\"4:3 ratio\"\n          ratio=\"4/3\"\n          style=\"width: 240px;\"\n        ></hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">4/3</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem; width: 240px;\">\n        <hx-image\n          src=\"https://picsum.photos/seed/c/480/480\"\n          alt=\"1:1 ratio\"\n          ratio=\"1\"\n          style=\"width: 240px;\"\n        ></hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">1/1</span>\n      </div>\n    </div>\n  `,\n};\n\n// ════════════════════════════════════════════════════════════════════════════\n// 4. FIT MODES\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * All object-fit modes demonstrated in a fixed-size container.\n */\nexport const FitModes: Story = {\n  render: () => html`\n    <div style=\"display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;\">\n      ${(['cover', 'contain', 'fill', 'none', 'scale-down'] as const).map(\n        (fit) => html`\n          <div style=\"display: flex; flex-direction: column; gap: 0.5rem;\">\n            <hx-image\n              src=\"https://picsum.photos/seed/fit/300/200\"\n              alt=${`fit=${fit}`}\n              fit=${fit}\n              ratio=\"4/3\"\n              style=\"width: 180px; border: 1px solid #e5e7eb;\"\n            ></hx-image>\n            <span style=\"font-size: 0.75rem; color: #6b7280;\">${fit}</span>\n          </div>\n        `,\n      )}\n    </div>\n  `,\n};\n\n// ════════════════════════════════════════════════════════════════════════════\n// 5. ROUNDED\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * Border-radius variants: theme token (boolean), custom value, and full circle.\n */\nexport const Rounded: Story = {\n  render: () => html`\n    <div style=\"display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;\">\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem;\">\n        <hx-image\n          src=\"https://picsum.photos/seed/r1/400/400\"\n          alt=\"Rounded with theme token\"\n          ratio=\"1\"\n          rounded\n          style=\"width: 160px;\"\n        ></hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">rounded (token)</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem;\">\n        <hx-image\n          src=\"https://picsum.photos/seed/r2/400/400\"\n          alt=\"Rounded with custom value\"\n          ratio=\"1\"\n          rounded=\"1rem\"\n          style=\"width: 160px;\"\n        ></hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">rounded=\"1rem\"</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem;\">\n        <hx-image\n          src=\"https://picsum.photos/seed/r3/400/400\"\n          alt=\"Circular image\"\n          ratio=\"1\"\n          rounded=\"50%\"\n          style=\"width: 160px;\"\n        ></hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">rounded=\"50%\"</span>\n      </div>\n    </div>\n  `,\n};\n\n// ════════════════════════════════════════════════════════════════════════════\n// 6. FALLBACK\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * Broken image with a fallback-src and a custom fallback slot.\n */\nexport const Fallback: Story = {\n  render: () => html`\n    <div style=\"display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;\">\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem;\">\n        <hx-image\n          src=\"https://broken.url/image.jpg\"\n          fallback-src=\"https://picsum.photos/seed/fallback/400/300\"\n          alt=\"Image with fallback src\"\n          ratio=\"4/3\"\n          style=\"width: 240px;\"\n        ></hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">fallback-src</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem;\">\n        <hx-image\n          src=\"https://broken.url/image2.jpg\"\n          alt=\"Image with custom fallback slot\"\n          ratio=\"4/3\"\n          style=\"width: 240px;\"\n        >\n          <div\n            slot=\"fallback\"\n            style=\"display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f3f4f6; color: #6b7280; font-size: 0.875rem;\"\n          >\n            Image unavailable\n          </div>\n        </hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">fallback slot</span>\n      </div>\n    </div>\n  `,\n};\n\n// ════════════════════════════════════════════════════════════════════════════\n// 7. LAZY LOADING\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * Demonstrates lazy vs eager loading. The lazy image defers loading until\n * it enters the viewport. The eager image loads immediately.\n */\nexport const LazyLoading: Story = {\n  render: () => html`\n    <div style=\"display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start;\">\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem; width: 240px;\">\n        <hx-image\n          src=\"https://picsum.photos/seed/lazy/480/360\"\n          alt=\"Lazy loaded image\"\n          loading=\"lazy\"\n          ratio=\"4/3\"\n          style=\"width: 240px;\"\n        ></hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">loading=\"lazy\" (default)</span>\n      </div>\n      <div style=\"display: flex; flex-direction: column; gap: 0.5rem; width: 240px;\">\n        <hx-image\n          src=\"https://picsum.photos/seed/eager/480/360\"\n          alt=\"Eagerly loaded image\"\n          loading=\"eager\"\n          ratio=\"4/3\"\n          style=\"width: 240px;\"\n        ></hx-image>\n        <span style=\"font-size: 0.75rem; color: #6b7280;\">loading=\"eager\"</span>\n      </div>\n    </div>\n  `,\n  play: async ({ canvasElement }) => {\n    const images = canvasElement.querySelectorAll('hx-image');\n    const lazyImg = images[0]?.shadowRoot?.querySelector('img');\n    const eagerImg = images[1]?.shadowRoot?.querySelector('img');\n    await expect(lazyImg?.getAttribute('loading')).toBe('lazy');\n    await expect(eagerImg?.getAttribute('loading')).toBe('eager');\n  },\n};\n\n// ════════════════════════════════════════════════════════════════════════════\n// 8. RESPONSIVE (srcset/sizes)\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * Responsive image with srcset and sizes for Drupal-compatible responsive image output.\n */\nexport const Responsive: Story = {\n  render: () => html`\n    <hx-image\n      src=\"https://picsum.photos/seed/responsive/800/600\"\n      srcset=\"https://picsum.photos/seed/responsive/400/300 400w, https://picsum.photos/seed/responsive/800/600 800w, https://picsum.photos/seed/responsive/1200/900 1200w\"\n      sizes=\"(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 800px\"\n      alt=\"Responsive image with srcset\"\n      ratio=\"4/3\"\n      style=\"max-width: 100%;\"\n    ></hx-image>\n  `,\n  play: async ({ canvasElement }) => {\n    const img = canvasElement.querySelector('hx-image');\n    const innerImg = img?.shadowRoot?.querySelector('img');\n    await expect(innerImg?.hasAttribute('srcset')).toBe(true);\n    await expect(innerImg?.hasAttribute('sizes')).toBe(true);\n  },\n};\n\n// ════════════════════════════════════════════════════════════════════════════\n// 9. CAPTION\n// ════════════════════════════════════════════════════════════════════════════\n\n/**\n * Image with a caption slot. Wraps the image in a `<figure>` with `<figcaption>`.\n */\nexport const WithCaption: Story = {\n  render: () => html`\n    <hx-image\n      src=\"https://picsum.photos/seed/caption/800/500\"\n      alt=\"Patient care facility\"\n      ratio=\"16/9\"\n      style=\"max-width: 500px;\"\n    >\n      <span slot=\"caption\">Figure 1: Main reception area of the healthcare facility.</span>\n    </hx-image>\n  `,\n};\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Add `decorative` prop, fix silent decorative default",
      "status": "completed",
      "activeForm": "Fixing P0-01: decorative prop and alt default"
    },
    {
      "content": "Fix P0-02: Add `srcset` and `sizes` property support",
      "status": "completed",
      "activeForm": "Fixing P0-02: adding srcset/sizes support"
    },
    {
      "content": "Fix P1-01: Add caption slot with figure/figcaption semantics",
      "status": "completed",
      "activeForm": "Fixing P1-01: adding caption support"
    },
    {
      "content": "Fix P1-02: Add ARIA live region to error state",
      "status": "completed",
      "activeForm": "Fixing P1-02: adding ARIA live to error container"
    },
    {
      "content": "Fix P1-03/P1-05: Fix tests — add rounded tests, remove duplicate, strengthen fallback test",
      "status": "completed",
      "activeForm": "Fixing tests: rounded coverage, dedup, fallback assertion"
    },
    {
      "content": "Fix P1-04: Fix Storybook play function attribute assertion",
      "status": "completed",
      "activeForm": "Fixing P1-04: Storybook play function"
    },
    {
      "content": "Fix P2 items: display block, min-height on error, property reflection, empty src handling",
      "status": "completed",
      "activeForm": "Fixing P2 items"
    },
    {
      "content": "Add missing test coverage for ratio, fit, width, height, srcset, sizes, decorative, caption",
      "status": "completed",
      "activeForm": "Adding missing test coverage"
    },
    {
      "content": "Add missing Storybook stories (lazy loading, responsive, caption)",
      "status": "completed",
      "activeForm": "Adding missing stories"
    },
    {
      "content": "Update AUDIT.md with findings and resolutions",
      "status": "in_progress",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build, tests, and verify",
      "status": "pending",
      "activeForm": "Running verification gates"
    }
  ]
}
Now let me run the build first to catch any compile errors.

🔧 Tool: Bash
Input: {
  "command": "npx tsc --noEmit --project packages/hx-library/tsconfig.json 2>&1 | head -50",
  "description": "Type-check the hx-library package",
  "timeout": 60000
}
TypeScript passes clean. Let me run the tests.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-image/hx-image.test.ts 2>&1 | tail -80",
  "description": "Run hx-image tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests using the project script",
  "timeout": 120000
}
6 test failures. Key issues: color contrast on fallback text (foreground #64748b on #f1f5f9 = 4.34 ratio, needs 4.5:1). Let me see all the failures more clearly.

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -E \"(FAIL|×|✗|❯ src/components/hx-image)\" | head -20",
  "description": "Get test failure summaries",
  "timeout": 120000
}
Two categories of failures:
1. **Style assertions** - `styleMap` output format mismatch (probably no space after colon)
2. **A11y contrast** - fallback text color needs darker contrast

Let me check the actual style output and fix both issues.

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -A 5 \"sets --_ratio\" | head -15",
  "description": "Get ratio test failure detail",
  "timeout": 120000
}
No space after colon in `styleMap` output. Let me fix the style assertions and the contrast issue.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.test.ts",
  "old_string": "      expect(container?.getAttribute('style')).toContain('--_ratio: 16/9');\n    });\n\n    it('reflects ratio to host attribute', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" ratio=\"4/3\"></hx-image>',\n      );\n      expect(el.getAttribute('ratio')).toBe('4/3');",
  "new_string": "      expect(container?.getAttribute('style')).toContain('--_ratio:16/9');\n    });\n\n    it('reflects ratio to host attribute', async () => {\n      const el = await fixture<HelixImage>(\n        '<hx-image src=\"https://example.com/img.png\" alt=\"Test\" ratio=\"4/3\"></hx-image>',\n      );\n      expect(el.getAttribute('ratio')).toBe('4/3');"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.test.ts",
  "old_string": "      expect(container?.getAttribute('style')).toContain('--_fit: contain');",
  "new_string": "      expect(container?.getAttribute('style')).toContain('--_fit:contain');"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.test.ts",
  "old_string": "      expect(container?.getAttribute('style')).toContain('--_radius: 1rem');",
  "new_string": "      expect(container?.getAttribute('style')).toContain('--_radius:1rem');"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.test.ts",
  "old_string": "      expect(container?.getAttribute('style')).toContain('--_radius: 50%');",
  "new_string": "      expect(container?.getAttribute('style')).toContain('--_radius:50%');"
}
Now fix the contrast issue. The fallback text color #6b7280 on #f3f4f6 has 4.34:1 ratio. Need at least 4.5:1. I'll use a darker color.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/hx-image.styles.ts",
  "old_string": "    color: var(--hx-image-fallback-color, var(--hx-color-neutral-500, #6b7280));",
  "new_string": "    color: var(--hx-image-fallback-color, var(--hx-color-neutral-600, #4b5563));"
}
Now I also need to handle the axe issue. The error is showing the computed fallback colors from the token system, not my hardcoded values. The test fixtures are picking up `--hx-color-neutral-*` tokens from `tokenStyles`. Let me check what those resolve to.

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep -E \"(foreground|background|contrast)\" | head -5",
  "description": "Check contrast values in test output",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | grep \"insufficient color contrast\" | head -3",
  "description": "Check specific contrast failure",
  "timeout": 120000
}
Good - the previous run was cached. Let me clear cache and rerun just the hx-image tests.

🔧 Tool: Bash
Input: {
  "command": "npx turbo test --filter=@helix/library --force 2>&1 | tail -60",
  "description": "Force run library tests (no cache)",
  "timeout": 300000
}
All 3126 tests pass, 79 test files, zero failures. Now let me run verify and update the audit.

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -20",
  "description": "Run verify (lint + format:check + type-check)",
  "timeout": 120000
}
All 11 tasks pass. Now let me update the AUDIT.md with the resolution status.

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image/packages/hx-library/src/components/hx-image/AUDIT.md",
  "content": "# AUDIT: hx-image — Deep Component Audit v2\n\n**Reviewer:** Deep audit agent\n**Date:** 2026-03-06\n**Branch:** feature/deep-audit-v2-hx-image\n**Previous audit:** T3-11 Antagonistic Quality Review\n\n---\n\n## Audit Summary\n\n**Previous state:** 2 P0, 5 P1, 10 P2 findings. NOT READY FOR SHIP.\n**Current state:** All P0 and P1 issues RESOLVED. Remaining P2 items documented.\n\n### wc-mcp Scores\n- **CEM Score:** 95/A (pre-audit), issues: private members visible in CEM\n- **Accessibility Score:** 5/100 (wc-mcp tooling), but actual a11y implementation is correct. Low score due to tool checking for form-related features (disabled, focus, label, keyboard) irrelevant to an image component.\n\n---\n\n## Resolved Findings\n\n### P0-01: `alt` defaults to `''` — silently decorative [FIXED]\nAdded explicit `decorative` boolean property. When `decorative` is true, `role=\"presentation\"`, `aria-hidden=\"true\"`, and `alt=\"\"` are applied. Without `decorative`, `alt` text is passed through as-is. This makes decorative intent explicit in markup.\n\n### P0-02: No `srcset`/`sizes` support [FIXED]\nAdded `srcset` and `sizes` string properties, both reflected to attributes. Values are passed directly to the inner `<img>` element. Enables Drupal responsive images module compatibility.\n\n### P1-01: Caption feature absent [FIXED]\nAdded `caption` slot. When caption content is slotted, component wraps in `<figure>`/`<figcaption>`. Exposed `caption` CSS part. Added `--hx-image-caption-color` and `--hx-image-caption-font-size` tokens.\n\n### P1-02: No ARIA live region for error state [FIXED]\nError/fallback container now has `role=\"status\"` and `aria-live=\"polite\"`. Default fallback text \"Image unavailable\" is shown when no fallback slot is provided.\n\n### P1-03: `rounded` not tested [FIXED]\nAdded 4 tests covering: boolean attribute (theme token), custom string, 50%, and `\"false\"` handling.\n\n### P1-04: Storybook play function asserts unreflected attribute [FIXED]\nChanged assertion to use property access (`img.src`) instead of `getAttribute('alt')`. Added `reflect: true` to key properties (`src`, `alt`, `loading`, `fit`, `ratio`, `rounded`, `srcset`, `sizes`, `decorative`).\n\n### P1-05: Duplicate CSS Parts test [FIXED]\nRemoved duplicate test. Replaced with `container` part test.\n\n---\n\n## Additional Fixes (P2 items resolved)\n\n| ID | Fix |\n|----|-----|\n| P2-01 | `decorative` prop added (see P0-01) |\n| P2-02 | `rounded` changed to `type: String, reflect: true` — eliminates boolean/string coercion mismatch |\n| P2-03 | Tests added for `ratio`, `fit`, `width`, `height`, `srcset`, `sizes` |\n| P2-04 | LazyLoading story added with lazy vs eager comparison |\n| P2-05 | Responsive story added with srcset/sizes demo |\n| P2-06 | `:host { display: block }` — changed from `inline-block` |\n| P2-07 | Key properties now reflect to attributes |\n| P2-08 | Error container has `min-height: var(--hx-image-fallback-min-height, 3rem)` |\n| P2-09 | Test added: `hx-error` dispatch verified after fallback-src failure |\n| P2-10 | Empty `src` now shows error/fallback state instead of rendering broken img |\n\n---\n\n## Design Tokens\n\n| Token | Purpose | Default |\n|-------|---------|---------|\n| `--hx-image-object-fit` | Image object-fit | `cover` |\n| `--hx-image-border-radius` | Border radius | `0` |\n| `--hx-image-aspect-ratio` | Container aspect ratio | (none) |\n| `--hx-image-fallback-min-height` | Fallback container min-height | `3rem` |\n| `--hx-image-fallback-bg` | Fallback background | `var(--hx-color-neutral-100, #f3f4f6)` |\n| `--hx-image-fallback-color` | Fallback text color | `var(--hx-color-neutral-600, #4b5563)` |\n| `--hx-image-caption-color` | Caption text color | `var(--hx-color-neutral-600, #6b7280)` |\n| `--hx-image-caption-font-size` | Caption font size | `0.875rem` |\n\n---\n\n## CSS Parts\n\n| Part | Element |\n|------|---------|\n| `base` | Inner `<img>` element |\n| `container` | Image container `<div>` |\n| `caption` | `<figcaption>` (when caption slot is used) |\n\n---\n\n## Test Coverage\n\n**Tests:** 38 (up from 20)\n**Coverage areas:** Rendering, src, alt/decorative/ARIA, loading, ratio, fit, rounded, width/height, srcset/sizes, events, fallback (with ARIA + default text + min-height), caption, axe-core a11y.\n\n---\n\n## Remaining Items (Low Priority)\n\nNone. All P0, P1, and P2 items have been resolved.\n\n---\n\n## Verdict\n\n**READY FOR SHIP.** All critical, high, and medium severity issues resolved. Full test coverage. All quality gates pass.\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Add `decorative` prop, fix silent decorative default",
      "status": "completed",
      "activeForm": "Fixing P0-01: decorative prop and alt default"
    },
    {
      "content": "Fix P0-02: Add `srcset` and `sizes` property support",
      "status": "completed",
      "activeForm": "Fixing P0-02: adding srcset/sizes support"
    },
    {
      "content": "Fix P1-01: Add caption slot with figure/figcaption semantics",
      "status": "completed",
      "activeForm": "Fixing P1-01: adding caption support"
    },
    {
      "content": "Fix P1-02: Add ARIA live region to error state",
      "status": "completed",
      "activeForm": "Fixing P1-02: adding ARIA live to error container"
    },
    {
      "content": "Fix P1-03/P1-05: Fix tests — add rounded tests, remove duplicate, strengthen fallback test",
      "status": "completed",
      "activeForm": "Fixing tests: rounded coverage, dedup, fallback assertion"
    },
    {
      "content": "Fix P1-04: Fix Storybook play function attribute assertion",
      "status": "completed",
      "activeForm": "Fixing P1-04: Storybook play function"
    },
    {
      "content": "Fix P2 items: display block, min-height on error, property reflection, empty src handling",
      "status": "completed",
      "activeForm": "Fixing P2 items"
    },
    {
      "content": "Add missing test coverage for ratio, fit, width, height, srcset, sizes, decorative, caption",
      "status": "completed",
      "activeForm": "Adding missing test coverage"
    },
    {
      "content": "Add missing Storybook stories (lazy loading, responsive, caption)",
      "status": "completed",
      "activeForm": "Adding missing stories"
    },
    {
      "content": "Update AUDIT.md with findings and resolutions",
      "status": "completed",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Run build, tests, and verify",
      "status": "completed",
      "activeForm": "Running verification gates"
    }
  ]
}
Let me verify the diff to confirm only intended files were changed.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image diff --stat",
  "description": "Show changed files summary"
}
The 5 core files changed as intended, plus some screenshot binary diffs from test runs (normal). Let me verify the git diff doesn't show any unintended changes to other component source code.

🔧 Tool: Bash
Input: {
  "command": "git -C /Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-image diff --stat -- '*.ts' '*.md'",
  "description": "Show only TS and MD file changes"
}
Only the 5 hx-image files were modified. All changes are scoped correctly.

<summary>
## Summary: Deep Component Audit — hx-image

### Changes Implemented

**P0 (Critical) — FIXED:**
- **P0-01:** Added `decorative` boolean property. Decorative intent is now explicit (`<hx-image decorative>`) instead of implicitly triggered by `alt=""`. Decorative images get `role="presentation"` + `aria-hidden="true"`.
- **P0-02:** Added `srcset` and `sizes` string properties, passed through to the inner `<img>`. Enables Drupal responsive images module compatibility.

**P1 (High) — FIXED:**
- **P1-01:** Added `caption` slot with `<figure>`/`<figcaption>` semantic wrapping. Exposed `caption` CSS part and tokens (`--hx-image-caption-color`, `--hx-image-caption-font-size`).
- **P1-02:** Error/fallback container now has `role="status"` + `aria-live="polite"`. Default fallback text "Image unavailable" shown when no fallback slot is provided.
- **P1-03:** Added 4 tests for `rounded` property (boolean, custom string, 50%, "false").
- **P1-04:** Fixed Storybook play function to assert on property instead of unreflected attribute.
- **P1-05:** Removed duplicate CSS Parts test, replaced with `container` part test.

**P2 (Medium) — FIXED:**
- Changed `:host` display from `inline-block` to `block`
- Added `min-height` on error container via `--hx-image-fallback-min-height` token
- Added `reflect: true` to key properties (src, alt, loading, fit, ratio, rounded, srcset, sizes, decorative)
- Empty `src` now shows fallback state instead of rendering broken img
- Changed `rounded` from `boolean | string` to `string` to align with Lit attribute coercion
- Token-based fallback colors with WCAG AA contrast compliance
- Added tests for ratio, fit, width, height, srcset, sizes, decorative, caption
- Added LazyLoading, Responsive, and WithCaption stories

### Files Modified
- `packages/hx-library/src/components/hx-image/hx-image.ts` — Component rewrite with all fixes
- `packages/hx-library/src/components/hx-image/hx-image.styles.ts` — Styles with new tokens
- `packages/hx-library/src/components/hx-image/hx-image.test.ts` — 38 tests (up from 20)
- `packages/hx-library/src/components/hx-image/hx-image.stories.ts` — 9 stories (up from 6)
- `packages/hx-library/src/components/hx-image/AUDIT.md` — Updated with all resolutions

### Verification Status
- `npm run type-check` — zero errors
- `npm run test:library` — 3126 tests pass, 79 test files, zero failures
- `npm run verify` — 11/11 tasks pass (lint + format:check + type-check)
- `git diff --stat` — only 5 hx-image files modified (plus screenshot binaries from test runs)

### Risks/Blockers Encountered
- `styleMap` outputs CSS without spaces after colons — fixed test assertions accordingly
- Initial fallback text color (#6b7280 on #f3f4f6) failed WCAG AA contrast — darkened to #4b5563

### Learnings
- Lit `styleMap` omits spaces in CSS variable assignments — use `--_var:value` not `--_var: value` in test assertions
- `rounded` property as `type: String` with `reflect: true` simplifies the boolean/string coercion issue — empty attribute (`rounded`) becomes `""` which maps cleanly to theme token usage

### Notes for Developer
- The `rounded` property type changed from `boolean | string | undefined` to `string | undefined`. Usage: `rounded` (boolean attr = theme token), `rounded="1rem"` (custom), `rounded="50%"` (circle). The string `"false"` is treated as no radius.
- The `decorative` prop is a breaking change from the previous behavior where `alt=""` triggered `role="presentation"`. Now `alt=""` alone does NOT add presentation role — `decorative` must be set explicitly.
</summary>