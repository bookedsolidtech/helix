export interface ComponentEntry {
  name: string;
  description: string;
  tags: readonly string[];
}

const COMPONENT_REGISTRY: readonly ComponentEntry[] = [
  {
    name: 'hx-button',
    description: 'Interactive button with multiple variants and sizes',
    tags: ['form', 'action'],
  },
  {
    name: 'hx-card',
    description: 'Content container with optional header, body, and footer slots',
    tags: ['layout', 'container'],
  },
  {
    name: 'hx-text-input',
    description: 'Accessible text input with label, hint, and error state support',
    tags: ['form', 'input'],
  },
  {
    name: 'hx-select',
    description: 'Dropdown selection control with keyboard navigation',
    tags: ['form', 'input'],
  },
  {
    name: 'hx-checkbox',
    description: 'Checkbox with indeterminate state and form association',
    tags: ['form', 'input'],
  },
  {
    name: 'hx-avatar',
    description: 'User or entity avatar with image, initials, and icon fallback',
    tags: ['display', 'identity'],
  },
  {
    name: 'hx-badge',
    description: 'Status indicator badge with semantic color variants',
    tags: ['display', 'status'],
  },
  {
    name: 'hx-spinner',
    description: 'Loading spinner with accessible label and size variants',
    tags: ['feedback', 'loading'],
  },
] as const;

export function getAvailableComponents(): readonly ComponentEntry[] {
  return COMPONENT_REGISTRY;
}

export function getAvailableComponentNames(): readonly string[] {
  return COMPONENT_REGISTRY.map((c) => c.name);
}

export function getComponentDescription(name: string): string {
  const entry = COMPONENT_REGISTRY.find((c) => c.name === name);
  return entry?.description ?? `Component: ${name}`;
}

export function findComponent(name: string): ComponentEntry | undefined {
  return COMPONENT_REGISTRY.find((c) => c.name === name);
}

export function isValidComponent(name: string): boolean {
  return COMPONENT_REGISTRY.some((c) => c.name === name);
}
