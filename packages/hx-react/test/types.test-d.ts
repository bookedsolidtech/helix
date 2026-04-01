/**
 * TypeScript type definition tests for @helixui/react wrappers.
 *
 * These are compile-time checks validated by `pnpm run type-check:test`.
 * The file must compile with zero TypeScript errors.
 *
 * Checks:
 * - Props interfaces have correct types for key properties
 * - Event handler callbacks accept Event as argument
 * - Optional props allow undefined / omission
 * - className and style props are standard React types
 * - children prop accepts React.ReactNode
 */
import type React from 'react';
import type { HxButtonProps } from '../src/components/HxButton/types.js';
import type { HxTextInputProps } from '../src/components/HxTextInput/types.js';
import type { HxCheckboxProps } from '../src/components/HxCheckbox/types.js';
import type { HxSelectProps } from '../src/components/HxSelect/types.js';
import type { HxAlertProps } from '../src/components/HxAlert/types.js';
import type { HxBadgeProps } from '../src/components/HxBadge/types.js';
import type { HxProgressBarProps } from '../src/components/HxProgressBar/types.js';

// ─── HxButtonProps ───────────────────────────────────────────────────────────

// All props are optional
const _emptyButton: HxButtonProps = {};

// Valid variant values
const _primaryButton: HxButtonProps = { variant: 'primary' };
const _secondaryButton: HxButtonProps = { variant: 'secondary' };
const _tertiaryButton: HxButtonProps = { variant: 'tertiary' };
const _dangerButton: HxButtonProps = { variant: 'danger' };
const _ghostButton: HxButtonProps = { variant: 'ghost' };
const _outlineButton: HxButtonProps = { variant: 'outline' };

// @ts-expect-error — 'invalid' is not a valid HxButton variant
const _badVariant: HxButtonProps = { variant: 'invalid' };

// Valid size values
const _smButton: HxButtonProps = { size: 'sm' };
const _mdButton: HxButtonProps = { size: 'md' };
const _lgButton: HxButtonProps = { size: 'lg' };

// @ts-expect-error — 'xl' is not a valid HxButton size
const _badSize: HxButtonProps = { size: 'xl' };

// Boolean props
const _disabledButton: HxButtonProps = { disabled: true };
const _loadingButton: HxButtonProps = { loading: true };
const _fullButton: HxButtonProps = { full: true };

// Event handler type check
const _withClick: HxButtonProps = {
  onHxClick: (_event: Event) => undefined,
};

// Standard React props
const _withClassName: HxButtonProps = { className: 'custom-class' };
const _withStyle: HxButtonProps = { style: { color: 'red' } };
const _withChildren: HxButtonProps = { children: 'Click me' };
const _withReactChildren: HxButtonProps = {
  children: React.createElement('span', null, 'Content'),
};

// ─── HxTextInputProps ────────────────────────────────────────────────────────

const _emptyInput: HxTextInputProps = {};
const _labeledInput: HxTextInputProps = { label: 'Email' };
const _disabledInput: HxTextInputProps = { disabled: true };
const _requiredInput: HxTextInputProps = { required: true };

// Dual event handlers
const _inputWithHandlers: HxTextInputProps = {
  onHxInput: (_e: Event) => undefined,
  onHxChange: (_e: Event) => undefined,
};

// ─── HxCheckboxProps ─────────────────────────────────────────────────────────

const _emptyCheckbox: HxCheckboxProps = {};
const _labeledCheckbox: HxCheckboxProps = { label: 'Accept terms' };
const _disabledCheckbox: HxCheckboxProps = { disabled: true };
const _checkboxWithHandler: HxCheckboxProps = { onHxChange: (_e: Event) => undefined };

// ─── HxSelectProps ───────────────────────────────────────────────────────────

const _emptySelect: HxSelectProps = {};
const _labeledSelect: HxSelectProps = { label: 'Country' };
const _disabledSelect: HxSelectProps = { disabled: true };

// ─── HxAlertProps ────────────────────────────────────────────────────────────

const _emptyAlert: HxAlertProps = {};
const _alertWithChildren: HxAlertProps = { children: 'Alert message' };

// ─── HxBadgeProps ────────────────────────────────────────────────────────────

const _emptyBadge: HxBadgeProps = {};
const _badgeWithChildren: HxBadgeProps = { children: '42' };

// ─── HxProgressBarProps ──────────────────────────────────────────────────────

const _emptyProgress: HxProgressBarProps = {};
const _progressWithValue: HxProgressBarProps = { value: 75 };

// Variables are prefixed with _ to signal intentional type-assertion usage.
// noUnusedLocals is not enabled in strict mode, so no suppression is needed.
void _emptyButton;
void _primaryButton;
void _secondaryButton;
void _tertiaryButton;
void _dangerButton;
void _ghostButton;
void _outlineButton;
void _badVariant;
void _smButton;
void _mdButton;
void _lgButton;
void _badSize;
void _disabledButton;
void _loadingButton;
void _fullButton;
void _withClick;
void _withClassName;
void _withStyle;
void _withChildren;
void _withReactChildren;
void _emptyInput;
void _labeledInput;
void _disabledInput;
void _requiredInput;
void _inputWithHandlers;
void _emptyCheckbox;
void _labeledCheckbox;
void _disabledCheckbox;
void _checkboxWithHandler;
void _emptySelect;
void _labeledSelect;
void _disabledSelect;
void _emptyAlert;
void _alertWithChildren;
void _emptyBadge;
void _badgeWithChildren;
void _emptyProgress;
void _progressWithValue;
