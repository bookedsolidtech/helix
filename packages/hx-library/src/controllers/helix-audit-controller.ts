/**
 * @module HelixAuditController
 *
 * A Lit ReactiveController that captures `hx-*` CustomEvents on the host
 * element and re-dispatches them as enriched `hx-audit` events that bubble to
 * the document level. Designed for HIPAA audit-trail infrastructure in
 * enterprise healthcare deployments.
 *
 * @example
 * ```ts
 * import { HelixAuditController } from '../controllers/helix-audit-controller.js';
 *
 * class MyElement extends LitElement {
 *   private _audit = new HelixAuditController(this, {
 *     userId: 'user-123',
 *     patientContextId: 'patient-456',
 *     encounterId: 'encounter-789',
 *   });
 * }
 * ```
 *
 * At the application boundary, wire a single document-level listener to forward
 * events to your HIPAA audit log infrastructure:
 *
 * ```ts
 * document.addEventListener('hx-audit', (e) => {
 *   const detail = (e as CustomEvent<AuditEventDetail>).detail;
 *   auditLogService.record(detail);
 * });
 * ```
 */
import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * The structured payload carried in every `hx-audit` CustomEvent.
 */
export interface AuditEventDetail {
  /** Stable correlation ID generated once per controller instance. */
  sessionId: string;
  /** ISO-8601 timestamp at the moment of capture. */
  timestamp: string;
  /** Lowercase tag name of the host element (e.g. `"hx-button"`). */
  tagName: string;
  /** The original `hx-*` event type that triggered this audit record. */
  sourceEventType: string;
  /** The original event's `detail` payload, preserved verbatim. */
  sourceEventDetail: unknown;
  /** Optional user identifier for the authenticated session. */
  userId?: string;
  /** Optional patient context identifier for clinical audit trails. */
  patientContextId?: string;
  /** Optional encounter/visit identifier for clinical audit trails. */
  encounterId?: string;
  /** Additional caller-supplied key/value metadata. */
  [key: string]: unknown;
}

/**
 * Options accepted by `HelixAuditController` at construction time and via
 * `updateMetadata()`.
 */
export interface AuditControllerOptions {
  /** Authenticated user identifier. */
  userId?: string;
  /** Patient context identifier. */
  patientContextId?: string;
  /** Clinical encounter / visit identifier. */
  encounterId?: string;
  /** Arbitrary additional metadata to merge into every audit record. */
  metadata?: Record<string, unknown>;
}

/**
 * All `hx-*` event types defined in the HELiX component library that should
 * be captured for audit. When a new event is added to the library, adding it
 * here ensures automatic audit coverage with zero other changes required.
 *
 * The DOM event model does not support wildcard subscriptions, so we maintain
 * this explicit list and attach/detach one listener per type — a single bound
 * handler object is reused across all registrations for memory efficiency.
 */
const HX_EVENT_TYPES = [
  'hx-click',
  'hx-input',
  'hx-change',
  'hx-open',
  'hx-close',
  'hx-select',
  'hx-submit',
  'hx-reset',
  'hx-sort',
  'hx-filter',
  'hx-page-change',
  'hx-tab-change',
  'hx-expand',
  'hx-collapse',
  'hx-copy',
  'hx-upload',
  'hx-remove',
  'hx-rate',
  'hx-toggle',
  'hx-dismiss',
  'hx-phi-access',
] as const;

/**
 * Generates a unique session correlation ID. Uses `crypto.randomUUID()` when
 * available and falls back to a timestamp-seeded pseudo-random string for
 * environments that do not expose the Web Crypto API (e.g. SSR, jsdom without
 * the crypto polyfill).
 */
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as Crypto).randomUUID === 'function') {
    return (crypto as Crypto).randomUUID();
  }
  // Fallback: formatted as a UUID v4 lookalike so downstream parsers that
  // expect that shape don't break.
  const t = Date.now().toString(16).padStart(12, '0');
  const r1 = Math.random().toString(16).slice(2, 10).padStart(8, '0');
  const r2 = Math.random().toString(16).slice(2, 14).padStart(12, '0');
  return `${t.slice(0, 8)}-${t.slice(8)}-4${r1.slice(0, 3)}-${r2.slice(0, 4)}-${r2.slice(4)}`;
}

/**
 * Attaches to a Lit `ReactiveControllerHost` (any `LitElement`) and silently
 * captures all `hx-*` events, enriching them with session, timestamp, and
 * optional clinical metadata before re-dispatching as `hx-audit` events.
 *
 * Because all HELiX component events are dispatched with
 * `bubbles: true, composed: true`, they propagate from inside the shadow DOM
 * up to the host element — where this controller's listeners are registered —
 * and then continue bubbling to `document`, making the `hx-audit` event
 * observable anywhere in the page without requiring a global listener.
 */
export class HelixAuditController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & EventTarget;
  private readonly _sessionId: string;
  private _options: AuditControllerOptions;

  /**
   * A single `EventListenerObject` reused across all event-type registrations.
   * Using the object form (rather than a bound function) avoids creating a new
   * closure per event type while still keeping `this` bound correctly.
   */
  private readonly _listener: EventListenerObject;

  constructor(host: ReactiveControllerHost & EventTarget, options: AuditControllerOptions = {}) {
    this._host = host;
    this._sessionId = generateSessionId();
    this._options = options;
    this._listener = { handleEvent: this._onHxEvent.bind(this) };
    this._host.addController(this);
  }

  /**
   * Updates the metadata attached to future audit records. Useful when the
   * authenticated user, patient context, or encounter changes after the
   * component is connected (e.g. patient context switch within a session).
   */
  updateMetadata(options: AuditControllerOptions): void {
    this._options = { ...this._options, ...options };
  }

  hostConnected(): void {
    for (const type of HX_EVENT_TYPES) {
      this._host.addEventListener(type, this._listener);
    }
  }

  hostDisconnected(): void {
    for (const type of HX_EVENT_TYPES) {
      this._host.removeEventListener(type, this._listener);
    }
  }

  private _onHxEvent(event: Event): void {
    // Guard: only process events whose type starts with 'hx-'.
    if (!event.type.startsWith('hx-')) return;
    // Guard: prevent recursion — never audit the audit event itself.
    if (event.type === 'hx-audit') return;

    const sourceDetail = event instanceof CustomEvent ? event.detail : undefined;

    const tagName = this._host instanceof Element ? this._host.tagName.toLowerCase() : 'unknown';

    const { userId, patientContextId, encounterId, metadata } = this._options;

    const detail: AuditEventDetail = {
      sessionId: this._sessionId,
      timestamp: new Date().toISOString(),
      tagName,
      sourceEventType: event.type,
      sourceEventDetail: sourceDetail,
      ...(userId !== undefined ? { userId } : {}),
      ...(patientContextId !== undefined ? { patientContextId } : {}),
      ...(encounterId !== undefined ? { encounterId } : {}),
      ...metadata,
    };

    this._host.dispatchEvent(
      new CustomEvent<AuditEventDetail>('hx-audit', {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }
}
