# HX Date Picker

Date picker component for selecting dates with keyboard-accessible calendar popup.

## Usage

```twig
{% include 'helix:hx-date-picker' with {
  name: '',
  value: '',
  min: '',
  max: '',
  label: '',
  required: false,
  disabled: false,
  error: '',
  helpText: '',
  format: 'MM/DD/YYYY',
  locale: 'en-US',
  labelChooseDate: 'Choose a date',
  labelPrevMonth: 'Previous month',
  labelNextMonth: 'Next month',
  labelOpenCalendar: 'Open calendar',
  labelCloseCalendar: 'Close calendar',
} %}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| name | string |  | The name of the field, used for form submission. |
| value | string |  | The current value as an ISO 8601 date string (e.g. 2026-03-04). |
| min | string |  | The minimum selectable date as an ISO 8601 string. |
| max | string |  | The maximum selectable date as an ISO 8601 string. |
| label | string |  | The visible label text. |
| required | boolean | false | Whether the field is required for form submission. |
| disabled | boolean | false | Whether the field is disabled. |
| error | string |  | Error message to display. When set, the field enters an error state. |
| helpText | string |  | Help text displayed below the field for guidance. |
| format | string | MM/DD/YYYY | Display format hint shown as placeholder (e.g. MM/DD/YYYY). |
| locale | string | en-US | Locale string used for formatting the display value. |
| labelChooseDate | string | Choose a date | Accessible label for the calendar grid/dialog. |
| labelPrevMonth | string | Previous month | Accessible label for the "previous month" button. |
| labelNextMonth | string | Next month | Accessible label for the "next month" button. |
| labelOpenCalendar | string | Open calendar | Accessible label for the calendar trigger button when calendar is closed. |
| labelCloseCalendar | string | Close calendar | Accessible label for the calendar trigger button when calendar is open. |

## Slots

| Slot | Description |
|------|-------------|
| label | Custom label content (overrides the label property). |
| help-text | Custom help text content (overrides the helpText property). |
| error | Custom error content (overrides the error property). |

## Events

| Event | Description |
|-------|-------------|
| hx-change | Emitted when the selected date changes. |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| --hx-date-picker-bg | var(--hx-color-neutral-0) | Input background color. |
| --hx-date-picker-color | var(--hx-color-neutral-800) | Input text color. |
| --hx-date-picker-border-color | var(--hx-color-neutral-300) | Border color. |
| --hx-date-picker-border-radius | var(--hx-border-radius-md) | Border radius. |
| --hx-date-picker-font-family | var(--hx-font-family-sans) | Font family. |
| --hx-date-picker-focus-ring-color | var(--hx-focus-ring-color) | Focus ring color. |
| --hx-date-picker-error-color | var(--hx-color-error-500) | Error state color. |
| --hx-date-picker-label-color | var(--hx-color-neutral-700) | Label text color. |
| --hx-date-picker-trigger-color | var(--hx-color-neutral-500) | Trigger icon color. |
| --hx-date-picker-calendar-bg | var(--hx-color-neutral-0) | Calendar background color. |
| --hx-date-picker-calendar-border-color | var(--hx-color-neutral-200) | Calendar border color. |
| --hx-date-picker-calendar-min-width | 18rem | Calendar minimum width. |
| --hx-date-picker-selected-bg | var(--hx-color-primary-500) | Selected day background. |
| --hx-date-picker-selected-color | var(--hx-color-neutral-0) | Selected day text color. |
| --hx-date-picker-today-color | var(--hx-color-primary-600) | Today indicator color. |
| --hx-date-picker-calendar-shadow | 0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1) | Calendar popup box shadow. |

## CSS Parts

| Part | Description |
|------|-------------|
| field | The outer field container. |
| label | The label element. |
| input-wrapper | The wrapper around input and trigger. |
| input | The readonly text input displaying the formatted date. |
| trigger | The calendar icon button. |
| calendar | The calendar popup dialog. |
| month-nav | The month navigation header. |
| day | An individual day button in the calendar grid. |
| help-text | The help text container. |
| error | The error message container. |
