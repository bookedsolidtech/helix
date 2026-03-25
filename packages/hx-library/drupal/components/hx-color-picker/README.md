# HX Color Picker

A color picker control with gradient picker, hue/opacity sliders, swatches,
and formatted text input. Supports hex, rgb, hsl, and hsv output formats.

## Usage

```twig
{% include 'helix:hx-color-picker' with {
  value: '#000000',
  format: 'hex',
  opacity: false,
  swatchesOnly: false,
  disabled: false,
  name: '',
  inline: false,
  required: false,
  labelGradient: 'Color gradient',
  labelHue: 'Hue',
  labelOpacity: 'Opacity',
  labelSwatches: 'Preset colors',
  labelSwitchFormat: 'Switch color format',
  labelColorValue: 'Color value',
  labelPicker: 'Color picker',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | string | #000000 | Current color value as a CSS color string. |
| format | object | hex | Output format for the color value. |
| opacity | boolean | false | Whether to show the alpha/opacity channel slider and include alpha in the output. |
| swatchesOnly | boolean | false | When true, hides the gradient grid and sliders, showing only swatches and the input.
Useful for compact preset-only color selection UIs. |
| disabled | boolean | false | Whether the control is disabled. |
| name | string |  | Form field name for form participation. |
| inline | boolean | false | When true the picker is shown inline instead of in a popover. |
| required | boolean | false | When true, the picker requires a non-empty value for form submission. |
| labelGradient | string | Color gradient | Accessible label for the color gradient canvas. |
| labelHue | string | Hue | Accessible label for the hue slider. |
| labelOpacity | string | Opacity | Accessible label for the opacity slider. |
| labelSwatches | string | Preset colors | Accessible label for the preset color swatches section. |
| labelSwitchFormat | string | Switch color format | Accessible label for the format-switch button. |
| labelColorValue | string | Color value | Accessible label for the color value input. |
| labelPicker | string | Color picker | Accessible label for the color picker dialog/panel. |

## Slots

| Slot | Description |
|------|-------------|
| trigger | Custom trigger element. Default: a color swatch button. |

## Events

| Event | Description |
|-------|-------------|
| hx-input | Dispatched while dragging sliders or grid. |
| hx-change | Dispatched when a color is committed. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-color-picker-z-index | 1000 | z-index of the popover panel. |
| --hx-color-picker-width | 260px | Width of the picker panel. |
| --hx-color-picker-grid-height | 160px | Height of the gradient grid. |
| --hx-color-picker-thumb-border | #fff | Border color of slider/grid thumbs. |
| --hx-color-picker-thumb-shadow | rgba(0,0,0,0.3) | Shadow color of slider/grid thumbs. |
| --hx-color-picker-panel-shadow | rgba(0,0,0,0.15) | Panel drop-shadow color. |
| --hx-color-picker-swatch-border | rgba(0,0,0,0.1) | Swatch button border color. |
| --hx-color-picker-swatch-border-hover | rgba(0,0,0,0.3) | Swatch button border on hover. |

## CSS Parts

| Part | Description |
|------|-------------|
| trigger | The trigger button element. |
| swatches | The swatch color buttons container. |
| grid | The 2D saturation/value gradient picker area. |
| slider | Shared slider container (also on hue-slider and opacity-slider). |
| hue-slider | The hue slider track. |
| opacity-slider | The alpha/opacity slider track. |
| input | The text input area. |
