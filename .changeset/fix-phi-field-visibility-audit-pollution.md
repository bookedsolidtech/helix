---
'@helixui/library': patch
---

Fix three HIPAA audit defects in `hx-phi-field`:

1. **Audit log pollution on never-accessed fields.** The `visibilitychange` handler no longer calls `_clearClipboard()` (and therefore does not dispatch `action: 'clipboard-clear'`) unless the field has actually been revealed or has an active clipboard-clear timer. Previously every tab switch on a page with PHI fields generated unnecessary audit entries.
2. **Clipboard leak after reveal → hide → tab background.** Manual-hide (toggle click) and auto-hide previously cancelled the scheduled `clipboard-clear` timer. A reveal-then-hide sequence where the user copied PHI during the reveal window would leave the clipboard populated and the `visibilitychange` pre-emption path would silently skip it. Both hide paths now preserve the clipboard-clear timer; it fires naturally at `clipboardTimeout`, and the `visibilitychange` pre-emption fires it earlier if the tab hides first. `_clearClipboard` now cancels its own scheduled timer so pre-emption cannot double-dispatch.
3. **Audit integrity when `navigator.clipboard.writeText` rejects.** The clipboard-clear timer and the `visibilitychange` pre-emption path both run without transient user activation, so `navigator.clipboard.writeText('')` can reject silently in Chrome/Safari. Previously `hx-phi-access` fired with `action: 'clipboard-clear'` unconditionally, producing a misleading audit trail that claimed clearance while PHI remained on the clipboard. The dispatch now observes the `writeText` outcome: `action: 'clipboard-clear'` only on confirmed success, `action: 'clipboard-clear-failed'` when the API is unavailable or the promise rejects. HIPAA audit consumers can now distinguish the two states and escalate failures (prompt the user to clear clipboard, flag the session).

The `PhiAccessEventDetail.action` union now includes `'clipboard-clear-failed'`. Consumers with exhaustive switches on the action type will see a new variant and should handle it (treat as an actionable audit event — clipboard state uncertain).
