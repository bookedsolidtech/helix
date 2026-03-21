---
'@helixui/library': patch
---

fix(ssr): guard browser APIs in 8 client-only components for SSR compatibility

Added `typeof window !== 'undefined'` and `typeof document !== 'undefined'` guards
to all browser API access (window.matchMedia, document.createElement, document.addEventListener,
document.body.children, document.activeElement, requestAnimationFrame) in:

- hx-breadcrumb: document.createElement for ellipsis, document.head.appendChild for JSON-LD
- hx-carousel: window.matchMedia in connectedCallback
- hx-color-picker: document.addEventListener/removeEventListener for pointer and click handlers
- hx-counter: window.matchMedia and requestAnimationFrame in connectedCallback
- hx-drawer: window.matchMedia, document.addEventListener, document.body.children, document.activeElement
- hx-toast: window.matchMedia in _reducedMotion getter
- hx-field: document.createElement in _ensureA11yDescEl
- hx-tooltip: document.createElement in _setupTriggerAria, document.activeElement in mouseleave handler

These guards prevent crashes when components are rendered server-side in SSR environments
like Next.js, Astro, or any Node.js-based rendering pipeline.
