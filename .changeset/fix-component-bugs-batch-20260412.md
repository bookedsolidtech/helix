---
'@helixui/library': patch
---

fix(hx-alert): consolidate duplicate icon/showIcon Storybook control — the icon
argType now correctly binds to the component's showIcon property via show-icon
attribute

fix(hx-badge): strengthen dot-mode CSS guards to prevent prefix slot from
rendering in dot indicator mode; refactor --hx-badge-pulse-color to use private
--hx-badge-pulse-color-internal variable so consumers can override via the public
custom property

fix(hx-action-bar): replace ariaLabel property that shadowed native
HTMLElement.ariaLabel with accessibleLabel property (accessible-label attribute).
The standard aria-label HTML attribute continues to work unchanged.
