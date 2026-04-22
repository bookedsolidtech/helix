---
'@helixui/library': patch
---

Fix `hx-phi-field` emitting false `hx-phi-access` audit events when a never-accessed field's tab is hidden. The `visibilitychange` handler no longer calls `_clearClipboard()` (and therefore does not dispatch `action: 'clipboard-clear'`) unless the field has actually been revealed or has an active clipboard-clear timer. Addresses HIPAA audit log pollution where every tab switch on a page with PHI fields generated unnecessary audit entries.
