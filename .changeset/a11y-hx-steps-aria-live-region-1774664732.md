---
'@helixui/library': patch
---

fix invalid role="button" on hx-step inner div and add aria-live status announcements

- STEPS-001: remove role="button" from the inner .step div — the host element already has role="listitem" and tabindex="0"; the inner div is purely presentational and the duplicate role caused role/focus mismatch for screen readers
- STEPS-003: add aria-live="polite" region in hx-step shadow DOM that announces status transitions to "complete" or "error" so screen readers are notified when step status changes programmatically
- STEPS-002: add devWarn in hx-steps connectedCallback() when aria-label is null or empty, guiding developers to provide an accessible name for the steps list (WCAG 2.1 SC 4.1.2)
