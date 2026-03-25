# HX Image

An accessible image wrapper with lazy loading, fallback support, aspect ratio control,
responsive image (srcset/sizes) support, and optional caption.

## Usage

```twig
{% include 'helix:hx-image' with {
  src: '',
  alt: 'undefined',
  decorative: false,
  width: 'undefined',
  height: 'undefined',
  loading: 'lazy',
  fit: 'undefined',
  ratio: 'undefined',
  rounded: 'undefined',
  fallbackSrc: 'undefined',
  srcset: 'undefined',
  sizes: 'undefined',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | string |  | The URL of the image to display. |
| alt | object | undefined | Accessible text description of the image.
Required for informative images. Use the `decorative` prop for decorative images
instead of setting this to an empty string — explicit decorative intent is preferred. |
| decorative | boolean | false | Marks the image as decorative (hidden from screen readers).
Use this instead of `alt=""` to make decorative intent explicit in markup.
When set, the inner img receives `alt=""` and `role="presentation"`. |
| width | object | undefined | Width of the image element. |
| height | object | undefined | Height of the image element. |
| loading | object | lazy | Loading strategy for the image. |
| fit | object | undefined | How the image should be resized to fit its container.
Maps to CSS object-fit. |
| ratio | object | undefined | CSS aspect-ratio value (e.g. "16/9", "1", "4/3").
When set, the container maintains this ratio. |
| rounded | object | undefined | Border radius for the image.
Boolean attribute (or `true`) applies the theme's medium radius token.
A string value is used directly as a CSS border-radius value (e.g. "1rem", "50%").

Note: When set as an HTML attribute (`<hx-image rounded>`), Lit receives the value as
an empty string (`''`). When set programmatically (`el.rounded = true`), it receives
a boolean. Both forms apply the theme radius token. |
| fallbackSrc | object | undefined | Fallback image URL shown when the primary src fails to load. |
| srcset | object | undefined | A comma-separated list of image candidates for responsive images.
Passed directly to the inner img's srcset attribute.
Enables Drupal responsive image styles and browser-native image selection. |
| sizes | object | undefined | Media conditions indicating which image size to use alongside srcset.
Works in conjunction with the `srcset` attribute. |

## Slots

| Slot | Description |
|------|-------------|
| fallback | Custom content shown when the image fails to load and no fallback-src is set. |
| caption | Optional caption content rendered in a figcaption element below the image. |

## Events

| Event | Description |
|-------|-------------|
| hx-load | Dispatched when the image has successfully loaded. |
| hx-error | Dispatched when the image fails to load (including after fallback-src also fails). |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-image-object-fit | - | Controls how the image fills its container. Maps to object-fit. |
| --hx-image-border-radius | - | Border radius of the image. Overridden by the `rounded` prop. |
| --hx-image-aspect-ratio | - | Aspect ratio of the image container. Overridden by the `ratio` prop. |
| --hx-image-caption-color | - | Text color for the caption. |
| --hx-image-caption-font-size | - | Font size for the caption. |
| --hx-image-caption-padding | - | Padding for the caption. |
| --hx-image-fallback-min-height | - | Minimum height of the error/fallback container. |

## CSS Parts

| Part | Description |
|------|-------------|
| base | The inner img element. |
| caption | The figcaption element (visible only when caption content is present). |
