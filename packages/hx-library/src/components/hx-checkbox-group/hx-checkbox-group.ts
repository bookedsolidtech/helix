import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixCheckboxGroupStyles } from './hx-checkbox-group.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import type { HelixCheckbox } from '../hx-checkbox/hx-checkbox.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

const _nextCheckboxGroupId = createIdCounter('hx-checkbox-group');

/** Detail for the hx-change event dispatched by hx-checkbox-group. */
export interface HxCheckboxGroupChangeDetail {
  values: string[];
}

/**
 * A form-associated checkbox group that manages a set of `<hx-checkbox>` children.
 *
 * @summary Form-associated checkbox group with label, validation, help text, and multi-value form submission.
 *
 * @tag hx-checkbox-group
 *
 * @slot - `<hx-checkbox>` elements.
 * @slot label - Rich HTML group label (overrides the label property when used).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Group-level help text.
 *
 * @fires {CustomEvent<{values: string[]}>} hx-change - Dispatched when any child checkbox changes.
 *
 * @csspart group - The fieldset wrapper.
 * @csspart label - The legend/label.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-checkbox-group-gap=var(--hx-space-3, 0.75rem)] - Gap between checkbox items.
 * @cssprop [--hx-checkbox-group-label-color=var(--hx-color-neutral-700, #313E4B)] - Label text color.
 * @cssprop [--hx-checkbox-group-error-color=var(--hx-color-error-500, #E5493E)] - Error message color.
 * @cssprop [--hx-checkbox-group-help-text-color=var(--hx-color-neutral-500)] - Help text color.
 *
 * @drupal
 * Form-associated; render via Twig:
 * ```twig
 * <hx-checkbox-group name="{{ field_name }}" label="{{ label }}"{{ required ? ' required' : '' }}>
 *   {% for option in options %}
 *     <hx-checkbox value="{{ option.value }}" label="{{ option.label }}"></hx-checkbox>
 *   {% endfor %}
 * </hx-checkbox-group>
 * ```
 * The group is the sole form participant — children are suppressed via
 * `_groupedSuppress`. Setting `name` on a child has no effect inside a group.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-checkbox-group-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-color-neutral-500] - Color.
 */
@customElement('hx-checkbox-group')
export class HelixCheckboxGroup extends FormMixin(HelixElement) {
  static override styles = [helixCheckboxGroupStyles, forcedColorsField];

  // ─── Form Association ───

  /** Marks this element as form-associated for ElementInternals support. @internal */
  static override formAssociated = true;

  // ─── Properties ───

  /**
   * The name used for form submission. Passed to child `hx-checkbox` elements.
   * @attr name
   */
  @property({ type: String, reflect: true })
  name = '';

  /**
   * The fieldset legend/label text.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether at least one checkbox must be checked for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the entire group is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Error message to display. When set, the group enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text to display below the group. Can also be provided via the help-text slot.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Layout orientation of the checkbox items.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  get orientation(): 'vertical' | 'horizontal' {
    return this._orientation;
  }
  set orientation(value: string) {
    if (value !== 'vertical' && value !== 'horizontal') {
      devWarn('hx-checkbox-group', `Invalid orientation "${value}", defaulting to "vertical".`);
      value = 'vertical';
    }
    this._orientation = value as 'vertical' | 'horizontal';
  }
  /** @internal */
  private _orientation: 'vertical' | 'horizontal' = 'vertical';

  /** Whether the named error slot contains projected content. @internal */
  @state() private _hasErrorSlot = false;
  /** Whether the named help-text slot contains projected content. @internal */
  @state() private _hasHelpSlot = false;
  /** Whether the named label slot contains projected content. @internal */
  @state() private _hasLabelSlot = false;

  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * Drives the render-time branch between modern (host-canonical via
   * internals) and fallback (inner fieldset is the announced surface).
   * Codex round-17 P1.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;

  // ─── Internal IDs ───

  /** @internal */
  private _groupId = _nextCheckboxGroupId();
  /** @internal */
  private _helpTextId = `${this._groupId}-help`;
  /** @internal */
  private _errorId = `${this._groupId}-error`;
  /** @internal */
  private _labelId = `${this._groupId}-label`;

  // ─── Slot Handlers ───

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleHelpSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasHelpSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedNodes().length > 0;
  }

  /**
   * Handle for the shared IDREF observer. See `installAriaIdrefMirror()`.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Deferred copy of `error` driven through reactive state so the persistent
   * live region can re-announce on transitions without direct DOM mutation.
   * Codex round-1 finding #10.
   * @internal
   */
  @state() private _announcedError = '';

  /**
   * Last value of `aria-labelledby` we wrote to the host. Used to distinguish
   * external (consumer) attribute mutations from our own internal augmentation
   * writes when refreshing the host-attribute fallback. Codex round-10 P2:
   * without this guard, an internal mutation observer fire would re-read the
   * already-augmented host attribute as if it were consumer-supplied, causing
   * legend/help/error ids to leak forward as "consumer tokens" forever.
   * @internal
   */
  private _lastWrittenLabelledBy: string | null = null;
  /** @internal — see `_lastWrittenLabelledBy`. */
  private _lastWrittenDescribedBy: string | null = null;
  /**
   * Most recently observed *consumer-supplied* `aria-labelledby` baseline (the
   * set of tokens the consumer themselves wrote on the host). Refreshed only
   * when the host attribute changes via an external write — internal writes
   * leave the baseline untouched.
   * @internal
   */
  private _consumerLabelledBy: string | null = null;
  /** @internal — see `_consumerLabelledBy`. */
  private _consumerDescribedBy: string | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Detect IDL element-references API support so render() can branch the
    // fieldset between presentational (modern) and group-with-aria
    // (fallback) treatments. Codex round-17 P1.
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    this.addEventListener('hx-change', this._handleCheckboxChange);
    // Seed root-independent semantics from connect.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
    // Codex round-10 P2: re-apply child suppression on reattach. On the first
    // mount `firstUpdated()` runs `_syncCheckboxNames()` later, but when the
    // same group node is detached and re-inserted (with the same children
    // already in place), `firstUpdated()` does NOT re-fire. Without this,
    // `disconnectedCallback()`'s suppression-clearing leaves children
    // form-active alongside the group on the next attach, which reintroduces
    // the duplicate-submission bug the round-1 fix eliminated.
    if (this._getCheckboxes().length > 0) {
      this._syncCheckboxNames();
      this._previousChildren = this._getCheckboxes();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-change', this._handleCheckboxChange);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    // Release suppression on every previously-tracked child so they regain
    // stand-alone form participation if re-parented or kept in the document
    // after the group is removed. Codex round-3 finding #1.
    this._previousChildren.forEach((cb) => {
      if (this._suppressedChildren.has(cb)) {
        cb._groupedSuppress = false;
        this._suppressedChildren.delete(cb);
      }
    });
    this._previousChildren = [];
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('disabled')) {
      this._syncCheckboxes();
    }
    if (changedProperties.has('name')) {
      this._syncCheckboxNames();
    }
    // Host-elevated ARIA semantics — see _syncHostAriaSemantics.
    this._syncHostAriaSemantics();
    // Codex round-1 finding #10: drive re-announcement from reactive state
    // so the persistent live region stays in the shadow tree across error
    // transitions. The previous direct `errorEl.textContent =` mutation
    // deleted the slot subtree the renderer just produced.
    if (changedProperties.has('error')) {
      const previousError = changedProperties.get('error') as string;
      if (previousError && this.error) {
        this._announcedError = '';
        requestAnimationFrame(() => {
          this._announcedError = this.error;
        });
      } else {
        this._announcedError = this.error;
      }
    }
  }

  /**
   * Mirrors group semantics onto the host via ElementInternals so that
   * consumer-supplied `aria-label`, `aria-labelledby`, and `aria-describedby`
   * on `<hx-checkbox-group>` reach the announced control. Without host-level
   * semantics, the announced node is the shadow `<fieldset>`, which is
   * unreachable from light-DOM IDREFs.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    internals.role = 'group';
    internals.ariaRequired = this.required ? 'true' : 'false';
    internals.ariaInvalid = !internals.validity.valid ? 'true' : 'false';
    internals.ariaDisabled = this.disabled ? 'true' : 'false';

    // Prefer consumer-supplied host aria-label; fall back to the visible legend
    // text (label property or label slot) so the host always carries an
    // accessible name.
    //
    // Codex round-7 #0: on the no-IDL-ref fallback path the slotted legend
    // is the only source of an accessible name (the IDREF branch wires it via
    // `ariaLabelledByElements`, which is unavailable here). Read the rendered
    // legend's `textContent` so a `<slot name="label">` payload contributes to
    // `internals.ariaLabel` — without this, fallback browsers leave the host
    // unnamed when only the slot supplies the legend.
    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const internalLegendText =
      this.shadowRoot?.getElementById(this._labelId)?.textContent?.trim() || this.label || null;
    if (hostAriaLabel) {
      internals.ariaLabel = hostAriaLabel;
    } else if (!this.getAttribute('aria-labelledby')) {
      internals.ariaLabel = internalLegendText;
    } else {
      internals.ariaLabel = null;
    }

    // Codex round-10 P2: refresh the consumer baseline only when the host
    // attribute moved due to an *external* write. Compare the live attribute
    // against our last-written snapshot — if it differs, the consumer wrote.
    const liveLabelledBy = this.getAttribute('aria-labelledby');
    if (liveLabelledBy !== this._lastWrittenLabelledBy) {
      this._consumerLabelledBy = liveLabelledBy;
    }
    const liveDescribedBy = this.getAttribute('aria-describedby');
    if (liveDescribedBy !== this._lastWrittenDescribedBy) {
      this._consumerDescribedBy = liveDescribedBy;
    }
    const externalLabelTokens = this._consumerLabelledBy;
    const externalDescTokens = this._consumerDescribedBy;

    // Resolve the candidate label/desc element references once — both render
    // branches (modern IDL-ref and host-attribute fallback) consume the same
    // collections; the IDL-ref branch assigns them as `Element[]`, the
    // fallback mirrors their `id` tokens onto the host's `aria-*` attributes.
    const labelEls = resolveIdrefTokens(this, externalLabelTokens);
    const internalLegend = this.shadowRoot?.getElementById(this._labelId);
    if (
      labelEls.length === 0 &&
      !hostAriaLabel &&
      (this.label || this._hasLabelSlot) &&
      internalLegend
    ) {
      labelEls.push(internalLegend);
    }

    const descEls = resolveIdrefTokens(this, externalDescTokens);
    const helpEl = this.shadowRoot?.getElementById(this._helpTextId);
    const errorEl = this.shadowRoot?.getElementById(this._errorId);
    const hasError = !!(this.error || this._hasErrorSlot);
    // Codex round-15 P2: drop help text from the describedby chain while an
    // error is active. The render path hides the help wrapper in that state
    // (`?hidden=${!hasHelp || hasError}`); appending the hidden node to host
    // semantics would make AT announce stale guidance ahead of the
    // validation error. Mirrors the hx-switch and hx-checkbox treatment.
    if (helpEl && !hasError && (this.helpText || this._hasHelpSlot)) {
      descEls.push(helpEl);
    }
    if (errorEl && hasError) {
      descEls.push(errorEl);
    }

    // Branch off the cached `_supportsIdrefRefs` (seeded at connect by the
    // platform probe) so tests can force the fallback branch by flipping the
    // flag. TODO(codex round-19 follow-up): re-probe on `adoptedCallback` if
    // we ever support cross-document moves; today the cached value is set
    // once at connect.
    if (this._supportsIdrefRefs) {
      type InternalsWithRefs = ElementInternals & {
        ariaLabelledByElements: Element[] | null;
        ariaDescribedByElements: Element[] | null;
      };
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = labelEls.length > 0 ? labelEls : null;
      refsInternals.ariaDescribedByElements = descEls.length > 0 ? descEls : null;
    } else {
      // ─── No-IDL-ref fallback (codex round-19 P1) ───
      // The IDL element-references API is unavailable, so internal shadow
      // help/error/legend wrappers cannot be projected onto the host
      // accessibility node via `internals.aria*Elements`.
      //
      // Codex round-19 P1: keep the host as the canonical accessible-container
      // surface on BOTH modern and fallback paths. Earlier rounds promoted the
      // inner fieldset to `role="group"` here and tried to splice consumer
      // light-DOM ids together with shadow-internal ids on the fieldset's
      // `aria-labelledby` / `aria-describedby`. That created two nested
      // accessible containers (host group → inner group → controls) AND the
      // spliced shadow IDREFs could never resolve to consumer light-DOM
      // targets, so the inner fieldset's "external label" was silently broken.
      //
      // The correct trade-off on legacy engines (notably Firefox today): the
      // host owns the role + ARIA strings (via `internals.role`,
      // `internals.ariaLabel`, and the host attribute mirror below); we accept
      // a documented loss of *internal* legend/help/error references and rely
      // on consumer-supplied light-DOM tokens, which resolve correctly in the
      // host's containing root. The inner fieldset stays presentational on
      // both paths so AT announces a single accessible container.
      const consumerLabelIds = new Set((externalLabelTokens?.split(/\s+/) ?? []).filter(Boolean));
      const consumerDescIds = new Set((externalDescTokens?.split(/\s+/) ?? []).filter(Boolean));

      // Host attributes: ONLY consumer tokens (never shadow-internal ids —
      // those cannot resolve across the shadow boundary). Restore the
      // consumer baseline on the host so its accessible-name computation in
      // the light DOM resolves the labels the consumer wired up. If the
      // consumer supplied nothing, clear any stale mirror we may have
      // written in a prior round.
      const hostLabel = [...consumerLabelIds].filter(Boolean).join(' ') || '';
      const liveLabel = this.getAttribute('aria-labelledby');
      if (hostLabel) {
        if (liveLabel !== hostLabel) {
          this.setAttribute('aria-labelledby', hostLabel);
        }
        this._lastWrittenLabelledBy = hostLabel;
      } else if (liveLabel !== null && this._lastWrittenLabelledBy !== null) {
        // Only clear when the previous value was something *we* wrote;
        // never clobber a consumer-supplied attribute that arrived between
        // syncs.
        this.removeAttribute('aria-labelledby');
        this._lastWrittenLabelledBy = null;
      }

      const hostDesc = [...consumerDescIds].filter(Boolean).join(' ') || '';
      const liveDesc = this.getAttribute('aria-describedby');
      if (hostDesc) {
        if (liveDesc !== hostDesc) {
          this.setAttribute('aria-describedby', hostDesc);
        }
        this._lastWrittenDescribedBy = hostDesc;
      } else if (liveDesc !== null && this._lastWrittenDescribedBy !== null) {
        this.removeAttribute('aria-describedby');
        this._lastWrittenDescribedBy = null;
      }
    }
  }

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);
    this._syncCheckboxes();
    this._syncCheckboxNames();
    this._previousChildren = this._getCheckboxes();
    const checkedValues = this._getCheckedValues();
    this._updateFormValue(checkedValues);
    this._updateValidity(checkedValues);
  }

  // ─── Checkbox Management ───

  /** @internal */
  private _getCheckboxes(): HelixCheckbox[] {
    return Array.from(this.children).filter((c): c is HelixCheckbox => c.tagName === 'HX-CHECKBOX');
  }

  /** @internal */
  private _getCheckedValues(): string[] {
    return this._getCheckboxes()
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);
  }

  /** @internal */
  private _syncCheckboxes(): void {
    const checkboxes = this._getCheckboxes();
    checkboxes.forEach((cb) => {
      cb.disabled = this.disabled;
    });
  }

  /**
   * Tracks the set of checkboxes most recently flagged with
   * `_groupedSuppress = true` so a child removed from the group can have its
   * suppression cleared and regain stand-alone form participation. Codex
   * round-3 finding #1.
   * @internal
   */
  private _suppressedChildren = new WeakSet<HelixCheckbox>();

  /**
   * Centralizes form participation on the group: when an `hx-checkbox` is
   * grouped, the group is the sole form participant. Without this, both the
   * group AND each child would call `setFormValue` for the same name, causing
   * every checked value to submit twice.
   *
   * Codex round-2 finding #1 used `cb.name = ''` as the suppression signal.
   * Codex round-3 finding #1 hardened that: a consumer (or framework binding)
   * that re-set `cb.name = 'foo'` after attach regained form participation
   * because the child's `name` setter re-armed `_updateFormValue()` while no
   * `slotchange` re-fired to re-null the name.
   *
   * The fix is a durable, name-independent kill switch — `_groupedSuppress` —
   * on each child. While the flag is set the child's `_updateFormValue()`
   * short-circuits to `setFormValue(null)` regardless of its `name` value.
   * Children removed from the group have the flag cleared so they regain
   * stand-alone form participation.
   * @internal
   */
  private _syncCheckboxNames(): void {
    const current = new Set(this._getCheckboxes());
    // Clear suppression on any previously-grouped child that has since been
    // removed from this group. WeakSet has no iterator, so we re-walk current
    // children plus track removals via the slotchange handler's "delta" — but
    // since WeakSet does not enumerate, we instead resolve via the child's
    // own state below: any child WITH the flag that is no longer a current
    // child must be cleared. To do that without enumeration we mark all
    // current children true here and rely on `_handleSlotChange` to clear
    // departed children explicitly via `_clearSuppressionForRemoved()`.
    current.forEach((cb) => {
      cb._groupedSuppress = true;
      this._suppressedChildren.add(cb);
    });
  }

  /**
   * Clears `_groupedSuppress` on any checkbox that was previously in this
   * group but has since been removed (re-parented or detached). Called from
   * `_handleSlotChange()` after `_syncCheckboxNames()` re-applies the flag
   * to current children.
   *
   * `previousChildren` is a snapshot captured before slot mutation; any child
   * in that set but not in the current set has left the group and must have
   * its suppression cleared so stand-alone use restores form participation.
   * @internal
   */
  private _clearSuppressionForRemoved(previousChildren: HelixCheckbox[]): void {
    const current = new Set(this._getCheckboxes());
    previousChildren.forEach((cb) => {
      if (!current.has(cb) && this._suppressedChildren.has(cb)) {
        cb._groupedSuppress = false;
        this._suppressedChildren.delete(cb);
      }
    });
  }

  /**
   * Snapshot of children captured before each `slotchange` so removed children
   * can be detected (WeakSet is non-enumerable).
   * @internal
   */
  private _previousChildren: HelixCheckbox[] = [];

  // ─── Event Handling ───

  /** @internal */
  private _handleCheckboxChange = (e: Event): void => {
    // Only intercept events from direct hx-checkbox children — do not re-intercept
    // the hx-change we dispatch ourselves from this element.
    if (e.target === this) return;

    e.stopImmediatePropagation();

    const values = this._getCheckedValues();
    this._updateFormValue(values);
    this._updateValidity(values);
    this._handleInteractionInput();

    /**
     * Dispatched when any child checkbox changes.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent<{ values: string[] }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { values },
      }),
    );
  };

  /** @internal */
  private _handleSlotChange(): void {
    this._syncCheckboxes();
    // Capture pre-mutation snapshot from the previous _previousChildren cache
    // (the previous slot pass) so removed children can be released from
    // suppression. Then refresh the snapshot for the next slotchange.
    const previous = this._previousChildren;
    this._syncCheckboxNames();
    this._clearSuppressionForRemoved(previous);
    this._previousChildren = this._getCheckboxes();
    const checkedValues = this._getCheckedValues();
    this._updateFormValue(checkedValues);
    this._updateValidity(checkedValues);
  }

  // ─── Form Integration ───

  /** @internal */
  private _updateFormValue(values: string[]): void {
    if (values.length === 0) {
      this._internals.setFormValue(null);
      return;
    }
    const formData = new FormData();
    values.forEach((v) => formData.append(this.name, v));
    this._internals.setFormValue(formData);
  }

  /** @internal */
  override _updateValidity(values?: string[]): void {
    const checkedValues = values ?? this._getCheckedValues();
    if (this.required && checkedValues.length === 0) {
      const firstCheckbox = this._getCheckboxes()[0];
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select at least one option.',
        firstCheckbox,
      );
    } else {
      this._internals.setValidity({});
    }
    // Codex round-1 finding #6: re-sync host ARIA after every setValidity().
    this._syncHostAriaSemantics();
  }

  /** @internal */
  protected override _onFormReset(): void {
    const checkboxes = this._getCheckboxes();
    checkboxes.forEach((cb) => {
      cb.checked = false;
    });
    this._internals.setFormValue(null);
    this._updateValidity([]);
    this._resetInteractionState();
  }

  /** @internal */
  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (!(state instanceof FormData)) return;
    const restoredValues = state.getAll(this.name).map((v) => String(v));
    const checkboxes = this._getCheckboxes();
    checkboxes.forEach((cb) => {
      cb.checked = restoredValues.includes(cb.value);
    });
    this._updateFormValue(restoredValues);
    this._updateValidity(restoredValues);
  }

  /** @internal */
  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const hasHelp = !!this.helpText || this._hasHelpSlot;

    const fieldsetClasses = {
      fieldset: true,
      'fieldset--error': hasError,
      'fieldset--disabled': this.disabled,
      'fieldset--required': this.required,
    };

    // Codex round-19 P1: inner fieldset is presentational on BOTH the modern
    // and no-IDL-ref fallback paths so AT announces exactly one accessible
    // container (the host). Earlier rounds promoted the fieldset to
    // `role="group"` on the fallback branch and spliced shadow-internal ids
    // into its aria-* attributes; that produced nested host→fieldset groups
    // and broke external IDREFs (shadow ids cannot resolve across the
    // boundary). The host carries the role + accessible name via
    // ElementInternals on both paths.
    return html`
      <fieldset part="group" class=${classMap(fieldsetClasses)} role="presentation">
        <legend part="label" class="fieldset__legend" id=${this._labelId}>
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>${this.label}</slot>
          ${this.required
            ? html`<span class="fieldset__required-marker" aria-hidden="true">*</span>`
            : nothing}
        </legend>

        <div class="fieldset__items">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>

        <!--
          Persistent live region. role="alert" is set from first paint so
          assistive tech tracks a stable element across error transitions;
          the content updates rather than the container being replaced.
        -->
        <div
          part="error"
          class="fieldset__error"
          id=${this._errorId}
          role="alert"
          ?hidden=${!hasError}
        >
          <slot name="error" @slotchange=${this._handleErrorSlotChange}
            >${this._announcedError}</slot
          >
        </div>

        <!--
          Persistent help-text wrapper, hidden when error overrides so guidance
          does not compete with validation feedback. Always in the shadow tree
          so the host's aria-describedby chain is stable.
        -->
        <div
          part="help-text"
          class="fieldset__help-text"
          id=${this._helpTextId}
          ?hidden=${!hasHelp || hasError}
        >
          <slot name="help-text" @slotchange=${this._handleHelpSlotChange}>${this.helpText}</slot>
        </div>
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-checkbox-group': HelixCheckboxGroup;
  }
}
