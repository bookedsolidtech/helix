/**
 * Representative components selected for detailed prop, event, and ref testing.
 * These cover a range of interaction patterns: buttons, form inputs, feedback,
 * layout, and navigation.
 */
export const DETAILED_TEST_COMPONENTS = [
  'HxButton',
  'HxTextInput',
  'HxCheckbox',
  'HxSelect',
  'HxTextarea',
  'HxSwitch',
  'HxRadio',
  'HxCard',
  'HxAlert',
  'HxBadge',
  'HxDialog',
  'HxDrawer',
  'HxTooltip',
  'HxToast',
  'HxProgressBar',
  'HxProgressRing',
  'HxSpinner',
  'HxIcon',
  'HxLink',
  'HxText',
  'HxDivider',
  'HxSlider',
] as const;

export type DetailedTestComponent = (typeof DETAILED_TEST_COMPONENTS)[number];

/** Components known to fire hx-click events */
export const CLICK_EVENT_COMPONENTS = ['HxButton', 'HxCard', 'HxIconButton'] as const;

/** Components known to fire hx-change events */
export const CHANGE_EVENT_COMPONENTS = [
  'HxCheckbox',
  'HxSwitch',
  'HxSelect',
  'HxRadio',
  'HxTextInput',
  'HxTextarea',
  'HxSlider',
] as const;
