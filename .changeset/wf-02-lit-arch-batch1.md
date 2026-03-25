---
'@helixui/library': patch
---

fix(lit-architecture): remediate critical and high severity Lit 3.x anti-patterns (WF-02 batch 1)

Fixes 13 critical/high severity findings from the WF-02 Lit architecture audit:

- hx-breadcrumb: eliminate event listener memory leak — bound references now created as arrow function class fields instead of re-bound in connectedCallback
- hx-combobox: add SSR guard around document.addEventListener/removeEventListener calls
- hx-counter: add MediaQueryList change listener for prefers-reduced-motion so runtime preference changes update animation behavior
- hx-date-picker: eliminate event listener memory leak — bound handlers converted to readonly arrow function field initializers
- hx-dropdown: add missing super.updated(changedProperties) call to prevent lifecycle chain breakage
- hx-file-upload: fix fragile changedProperties type cast to use proper keyof typing
- hx-format-date: add SSR guards around document.documentElement.lang and navigator.language access
- hx-grid: add missing super.updated(changed) call in HelixGridItem to prevent lifecycle chain breakage
- hx-icon: add missing super.updated(changed) call to prevent lifecycle chain breakage
- hx-meter: add missing super.updated(changedProperties) call to prevent lifecycle chain breakage
- hx-progress-bar: add missing super.updated(changedProps) call to prevent lifecycle chain breakage
- hx-time-picker: add isConnected guard in outside-click handler for extra safety
- hx-tooltip: add reconnection handling in connectedCallback to re-setup light DOM ARIA description element
