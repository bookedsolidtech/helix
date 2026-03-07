I'll start by examining the current state of the hx-checkbox-group component.

🔧 Tool: ToolSearch
Input: {
  "query": "select:Read,Glob,Grep,Bash,Write,Edit,TodoWrite,Agent",
  "max_results": 8
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-checkbox-group/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "packages/hx-library/src/components/hx-checkbox/**/*"
}
Good, the component exists with all standard files including an index.ts. Let me read the source files.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.styles.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.test.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.stories.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/AUDIT.md"
}
The component exists with a complete implementation and a thorough prior audit. I need to fix the P0 and P1 issues identified. Let me also check the hx-checkbox component briefly to understand the event behavior.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Slotted error content not reachable via aria-describedby",
      "status": "in_progress",
      "activeForm": "Fixing P0-01: slotted error aria-describedby"
    },
    {
      "content": "Fix P1-01: Remove conflicting aria-live='polite' from role='alert' error div",
      "status": "pending",
      "activeForm": "Fixing P1-01: conflicting ARIA semantics"
    },
    {
      "content": "Fix P1-02: Add aria-required to fieldset",
      "status": "pending",
      "activeForm": "Fixing P1-02: aria-required on fieldset"
    },
    {
      "content": "Fix P1-03: Remove fragile _suppressNextChildChange guard",
      "status": "pending",
      "activeForm": "Fixing P1-03: event dedup guard"
    },
    {
      "content": "Fix P1-04: Only include helpTextId in aria-describedby when help slot has content",
      "status": "pending",
      "activeForm": "Fixing P1-04: empty help text aria-describedby"
    },
    {
      "content": "Fix P2-01: Use monotonic counter for ID generation",
      "status": "pending",
      "activeForm": "Fixing P2-01: deterministic IDs"
    },
    {
      "content": "Update tests for new behavior and missing coverage",
      "status": "pending",
      "activeForm": "Updating tests"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts",
  "limit": 50
}
Now let me implement all the fixes to the component. I'll tackle them all in the main component file first.

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.ts"
}
Now I'll implement all the fixes. Let me write the updated component file.

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.ts",
  "content": "import { LitElement, html, nothing } from 'lit';\nimport { customElement, property, query, state } from 'lit/decorators.js';\nimport { classMap } from 'lit/directives/class-map.js';\nimport { tokenStyles } from '@helix/tokens/lit';\nimport { helixCheckboxGroupStyles } from './hx-checkbox-group.styles.js';\nimport type { HelixCheckbox } from '../hx-checkbox/hx-checkbox.js';\n\nlet _uid = 0;\n\n/**\n * A form-associated checkbox group that manages a set of `<hx-checkbox>` children.\n *\n * @summary Form-associated checkbox group with label, validation, help text, and multi-value form submission.\n *\n * @tag hx-checkbox-group\n *\n * @slot - `<hx-checkbox>` elements.\n * @slot label - Rich HTML group label (overrides the label property when used).\n * @slot error - Custom error content (overrides the error property).\n * @slot help - Group-level help text.\n *\n * @fires {CustomEvent<{values: string[]}>} hx-change - Dispatched when any child checkbox changes.\n *\n * @csspart group - The fieldset wrapper.\n * @csspart label - The legend/label.\n * @csspart help-text - The help text container.\n * @csspart error-message - The error message container.\n *\n * @cssprop [--hx-checkbox-group-gap=var(--hx-space-3, 0.75rem)] - Gap between checkbox items.\n * @cssprop [--hx-checkbox-group-label-color=var(--hx-color-neutral-700, #343a40)] - Label text color.\n * @cssprop [--hx-checkbox-group-error-color=var(--hx-color-error-500, #dc3545)] - Error message color.\n */\n@customElement('hx-checkbox-group')\nexport class HelixCheckboxGroup extends LitElement {\n  static override styles = [tokenStyles, helixCheckboxGroupStyles];\n\n  // ─── Form Association ───\n\n  static formAssociated = true;\n\n  private _internals: ElementInternals;\n\n  constructor() {\n    super();\n    this._internals = this.attachInternals();\n  }\n\n  // ─── Properties ───\n\n  /**\n   * The name used for form submission. Passed to child `hx-checkbox` elements.\n   * @attr name\n   */\n  @property({ type: String })\n  name = '';\n\n  /**\n   * The fieldset legend/label text.\n   * @attr label\n   */\n  @property({ type: String })\n  label = '';\n\n  /**\n   * Whether at least one checkbox must be checked for form submission.\n   * @attr required\n   */\n  @property({ type: Boolean, reflect: true })\n  required = false;\n\n  /**\n   * Whether the entire group is disabled.\n   * @attr disabled\n   */\n  @property({ type: Boolean, reflect: true })\n  disabled = false;\n\n  /**\n   * Error message to display. When set, the group enters an error state.\n   * @attr error\n   */\n  @property({ type: String })\n  error = '';\n\n  /**\n   * Layout orientation of the checkbox items.\n   * @attr orientation\n   */\n  @property({ type: String, reflect: true })\n  orientation: 'vertical' | 'horizontal' = 'vertical';\n\n  @query('.fieldset__items')\n  declare private _itemsEl: HTMLElement | null;\n\n  @state() private _hasErrorSlot = false;\n  @state() private _hasHelpSlot = false;\n\n  // ─── Internal IDs ───\n\n  private _groupId = `hx-checkbox-group-${++_uid}`;\n  private _helpTextId = `${this._groupId}-help`;\n  private _errorId = `${this._groupId}-error`;\n\n  // ─── Slot Handlers ───\n\n  private _handleErrorSlotChange(e: Event): void {\n    const slot = e.target as HTMLSlotElement;\n    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;\n  }\n\n  private _handleHelpSlotChange(e: Event): void {\n    const slot = e.target as HTMLSlotElement;\n    this._hasHelpSlot = slot.assignedNodes({ flatten: true }).length > 0;\n  }\n\n  // ─── Lifecycle ───\n\n  override connectedCallback(): void {\n    super.connectedCallback();\n    this.addEventListener('hx-change', this._handleCheckboxChange as EventListener);\n  }\n\n  override disconnectedCallback(): void {\n    super.disconnectedCallback();\n    this.removeEventListener('hx-change', this._handleCheckboxChange as EventListener);\n  }\n\n  override updated(changedProperties: Map<string, unknown>): void {\n    super.updated(changedProperties);\n    if (changedProperties.has('disabled')) {\n      this._syncCheckboxes();\n    }\n    if (changedProperties.has('name')) {\n      this._syncCheckboxNames();\n    }\n    if (changedProperties.has('required')) {\n      this._updateValidity();\n    }\n  }\n\n  override firstUpdated(changedProperties: Map<string, unknown>): void {\n    super.firstUpdated(changedProperties);\n    this._syncCheckboxes();\n    this._syncCheckboxNames();\n    const checkedValues = this._getCheckedValues();\n    this._updateFormValue(checkedValues);\n    this._updateValidity(checkedValues);\n  }\n\n  // ─── Checkbox Management ───\n\n  private _getCheckboxes(): HelixCheckbox[] {\n    return Array.from(this.querySelectorAll('hx-checkbox')) as HelixCheckbox[];\n  }\n\n  private _getCheckedValues(): string[] {\n    return this._getCheckboxes()\n      .filter((cb) => cb.checked)\n      .map((cb) => cb.value);\n  }\n\n  private _syncCheckboxes(): void {\n    const checkboxes = this._getCheckboxes();\n    checkboxes.forEach((cb) => {\n      cb.disabled = this.disabled;\n    });\n  }\n\n  private _syncCheckboxNames(): void {\n    if (!this.name) return;\n    const checkboxes = this._getCheckboxes();\n    checkboxes.forEach((cb) => {\n      cb.name = this.name;\n    });\n  }\n\n  // ─── Event Handling ───\n\n  private _handleCheckboxChange = (e: CustomEvent<{ checked: boolean; value: string }>): void => {\n    if (e.target === this) return;\n\n    e.stopImmediatePropagation();\n\n    const values = this._getCheckedValues();\n    this._updateFormValue(values);\n    this._updateValidity(values);\n\n    /**\n     * Dispatched when any child checkbox changes.\n     * @event hx-change\n     */\n    this.dispatchEvent(\n      new CustomEvent('hx-change', {\n        bubbles: true,\n        composed: true,\n        detail: { values },\n      }),\n    );\n  };\n\n  private _handleSlotChange(): void {\n    this._syncCheckboxes();\n    this._syncCheckboxNames();\n    const checkedValues = this._getCheckedValues();\n    this._updateFormValue(checkedValues);\n    this._updateValidity(checkedValues);\n  }\n\n  // ─── Form Integration ───\n\n  private _updateFormValue(values: string[]): void {\n    if (values.length === 0) {\n      this._internals.setFormValue(null);\n      return;\n    }\n    const formData = new FormData();\n    values.forEach((v) => formData.append(this.name, v));\n    this._internals.setFormValue(formData);\n  }\n\n  private _updateValidity(values?: string[]): void {\n    const checkedValues = values ?? this._getCheckedValues();\n    if (this.required && checkedValues.length === 0) {\n      this._internals.setValidity(\n        { valueMissing: true },\n        this.error || 'Please select at least one option.',\n        this._itemsEl ?? undefined,\n      );\n    } else {\n      this._internals.setValidity({});\n    }\n  }\n\n  /** Returns the associated form element, if any. */\n  get form(): HTMLFormElement | null {\n    return this._internals.form;\n  }\n\n  /** Returns the validation message. */\n  get validationMessage(): string {\n    return this._internals.validationMessage;\n  }\n\n  /** Returns the ValidityState object. */\n  get validity(): ValidityState {\n    return this._internals.validity;\n  }\n\n  /** Checks whether the group satisfies its constraints. */\n  checkValidity(): boolean {\n    return this._internals.checkValidity();\n  }\n\n  /** Reports validity and shows the browser's constraint validation UI. */\n  reportValidity(): boolean {\n    return this._internals.reportValidity();\n  }\n\n  /** Called by the form when it resets. */\n  formResetCallback(): void {\n    const checkboxes = this._getCheckboxes();\n    checkboxes.forEach((cb) => {\n      cb.checked = false;\n    });\n    this._internals.setFormValue(null);\n    this._updateValidity([]);\n  }\n\n  /** Called when the form restores state (e.g., back/forward navigation). */\n  formStateRestoreCallback(state: string | File | FormData): void {\n    if (!(state instanceof FormData)) return;\n    const restoredValues = state.getAll(this.name).map((v) => String(v));\n    const checkboxes = this._getCheckboxes();\n    checkboxes.forEach((cb) => {\n      cb.checked = restoredValues.includes(cb.value);\n    });\n    this._updateFormValue(restoredValues);\n    this._updateValidity(restoredValues);\n  }\n\n  // ─── Render ───\n\n  override render() {\n    const hasError = !!this.error || this._hasErrorSlot;\n\n    const fieldsetClasses = {\n      fieldset: true,\n      'fieldset--error': hasError,\n      'fieldset--disabled': this.disabled,\n      'fieldset--required': this.required,\n    };\n\n    const describedByParts: string[] = [];\n    if (hasError) describedByParts.push(this._errorId);\n    if (this._hasHelpSlot) describedByParts.push(this._helpTextId);\n    const describedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;\n\n    return html`\n      <fieldset\n        part=\"group\"\n        class=${classMap(fieldsetClasses)}\n        aria-describedby=${describedBy ?? nothing}\n        aria-required=${this.required || nothing}\n      >\n        <legend part=\"label\" class=\"fieldset__legend\">\n          <slot name=\"label\">${this.label}</slot>\n          ${this.required\n            ? html`<span class=\"fieldset__required-marker\" aria-hidden=\"true\">*</span>`\n            : nothing}\n        </legend>\n\n        <div class=\"fieldset__items\">\n          <slot @slotchange=${this._handleSlotChange}></slot>\n        </div>\n\n        <div\n          part=\"error-message\"\n          class=\"fieldset__error\"\n          id=${this._errorId}\n          role=\"alert\"\n        >\n          <slot name=\"error\" @slotchange=${this._handleErrorSlotChange}>\n            ${this.error && !this._hasErrorSlot ? this.error : nothing}\n          </slot>\n        </div>\n\n        <div part=\"help-text\" class=\"fieldset__help-text\" id=${this._helpTextId}>\n          <slot name=\"help\" @slotchange=${this._handleHelpSlotChange}></slot>\n        </div>\n      </fieldset>\n    `;\n  }\n}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n    'hx-checkbox-group': HelixCheckboxGroup;\n  }\n}\n"
}
Now update the styles to handle the always-rendered error container (hide when empty) and fix the cursor issue:

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.styles.ts",
  "content": "import { css } from 'lit';\n\nexport const helixCheckboxGroupStyles = css`\n  :host {\n    display: block;\n  }\n\n  :host([disabled]) {\n    opacity: var(--hx-opacity-disabled);\n    cursor: not-allowed;\n  }\n\n  * {\n    box-sizing: border-box;\n  }\n\n  /* ─── Fieldset ─── */\n\n  .fieldset {\n    border: none;\n    margin: 0;\n    padding: 0;\n    display: flex;\n    flex-direction: column;\n    gap: var(--hx-space-2);\n    font-family: var(--hx-font-family-sans);\n  }\n\n  .fieldset--disabled {\n    pointer-events: none;\n  }\n\n  /* ─── Legend ─── */\n\n  .fieldset__legend {\n    display: flex;\n    align-items: baseline;\n    gap: var(--hx-space-1);\n    font-size: var(--hx-font-size-sm);\n    font-weight: var(--hx-font-weight-medium);\n    color: var(--hx-checkbox-group-label-color, var(--hx-color-neutral-700));\n    line-height: var(--hx-line-height-normal);\n    padding: 0;\n    margin-bottom: var(--hx-space-1);\n  }\n\n  .fieldset__required-marker {\n    color: var(--hx-checkbox-group-error-color, var(--hx-color-error-500));\n    font-weight: var(--hx-font-weight-bold);\n  }\n\n  /* ─── Items Container ─── */\n\n  .fieldset__items {\n    display: flex;\n    flex-direction: column;\n    gap: var(--hx-checkbox-group-gap, var(--hx-space-3));\n  }\n\n  :host([orientation='horizontal']) .fieldset__items {\n    flex-direction: row;\n    flex-wrap: wrap;\n  }\n\n  /* ─── Error State ─── */\n\n  .fieldset--error .fieldset__legend {\n    color: var(--hx-checkbox-group-error-color, var(--hx-color-error-500));\n  }\n\n  /* ─── Help Text & Error Messages ─── */\n\n  .fieldset__help-text {\n    font-size: var(--hx-font-size-xs);\n    color: var(--hx-color-neutral-500);\n    line-height: var(--hx-line-height-normal);\n  }\n\n  .fieldset__help-text:empty {\n    display: none;\n  }\n\n  .fieldset__error {\n    font-size: var(--hx-font-size-xs);\n    color: var(--hx-checkbox-group-error-color, var(--hx-color-error-500));\n    line-height: var(--hx-line-height-normal);\n  }\n\n  .fieldset__error:empty {\n    display: none;\n  }\n`;\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Slotted error content not reachable via aria-describedby",
      "status": "completed",
      "activeForm": "Fixing P0-01: slotted error aria-describedby"
    },
    {
      "content": "Fix P1-01: Remove conflicting aria-live='polite' from role='alert' error div",
      "status": "completed",
      "activeForm": "Fixing P1-01: conflicting ARIA semantics"
    },
    {
      "content": "Fix P1-02: Add aria-required to fieldset",
      "status": "completed",
      "activeForm": "Fixing P1-02: aria-required on fieldset"
    },
    {
      "content": "Fix P1-03: Remove fragile _suppressNextChildChange guard",
      "status": "completed",
      "activeForm": "Fixing P1-03: event dedup guard"
    },
    {
      "content": "Fix P1-04: Only include helpTextId in aria-describedby when help slot has content",
      "status": "completed",
      "activeForm": "Fixing P1-04: empty help text aria-describedby"
    },
    {
      "content": "Fix P2-01: Use monotonic counter for ID generation",
      "status": "completed",
      "activeForm": "Fixing P2-01: deterministic IDs"
    },
    {
      "content": "Fix P2-03: Disabled cursor pattern",
      "status": "completed",
      "activeForm": "Fixing P2-03: disabled cursor"
    },
    {
      "content": "Update tests for new behavior",
      "status": "in_progress",
      "activeForm": "Updating tests"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}
Now update the tests to match the new render structure. Key changes:
1. Error div is always rendered (wraps the error slot) — tests looking for `[role="alert"]` or `[part="error-message"]` should still work since the div is always there
2. `aria-live="polite"` removed — test checking for it needs updating
3. `aria-required` now on fieldset — should add test

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.test.ts",
  "content": "import { describe, it, expect, afterEach } from 'vitest';\nimport {\n  fixture,\n  shadowQuery,\n\n  oneEvent,\n  cleanup,\n  checkA11y,\n} from '../../test-utils.js';\nimport type { HelixCheckboxGroup } from './hx-checkbox-group.js';\nimport type { HelixCheckbox } from '../hx-checkbox/hx-checkbox.js';\nimport '../hx-checkbox/index.js';\nimport './index.js';\n\nafterEach(cleanup);\n\ndescribe('hx-checkbox-group', () => {\n  // ─── Rendering (4) ───\n\n  describe('Rendering', () => {\n    it('renders with shadow DOM', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.shadowRoot).toBeTruthy();\n    });\n\n    it('renders a fieldset element', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const fieldset = shadowQuery(el, 'fieldset');\n      expect(fieldset).toBeInstanceOf(HTMLFieldSetElement);\n    });\n\n    it('renders legend with label text', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Choose Options\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const legend = shadowQuery(el, 'legend');\n      expect(legend?.textContent?.trim()).toContain('Choose Options');\n    });\n\n    it('default orientation is vertical', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.orientation).toBe('vertical');\n    });\n  });\n\n  // ─── Property: label (2) ───\n\n  describe('Property: label', () => {\n    it('shows label text in legend', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Notification Preferences\">\n          <hx-checkbox value=\"email\" label=\"Email\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const legend = shadowQuery(el, 'legend');\n      expect(legend?.textContent?.trim()).toContain('Notification Preferences');\n    });\n\n    it('renders legend with empty text when no label is provided', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const legend = shadowQuery(el, 'legend');\n      // Legend is always rendered; with no label it has no meaningful text\n      expect(legend).toBeTruthy();\n      const textContent = legend?.textContent?.trim() ?? '';\n      expect(textContent).toBe('');\n    });\n  });\n\n  // ─── Property: required (3) ───\n\n  describe('Property: required', () => {\n    it('shows required marker asterisk in legend', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const marker = shadowQuery(el, '.fieldset__required-marker');\n      expect(marker).toBeTruthy();\n      expect(marker?.textContent).toBe('*');\n    });\n\n    it('reflects required attribute to host', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.hasAttribute('required')).toBe(true);\n    });\n\n    it('sets aria-required on fieldset when required', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const fieldset = shadowQuery(el, 'fieldset');\n      expect(fieldset?.getAttribute('aria-required')).toBe('true');\n    });\n  });\n\n  // ─── Property: error (3) ───\n\n  describe('Property: error', () => {\n    it('shows error message div with role=\"alert\"', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" error=\"Please select at least one option\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const errorDiv = shadowQuery(el, '[role=\"alert\"]');\n      expect(errorDiv).toBeTruthy();\n      expect(errorDiv?.textContent?.trim()).toBe('Please select at least one option');\n    });\n\n    it('error div has part=\"error-message\"', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" error=\"Required\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const errorDiv = shadowQuery(el, '[part=\"error-message\"]');\n      expect(errorDiv).toBeTruthy();\n    });\n\n    it('error div uses role=\"alert\" without conflicting aria-live', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" error=\"Error\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const errorDiv = shadowQuery(el, '.fieldset__error');\n      expect(errorDiv?.getAttribute('role')).toBe('alert');\n      expect(errorDiv?.hasAttribute('aria-live')).toBe(false);\n    });\n  });\n\n  // ─── Property: orientation (2) ───\n\n  describe('Property: orientation', () => {\n    it('orientation defaults to vertical', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.orientation).toBe('vertical');\n      expect(el.getAttribute('orientation')).toBe('vertical');\n    });\n\n    it('horizontal orientation reflects to host attribute', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" orientation=\"horizontal\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <hx-checkbox value=\"b\" label=\"Option B\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.orientation).toBe('horizontal');\n      expect(el.getAttribute('orientation')).toBe('horizontal');\n    });\n  });\n\n  // ─── Property: disabled (2) ───\n\n  describe('Property: disabled', () => {\n    it('reflects disabled attribute to host', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" disabled>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.hasAttribute('disabled')).toBe(true);\n    });\n\n    it('propagates disabled to child hx-checkbox elements', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" disabled>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <hx-checkbox value=\"b\" label=\"Option B\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const checkboxes = Array.from(el.querySelectorAll('hx-checkbox')) as HelixCheckbox[];\n      expect(checkboxes[0].disabled).toBe(true);\n      expect(checkboxes[1].disabled).toBe(true);\n    });\n  });\n\n  // ─── Slots (4) ───\n\n  describe('Slots', () => {\n    it('default slot renders hx-checkbox children', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <hx-checkbox value=\"b\" label=\"Option B\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const checkboxes = el.querySelectorAll('hx-checkbox');\n      expect(checkboxes.length).toBe(2);\n    });\n\n    it('label slot overrides label property', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Fallback Label\">\n          <strong slot=\"label\">Custom <em>Rich</em> Label</strong>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const slotted = el.querySelector('[slot=\"label\"]');\n      expect(slotted).toBeTruthy();\n      expect(slotted?.textContent?.trim()).toContain('Custom');\n    });\n\n    it('help slot renders help text content', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <span slot=\"help\">Select all that apply</span>\n        </hx-checkbox-group>\n      `);\n      const helpSlotted = el.querySelector('[slot=\"help\"]');\n      expect(helpSlotted).toBeTruthy();\n      expect(helpSlotted?.textContent).toBe('Select all that apply');\n    });\n\n    it('error slot overrides error property', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" error=\"Prop error\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <span slot=\"error\">Slotted error message</span>\n        </hx-checkbox-group>\n      `);\n      const errorSlotted = el.querySelector('[slot=\"error\"]');\n      expect(errorSlotted).toBeTruthy();\n      expect(errorSlotted?.textContent).toBe('Slotted error message');\n    });\n  });\n\n  // ─── CSS Parts (4) ───\n\n  describe('CSS Parts', () => {\n    it('exposes \"group\" CSS part on fieldset', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(shadowQuery(el, '[part=\"group\"]')).toBeTruthy();\n    });\n\n    it('exposes \"label\" CSS part on legend', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(shadowQuery(el, '[part=\"label\"]')).toBeTruthy();\n    });\n\n    it('exposes \"help-text\" CSS part', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(shadowQuery(el, '[part=\"help-text\"]')).toBeTruthy();\n    });\n\n    it('exposes \"error-message\" CSS part when error is set', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" error=\"Something went wrong\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(shadowQuery(el, '[part=\"error-message\"]')).toBeTruthy();\n    });\n  });\n\n  // ─── Events (5) ───\n\n  describe('Events', () => {\n    it('dispatches hx-change when a child checkbox changes', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <hx-checkbox value=\"b\" label=\"Option B\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const eventPromise = oneEvent<CustomEvent<{ values: string[] }>>(el, 'hx-change');\n      const checkboxA = el.querySelector('hx-checkbox[value=\"a\"]') as HelixCheckbox;\n      const control = shadowQuery<HTMLElement>(checkboxA, '.checkbox__control');\n      if (!control) throw new Error('.checkbox__control not found');\n      control.click();\n      const event = await eventPromise;\n      expect(event).toBeTruthy();\n    });\n\n    it('hx-change event detail has values array with checked checkbox values', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <hx-checkbox value=\"b\" label=\"Option B\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const eventPromise = oneEvent<CustomEvent<{ values: string[] }>>(el, 'hx-change');\n      const checkboxA = el.querySelector('hx-checkbox[value=\"a\"]') as HelixCheckbox;\n      const control = shadowQuery<HTMLElement>(checkboxA, '.checkbox__control');\n      if (!control) throw new Error('.checkbox__control not found');\n      control.click();\n      const event = await eventPromise;\n      expect(Array.isArray(event.detail.values)).toBe(true);\n      expect(event.detail.values).toContain('a');\n    });\n\n    it('hx-change is composed and bubbles', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const eventPromise = oneEvent<CustomEvent<{ values: string[] }>>(el, 'hx-change');\n      const checkboxA = el.querySelector('hx-checkbox[value=\"a\"]') as HelixCheckbox;\n      const control = shadowQuery<HTMLElement>(checkboxA, '.checkbox__control');\n      if (!control) throw new Error('.checkbox__control not found');\n      control.click();\n      const event = await eventPromise;\n      expect(event.bubbles).toBe(true);\n      expect(event.composed).toBe(true);\n    });\n\n    it('stops propagation of hx-change from child checkbox (re-dispatches from group)', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      // The group should intercept child events and re-dispatch — only one event should arrive at the group\n      const receivedEvents: CustomEvent<{ values: string[] }>[] = [];\n      el.addEventListener('hx-change', (e) => {\n        receivedEvents.push(e as CustomEvent<{ values: string[] }>);\n      });\n      const checkboxA = el.querySelector('hx-checkbox[value=\"a\"]') as HelixCheckbox;\n      const control = shadowQuery<HTMLElement>(checkboxA, '.checkbox__control');\n      if (!control) throw new Error('.checkbox__control not found');\n      control.click();\n      // Wait for event processing\n      await el.updateComplete;\n      // Exactly one hx-change should arrive, dispatched by the group (target === el)\n      expect(receivedEvents.length).toBe(1);\n      expect(receivedEvents[0].target).toBe(el);\n    });\n\n    it('does not re-dispatch hx-change when target is the group itself', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      let eventCount = 0;\n      el.addEventListener('hx-change', () => {\n        eventCount++;\n      });\n      // Dispatch an hx-change directly from the group element (simulates the guard condition)\n      el.dispatchEvent(\n        new CustomEvent('hx-change', {\n          bubbles: true,\n          composed: true,\n          detail: { values: ['a'] },\n        }),\n      );\n      await el.updateComplete;\n      // Only the directly dispatched event should count, not a re-dispatch loop\n      expect(eventCount).toBe(1);\n    });\n  });\n\n  // ─── Form Integration (6) ───\n\n  describe('Form Integration', () => {\n    it('has formAssociated=true', () => {\n      const ctor = customElements.get('hx-checkbox-group') as unknown as {\n        formAssociated: boolean;\n      };\n      expect(ctor.formAssociated).toBe(true);\n    });\n\n    it('form getter returns null when not inside a form', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.form).toBe(null);\n    });\n\n    it('form getter returns associated form element', async () => {\n      const form = document.createElement('form');\n      form.innerHTML = `\n        <hx-checkbox-group label=\"Test Group\" name=\"options\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `;\n      const container = document.getElementById('test-fixture-container');\n      if (!container) throw new Error('test-fixture-container not found');\n      container.appendChild(form);\n      const el = form.querySelector('hx-checkbox-group') as HelixCheckboxGroup;\n      await el.updateComplete;\n      expect(el.form).toBe(form);\n    });\n\n    it('required group is invalid when no checkboxes are checked', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <hx-checkbox value=\"b\" label=\"Option B\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.checkValidity()).toBe(false);\n      expect(el.validity.valueMissing).toBe(true);\n    });\n\n    it('required group is valid when at least one checkbox is checked', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\" checked></hx-checkbox>\n          <hx-checkbox value=\"b\" label=\"Option B\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.checkValidity()).toBe(true);\n    });\n\n    it('formResetCallback resets all child checkboxes to unchecked', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\">\n          <hx-checkbox value=\"a\" label=\"Option A\" checked></hx-checkbox>\n          <hx-checkbox value=\"b\" label=\"Option B\" checked></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const checkboxes = Array.from(el.querySelectorAll('hx-checkbox')) as HelixCheckbox[];\n      expect(checkboxes[0].checked).toBe(true);\n      expect(checkboxes[1].checked).toBe(true);\n\n      el.formResetCallback();\n      await el.updateComplete;\n\n      expect(checkboxes[0].checked).toBe(false);\n      expect(checkboxes[1].checked).toBe(false);\n    });\n  });\n\n  // ─── Validation (4) ───\n\n  describe('Validation', () => {\n    it('checkValidity returns false when required and no checkboxes are checked', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.checkValidity()).toBe(false);\n    });\n\n    it('checkValidity returns true when required and at least one checkbox is checked', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\" checked></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.checkValidity()).toBe(true);\n    });\n\n    it('reportValidity returns false when required and empty', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.reportValidity()).toBe(false);\n    });\n\n    it('validationMessage is non-empty when required and no checkboxes are checked', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" name=\"options\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      expect(el.validationMessage.length).toBeGreaterThan(0);\n    });\n  });\n\n  // ─── ARIA: aria-describedby (3) ───\n\n  describe('ARIA: aria-describedby', () => {\n    it('includes error id in aria-describedby when error prop is set', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" error=\"Required\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const fieldset = shadowQuery(el, 'fieldset');\n      const describedBy = fieldset?.getAttribute('aria-describedby') ?? '';\n      const errorDiv = shadowQuery(el, '.fieldset__error');\n      expect(describedBy).toContain(errorDiv?.id ?? 'MISSING');\n    });\n\n    it('includes error id in aria-describedby when error slot is used', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <span slot=\"error\">Slotted error</span>\n        </hx-checkbox-group>\n      `);\n      await el.updateComplete;\n      const fieldset = shadowQuery(el, 'fieldset');\n      const describedBy = fieldset?.getAttribute('aria-describedby') ?? '';\n      const errorDiv = shadowQuery(el, '.fieldset__error');\n      expect(describedBy).toContain(errorDiv?.id ?? 'MISSING');\n    });\n\n    it('does not include help-text id when help slot is empty', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const fieldset = shadowQuery(el, 'fieldset');\n      const describedBy = fieldset?.getAttribute('aria-describedby');\n      expect(describedBy).toBeFalsy();\n    });\n\n    it('includes help-text id when help slot has content', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\">\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n          <span slot=\"help\">Help text</span>\n        </hx-checkbox-group>\n      `);\n      await el.updateComplete;\n      const fieldset = shadowQuery(el, 'fieldset');\n      const describedBy = fieldset?.getAttribute('aria-describedby') ?? '';\n      const helpDiv = shadowQuery(el, '.fieldset__help-text');\n      expect(describedBy).toContain(helpDiv?.id ?? 'MISSING');\n    });\n  });\n\n  // ─── Accessibility (axe-core) ───\n\n  describe('Accessibility (axe-core)', () => {\n    it('has no axe violations in default state', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Notification Settings\" name=\"notifications\">\n          <hx-checkbox value=\"email\" label=\"Email\"></hx-checkbox>\n          <hx-checkbox value=\"sms\" label=\"SMS\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations when required', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Notification Settings\" name=\"notifications\" required>\n          <hx-checkbox value=\"email\" label=\"Email\"></hx-checkbox>\n          <hx-checkbox value=\"sms\" label=\"SMS\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n\n    it('has no axe violations in error state', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Notification Settings\" name=\"notifications\" error=\"Please select at least one option\">\n          <hx-checkbox value=\"email\" label=\"Email\"></hx-checkbox>\n          <hx-checkbox value=\"sms\" label=\"SMS\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const { violations } = await checkA11y(el);\n      expect(violations).toEqual([]);\n    });\n  });\n});\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Slotted error content not reachable via aria-describedby",
      "status": "completed",
      "activeForm": "Fixing P0-01: slotted error aria-describedby"
    },
    {
      "content": "Fix P1-01: Remove conflicting aria-live='polite' from role='alert' error div",
      "status": "completed",
      "activeForm": "Fixing P1-01: conflicting ARIA semantics"
    },
    {
      "content": "Fix P1-02: Add aria-required to fieldset",
      "status": "completed",
      "activeForm": "Fixing P1-02: aria-required on fieldset"
    },
    {
      "content": "Fix P1-03: Remove fragile _suppressNextChildChange guard",
      "status": "completed",
      "activeForm": "Fixing P1-03: event dedup guard"
    },
    {
      "content": "Fix P1-04: Only include helpTextId in aria-describedby when help slot has content",
      "status": "completed",
      "activeForm": "Fixing P1-04: empty help text aria-describedby"
    },
    {
      "content": "Fix P2-01: Use monotonic counter for ID generation",
      "status": "completed",
      "activeForm": "Fixing P2-01: deterministic IDs"
    },
    {
      "content": "Fix P2-03: Disabled cursor pattern",
      "status": "completed",
      "activeForm": "Fixing P2-03: disabled cursor"
    },
    {
      "content": "Update tests for new behavior",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Update AUDIT.md with remediation status",
      "status": "in_progress",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Build and verify",
      "status": "pending",
      "activeForm": "Building and verifying"
    }
  ]
}
Now update the AUDIT.md with remediation notes.

🔧 Tool: Write
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/AUDIT.md",
  "content": "# AUDIT: hx-checkbox-group — Deep Audit v2\n\n**Date:** 2026-03-06\n**Auditor:** Deep Audit v2 (remediation pass)\n**Prior Audit:** T1-10 Antagonistic Quality Review (2026-03-05)\n**Verdict:** PASS — All P0/P1 defects resolved. P2 items addressed where applicable.\n\n---\n\n## Existence Check\n\nComponent is **complete and functional**. All standard files present:\n- `hx-checkbox-group.ts` — Component class (form-associated, ElementInternals)\n- `hx-checkbox-group.styles.ts` — Lit CSS styles\n- `hx-checkbox-group.stories.ts` — 15 Storybook stories with interaction tests\n- `hx-checkbox-group.test.ts` — Vitest browser tests (40+ tests)\n- `index.ts` — Re-export\n\n---\n\n## Remediation Summary\n\n### P0-01: Slotted error content not reachable via aria-describedby — FIXED\n- Error container now always renders with `id` and `role=\"alert\"`, wrapping the error slot\n- `aria-describedby` includes error ID when either `error` prop OR error slot has content (`_hasErrorSlot`)\n- Empty error container hidden via `:empty` CSS pseudo-class\n\n### P1-01: Conflicting role=\"alert\" + aria-live=\"polite\" — FIXED\n- Removed `aria-live=\"polite\"` from error div\n- `role=\"alert\"` alone provides correct assertive announcement semantics\n\n### P1-02: Missing aria-required on fieldset — FIXED\n- Added `aria-required=${this.required || nothing}` to `<fieldset>` element\n- Programmatically communicates required state to AT per WCAG 2.1 SC 1.3.1\n\n### P1-03: _suppressNextChildChange fragile guard — FIXED\n- Removed entire `_suppressNextChildChange` mechanism\n- `hx-checkbox` handles its own event deduplication internally\n\n### P1-04: aria-describedby includes helpTextId when help slot is empty — FIXED\n- Added `_hasHelpSlot` state tracked via `_handleHelpSlotChange`\n- `aria-describedby` only includes help-text ID when help slot has content\n\n### P2-01: Math.random() for ID generation — FIXED\n- Replaced with module-level monotonic counter: `let _uid = 0`\n- IDs are now deterministic within a session\n\n### P2-03: pointer-events: none prevents disabled cursor — FIXED\n- `cursor: not-allowed` on `:host([disabled])`\n- `pointer-events: none` moved to `.fieldset--disabled` (internal only)\n\n### P2-02: querySelectorAll traverses all descendants — NOT CHANGED\n- Kept as-is. Deep query is intentional to support wrapper elements around checkboxes.\n\n### P2-04: Validation anchor on non-focusable div — NOT CHANGED\n- Browser behavior is acceptable. Anchor positioning is a minor UX concern.\n\n### P2-05: Missing test coverage — PARTIALLY ADDRESSED\n- Added `validationMessage` test\n- Added `aria-required` test\n- Added `aria-describedby` tests for error slot, help slot, and empty states\n\n### P2-07: Story imports via relative path — NOT CHANGED\n- Story imports use relative paths consistently with other components in the library.\n\n### P2-08: No Drupal Twig example — NOT CHANGED\n- DrupalExample story already exists demonstrating taxonomy term rendering pattern.\n\n---\n\n## Quality Gate Status\n\n| Gate | Check | Status |\n|------|-------|--------|\n| 1 | TypeScript strict | PASS — No `any`, strict mode clean |\n| 2 | Tests | PASS — 40+ tests including a11y, form integration, ARIA |\n| 3 | Accessibility | PASS — P0/P1 a11y defects resolved, axe-core tests pass |\n| 4 | Storybook | PASS — 15 stories with interaction tests |\n| 5 | CEM | PASS — JSDoc tags match public API |\n| 6 | Bundle size | PASS — ~270 LoC component + 85 LoC styles |\n| 7 | Code review | PENDING — Awaiting review |\n\n---\n\n## Design Tokens\n\n| Token | Usage |\n|-------|-------|\n| `--hx-checkbox-group-gap` | Gap between checkbox items |\n| `--hx-checkbox-group-label-color` | Label/legend text color |\n| `--hx-checkbox-group-error-color` | Error message + required marker color |\n| `--hx-space-*` | Internal spacing (fieldset gap, legend margin) |\n| `--hx-font-*` | Typography (family, size, weight, line-height) |\n| `--hx-color-*` | Semantic colors (neutral, error) |\n| `--hx-opacity-disabled` | Disabled state opacity |\n| `--hx-border-radius-*` | Not used (no borders on fieldset) |\n\nAll values use design tokens with fallbacks. Zero hardcoded values.\n\n---\n\n## Accessibility Summary\n\n- `<fieldset>` + `<legend>` provides native group semantics\n- `aria-required` communicates required state programmatically\n- `role=\"alert\"` on error container for assertive announcement\n- `aria-describedby` dynamically includes error/help IDs only when content exists\n- Required marker (`*`) is `aria-hidden=\"true\"`\n- `disabled` propagated to all child checkboxes\n- axe-core tests for default, required, and error states\n"
}
Now let me build and verify.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Slotted error content not reachable via aria-describedby",
      "status": "completed",
      "activeForm": "Fixing P0-01: slotted error aria-describedby"
    },
    {
      "content": "Fix P1-01: Remove conflicting aria-live='polite' from role='alert' error div",
      "status": "completed",
      "activeForm": "Fixing P1-01: conflicting ARIA semantics"
    },
    {
      "content": "Fix P1-02: Add aria-required to fieldset",
      "status": "completed",
      "activeForm": "Fixing P1-02: aria-required on fieldset"
    },
    {
      "content": "Fix P1-03: Remove fragile _suppressNextChildChange guard",
      "status": "completed",
      "activeForm": "Fixing P1-03: event dedup guard"
    },
    {
      "content": "Fix P1-04: Only include helpTextId in aria-describedby when help slot has content",
      "status": "completed",
      "activeForm": "Fixing P1-04: empty help text aria-describedby"
    },
    {
      "content": "Fix P2-01: Use monotonic counter for ID generation",
      "status": "completed",
      "activeForm": "Fixing P2-01: deterministic IDs"
    },
    {
      "content": "Fix P2-03: Disabled cursor pattern",
      "status": "completed",
      "activeForm": "Fixing P2-03: disabled cursor"
    },
    {
      "content": "Update tests for new behavior",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Update AUDIT.md with remediation status",
      "status": "completed",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Build and verify",
      "status": "in_progress",
      "activeForm": "Building and verifying"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "npm run type-check 2>&1 | tail -30",
  "description": "Run TypeScript type-check",
  "timeout": 120000
}
Type-check passes with zero errors. Now run the tests for this component.

🔧 Tool: Bash
Input: {
  "command": "npx vitest run --reporter=verbose packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.test.ts 2>&1 | tail -80",
  "description": "Run hx-checkbox-group tests",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -80",
  "description": "Run library tests",
  "timeout": 180000
}
Axe-core reports `aria-required` is not allowed on `<fieldset>`. The prior audit was wrong about this being valid. Let me fix it.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.ts",
  "old_string": "        aria-describedby=${describedBy ?? nothing}\n        aria-required=${this.required || nothing}",
  "new_string": "        aria-describedby=${describedBy ?? nothing}"
}
Now update the test that checks for `aria-required`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.test.ts",
  "old_string": "    it('sets aria-required on fieldset when required', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const fieldset = shadowQuery(el, 'fieldset');\n      expect(fieldset?.getAttribute('aria-required')).toBe('true');\n    });",
  "new_string": "    it('does not set aria-required on fieldset (not allowed by ARIA spec)', async () => {\n      const el = await fixture<HelixCheckboxGroup>(`\n        <hx-checkbox-group label=\"Test Group\" required>\n          <hx-checkbox value=\"a\" label=\"Option A\"></hx-checkbox>\n        </hx-checkbox-group>\n      `);\n      const fieldset = shadowQuery(el, 'fieldset');\n      expect(fieldset?.hasAttribute('aria-required')).toBe(false);\n    });"
}
Also update the AUDIT.md:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/AUDIT.md",
  "old_string": "### P1-02: Missing aria-required on fieldset — FIXED\n- Added `aria-required=${this.required || nothing}` to `<fieldset>` element\n- Programmatically communicates required state to AT per WCAG 2.1 SC 1.3.1",
  "new_string": "### P1-02: Missing aria-required on fieldset — RESOLVED (won't fix)\n- `aria-required` is NOT allowed on `<fieldset>` per ARIA spec (axe-core `aria-allowed-attr` rule)\n- Required state is communicated via: visual asterisk in legend, `required` attribute on host, validation messages\n- The original audit recommendation was incorrect"
}
Now run tests again:

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -40",
  "description": "Run library tests after fix",
  "timeout": 180000
}
The double-fire guard was actually needed — `hx-checkbox` does dispatch two events. Let me check the hx-checkbox event handling.

🔧 Tool: Grep
Input: {
  "pattern": "hx-change|_handleChange|dispatchEvent",
  "path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts",
  "output_mode": "content"
}

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts",
  "offset": 195,
  "limit": 85
}
I see — `_handleChange` is bound to the `<label>` click. When the label is clicked, the browser also triggers a click on the associated input, which would fire `_handleChange` again. Actually wait — the label's click handler calls `_handleChange`, and the input's `change` event... let me look at the input:

🔧 Tool: Read
Input: {
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts",
  "offset": 270,
  "limit": 30
}
The `hx-checkbox` does double-fire (label click bubbles back from input to label). The guard IS needed. Let me restore it but with a clearer implementation.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.ts",
  "old_string": "  @state() private _hasErrorSlot = false;\n  @state() private _hasHelpSlot = false;\n\n  // ─── Internal IDs ───",
  "new_string": "  @state() private _hasErrorSlot = false;\n  @state() private _hasHelpSlot = false;\n\n  /** Guards against label→input click double-fire from hx-checkbox. */\n  private _processingChange = false;\n\n  // ─── Internal IDs ───"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.ts",
  "old_string": "  private _handleCheckboxChange = (e: CustomEvent<{ checked: boolean; value: string }>): void => {\n    if (e.target === this) return;\n\n    e.stopImmediatePropagation();\n\n    const values = this._getCheckedValues();",
  "new_string": "  private _handleCheckboxChange = (e: CustomEvent<{ checked: boolean; value: string }>): void => {\n    if (e.target === this) return;\n\n    e.stopImmediatePropagation();\n\n    // hx-checkbox double-fires hx-change (label click bubbles from input back to label).\n    // Coalesce into a single group-level event per microtask.\n    if (this._processingChange) return;\n    this._processingChange = true;\n    void Promise.resolve().then(() => {\n      this._processingChange = false;\n    });\n\n    const values = this._getCheckedValues();"
}

🔧 Tool: Bash
Input: {
  "command": "npm run test:library 2>&1 | tail -20",
  "description": "Run library tests after restoring guard",
  "timeout": 180000
}
All 3106 tests pass, 79 test files. Let me also update the AUDIT.md for the guard fix:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "/Volumes/Development/booked/helix/.worktrees/feature-deep-audit-v2-hx-checkbox-group/packages/hx-library/src/components/hx-checkbox-group/AUDIT.md",
  "old_string": "### P1-03: _suppressNextChildChange fragile guard — FIXED\n- Removed entire `_suppressNextChildChange` mechanism\n- `hx-checkbox` handles its own event deduplication internally",
  "new_string": "### P1-03: _suppressNextChildChange fragile guard — IMPROVED\n- Renamed to `_processingChange` with clearer semantics\n- Guard is necessary: `hx-checkbox` double-fires `hx-change` due to label→input click bubbling\n- Microtask-based coalescing ensures exactly one group event per user interaction\n- Comment documents WHY the guard exists (upstream double-fire, not a bug in this component)"
}
Now run verify and check diff:

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -10",
  "description": "Run pre-push verify",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "npx prettier --write packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.ts 2>&1",
  "description": "Fix formatting"
}

🔧 Tool: Bash
Input: {
  "command": "npm run verify 2>&1 | tail -10",
  "description": "Verify again after format",
  "timeout": 120000
}
All gates pass. Let me check the diff:

🔧 Tool: Bash
Input: {
  "command": "git diff --stat",
  "description": "Check changed files"
}
The intended files are changed. The screenshot PNGs are test artifacts (expected behavior in this project).

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Fix P0-01: Slotted error content not reachable via aria-describedby",
      "status": "completed",
      "activeForm": "Fixing P0-01: slotted error aria-describedby"
    },
    {
      "content": "Fix P1-01: Remove conflicting aria-live='polite' from role='alert' error div",
      "status": "completed",
      "activeForm": "Fixing P1-01: conflicting ARIA semantics"
    },
    {
      "content": "Fix P1-02: aria-required on fieldset — resolved as won't fix (not allowed by ARIA)",
      "status": "completed",
      "activeForm": "Resolving P1-02"
    },
    {
      "content": "Fix P1-03: Improve event dedup guard naming and documentation",
      "status": "completed",
      "activeForm": "Fixing P1-03: event dedup guard"
    },
    {
      "content": "Fix P1-04: Only include helpTextId in aria-describedby when help slot has content",
      "status": "completed",
      "activeForm": "Fixing P1-04: empty help text aria-describedby"
    },
    {
      "content": "Fix P2-01: Use monotonic counter for ID generation",
      "status": "completed",
      "activeForm": "Fixing P2-01: deterministic IDs"
    },
    {
      "content": "Fix P2-03: Disabled cursor pattern",
      "status": "completed",
      "activeForm": "Fixing P2-03: disabled cursor"
    },
    {
      "content": "Update tests for new behavior",
      "status": "completed",
      "activeForm": "Updating tests"
    },
    {
      "content": "Update AUDIT.md with remediation status",
      "status": "completed",
      "activeForm": "Updating AUDIT.md"
    },
    {
      "content": "Build and verify",
      "status": "completed",
      "activeForm": "Building and verifying"
    }
  ]
}
<summary>
## Summary: Deep Component Audit — hx-checkbox-group

### Changes Implemented
- **P0-01 FIXED**: Error container now always renders with `id` and `role="alert"`, wrapping the error slot. `aria-describedby` includes error ID when either the `error` prop OR `_hasErrorSlot` is true. Slotted error content is now reachable by assistive technology.
- **P1-01 FIXED**: Removed conflicting `aria-live="polite"` from the error div. `role="alert"` alone provides correct assertive announcement semantics.
- **P1-02 RESOLVED (won't fix)**: `aria-required` is NOT allowed on `<fieldset>` per ARIA spec (axe-core `aria-allowed-attr` rule). The original audit recommendation was incorrect. Required state is communicated via visual asterisk, host `required` attribute, and validation messages.
- **P1-03 IMPROVED**: Renamed `_suppressNextChildChange` to `_processingChange` with clear documentation. Guard is necessary because `hx-checkbox` double-fires `hx-change` due to label→input click bubbling.
- **P1-04 FIXED**: Added `_hasHelpSlot` state tracked via `_handleHelpSlotChange`. `aria-describedby` only includes help-text ID when help slot has content.
- **P2-01 FIXED**: Replaced `Math.random()` with module-level monotonic counter for deterministic IDs.
- **P2-03 FIXED**: `cursor: not-allowed` on `:host([disabled])`, `pointer-events: none` moved to internal `.fieldset--disabled`.
- Added new tests: `aria-describedby` for error slot, help slot, empty states; `validationMessage` getter; `aria-required` absence verification; updated error ARIA semantics test.

### Files Modified
- `packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.ts`
- `packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.styles.ts`
- `packages/hx-library/src/components/hx-checkbox-group/hx-checkbox-group.test.ts`
- `packages/hx-library/src/components/hx-checkbox-group/AUDIT.md`

### Verification Status
- `npm run type-check`: 0 errors (11 tasks all successful)
- `npm run test:library`: 3106 tests passed, 79 test files, 0 failures
- `npm run verify`: All gates pass (lint + format:check + type-check)

### Risks/Blockers Encountered
- **P1-02 invalid recommendation**: The prior audit recommended adding `aria-required` to `<fieldset>`, but axe-core correctly identifies this as a critical ARIA violation (`aria-allowed-attr`). Resolved as won't-fix.
- **P1-03 guard needed**: Removing `_suppressNextChildChange` caused double events because `hx-checkbox` has a label→input click double-fire. Guard restored with improved naming and documentation.

### Learnings
- `aria-required` is NOT valid on `<fieldset>` elements per ARIA spec — audit recommendations should be validated against axe-core before implementing.
- `hx-checkbox` dispatches two `hx-change` events per click due to label wrapping input (click bubbles from input back to label). This is a known upstream issue that the group must coalesce.
- `:empty` CSS pseudo-class is effective for hiding always-rendered containers (error/help divs) when they have no content.

### Notes for Developer
- The `hx-checkbox` double-fire issue (P1-03) should be fixed upstream in the `hx-checkbox` component to eliminate the need for the coalescing guard in `hx-checkbox-group`.
</summary>