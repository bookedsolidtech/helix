import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { devWarn } from '../../utils/dev-warn.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixRadioGroupStyles } from './hx-radio-group.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import type { HelixRadio } from './hx-radio.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

const _nextRadioGroupId = createIdCounter('hx-radio-group');

/**
 * Reads visible text from a shadow wrapper that contains a `<slot>`. Prefers
 * the slot's flattened assigned-nodes text when light DOM is projected,
 * otherwise falls back to the wrapper's own `textContent` (so property-driven
 * fallback content rendered inside the slot is still readable). Codex
 * round-23 P2 (Finding C): a wrapper-element `textContent` read does NOT
 * cross the shadow → light-DOM slot boundary, so the previous direct
 * `textContent` mirror returned empty when a consumer slotted help/error
 * content instead of using the property.
 */
function readSlottedOrShadowText(wrapper: Element): string {
  const slot = wrapper.querySelector('slot');
  if (slot) {
    const assigned = (slot as HTMLSlotElement).assignedNodes({ flatten: true });
    if (assigned.length > 0) {
      return assigned
        .map((node) => node.textContent ?? '')
        .join('')
        .trim();
    }
  }
  return (wrapper.textContent ?? '').trim();
}

/** Detail for the hx-change event dispatched by hx-radio-group. */
export interface HxRadioGroupChangeDetail {
  value: string;
  checked: boolean;
}

/**
 * A form-associated radio group that manages a set of `<hx-radio>` children.
 *
 * @summary Form-associated radio group with label, validation, help text, and keyboard navigation.
 *
 * @tag hx-radio-group
 *
 * @slot - `<hx-radio>` elements.
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{value: string, checked: boolean}>} hx-change - Dispatched when the selected radio changes.
 * @fires {CustomEvent<{value: string}>} hx-radio-select - Internal event dispatched by `hx-radio` when selected; consumed by the group.
 *
 * @csspart fieldset - The fieldset wrapper.
 * @csspart legend - The legend/label.
 * @csspart group - The container for radio items.
 * @csspart error - The error message.
 * @csspart help-text - The help text.
 *
 * @cssprop [--hx-radio-group-gap=var(--hx-space-3, 0.75rem)] - Gap between radio items.
 * @cssprop [--hx-radio-group-label-color=var(--hx-color-neutral-700, #313E4B)] - Label text color.
 * @cssprop [--hx-radio-group-error-color=var(--hx-color-error-500, #E5493E)] - Error message color.
 * @cssprop [--hx-radio-group-help-text-color=var(--hx-color-neutral-500, #66787B)] - Help text color.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-radio-group-font-family=var(--hx-font-family-sans)] - CSS custom property.
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
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-radio-group/AAA-AUDIT.md
 * @keyboard-contract navigate=Arrow; activate=Space; disabled-suppresses=true
 * @aria-pattern radiogroup
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated true
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-radio-group
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */
@customElement('hx-radio-group')
export class HelixRadioGroup extends FormMixin(HelixElement) {
  static override styles = [helixRadioGroupStyles, forcedColorsField];

  // ─── Form Association ───

  /**
   * Enables ElementInternals form association for this component.
   * @internal
   */
  static override formAssociated = true;

  // ─── Properties ───

  /**
   * The selected radio's value.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * The name used for form submission.
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
   * Whether a selection is required for form submission.
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
   * Help text displayed below the group for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Layout orientation of the radio items.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'vertical' | 'horizontal' = 'vertical';

  /**
   * Queries the rendered group container element within the shadow root.
   * @internal
   */
  private get _groupEl(): HTMLElement | null {
    return this.renderRoot?.querySelector('.fieldset__group') ?? null;
  }

  /**
   * Tracks whether the error slot has assigned content.
   * @internal
   */
  @state() private _hasErrorSlot = false;

  /**
   * Tracks whether the help-text slot has assigned content.
   * @internal
   */
  @state() private _hasHelpSlot = false;

  /**
   * Whether the platform supports IDL element references on `ElementInternals`.
   * Drives the render-time branch between modern (host-canonical via
   * internals) and fallback (inner fieldset is the announced surface).
   * Codex round-17 P1.
   * @internal
   */
  @state() private _supportsIdrefRefs = true;

  // ─── Internal IDs ───

  /**
   * Unique identifier for this radio group instance used in ARIA attributes.
   * @internal
   */
  private _groupId = _nextRadioGroupId();
  /**
   * Unique identifier for the help text element, used in aria-describedby.
   * @internal
   */
  private _helpTextId = `${this._groupId}-help`;
  /**
   * Unique identifier for the error element, used in aria-describedby.
   * @internal
   */
  private _errorId = `${this._groupId}-error`;

  // ─── Slot Handlers ───

  /**
   * Handles slotchange events on the error slot to detect assigned content.
   * @internal
   */
  private _handleErrorSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    this._hasErrorSlot = e.target.assignedNodes({ flatten: true }).length > 0;
    // Codex round-23 P2 (Finding C): re-tune the in-place text observer over
    // the new assigned-node set so in-place `textContent` rewrites of slotted
    // error nodes resync `internals.ariaDescription` on the no-IDL-ref
    // fallback path. `slotchange` only fires when the *node set* changes;
    // mutating an already-assigned node's text does not, so a separate
    // observer is required. Mirrors the round-21 P3 label-slot observer in
    // hx-checkbox-group.
    this._installErrorSlotTextObserver(e.target);
    this._syncHostAriaSemantics();
  }

  /**
   * Handles slotchange events on the help-text slot to detect assigned content.
   * Codex aria-group-2 finding: slot-only help text was not contributing to
   * `aria-describedby` because the wrapper was conditionally rendered on the
   * `helpText` property alone.
   * @internal
   */
  private _handleHelpSlotChange(e: Event): void {
    if (!(e.target instanceof HTMLSlotElement)) return;
    this._hasHelpSlot = e.target.assignedNodes({ flatten: true }).length > 0;
    // Codex round-23 P2 (Finding C): same pattern as the error slot — keep
    // `internals.ariaDescription` in sync with in-place text edits on already
    // assigned help-text nodes.
    this._installHelpSlotTextObserver(e.target);
    this._syncHostAriaSemantics();
  }

  /**
   * Watches assigned `<slot name="help-text">` nodes for in-place text
   * mutations so the no-IDL-ref fallback `internals.ariaDescription` stays in
   * sync when a framework rewrites `textContent` of an already-assigned node
   * without replacing it. `slotchange` does NOT fire for those mutations, so
   * a separate observer is required. Codex round-23 P2 (Finding C).
   * @internal
   */
  private _helpSlotTextObserver: MutationObserver | null = null;

  /**
   * Watches assigned `<slot name="error">` nodes for in-place text mutations
   * so the no-IDL-ref fallback `internals.ariaDescription` stays in sync when
   * a framework rewrites `textContent` of an already-assigned node without
   * replacing it. Codex round-23 P2 (Finding C).
   * @internal
   */
  private _errorSlotTextObserver: MutationObserver | null = null;

  /**
   * (Re-)installs the mutation observer over the current set of assigned
   * help-text-slot nodes. Codex round-23 P2 (Finding C).
   * @internal
   */
  private _installHelpSlotTextObserver(slot: HTMLSlotElement | null): void {
    this._helpSlotTextObserver?.disconnect();
    if (!slot) {
      this._helpSlotTextObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      this._syncHostAriaSemantics();
    });
    slot.assignedNodes().forEach((node) => {
      observer.observe(node, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    });
    this._helpSlotTextObserver = observer;
  }

  /**
   * (Re-)installs the mutation observer over the current set of assigned
   * error-slot nodes. Codex round-23 P2 (Finding C).
   * @internal
   */
  private _installErrorSlotTextObserver(slot: HTMLSlotElement | null): void {
    this._errorSlotTextObserver?.disconnect();
    if (!slot) {
      this._errorSlotTextObserver = null;
      return;
    }
    const observer = new MutationObserver(() => {
      this._syncHostAriaSemantics();
    });
    slot.assignedNodes().forEach((node) => {
      observer.observe(node, {
        characterData: true,
        childList: true,
        subtree: true,
      });
    });
    this._errorSlotTextObserver = observer;
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
   * Tracks group-suppressed child radios so detached children can have the
   * flag cleared. Defense-in-depth symmetry with `hx-checkbox-group` —
   * `hx-radio` is not form-associated today, so the flag is inert, but the
   * parity keeps the contract identical between the two group/child families
   * for any future form-association on `hx-radio`. Codex round-3 finding #1.
   * @internal
   */
  private _suppressedChildren = new WeakSet<HelixRadio>();

  /**
   * Snapshot of children captured before each `slotchange` so removed
   * children can be released from suppression (WeakSet is non-enumerable).
   * @internal
   */
  private _previousRadios: HelixRadio[] = [];

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
    // Codex round-17 P1: detect IDL element-references API support so
    // render() can branch the fieldset between presentational (modern) and
    // group-with-aria (fallback) treatments.
    this._supportsIdrefRefs = supportsIdrefElementReferences(this._internals);
    this.addEventListener('hx-radio-select', this._handleRadioSelect);
    this.addEventListener('keydown', this._handleKeydown);
    // Seed root-independent semantics from connect so the host announces the
    // radiogroup role before first paint.
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
    // Codex round-10 P2 (parity with hx-checkbox-group): re-apply child
    // suppression on reattach so a detached-then-reinserted group with the
    // same `<hx-radio>` children still claims them. `_groupedSuppress` is
    // currently inert on `hx-radio`, but the lifecycle parity keeps the
    // contract identical for any future form-association on the radio child.
    const existing = this._getRadios();
    if (existing.length > 0) {
      existing.forEach((radio) => {
        radio._groupedSuppress = true;
        this._suppressedChildren.add(radio);
      });
      this._previousRadios = existing;
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-radio-select', this._handleRadioSelect);
    this.removeEventListener('keydown', this._handleKeydown);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    // Codex round-7 finding #6: tear down the per-child disabled observer so
    // detached radios don't keep a strong reference back into a group whose
    // host is being torn down.
    this._childDisabledObserver?.disconnect();
    this._childDisabledObserver = null;
    // Codex round-23 P2 (Finding C): tear down the help/error slot text
    // observers so detached assigned nodes stop firing into a torn-down host.
    this._helpSlotTextObserver?.disconnect();
    this._helpSlotTextObserver = null;
    this._errorSlotTextObserver?.disconnect();
    this._errorSlotTextObserver = null;
    // Release suppression on every previously-tracked child so they regain
    // stand-alone behaviour if re-parented or kept in the document after the
    // group is removed. Codex round-3 finding #1 (defense-in-depth).
    this._previousRadios.forEach((radio) => {
      if (this._suppressedChildren.has(radio)) {
        radio._groupedSuppress = false;
        this._suppressedChildren.delete(radio);
      }
    });
    this._previousRadios = [];
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value || null);
      this._syncRadios();
    }
    if (changedProperties.has('disabled')) {
      this._syncRadios();
    }
    // Host-elevated ARIA semantics — see _syncHostAriaSemantics.
    this._syncHostAriaSemantics();
    // Codex round-1 finding #10: drive re-announcement from reactive state
    // so the persistent live region stays in the shadow tree across error
    // transitions. Direct `textContent` mutation would delete the slot
    // subtree the renderer just produced.
    if (changedProperties.has('error')) {
      const previousError = changedProperties.get('error') as string;
      if (previousError && this.error) {
        // Error→error: clear then re-set after rAF so AT re-announces.
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
   * Mirrors radiogroup semantics onto the host via ElementInternals so that
   * consumer-supplied `aria-label`, `aria-labelledby`, and `aria-describedby`
   * on `<hx-radio-group>` reach the announced control. The codex aria-group-2
   * finding identified that the inner `<fieldset>` was the announced node and
   * the host's external IDREF tokens could not cross the shadow boundary.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    internals.role = 'radiogroup';
    internals.ariaRequired = this.required ? 'true' : 'false';
    internals.ariaInvalid = !internals.validity.valid ? 'true' : 'false';
    internals.ariaDisabled = this.disabled ? 'true' : 'false';
    internals.ariaOrientation = this.orientation === 'horizontal' ? 'horizontal' : 'vertical';

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';

    // Resolve the candidate label/desc element references once — the IDL-ref
    // path consumes them as `Element[]`, the fallback path mirrors their `id`
    // tokens onto the host's `aria-labelledby` / `aria-describedby` attributes
    // so that AT can still locate the shadow help/error wrappers via the
    // stable shadow-internal ids.
    const internalLegend = this.shadowRoot?.getElementById(`${this._groupId}-legend`);
    const helpEl = this.shadowRoot?.getElementById(this._helpTextId);
    const errorEl = this.shadowRoot?.getElementById(this._errorId);

    // Codex round-10 P2: refresh the consumer baseline only when the host
    // attribute moved due to an *external* write. Compare the live attribute
    // against our last-written snapshot — if it differs, the consumer wrote.
    // This prevents internally-augmented values (containing legend/help/error
    // ids we appended) from being re-read as if they were consumer tokens.
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

    const labelEls = resolveIdrefTokens(this, externalLabelTokens);
    // Codex round-35 finding (CR major + codex follow-up): `aria-labelledby`
    // is only "effective" when at least one IDREF resolves. A typo or
    // transiently-missing target must NOT erase the visible label — fall back
    // to `label` so the radiogroup keeps a name on both paths.
    const hasEffectiveLabelledBy = labelEls.length > 0;
    if (hostAriaLabel) {
      internals.ariaLabel = hostAriaLabel;
    } else if (!hasEffectiveLabelledBy) {
      internals.ariaLabel = this.label || null;
    } else {
      internals.ariaLabel = null;
    }
    if (labelEls.length === 0 && !hostAriaLabel && this.label && internalLegend) {
      labelEls.push(internalLegend);
    }

    const descEls = resolveIdrefTokens(this, externalDescTokens);
    const hasError = !!(this.error || this._hasErrorSlot);
    // Codex round-16 P2: drop help text from the describedby chain while an
    // error is active. The render path hides the help wrapper in that state
    // (`?hidden=${!hasHelp || hasError}`); appending the hidden node to host
    // semantics would have AT announce stale guidance ahead of the
    // validation error. Mirrors hx-checkbox-group, hx-switch, hx-checkbox.
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
      // Clear any stale fallback `ariaDescription` string in case a prior sync
      // ran on the fallback path (e.g. tests flipping `_supportsIdrefRefs`).
      // The modern path uses element references exclusively; coexisting strings
      // would cause AT to announce the description twice.
      internals.ariaDescription = null;
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
      // accessible containers (host radiogroup → inner group → controls) AND
      // the spliced shadow IDREFs could never resolve to consumer light-DOM
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
      // those cannot resolve across the shadow boundary).
      //
      // Codex round-35 (medium): mirror consumer tokens to the host attribute
      // ONLY when at least one token resolves to a real element. A broken
      // `aria-labelledby` (typo, target not yet attached) would otherwise
      // erase the accessible name on legacy engines per ARIA priority
      // (aria-labelledby > aria-label > internals.ariaLabel). When tokens
      // don't resolve, clear the host attribute so the `internals.ariaLabel`
      // fallback the modern path set above (`this.label`) wins.
      const hostLabel = hasEffectiveLabelledBy
        ? [...consumerLabelIds].filter(Boolean).join(' ')
        : '';
      const liveLabel = this.getAttribute('aria-labelledby');
      if (hostLabel) {
        if (liveLabel !== hostLabel) {
          this.setAttribute('aria-labelledby', hostLabel);
        }
        this._lastWrittenLabelledBy = hostLabel;
      } else if (liveLabel !== null) {
        // Codex round-36 (medium): when consumer-supplied tokens don't
        // resolve (`!hasEffectiveLabelledBy`), actively clear the host
        // attribute even if WE didn't write it. Per ARIA priority
        // (aria-labelledby > aria-label > internals.ariaLabel), a broken
        // consumer-authored attribute on the announced surface erases the
        // legend on legacy engines. The original tokens remain cached in
        // `_consumerLabelledBy` so they replay on a future sync if the
        // target later attaches and `hasEffectiveLabelledBy` flips back to
        // true.
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

      // Codex round-22 P1 #2: on the no-IDL-ref fallback path, consumer-supplied
      // describedby tokens reach the host (above) but the *internal* shadow
      // help/error wrappers cannot be referenced from light-DOM IDREFs. Mirror
      // their `textContent` into `internals.ariaDescription` so the host's
      // accessible description still surfaces the live help/error strings on
      // legacy engines (Firefox today). The string-form description hook is
      // independent of element references and survives the shadow boundary.
      // Empty strings are normalized to `null` so AT does not announce an
      // empty description.
      // Codex round-23 P2 (Finding C): use a slot-aware text read so slotted
      // help/error content surfaces into `internals.ariaDescription` —
      // wrapper `textContent` does NOT cross the shadow → light-DOM slot
      // boundary. The new help/error slot text observers (above) keep this
      // in sync when a framework rewrites the slotted node's textContent in
      // place.
      const helpText =
        helpEl && !hasError && (this.helpText || this._hasHelpSlot)
          ? readSlottedOrShadowText(helpEl)
          : '';
      const errorText = errorEl && hasError ? readSlottedOrShadowText(errorEl) : '';
      const internalDescriptionText = [helpText, errorText].filter(Boolean).join(' ');
      internals.ariaDescription = internalDescriptionText || null;
    }
  }

  override firstUpdated(changedProperties: PropertyValues<this>): void {
    super.firstUpdated(changedProperties);
    this._syncRadios();
    this._previousRadios = this._getRadios();
    // Codex round-7 finding #6: observe in-place `disabled` mutations on the
    // initial child set. The slotchange handler refreshes this on every slot
    // pass, but firstUpdated covers the case where the initial children are
    // never re-slotted (e.g. static markup mounted once).
    this._installChildDisabledObservers();
    // WCAG 4.1.2: warn when no accessible name is available for the radio group.
    // The fieldset needs either a label prop (rendered as <legend>) or an aria-label
    // attribute on the host element so screen readers can identify the group.
    if (!this.label && !this.getAttribute('aria-label')) {
      devWarn(
        'hx-radio-group',
        'No accessible label provided. Set the `label` attribute or add `aria-label` to the host element. An unlabeled radio group violates WCAG 2.1 AA (4.1.2 Name, Role, Value).',
      );
    }
  }

  // ─── Radio Management ───

  /**
   * Cached list of child hx-radio elements; invalidated on slot change.
   * @internal
   */
  private _cachedRadios: HelixRadio[] | null = null;
  /**
   * Stores each radio's individual disabled state before group-level disabling overrides it.
   * @internal
   */
  private _individualDisabledStates = new WeakMap<HelixRadio, boolean>();

  /**
   * Returns all child hx-radio elements, using the cache when available.
   * @internal
   */
  private _getRadios(): HelixRadio[] {
    if (!this._cachedRadios) {
      this._cachedRadios = Array.from(this.querySelectorAll('hx-radio')) as HelixRadio[];
    }
    return this._cachedRadios;
  }

  /**
   * Returns only the child hx-radio elements that are not disabled.
   * @internal
   */
  private _getEnabledRadios(): HelixRadio[] {
    return this._getRadios().filter((radio) => !radio.disabled && !this.disabled);
  }

  /**
   * Synchronizes checked state, disabled state, and roving tabindex across all child radios.
   * @internal
   */
  private _syncRadios(): void {
    const radios = this._getRadios();
    const enabledRadios = this._getEnabledRadios();

    radios.forEach((radio) => {
      // Codex round-3 finding #1 (defense-in-depth symmetry with hx-checkbox):
      // mark every group-managed child so any future form-association change
      // on `hx-radio` is automatically suppressed inside the group. The flag
      // is currently inert on `hx-radio` (which is not form-associated).
      radio._groupedSuppress = true;
      this._suppressedChildren.add(radio);

      const isChecked = radio.value === this.value && this.value !== '';
      radio.checked = isChecked;

      if (this.disabled) {
        // Store individual disabled state before overriding with group disabled
        if (!this._individualDisabledStates.has(radio)) {
          this._individualDisabledStates.set(radio, radio.disabled);
        }
        radio.disabled = true;
      } else {
        // Restore individual disabled state when group is re-enabled
        const originalDisabled = this._individualDisabledStates.get(radio);
        if (originalDisabled !== undefined) {
          radio.disabled = originalDisabled;
          this._individualDisabledStates.delete(radio);
        }
      }
    });

    // Roving tabindex management
    const checkedRadio = enabledRadios.find((r) => r.checked);
    radios.forEach((radio) => {
      radio.tabIndex = -1;
    });

    if (checkedRadio) {
      checkedRadio.tabIndex = 0;
    } else if (enabledRadios.length > 0) {
      const firstRadio = enabledRadios[0];
      if (firstRadio) {
        firstRadio.tabIndex = 0;
      }
    }
  }

  // ─── Event Handling ───

  /**
   * Handles the internal hx-radio-select event to update the group's selected value.
   * @internal
   */
  private _handleRadioSelect = (e: Event): void => {
    if (!(e instanceof CustomEvent)) return;
    e.stopPropagation();

    const newValue = (e.detail as { value: string }).value;
    if (newValue === this.value) {
      return;
    }

    this.value = newValue;
    this._handleInteractionInput();
    // Reactive update in updated() will call setFormValue, _syncRadios, _updateValidity

    /**
     * Dispatched when the selected radio changes.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent<{ value: string; checked: boolean }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, checked: true },
      }),
    );
  };

  /**
   * Handles keyboard navigation (arrow keys, Home, End, Space) within the radio group.
   * @internal
   */
  private _handleKeydown = (e: KeyboardEvent): void => {
    const enabledRadios = this._getEnabledRadios();
    if (enabledRadios.length === 0) {
      return;
    }

    const isHandledKey = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      ' ',
      'Home',
      'End',
    ].includes(e.key);
    if (!isHandledKey) {
      return;
    }

    e.preventDefault();

    // Space: select the currently focused radio without moving focus
    if (e.key === ' ') {
      const targetRadio = (e.target as Element)?.closest?.('hx-radio') as HelixRadio | null;
      if (targetRadio && !targetRadio.disabled) {
        targetRadio.dispatchEvent(
          new CustomEvent<{ value: string }>('hx-radio-select', {
            bubbles: true,
            composed: true,
            detail: { value: targetRadio.value },
          }),
        );
      }
      return;
    }

    const targetRadio = (e.target as Element)?.closest?.('hx-radio') as HelixRadio | null;
    const currentIndex = targetRadio
      ? enabledRadios.indexOf(targetRadio)
      : enabledRadios.findIndex((radio) => radio.checked);

    let nextIndex: number;
    if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = enabledRadios.length - 1;
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % enabledRadios.length;
    } else {
      nextIndex = currentIndex <= 0 ? enabledRadios.length - 1 : currentIndex - 1;
    }

    const nextRadio = enabledRadios[nextIndex];
    if (nextRadio) {
      nextRadio.focus();
      nextRadio.dispatchEvent(
        new CustomEvent<{ value: string }>('hx-radio-select', {
          bubbles: true,
          composed: true,
          detail: { value: nextRadio.value },
        }),
      );
    }
  };

  /**
   * Handles slotchange events on the default slot. Refreshes the cached
   * radio list, reconciles `value`/`setFormValue`/validity against the new
   * children, then re-tunes the per-child disabled observer so in-place
   * `radio.disabled = true` mutations trigger the same reconcile pass.
   *
   * Codex round-2 finding #3: previously this handler only invalidated the
   * cache and re-synced child state, so removing the currently-selected
   * radio (or disabling it, or adding a new `checked` radio) left
   * `this.value` and the submitted form value pointing at stale state and
   * `_updateValidity` was never re-run.
   *
   * Codex round-7 finding #6: an in-place `selectedRadio.disabled = true`
   * never re-entered this reconciler (the radio remained slotted), so the
   * group could keep submitting a disabled value and stay valid until some
   * unrelated slot mutation kicked things over. The per-child observer
   * installed at the end of this method re-runs the same reconcile logic on
   * every `disabled` attribute mutation.
   * @internal
   */
  private _handleSlotChange(): void {
    this._cachedRadios = null;
    this._reconcileChildren();
    this._installChildDisabledObservers();
  }

  /**
   * Per-child `disabled` attribute observer. Mirrors the slotchange
   * reconcile pipeline so an in-place `radio.disabled = true` collapses the
   * group's `value`/form participation/validity. Round-7 finding #6.
   *
   * One observer is shared across all currently-slotted radios; it is
   * disconnected and re-attached on every slotchange so children that have
   * left the group stop firing reconcile passes.
   * @internal
   */
  private _childDisabledObserver: MutationObserver | null = null;

  /**
   * Re-runs the slotchange reconcile pass without touching the disabled
   * observer wiring. Called from the slotchange handler and from the
   * per-child disabled observer; factored out so both entry points share
   * the same value/formValue/validity reconciliation path. Round-7 #6.
   * @internal
   */
  private _reconcileChildren(): void {
    // Snapshot of the previous slot pass so we can release `_groupedSuppress`
    // on any radio that has left this group. Codex round-3 finding #1
    // (defense-in-depth symmetry).
    const previous = this._previousRadios;

    // Reconcile against currently-slotted children BEFORE _syncRadios runs.
    // _syncRadios() unconditionally overwrites `radio.checked` from `this.value`,
    // which would clobber an externally-set `checked=true` on a newly-added
    // radio when the group's current value is empty. We therefore peek at the
    // raw children first to detect "pre-checked" adoption, then commit through
    // the normal sync pipeline.
    //
    // Codex round-12 P2: prefer a checked radio whose value differs from the
    // current group value — that is the "newly externally checked" candidate.
    // The naive `.find(r.checked && !r.disabled)` returned the first checked
    // radio in DOM order, which is typically the previously-selected one whose
    // value already matches `this.value`, so an appended `<hx-radio checked>`
    // with a different value would be rejected by the next `_syncRadios()`
    // pass. Falling back to "any checked radio" still handles the
    // empty-group / first-mount case.
    const candidates = this._getRadios().filter((r) => r.checked && !r.disabled);
    const externallyChecked = candidates.find((r) => r.value !== this.value) ?? candidates[0];
    if (externallyChecked && externallyChecked.value !== this.value) {
      this.value = externallyChecked.value;
    }

    this._syncRadios();

    // After sync, the group's `value` and the children's `checked` flags are
    // canonical. If the previously-selected radio was removed or disabled,
    // `selected` becomes undefined and `reconciled` collapses to '', clearing
    // form participation.
    //
    // Codex round-10 P1: when the group itself is disabled, every radio is
    // force-disabled by `_syncRadios`. The post-sync `selected` lookup excludes
    // disabled radios, so it would always collapse to '' and wipe the user's
    // selection across a disable→enable cycle. Group-level disable is a
    // visual/interaction lock — it must preserve `value` and form participation
    // (matching native `<fieldset disabled>` semantics where the form value is
    // simply omitted from submission while disabled). When `this.disabled` is
    // true we leave `value` and form state untouched; the next disabled→false
    // pass through `updated()` runs `_syncRadios` again, which restores each
    // radio's individual disabled flag and re-checks the matching value.
    if (this.disabled) {
      // Codex round-18 P2: even while disabled, if the previously-selected
      // radio has been *removed* from the DOM (vs merely disabled by the
      // group), `this.value` references a value that no slotted child
      // carries, so the group would resubmit a stale option after re-enable.
      // We must clear `value` in that case while still preserving selection
      // across pure disable→enable cycles where the radio still exists.
      // Detect "selected option still in DOM" by membership lookup on the
      // raw children, ignoring their disabled flag (since group-level
      // disable forces them all disabled by _syncRadios).
      const presentValues = this._getRadios().map((r) => r.value);
      if (this.value && !presentValues.includes(this.value)) {
        this.value = '';
      }
      // Validity reflects the (possibly-cleared) value; setFormValue is
      // omitted because a disabled control shouldn't contribute to form
      // submission.
      this._updateValidity();
    } else {
      const selected = this._getRadios().find((r) => r.checked && !r.disabled);
      const reconciled = selected?.value ?? '';
      if (reconciled !== this.value) {
        this.value = reconciled;
      }
      // Always re-run setFormValue + validity. `value` may be stable while
      // membership/disabled-state changed, and a freshly-adopted pre-checked
      // radio still needs its value pushed to the form.
      this._internals.setFormValue(this.value || null);
      this._updateValidity();
    }

    // Release suppression on any radio that left the group. Then refresh the
    // snapshot for the next slotchange. Codex round-3 finding #1.
    const current = new Set(this._getRadios());
    previous.forEach((radio) => {
      if (!current.has(radio) && this._suppressedChildren.has(radio)) {
        radio._groupedSuppress = false;
        this._suppressedChildren.delete(radio);
      }
    });
    this._previousRadios = this._getRadios();
  }

  /**
   * Installs (or re-installs) a single MutationObserver across the current
   * set of slotted `<hx-radio>` children, listening for `disabled` attribute
   * mutations. Round-7 finding #6: in-place `disabled = true` never reaches
   * the slotchange-driven reconciler otherwise.
   * @internal
   */
  private _installChildDisabledObservers(): void {
    this._childDisabledObserver?.disconnect();
    const radios = this._getRadios();
    if (radios.length === 0) {
      this._childDisabledObserver = null;
      return;
    }
    const observer = new MutationObserver((mutations) => {
      // Filter to disabled-attribute mutations only — the observer is scoped
      // to attributeFilter:['disabled'] but the callback still fires per
      // mutation record, so guard cheaply against noise.
      if (!mutations.some((m) => m.attributeName === 'disabled')) return;
      this._reconcileChildren();
    });
    radios.forEach((radio) => {
      observer.observe(radio, {
        attributes: true,
        attributeFilter: ['disabled'],
      });
    });
    this._childDisabledObserver = observer;
  }

  // ─── Form Integration ───

  /**
   * Updates the ElementInternals validity state based on the required constraint and current value.
   * @internal
   */
  override _updateValidity(): void {
    if (this.required && !this.value) {
      // Codex round-35 finding (CR major): anchor `setValidity()` to an actual
      // radio. The presentational `.fieldset__group` div is `role="none"` and
      // not focusable, so anchoring there leaves UA validation UI / error
      // recovery disconnected from the interactive surface.
      //
      // Codex round-35 follow-up (Low #4): drop the unconditional `radios[0]`
      // tier — a disabled radio is not focusable and cannot host UA validation
      // UI either. Prefer checked-enabled, then any enabled, then the
      // presentational group as a last resort (still better than `undefined`
      // because it pins UA error positioning to the visible group bounds).
      const anchor =
        this._getRadios().find((radio) => radio.checked && !radio.disabled) ??
        this._getEnabledRadios()[0] ??
        this._groupEl ??
        undefined;
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select an option.',
        anchor,
      );
    } else {
      this._internals.setValidity({});
    }
    // Codex round-1 finding #6: re-sync host ARIA after every setValidity().
    this._syncHostAriaSemantics();
  }

  /** @internal */
  protected override _onFormReset(): void {
    this.value = '';
    this._internals.setFormValue(null);
    this._syncRadios();
    this._resetInteractionState();
  }

  /** @internal */
  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  /** @internal */
  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const hasHelp = !!this.helpText || this._hasHelpSlot;
    const legendId = `${this._groupId}-legend`;

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
    // boundary). The host carries the radiogroup role via ElementInternals
    // on both paths.
    // axe rule `aria-allowed-attr` forbids aria-orientation on
    // role="presentation" — the host carries `ariaOrientation` via
    // ElementInternals (see _syncHostAriaSemantics), so the inner
    // fieldset must not duplicate it.
    return html`
      <fieldset part="fieldset" class=${classMap(fieldsetClasses)} role="presentation">
        ${this.label
          ? html`
              <legend part="legend" class="fieldset__legend" id=${legendId}>
                ${this.label}
                ${this.required
                  ? html`<span class="fieldset__required-marker" aria-hidden="true">*</span>`
                  : nothing}
              </legend>
            `
          : nothing}

        <div part="group" class="fieldset__group" role="none">
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>

        <!--
          Persistent error live region. role="alert" is set from first paint
          so the WAI-ARIA contract for live updates is honoured: content
          changes in place rather than the container being toggled.
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
          Persistent help-text container. Rendered whenever the property OR
          the slot has content; hidden when an error is present so guidance
          does not compete with validation feedback. Always in the shadow
          tree so the host's aria-describedby chain is stable.
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
    'hx-radio-group': HelixRadioGroup;
  }
}

/** Canonical type alias for the hx-radio-group component. */
export type HxRadioGroup = HelixRadioGroup;
