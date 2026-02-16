---
title: Advanced TypeScript Patterns
description: Deep dive into advanced TypeScript patterns for enterprise web components - conditional types, mapped types, template literal types, utility types, type guards, and discriminated unions.
sidebar:
  order: 22
---

# Advanced TypeScript Patterns

Advanced TypeScript patterns enable you to build sophisticated, type-safe APIs for enterprise healthcare web components. This guide explores conditional types, mapped types, template literal types, utility types, type guards, and discriminated unions—all applied to real-world scenarios from the HELIX component library.

These patterns go beyond basic type annotations to provide compile-time guarantees, improve developer experience, and prevent runtime errors in mission-critical healthcare applications where type safety directly impacts patient care.

:::tip[Prerequisites]
This guide assumes familiarity with [TypeScript generics](/components/typescript/generics). Review that guide first if you're new to generic type parameters.
:::

## Why Advanced Types Matter

Enterprise healthcare web components require sophisticated type systems to handle:

- **Complex event payloads** with varying detail structures
- **Conditional component APIs** that change based on property combinations
- **Type-safe utility functions** that work across different component types
- **Runtime type validation** with compile-time guarantees
- **Form field mapping** with automatic type inference
- **Component state management** with discriminated unions

Without advanced types, you would sacrifice type safety, duplicate code, or create brittle APIs. Advanced patterns solve these challenges while maintaining strict mode compliance.

## Conditional Types

Conditional types select one of two possible types based on a type relationship test. They use the syntax `T extends U ? X : Y`, similar to JavaScript's ternary operator but operating on types instead of values.

### Basic Conditional Types

```typescript
/**
 * Checks if a type is a string.
 */
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<42>; // false
type C = IsString<HTMLElement>; // false

/**
 * Extracts the element type from an array, or returns the type unchanged.
 */
type Flatten<T> = T extends Array<infer U> ? U : T;

type StringArray = Flatten<string[]>; // string
type NumberType = Flatten<number>; // number
type BothTypes = Flatten<string[] | number>; // string | number
```

### Conditional Types for HELIX Components

Conditional types enable component APIs that adapt based on property combinations:

```typescript
/**
 * Type for hx-button based on whether it has an href.
 * Interactive buttons with href must have a role of 'link'.
 */
type ButtonProps<T extends { href?: string }> = T extends { href: string }
  ? T & { role: 'link'; target?: '_blank' | '_self' | '_parent' | '_top' }
  : T & { role?: never; target?: never };

// Usage: button with href must include role
const linkButton: ButtonProps<{ href: string }> = {
  href: '/patients',
  role: 'link', // ✓ Required
  target: '_blank', // ✓ Optional
};

// Usage: button without href cannot have role or target
const actionButton: ButtonProps<{}> = {
  // role: 'link', // ❌ Error: role is never
  // target: '_blank', // ❌ Error: target is never
};
```

### Extracting Types with `infer`

The `infer` keyword declares a type variable within a conditional type's extends clause, allowing you to extract and use types from complex structures:

```typescript
/**
 * Extracts the detail type from a CustomEvent.
 */
type EventDetail<T> = T extends CustomEvent<infer D> ? D : never;

// Example: Extract detail from hx-change event
type HxChangeEvent = CustomEvent<{ checked: boolean; value: string }>;
type ChangeDetail = EventDetail<HxChangeEvent>;
// Result: { checked: boolean; value: string }

/**
 * Extracts the return type from any function.
 */
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Example: Extract return type from component method
type FormValidation = (field: string) => Promise<{ valid: boolean; errors: string[] }>;
type ValidationResult = ReturnType<FormValidation>;
// Result: Promise<{ valid: boolean; errors: string[] }>

/**
 * Extracts the first parameter type from a function.
 */
type FirstParameter<T> = T extends (first: infer P, ...args: any[]) => any ? P : never;

// Example: Extract event type from event handler
type ClickHandler = (event: MouseEvent, metadata: object) => void;
type EventType = FirstParameter<ClickHandler>;
// Result: MouseEvent
```

### Distributive Conditional Types

When a conditional type is applied to a union type, TypeScript distributes the conditional across each member of the union:

```typescript
/**
 * Extracts only the string types from a union.
 */
type ExtractStrings<T> = T extends string ? T : never;

type Mixed = string | number | boolean | object;
type OnlyStrings = ExtractStrings<Mixed>;
// Result: string

/**
 * Filters out null and undefined from a type.
 */
type NonNullable<T> = T extends null | undefined ? never : T;

type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>;
// Result: string

/**
 * Filters HELIX component events to only user interaction events.
 */
type HxEventName = 'hx-click' | 'hx-change' | 'hx-input' | 'hx-mounted' | 'hx-ready';
type UserEvent<T> = T extends `hx-${'click' | 'change' | 'input'}` ? T : never;

type InteractionEvents = UserEvent<HxEventName>;
// Result: 'hx-click' | 'hx-change' | 'hx-input'
```

### Practical Example: Type-Safe Event Dispatcher

```typescript
/**
 * Event detail map for all HELIX component events.
 */
interface HxEventDetailMap {
  'hx-click': { originalEvent: MouseEvent };
  'hx-change': { checked: boolean; value: string };
  'hx-input': { value: string };
  'hx-select': { value: string; label: string };
  'hx-focus': { relatedTarget: EventTarget | null };
}

/**
 * Type-safe event dispatcher that ensures detail matches event name.
 */
class TypedEventDispatcher<T extends keyof HxEventDetailMap> {
  constructor(
    private element: HTMLElement,
    private eventName: T,
  ) {}

  dispatch(detail: HxEventDetailMap[T]): void {
    this.element.dispatchEvent(
      new CustomEvent(this.eventName, {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }
}

// Usage: detail must match event type
const clickDispatcher = new TypedEventDispatcher(element, 'hx-click');
clickDispatcher.dispatch({ originalEvent: event }); // ✓ Correct

const changeDispatcher = new TypedEventDispatcher(element, 'hx-change');
changeDispatcher.dispatch({ checked: true, value: 'on' }); // ✓ Correct
// changeDispatcher.dispatch({ originalEvent: event }); // ❌ Error: wrong detail type
```

## Mapped Types

Mapped types create new types by transforming properties of existing types. They iterate over property keys using the `in` operator and can optionally remap keys using the `as` clause.

### Basic Mapped Types

```typescript
/**
 * Makes all properties readonly.
 */
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

/**
 * Makes all properties optional.
 */
type Partial<T> = {
  [K in keyof T]?: T[K];
};

/**
 * Makes all properties required (removes optional modifier).
 */
type Required<T> = {
  [K in keyof T]-?: T[K];
};

// Example: Partial component props for updates
interface HxButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
}

type PartialButtonProps = Partial<HxButtonProps>;
// Result: { variant?: ...; size?: ...; disabled?: boolean }
```

### Remapping Keys with `as`

The `as` clause allows you to transform property keys during mapping:

```typescript
/**
 * Creates getter functions for all properties.
 */
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface ComponentState {
  value: string;
  checked: boolean;
  disabled: boolean;
}

type StateGetters = Getters<ComponentState>;
// Result: {
//   getValue: () => string;
//   getChecked: () => boolean;
//   getDisabled: () => boolean;
// }

/**
 * Creates event handler types from event names.
 */
type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (event: T[K]) => void;
};

interface HxEvents {
  click: MouseEvent;
  change: CustomEvent<{ value: string }>;
  focus: FocusEvent;
}

type HxEventHandlers = EventHandlers<HxEvents>;
// Result: {
//   onClick: (event: MouseEvent) => void;
//   onChange: (event: CustomEvent<{ value: string }>) => void;
//   onFocus: (event: FocusEvent) => void;
// }
```

### Filtering Properties

Mapped types can filter properties using conditional types in the `as` clause:

```typescript
/**
 * Extracts only boolean properties.
 */
type BooleanPropsOnly<T> = {
  [K in keyof T as T[K] extends boolean ? K : never]: T[K];
};

interface HxCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  required: boolean;
  label: string;
  value: string;
  name: string;
}

type BooleanProps = BooleanPropsOnly<HxCheckboxProps>;
// Result: {
//   checked: boolean;
//   indeterminate: boolean;
//   disabled: boolean;
//   required: boolean;
// }

/**
 * Extracts only string properties.
 */
type StringPropsOnly<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

type StringProps = StringPropsOnly<HxCheckboxProps>;
// Result: { label: string; value: string; name: string }

/**
 * Filters out specified keys.
 */
type Omit<T, K extends keyof T> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};

type PublicCheckboxProps = Omit<HxCheckboxProps, 'name' | 'value'>;
// Result: All props except 'name' and 'value'
```

### Practical Example: CSS Custom Property Types

```typescript
/**
 * Branded type for CSS custom properties.
 */
type CSSCustomProperty = `--hx-${string}`;

/**
 * Component CSS property configuration.
 */
interface HxButtonCSSProps {
  bg: string;
  color: string;
  borderColor: string;
  borderRadius: string;
  fontFamily: string;
  fontWeight: string;
}

/**
 * Maps component properties to CSS custom property names.
 */
type CSSVarMap<T> = {
  [K in keyof T as `--hx-button-${string & K}`]: T[K];
};

type ButtonCSSVars = CSSVarMap<HxButtonCSSProps>;
// Result: {
//   '--hx-button-bg': string;
//   '--hx-button-color': string;
//   '--hx-button-borderColor': string;
//   ...
// }

/**
 * Creates kebab-case CSS property names.
 */
type KebabCase<S extends string> = S extends `${infer T}${infer U}`
  ? U extends Uncapitalize<U>
    ? `${Uncapitalize<T>}${KebabCase<U>}`
    : `${Uncapitalize<T>}-${KebabCase<Uncapitalize<U>>}`
  : S;

type CSSVarMapKebab<T> = {
  [K in keyof T as `--hx-button-${KebabCase<string & K>}`]: T[K];
};

type ButtonCSSVarsKebab = CSSVarMapKebab<HxButtonCSSProps>;
// Result: {
//   '--hx-button-bg': string;
//   '--hx-button-color': string;
//   '--hx-button-border-color': string; // Converted to kebab-case
//   ...
// }
```

## Template Literal Types

Template literal types use template literal syntax to construct new string literal types. They enable powerful string manipulation at the type level, particularly useful for event names, CSS classes, and component tag names.

### Basic Template Literal Types

```typescript
/**
 * HELIX component tag name.
 */
type ComponentTag = `hx-${string}`;

const buttonTag: ComponentTag = 'hx-button'; // ✓
const cardTag: ComponentTag = 'hx-card'; // ✓
// const invalidTag: ComponentTag = 'custom-element'; // ❌ Error

/**
 * HELIX event name.
 */
type HxEvent = `hx-${string}`;

const clickEvent: HxEvent = 'hx-click'; // ✓
const changeEvent: HxEvent = 'hx-change'; // ✓
// const invalidEvent: HxEvent = 'custom-event'; // ❌ Error

/**
 * CSS custom property name.
 */
type CSSVar = `--hx-${string}`;

const primaryColor: CSSVar = '--hx-color-primary-500'; // ✓
const spacing: CSSVar = '--hx-space-4'; // ✓
// const invalid: CSSVar = '--custom-var'; // ❌ Error
```

### Union Type Expansion

Template literals expand union types into all possible combinations:

```typescript
/**
 * Button variants.
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * CSS class names for button variants and sizes.
 */
type ButtonClass = `button--${ButtonVariant}` | `button--${ButtonSize}`;
// Result:
// 'button--primary' | 'button--secondary' | 'button--ghost' |
// 'button--sm' | 'button--md' | 'button--lg'

/**
 * Combined variant and size classes.
 */
type ButtonCombinedClass = `button--${ButtonVariant}-${ButtonSize}`;
// Result:
// 'button--primary-sm' | 'button--primary-md' | 'button--primary-lg' |
// 'button--secondary-sm' | 'button--secondary-md' | 'button--secondary-lg' |
// 'button--ghost-sm' | 'button--ghost-md' | 'button--ghost-lg'

/**
 * Form field error keys.
 */
type FieldName = 'email' | 'password' | 'username';
type ErrorKey = `${FieldName}_error`;
// Result: 'email_error' | 'password_error' | 'username_error'
```

### String Manipulation Types

TypeScript provides intrinsic string manipulation types that work with template literals:

```typescript
/**
 * Built-in string manipulation utilities.
 */
type UppercaseExample = Uppercase<'hello'>; // 'HELLO'
type LowercaseExample = Lowercase<'WORLD'>; // 'world'
type CapitalizeExample = Capitalize<'typescript'>; // 'Typescript'
type UncapitalizeExample = Uncapitalize<'Hello'>; // 'hello'

/**
 * Event handler naming convention.
 */
type EventName = 'click' | 'change' | 'input' | 'focus' | 'blur';
type EventHandler = `on${Capitalize<EventName>}`;
// Result: 'onClick' | 'onChange' | 'onInput' | 'onFocus' | 'onBlur'

/**
 * HTTP method prefixed endpoints.
 */
type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';
type Endpoint<M extends HTTPMethod> = `${Uppercase<M>} /api/${string}`;

type GetEndpoint = Endpoint<'get'>; // 'GET /api/${string}'
type PostEndpoint = Endpoint<'post'>; // 'POST /api/${string}'

/**
 * CSS utility classes.
 */
type Direction = 'top' | 'right' | 'bottom' | 'left';
type PaddingClass = `p-${Direction}`;
// Result: 'p-top' | 'p-right' | 'p-bottom' | 'p-left'

type MarginClass = `m-${Direction}`;
// Result: 'm-top' | 'm-right' | 'm-bottom' | 'm-left'
```

### Practical Example: Type-Safe Component Registry

```typescript
/**
 * HELIX component tag names.
 */
type HxComponentTag =
  | 'hx-button'
  | 'hx-card'
  | 'hx-checkbox'
  | 'hx-select'
  | 'hx-text-input'
  | 'hx-textarea';

/**
 * Extract component name from tag (removes 'hx-' prefix).
 */
type ComponentName<T extends HxComponentTag> = T extends `hx-${infer Name}` ? Name : never;

type ButtonName = ComponentName<'hx-button'>; // 'button'
type CardName = ComponentName<'hx-card'>; // 'card'

/**
 * Component class name from tag name.
 */
type ComponentClassName<T extends HxComponentTag> = `Helix${Capitalize<ComponentName<T>>}`;

type ButtonClass = ComponentClassName<'hx-button'>; // 'HelixButton'
type CheckboxClass = ComponentClassName<'hx-checkbox'>; // 'HelixCheckbox'

/**
 * Type-safe component registry.
 */
interface ComponentRegistry {
  'hx-button': HTMLElementTagNameMap['hx-button'];
  'hx-card': HTMLElementTagNameMap['hx-card'];
  'hx-checkbox': HTMLElementTagNameMap['hx-checkbox'];
  'hx-select': HTMLElementTagNameMap['hx-select'];
  'hx-text-input': HTMLElementTagNameMap['hx-text-input'];
  'hx-textarea': HTMLElementTagNameMap['hx-textarea'];
}

/**
 * Type-safe querySelector for HELIX components.
 */
function queryComponent<T extends HxComponentTag>(selector: T): ComponentRegistry[T] | null {
  return document.querySelector(selector);
}

// Usage: return type is automatically inferred
const button = queryComponent('hx-button'); // Type: HelixButton | null
const checkbox = queryComponent('hx-checkbox'); // Type: HelixCheckbox | null
```

## Utility Types

Utility types are reusable type transformations that solve common patterns. TypeScript provides many built-in utilities, and you can create custom ones using conditional and mapped types.

### Built-in Utility Types

```typescript
/**
 * Partial<T> - Makes all properties optional.
 */
interface HxSelectProps {
  label: string;
  placeholder: string;
  value: string;
  required: boolean;
  disabled: boolean;
}

type PartialSelectProps = Partial<HxSelectProps>;
// All properties are optional

/**
 * Required<T> - Makes all properties required.
 */
type RequiredSelectProps = Required<PartialSelectProps>;
// All properties are required again

/**
 * Readonly<T> - Makes all properties readonly.
 */
type ReadonlySelectProps = Readonly<HxSelectProps>;
// Cannot modify any properties

/**
 * Pick<T, K> - Selects specific properties.
 */
type DisplayProps = Pick<HxSelectProps, 'label' | 'placeholder'>;
// Result: { label: string; placeholder: string }

/**
 * Omit<T, K> - Excludes specific properties.
 */
type PublicProps = Omit<HxSelectProps, 'value'>;
// All properties except 'value'

/**
 * Record<K, T> - Creates object type with specific keys and value type.
 */
type ErrorMessages = Record<string, string>;
// { [key: string]: string }

type FormErrors = Record<'email' | 'password' | 'username', string[]>;
// { email: string[]; password: string[]; username: string[] }

/**
 * Exclude<T, U> - Excludes types from union.
 */
type AllSizes = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonSizes = Exclude<AllSizes, 'xs' | 'xl'>;
// Result: 'sm' | 'md' | 'lg'

/**
 * Extract<T, U> - Extracts types from union.
 */
type InteractiveSizes = Extract<AllSizes, 'sm' | 'md' | 'lg'>;
// Result: 'sm' | 'md' | 'lg'

/**
 * NonNullable<T> - Removes null and undefined.
 */
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>;
// Result: string

/**
 * ReturnType<T> - Extracts function return type.
 */
type ValidationFn = () => Promise<{ valid: boolean; errors: string[] }>;
type ValidationResult = ReturnType<ValidationFn>;
// Result: Promise<{ valid: boolean; errors: string[] }>

/**
 * Parameters<T> - Extracts function parameter types as tuple.
 */
type HandlerFn = (event: MouseEvent, metadata: { timestamp: number }) => void;
type HandlerParams = Parameters<HandlerFn>;
// Result: [event: MouseEvent, metadata: { timestamp: number }]
```

### Custom Utility Types for HELIX

```typescript
/**
 * Requires specific properties while keeping others optional.
 */
type RequireProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

interface FormFieldProps {
  label?: string;
  value?: string;
  name?: string;
  required?: boolean;
}

type RequiredFormField = RequireProps<FormFieldProps, 'label' | 'name'>;
// label and name are required, value and required remain optional

/**
 * Makes specific properties optional while keeping others required.
 */
type PartialProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

interface StrictButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
  type: 'button' | 'submit' | 'reset';
}

type FlexibleButtonProps = PartialProps<StrictButtonProps, 'size' | 'disabled' | 'type'>;
// variant is required, size/disabled/type are optional

/**
 * Extracts property names that match a specific type.
 */
type PropsOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

type BooleanPropNames = PropsOfType<HxCheckboxProps, boolean>;
// Result: 'checked' | 'indeterminate' | 'disabled' | 'required'

type StringPropNames = PropsOfType<HxCheckboxProps, string>;
// Result: 'label' | 'value' | 'name'

/**
 * Creates a type-safe property updater.
 */
type PropUpdater<T> = {
  [K in keyof T]: (value: T[K]) => void;
};

type CheckboxUpdaters = PropUpdater<HxCheckboxProps>;
// Result: {
//   checked: (value: boolean) => void;
//   indeterminate: (value: boolean) => void;
//   disabled: (value: boolean) => void;
//   label: (value: string) => void;
//   ...
// }

/**
 * Ensures at least one property from a set is required.
 */
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

interface LinkOrButton {
  href?: string;
  onClick?: () => void;
}

type ValidInteraction = RequireAtLeastOne<LinkOrButton, 'href' | 'onClick'>;
// Must have either href or onClick (or both)

/**
 * Ensures exactly one property from a set is present.
 */
type ExactlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, never>>;
  }[Keys];

type ExactInteraction = ExactlyOne<LinkOrButton, 'href' | 'onClick'>;
// Must have exactly one: href XOR onClick
```

### Practical Example: Form Field Type System

```typescript
/**
 * Base form field properties.
 */
interface BaseFieldProps {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
}

/**
 * Text input specific properties.
 */
interface TextInputProps extends BaseFieldProps {
  type: 'text' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  autocomplete?: string;
}

/**
 * Checkbox specific properties.
 */
interface CheckboxProps extends BaseFieldProps {
  checked: boolean;
  indeterminate?: boolean;
  value?: string;
}

/**
 * Select specific properties.
 */
interface SelectProps extends BaseFieldProps {
  value: string;
  placeholder?: string;
  multiple?: boolean;
}

/**
 * Discriminated union of all field types.
 */
type FormFieldProps = TextInputProps | CheckboxProps | SelectProps;

/**
 * Extract common properties across all field types.
 */
type CommonFieldProps = Pick<
  BaseFieldProps,
  'name' | 'label' | 'required' | 'disabled' | 'error' | 'helpText'
>;

/**
 * Extract properties unique to each field type.
 */
type UniqueTextProps = Omit<TextInputProps, keyof BaseFieldProps>;
type UniqueCheckboxProps = Omit<CheckboxProps, keyof BaseFieldProps>;
type UniqueSelectProps = Omit<SelectProps, keyof BaseFieldProps>;

/**
 * Type-safe field factory.
 */
function createField<T extends FormFieldProps>(props: T): T {
  return props;
}

// Usage: TypeScript infers the specific field type
const emailField = createField({
  name: 'email',
  label: 'Email Address',
  type: 'email',
  required: true,
  placeholder: 'you@example.com',
} satisfies TextInputProps);

const agreeField = createField({
  name: 'agree',
  label: 'I agree to terms',
  checked: false,
  required: true,
} satisfies CheckboxProps);
```

## Type Guards

Type guards are runtime checks that narrow types within a conditional block. They enable you to safely work with union types and unknown values while maintaining type safety.

### Built-in Type Guards

```typescript
/**
 * typeof type guard for primitives.
 */
function processValue(value: string | number): string {
  if (typeof value === 'string') {
    return value.toUpperCase(); // TypeScript knows value is string
  }
  return value.toFixed(2); // TypeScript knows value is number
}

/**
 * instanceof type guard for class instances.
 */
function handleElement(element: Element | null): void {
  if (element instanceof HTMLInputElement) {
    console.log(element.value); // TypeScript knows element is HTMLInputElement
  } else if (element instanceof HTMLButtonElement) {
    console.log(element.disabled); // TypeScript knows element is HTMLButtonElement
  }
}

/**
 * in operator for property checks.
 */
interface HxButton {
  variant: string;
  click(): void;
}

interface HxCard {
  elevation: string;
  navigate(): void;
}

function interact(component: HxButton | HxCard): void {
  if ('click' in component) {
    component.click(); // TypeScript knows component is HxButton
  } else {
    component.navigate(); // TypeScript knows component is HxCard
  }
}
```

### Custom Type Guards

Custom type guards use the `is` type predicate to tell TypeScript that a value is a specific type when the function returns true:

```typescript
/**
 * Type guard for HELIX button elements.
 */
function isHxButton(element: Element): element is HTMLElementTagNameMap['hx-button'] {
  return element.tagName.toLowerCase() === 'hx-button';
}

// Usage
const elements = document.querySelectorAll('[disabled]');
elements.forEach((el) => {
  if (isHxButton(el)) {
    console.log(el.variant); // TypeScript knows el is HelixButton
  }
});

/**
 * Type guard for form-associated elements.
 */
interface FormAssociated {
  form: HTMLFormElement | null;
  name: string;
  disabled: boolean;
}

function isFormAssociated(element: unknown): element is FormAssociated {
  return (
    typeof element === 'object' &&
    element !== null &&
    'form' in element &&
    'name' in element &&
    'disabled' in element
  );
}

// Usage
function getFormFields(form: HTMLFormElement): FormAssociated[] {
  const elements = Array.from(form.elements);
  return elements.filter(isFormAssociated);
}

/**
 * Type guard for checking if element has a specific property.
 */
function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K,
): obj is T & Record<K, unknown> {
  return key in obj;
}

// Usage
const component: unknown = document.querySelector('hx-checkbox');

if (hasProperty(component, 'checked')) {
  console.log(component.checked); // TypeScript knows component has 'checked' property
}

/**
 * Type guard for non-null values.
 */
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Usage: Filter out null/undefined from arrays
const maybeElements = [
  document.querySelector('hx-button'),
  document.querySelector('hx-checkbox'),
  document.querySelector('hx-select'),
];

const definiteElements = maybeElements.filter(isDefined);
// Type: Element[] (no null values)
```

### Assertion Functions

Assertion functions throw errors if a condition is false, allowing TypeScript to narrow types in the code that follows:

```typescript
/**
 * Asserts that a value is defined.
 */
function assertDefined<T>(value: T, message?: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Value must be defined');
  }
}

// Usage
const button = document.querySelector('hx-button');
assertDefined(button, 'Button not found');
// After this line, TypeScript knows button is not null
console.log(button.variant);

/**
 * Asserts that an element is a specific HELIX component.
 */
function assertHxButton(
  element: Element | null,
): asserts element is HTMLElementTagNameMap['hx-button'] {
  if (!element || element.tagName.toLowerCase() !== 'hx-button') {
    throw new Error('Element is not an hx-button');
  }
}

// Usage
const el = document.querySelector('#submit-btn');
assertHxButton(el);
// After this line, TypeScript knows el is HelixButton
el.variant = 'primary';

/**
 * Asserts that a value is a string.
 */
function assertString(value: unknown, name?: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`${name ?? 'Value'} must be a string`);
  }
}

// Usage
function processInput(input: unknown): string {
  assertString(input, 'Input');
  // TypeScript now knows input is string
  return input.toUpperCase();
}
```

### Practical Example: Event Handler Type Guards

```typescript
/**
 * Event detail type map.
 */
interface HxEventMap {
  'hx-click': { originalEvent: MouseEvent };
  'hx-change': { checked: boolean; value: string };
  'hx-input': { value: string };
  'hx-select': { value: string; label: string };
}

/**
 * Type guard for specific HELIX events.
 */
function isHxEvent<K extends keyof HxEventMap>(
  event: Event,
  eventType: K,
): event is CustomEvent<HxEventMap[K]> {
  return event.type === eventType && event instanceof CustomEvent;
}

// Usage in event listener
document.addEventListener('hx-change', (event) => {
  if (isHxEvent(event, 'hx-change')) {
    // TypeScript knows event.detail has { checked: boolean; value: string }
    console.log(event.detail.checked);
    console.log(event.detail.value);
  }
});

/**
 * Type guard for mouse events.
 */
function isMouseEvent(event: Event): event is MouseEvent {
  return event instanceof MouseEvent;
}

/**
 * Type guard for keyboard events.
 */
function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return event instanceof KeyboardEvent;
}

/**
 * Combined type guard for user interaction events.
 */
function isInteractionEvent(event: Event): event is MouseEvent | KeyboardEvent {
  return isMouseEvent(event) || isKeyboardEvent(event);
}

// Usage
function handleUserInteraction(event: Event): void {
  if (isInteractionEvent(event)) {
    event.preventDefault(); // Both MouseEvent and KeyboardEvent have preventDefault

    if (isMouseEvent(event)) {
      console.log('Mouse click at', event.clientX, event.clientY);
    } else {
      console.log('Key pressed:', event.key);
    }
  }
}
```

## Discriminated Unions

Discriminated unions (also called tagged unions) are union types where each member has a common property with a unique literal type. This discriminant property allows TypeScript to narrow the union to a specific member.

### Basic Discriminated Unions

```typescript
/**
 * Form field state with discriminant 'status'.
 */
type FieldState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'valid'; timestamp: number }
  | { status: 'invalid'; errors: string[] };

function displayFieldStatus(state: FieldState): string {
  switch (state.status) {
    case 'idle':
      return 'Not yet validated';
    case 'validating':
      return 'Validating...';
    case 'valid':
      // TypeScript knows state has timestamp
      return `Valid (checked at ${new Date(state.timestamp).toISOString()})`;
    case 'invalid':
      // TypeScript knows state has errors
      return `Invalid: ${state.errors.join(', ')}`;
  }
}
```

### Discriminated Unions for Component State

```typescript
/**
 * Component loading state.
 */
type LoadingState<T> =
  | { state: 'loading' }
  | { state: 'loaded'; data: T }
  | { state: 'error'; error: Error };

function renderData<T>(loading: LoadingState<T>, render: (data: T) => string): string {
  switch (loading.state) {
    case 'loading':
      return '<div>Loading...</div>';
    case 'loaded':
      // TypeScript knows loading has data of type T
      return render(loading.data);
    case 'error':
      // TypeScript knows loading has error
      return `<div class="error">${loading.error.message}</div>`;
  }
}

// Usage
type User = { id: number; name: string; email: string };
const userState: LoadingState<User> = {
  state: 'loaded',
  data: { id: 1, name: 'Jane', email: 'jane@example.com' },
};

const html = renderData(
  userState,
  (user) => `
  <div>
    <h2>${user.name}</h2>
    <p>${user.email}</p>
  </div>
`,
);
```

### Complex Discriminated Unions

```typescript
/**
 * Form submission result with multiple discriminants.
 */
type SubmissionResult =
  | { success: true; id: string; timestamp: number }
  | { success: false; type: 'validation'; errors: Record<string, string[]> }
  | { success: false; type: 'network'; statusCode: number; message: string }
  | { success: false; type: 'server'; message: string; stack?: string };

function handleSubmission(result: SubmissionResult): void {
  if (result.success) {
    console.log(`Submitted successfully with ID ${result.id}`);
    return;
  }

  // result.success is false, check type
  switch (result.type) {
    case 'validation':
      // TypeScript knows result has errors
      Object.entries(result.errors).forEach(([field, errors]) => {
        console.error(`${field}: ${errors.join(', ')}`);
      });
      break;
    case 'network':
      // TypeScript knows result has statusCode and message
      console.error(`Network error (${result.statusCode}): ${result.message}`);
      break;
    case 'server':
      // TypeScript knows result has message and optional stack
      console.error(`Server error: ${result.message}`);
      if (result.stack) {
        console.error(result.stack);
      }
      break;
  }
}
```

### Discriminated Unions for Event Handling

```typescript
/**
 * User interaction events with discriminant 'type'.
 */
type UserInteraction =
  | { type: 'click'; element: HTMLElement; coordinates: { x: number; y: number } }
  | { type: 'input'; element: HTMLInputElement; value: string; previousValue: string }
  | { type: 'select'; element: HTMLSelectElement; selectedIndex: number; value: string }
  | { type: 'check'; element: HTMLInputElement; checked: boolean };

function logInteraction(interaction: UserInteraction): void {
  switch (interaction.type) {
    case 'click':
      console.log(
        `Clicked on ${interaction.element.tagName} at (${interaction.coordinates.x}, ${interaction.coordinates.y})`,
      );
      break;
    case 'input':
      console.log(`Input changed from "${interaction.previousValue}" to "${interaction.value}"`);
      break;
    case 'select':
      console.log(`Selected option ${interaction.selectedIndex}: ${interaction.value}`);
      break;
    case 'check':
      console.log(`Checkbox ${interaction.checked ? 'checked' : 'unchecked'}`);
      break;
  }
}

/**
 * Component lifecycle events with discriminant 'phase'.
 */
type LifecycleEvent =
  | { phase: 'mount'; element: HTMLElement }
  | { phase: 'update'; element: HTMLElement; changedProperties: string[] }
  | { phase: 'unmount'; element: HTMLElement; reason: 'removed' | 'disconnected' };

function handleLifecycle(event: LifecycleEvent): void {
  console.log(`[${event.phase}] ${event.element.tagName}`);

  if (event.phase === 'update') {
    console.log(`Changed properties: ${event.changedProperties.join(', ')}`);
  }

  if (event.phase === 'unmount') {
    console.log(`Unmount reason: ${event.reason}`);
  }
}
```

### Practical Example: Form Field Union Types

```typescript
/**
 * Discriminated union for different form field types.
 */
type FormField =
  | {
      type: 'text';
      name: string;
      label: string;
      value: string;
      placeholder?: string;
      maxLength?: number;
    }
  | {
      type: 'checkbox';
      name: string;
      label: string;
      checked: boolean;
      value?: string;
    }
  | {
      type: 'select';
      name: string;
      label: string;
      value: string;
      options: Array<{ value: string; label: string }>;
      multiple?: boolean;
    }
  | {
      type: 'textarea';
      name: string;
      label: string;
      value: string;
      rows?: number;
      cols?: number;
    };

/**
 * Type-safe field renderer using discriminated union.
 */
function renderField(field: FormField): string {
  const baseAttrs = `name="${field.name}"`;
  const label = `<label>${field.label}</label>`;

  switch (field.type) {
    case 'text':
      return `
        ${label}
        <hx-text-input
          ${baseAttrs}
          value="${field.value}"
          placeholder="${field.placeholder ?? ''}"
          ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
        ></hx-text-input>
      `;

    case 'checkbox':
      return `
        <hx-checkbox
          ${baseAttrs}
          label="${field.label}"
          ${field.checked ? 'checked' : ''}
          value="${field.value ?? 'on'}"
        ></hx-checkbox>
      `;

    case 'select':
      const options = field.options
        .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
        .join('\n');
      return `
        ${label}
        <hx-select ${baseAttrs} ${field.multiple ? 'multiple' : ''}>
          ${options}
        </hx-select>
      `;

    case 'textarea':
      return `
        ${label}
        <hx-textarea
          ${baseAttrs}
          ${field.rows ? `rows="${field.rows}"` : ''}
          ${field.cols ? `cols="${field.cols}"` : ''}
        >${field.value}</hx-textarea>
      `;
  }
}

/**
 * Type-safe field validator.
 */
function validateField(field: FormField): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (field.type) {
    case 'text':
      if (!field.value.trim()) {
        errors.push('Field is required');
      }
      if (field.maxLength && field.value.length > field.maxLength) {
        errors.push(`Maximum ${field.maxLength} characters allowed`);
      }
      break;

    case 'checkbox':
      // Checkbox validation logic (if required)
      break;

    case 'select':
      if (!field.value) {
        errors.push('Please select an option');
      }
      if (field.multiple && !field.value) {
        errors.push('Please select at least one option');
      }
      break;

    case 'textarea':
      if (!field.value.trim()) {
        errors.push('Field is required');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extract field value based on type.
 */
function getFieldValue(field: FormField): string | boolean {
  switch (field.type) {
    case 'text':
    case 'select':
    case 'textarea':
      return field.value;
    case 'checkbox':
      return field.checked;
  }
}
```

## Combining Advanced Patterns

Advanced TypeScript patterns are most powerful when combined. Here's a comprehensive example that uses multiple patterns together:

```typescript
/**
 * Component property configuration using discriminated unions.
 */
type ComponentConfig =
  | {
      component: 'hx-button';
      variant: 'primary' | 'secondary' | 'ghost';
      size: 'sm' | 'md' | 'lg';
      disabled?: boolean;
    }
  | {
      component: 'hx-checkbox';
      checked: boolean;
      indeterminate?: boolean;
      required?: boolean;
    }
  | {
      component: 'hx-select';
      value: string;
      options: Array<{ value: string; label: string }>;
      multiple?: boolean;
    };

/**
 * Extract component tag name from config.
 */
type ComponentTag<T extends ComponentConfig> = T['component'];

/**
 * Extract props for a specific component using conditional types.
 */
type ComponentProps<T extends ComponentConfig['component']> = Extract<
  ComponentConfig,
  { component: T }
>;

type ButtonProps = ComponentProps<'hx-button'>;
// Result: { component: 'hx-button'; variant: ...; size: ...; disabled?: boolean }

type CheckboxProps = ComponentProps<'hx-checkbox'>;
// Result: { component: 'hx-checkbox'; checked: boolean; ... }

/**
 * Create mapped type for component attributes.
 */
type ComponentAttributes<T extends ComponentConfig> = {
  [K in keyof T as K extends 'component' ? never : K]: T[K];
};

type ButtonAttributes = ComponentAttributes<ComponentProps<'hx-button'>>;
// Result: { variant: ...; size: ...; disabled?: boolean } (no 'component' key)

/**
 * Type-safe component factory with discriminated unions.
 */
function createComponent<T extends ComponentConfig['component']>(
  type: T,
  props: Omit<ComponentProps<T>, 'component'>,
): Element {
  const element = document.createElement(type);

  // Type guard to narrow config type
  if (type === 'hx-button' && 'variant' in props) {
    const button = element as HTMLElementTagNameMap['hx-button'];
    button.variant = props.variant;
    button.size = props.size;
    if (props.disabled) button.disabled = props.disabled;
  } else if (type === 'hx-checkbox' && 'checked' in props) {
    const checkbox = element as HTMLElementTagNameMap['hx-checkbox'];
    checkbox.checked = props.checked;
    if (props.indeterminate) checkbox.indeterminate = props.indeterminate;
    if (props.required) checkbox.required = props.required;
  } else if (type === 'hx-select' && 'value' in props) {
    const select = element as HTMLElementTagNameMap['hx-select'];
    select.value = props.value;
    // Add options...
  }

  return element;
}

// Usage: TypeScript enforces correct props for each component type
const button = createComponent('hx-button', {
  variant: 'primary',
  size: 'md',
  disabled: false,
});

const checkbox = createComponent('hx-checkbox', {
  checked: true,
  required: true,
});

// ❌ Type error: 'variant' is not valid for hx-checkbox
// const invalid = createComponent('hx-checkbox', {
//   variant: 'primary',
// });
```

## Best Practices

### 1. Use Conditional Types for Type Relationships

```typescript
// ✓ Good: Conditional type that adapts to input
type ArrayOrSingle<T> = T extends Array<infer U> ? U[] : T[];

// ❌ Bad: Separate types that duplicate logic
type ArrayOfStrings = string[];
type ArrayOfNumbers = number[];
```

### 2. Leverage Mapped Types for Transformations

```typescript
// ✓ Good: Single mapped type handles all properties
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// ❌ Bad: Manual transformation for each property
type NullableButton = {
  variant: 'primary' | 'secondary' | null;
  size: 'sm' | 'md' | 'lg' | null;
  disabled: boolean | null;
};
```

### 3. Use Template Literals for String Patterns

```typescript
// ✓ Good: Template literal enforces naming convention
type EventName = `hx-${string}`;

// ❌ Bad: Unconstrained string allows typos
type EventName = string;
```

### 4. Create Custom Type Guards for Runtime Safety

```typescript
// ✓ Good: Type guard provides runtime and compile-time safety
function isHxButton(el: Element): el is HTMLElementTagNameMap['hx-button'] {
  return el.tagName.toLowerCase() === 'hx-button';
}

// ❌ Bad: Type assertion bypasses type checking
const button = document.querySelector('hx-button') as HTMLElementTagNameMap['hx-button'];
```

### 5. Use Discriminated Unions for State Management

```typescript
// ✓ Good: Discriminated union ensures valid state combinations
type LoadState<T> =
  | { status: 'loading' }
  | { status: 'loaded'; data: T }
  | { status: 'error'; error: Error };

// ❌ Bad: Separate optionals allow invalid combinations
type LoadState<T> = {
  status: 'loading' | 'loaded' | 'error';
  data?: T;
  error?: Error;
};
// Problem: Can have status='loaded' with no data, or status='error' with no error
```

### 6. Combine Utility Types for Complex Transformations

```typescript
// ✓ Good: Compose utility types for precise transformations
type PublicAPI<T> = Readonly<Pick<T, PublicKeys<T>>>;

// ❌ Bad: Manually specify every transformation
type PublicButtonAPI = {
  readonly variant: 'primary' | 'secondary' | 'ghost';
  readonly size: 'sm' | 'md' | 'lg';
  readonly disabled: boolean;
};
```

## Related Topics

- **[TypeScript Generics](/components/typescript/generics)** - Foundation for conditional types and type parameters
- **[Typing Components](/components/typescript/typing-components)** - Applying type patterns to web components
- **[Type-Safe Events](/components/events/typed-events)** - Using advanced types for event handling
- **[Form Type Safety](/components/forms/type-safety)** - Discriminated unions and mapped types for forms

## References

### Official TypeScript Documentation

- [TypeScript Documentation: Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html)
- [TypeScript Documentation: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript Documentation: Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript Documentation: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Documentation: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

### Community Resources

- [TypeScript's Powerful Type Inference with Conditional Types and String Literals](https://egghead.io/blog/typescript-s-powerful-type-inference-with-conditional-types-and-string-literals)
- [TypeScript and Advanced Type Manipulation: Mapped Types, Template Literal Types, and More](https://medium.com/@ignatovich.dm/typescript-and-advanced-type-manipulation-mapped-types-template-literal-types-and-more-cc22533bc15d)
- [Conditional Types and Mapped Types in TypeScript](https://codefinity.com/blog/Conditional-Types-and-Mapped-Types-in-TypeScript)
- [Mastering TypeScript: Advanced Patterns for Safer Frontend Code](https://www.javacodegeeks.com/2025/09/mastering-typescript-advanced-patterns-for-safer-frontend-code.html)
- [Understanding TypeScript Type Guards](https://betterstack.com/community/guides/scaling-nodejs/typescript-type-guards/)
- [Understanding the discriminated union pattern](https://learntypescript.dev/07/l8-discriminated-union/)
- [Discriminated Unions | TypeScript Deep Dive](https://basarat.gitbook.io/typescript/type-system/discriminated-unions)
- [Making TypeScript More Flexible: Generics and Discriminated Unions](https://blog.designly.biz/making-typescript-more-flexible-generics-and-discriminated-unions)

---

**Next Steps**: Apply these advanced patterns to your HELIX components. Start with conditional types for event handling, then add mapped types for property transformations. Use discriminated unions for complex state management and type guards for runtime safety.
