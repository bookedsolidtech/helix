---
'@helixui/library': patch
---

Fix two HIPAA audit defects in `hx-phi-field`:

1. **Audit log pollution on never-accessed fields.** The `visibilitychange` handler no longer calls `_clearClipboard()` (and therefore does not dispatch `action: 'clipboard-clear'`) unless the field has actually been revealed or has an active clipboard-clear timer. Previously every tab switch on a page with PHI fields generated unnecessary audit entries.
2. **Clipboard leak after reveal → hide → tab background.** Manual-hide (toggle click) and auto-hide previously cancelled the scheduled `clipboard-clear` timer. A reveal-then-hide sequence where the user copied PHI during the reveal window would leave the clipboard populated and the `visibilitychange` pre-emption path would silently skip it. Both hide paths now preserve the clipboard-clear timer; it fires naturally at `clipboardTimeout`, and the `visibilitychange` pre-emption fires it earlier if the tab hides first. `_clearClipboard` now cancels its own scheduled timer so pre-emption cannot double-dispatch.
