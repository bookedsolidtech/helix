# HX File Upload

A drag-and-drop file upload component with client-side validation,
file list management, per-file progress, and native form association.

## Usage

```twig
{% include 'helix:hx-file-upload' with {
  name: '',
  accept: '',
  maxSize: 0,
  maxFiles: 0,
  multiple: false,
  label: '',
  disabled: false,
  error: '',
  labelDropzone: 'Drag files here or click to browse',
  labelFileList: 'Selected files',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string |  | The form field name used during form submission. |
| accept | string |  | Accepted file types as a comma-separated list of MIME types or extensions.
Mirrors the native `<input type="file" accept>` attribute. |
| maxSize | number | 0 | Maximum allowed file size in bytes. 0 means unlimited. |
| maxFiles | number | 0 | Maximum number of files that can be selected. 0 means unlimited. |
| multiple | boolean | false | Whether multiple files may be selected at once. |
| label | string |  | Visible label text for the dropzone. |
| disabled | boolean | false | Whether the component is disabled. |
| error | string |  | Error message displayed below the dropzone. Also puts the dropzone in an error visual state. |
| labelDropzone | string | Drag files here or click to browse | Instructional text shown in the dropzone when no custom slot content is provided.
Also used as the accessible label for the dropzone. |
| labelFileList | string | Selected files | Accessible label for the selected files list. |

## Slots

| Slot | Description |
|------|-------------|
| (default) | Default dropzone content. Replaces the built-in "Drag files here or click to browse" prompt. |
| file-list | Custom file list display. When provided, the built-in file list is hidden. |

## Events

| Event | Description |
|-------|-------------|
| hx-error | Dispatched when file validation fails (type or size constraint). |
| hx-upload | Dispatched when valid files are selected via drag-and-drop or the file picker. |
| hx-remove | Dispatched when a file is removed from the list. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-file-upload-dropzone-bg | var(--hx-color-neutral-50) | Dropzone background color. |
| --hx-file-upload-dropzone-border-color | var(--hx-color-neutral-300) | Dropzone border color. |
| --hx-file-upload-dropzone-border-radius | var(--hx-border-radius-lg) | Dropzone border radius. |
| --hx-file-upload-dropzone-active-bg | - | Dropzone background when a file is dragged over. |
| --hx-file-upload-progress-color | var(--hx-color-primary-500) | Progress bar fill color. |
| --hx-file-upload-error-color | var(--hx-color-error-500) | Error state and remove-button hover color. |

## CSS Parts

| Part | Description |
|------|-------------|
| dropzone | The drag-and-drop target area. |
| file-list | The container wrapping the list of selected files. |
| file-item | An individual file entry in the list. |
| progress | The progress bar track for a file item. |
| label | The visible label element. |
| error | The error message container below the dropzone. |
