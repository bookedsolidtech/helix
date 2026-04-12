---
'@helixui/library': patch
---

fix(hx-alert): consolidate duplicate icon/showIcon Storybook control — the icon
argType now correctly binds to the component's showIcon property via show-icon
attribute

fix(hx-badge): strengthen dot-mode CSS guards to prevent prefix slot from
rendering in dot indicator mode; add slot projection assertions to
RemovableWithCount story; refactor --hx-badge-pulse-color to use private
--hx-badge-pulse-color-internal variable so consumers can override via the public
custom property

fix(hx-action-bar): **BREAKING** replace ariaLabel property that shadowed native
HTMLElement.ariaLabel with accessibleLabel property (accessible-label attribute).
The component continues to accept the standard aria-label HTML attribute for
backward compatibility. Consumers using the JS property el.ariaLabel should
migrate to el.accessibleLabel or set the aria-label attribute directly.
