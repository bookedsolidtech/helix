# HX Popup

A low-level positioning primitive that anchors a floating panel to a reference element.
This is the base that hx-tooltip, hx-dropdown, and hx-popover build upon.

## Usage

```twig
{% include 'helix:hx-popup' with {
  anchor: 'null',
  placement: 'bottom',
  active: false,
  distance: 0,
  skidding: 0,
  arrow: false,
  arrowPlacement: 'null',
  arrowPadding: 10,
  flip: false,
  flipFallbackPlacements: '[]',
  shift: false,
  autoSize: false,
  strategy: 'fixed',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| anchor | object | null | The reference element to anchor the popup to.

- **Attribute form** (`anchor="#selector"`): Accepts a CSS selector string resolved via
  `querySelector` from the component's root node. Use this in HTML/Twig markup.
- **Property form** (`el.anchor = element`): Accepts an `Element` reference directly.
  Setting an Element via JS property does NOT reflect to the attribute.

If not set, the element in the `anchor` slot is used. |
| placement | object | bottom | Preferred placement of the popup relative to the anchor. |
| active | boolean | false | Whether the popup is visible. |
| distance | number | 0 | Gap in pixels between the popup and the anchor element. |
| skidding | number | 0 | Offset in pixels along the anchor element's axis. |
| arrow | boolean | false | Whether to show an arrow pointing to the anchor element. |
| arrowPlacement | object | null | Manual placement of the arrow along the popup edge.
When not set, floating-ui calculates the optimal position. |
| arrowPadding | number | 10 | Minimum padding in pixels from the popup edge to the arrow. |
| flip | boolean | false | When true, flips the popup to the opposite side to avoid overflow. |
| flipFallbackPlacements | object | [] | Fallback placements to try when flipping. Accepts a JSON array string. |
| shift | boolean | false | When true, shifts the popup along the axis to remain in the viewport. |
| autoSize | boolean | false | When true, resizes the popup to fit within the viewport.
Sets --hx-auto-size-available-width and --hx-auto-size-available-height CSS custom
properties on `:host` so they cascade into shadow DOM and are readable from light DOM. |
| strategy | object | fixed | Positioning strategy passed to floating-ui's `computePosition`.

- `'fixed'` (default): works for most cases; positions relative to the viewport.
- `'absolute'`: use inside `overflow: hidden` / scroll containers where the popup is
  positioned relative to the nearest positioned ancestor instead of the viewport. |

## Slots

| Slot | Description |
|------|-------------|
| anchor | The reference element the popup is anchored to. |
| (default) | Default slot for popup content. |

## Events

| Event | Description |
|-------|-------------|
| hx-reposition | Emitted after the popup is repositioned. ## Accessibility Contract `hx-popup` is a **positioning utility**, not an interactive widget. It does not provide ARIA semantics. Consumers are responsible for all accessibility: - **Popup role**: Add `role="tooltip"`, `role="dialog"`, `role="listbox"`, etc. to the slotted popup content depending on its purpose. - **Trigger state**: The element that triggers the popup MUST set `aria-expanded="true/false"`. - **Association**: Use `aria-controls` on the trigger to reference the popup content element, and `aria-labelledby` / `aria-describedby` as appropriate. - **Focus management**: `hx-popup` does NOT trap focus. Consumers building dialogs or menus MUST implement focus trapping and keyboard dismiss (Escape key) themselves. - **Visibility**: The popup is hidden via `display: none` (CSS) and the `inert` attribute when inactive. Both are reliable accessibility-tree hiding mechanisms. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-popup-z-index | 9000 | Z-index of the popup container. |
| --hx-popup-transition | none | Transition applied to the popup element. Consumers who need enter/exit animations can set this property AND override the default `display: none` hide mechanism via `::part(popup)`. Example: ```css hx-popup { --hx-popup-transition: opacity 0.2s ease; } hx-popup:not([active])::part(popup) { display: block; opacity: 0; pointer-events: none; } hx-popup[active]::part(popup) { opacity: 1; } ``` |
| --hx-arrow-size | 8px | Size of the arrow element. |
| --hx-arrow-color | var(--hx-color-surface-overlay, #ffffff) | Color of the arrow element. |
| --hx-auto-size-available-width | - | Available width set by auto-size middleware (on :host). |
| --hx-auto-size-available-height | - | Available height set by auto-size middleware (on :host). |

## CSS Parts

| Part | Description |
|------|-------------|
| popup | The popup container element. |
| arrow | The arrow indicator element (only present when `arrow` is true). |
