import { resolve } from 'node:path';
import { GitOperations, SafeFileOperations, MCPError, ErrorCategory } from '@helix/mcp-shared';

const PROJECT_ROOT = resolve(process.cwd(), '../..');
const CEM_PATH = 'packages/hx-library/custom-elements.json';

const git = new GitOperations(PROJECT_ROOT);
const fileOps = new SafeFileOperations(PROJECT_ROOT);

interface CemMember {
  name: string;
  kind: string;
  type?: { text?: string };
  description?: string;
}

interface CemEvent {
  name: string;
  type?: { text?: string };
  description?: string;
}

interface CemSlot {
  name: string;
  description?: string;
}

interface CemCssProperty {
  name: string;
  description?: string;
}

interface CemCssPart {
  name: string;
  description?: string;
}

interface CemComponent {
  tagName: string;
  name: string;
  members?: CemMember[];
  events?: CemEvent[];
  slots?: CemSlot[];
  cssProperties?: CemCssProperty[];
  cssParts?: CemCssPart[];
  description?: string;
}

export async function parseCem(tagName: string): Promise<CemComponent> {
  if (!fileOps.fileExists(CEM_PATH)) {
    throw new MCPError(`CEM file not found. Run 'npm run cem' first.`, ErrorCategory.UserInput);
  }

  const cemContent = fileOps.readFile(CEM_PATH);
  const cem = JSON.parse(cemContent);

  const component = cem.modules
    ?.flatMap((m: { declarations: CemComponent[] }) => m.declarations || [])
    .find((d: CemComponent) => d.tagName === tagName);

  if (!component) {
    throw new Error(
      `Component ${tagName} not found in CEM. Available components: ${await listAllComponents().then((c) => c.join(', '))}`,
    );
  }

  return {
    tagName: component.tagName,
    name: component.name,
    description: component.description || '',
    members: component.members || [],
    events: component.events || [],
    slots: component.slots || [],
    cssProperties: component.cssProperties || [],
    cssParts: component.cssParts || [],
  };
}

export async function diffCem(
  tagName: string,
  baseBranch: string,
): Promise<{
  breaking: string[];
  added: string[];
  removed: string[];
  changed: string[];
}> {
  const baseComponent = await git.withBranch(baseBranch, async () => {
    if (!fileOps.fileExists(CEM_PATH)) {
      return null;
    }

    const baseContent = fileOps.readFile(CEM_PATH);
    const baseCem = JSON.parse(baseContent);
    return baseCem.modules
      ?.flatMap((m: { declarations: CemComponent[] }) => m.declarations || [])
      .find((d: CemComponent) => d.tagName === tagName);
  });

  // Read current CEM
  const currentComponent = await parseCem(tagName);

  // Calculate differences
  const breaking: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  if (!baseComponent) {
    // Component is new
    added.push(`New component: ${tagName}`);
    return { breaking, added, removed, changed };
  }

  // Check properties
  const baseProps = new Set((baseComponent.members || []).map((m: CemMember) => m.name));
  const currentProps = new Set(currentComponent.members?.map((m) => m.name) || []);

  // Removed properties = BREAKING
  baseComponent.members?.forEach((m: CemMember) => {
    if (!currentProps.has(m.name)) {
      breaking.push(`Property removed: ${m.name}`);
    }
  });

  // Added properties
  currentComponent.members?.forEach((m) => {
    if (!baseProps.has(m.name)) {
      added.push(`Property added: ${m.name}`);
    }
  });

  // Check events
  const baseEvents = new Set((baseComponent.events || []).map((e: CemEvent) => e.name));
  const currentEvents = new Set(currentComponent.events?.map((e) => e.name) || []);

  // Removed events = BREAKING
  baseComponent.events?.forEach((e: CemEvent) => {
    if (!currentEvents.has(e.name)) {
      breaking.push(`Event removed: ${e.name}`);
    }
  });

  // Added events
  currentComponent.events?.forEach((e) => {
    if (!baseEvents.has(e.name)) {
      added.push(`Event added: ${e.name}`);
    }
  });

  // Check slots
  const baseSlots = new Set((baseComponent.slots || []).map((s: CemSlot) => s.name));
  const currentSlots = new Set(currentComponent.slots?.map((s) => s.name) || []);

  // Removed slots = BREAKING
  baseComponent.slots?.forEach((s: CemSlot) => {
    if (!currentSlots.has(s.name)) {
      breaking.push(`Slot removed: ${s.name}`);
    }
  });

  // Added slots
  currentComponent.slots?.forEach((s) => {
    if (!baseSlots.has(s.name)) {
      added.push(`Slot added: ${s.name}`);
    }
  });

  return { breaking, added, removed, changed };
}

export async function listAllComponents(): Promise<string[]> {
  if (!fileOps.fileExists(CEM_PATH)) {
    throw new MCPError(`CEM file not found. Run 'npm run cem' first.`, ErrorCategory.UserInput);
  }

  const cemContent = fileOps.readFile(CEM_PATH);
  const cem = JSON.parse(cemContent);

  const components = cem.modules
    ?.flatMap((m: { declarations: CemComponent[] }) => m.declarations || [])
    .filter((d: CemComponent) => d.tagName)
    .map((d: CemComponent) => d.tagName);

  return components || [];
}

export async function validateCompleteness(
  tagName: string,
): Promise<{ isValid: boolean; score: number; issues: string[] }> {
  const component = await parseCem(tagName);

  const issues: string[] = [];
  let score = 100;

  // Check for component description
  if (!component.description || component.description.trim().length === 0) {
    issues.push('Missing component description');
    score -= 10;
  }

  // Check for documented properties
  if (!component.members || component.members.length === 0) {
    issues.push('No properties documented');
    score -= 20;
  } else {
    // Check if properties have descriptions
    const undocumentedProps = component.members.filter((m) => !m.description);
    if (undocumentedProps.length > 0) {
      issues.push(
        `${undocumentedProps.length} properties missing descriptions: ${undocumentedProps.map((m) => m.name).join(', ')}`,
      );
      score -= undocumentedProps.length * 5;
    }
  }

  // Check for documented events
  if (component.events && component.events.length > 0) {
    const undocumentedEvents = component.events.filter((e) => !e.description);
    if (undocumentedEvents.length > 0) {
      issues.push(
        `${undocumentedEvents.length} events missing descriptions: ${undocumentedEvents.map((e) => e.name).join(', ')}`,
      );
      score -= undocumentedEvents.length * 5;
    }
  }

  // Check for CSS properties
  if (component.cssProperties && component.cssProperties.length > 0) {
    const undocumentedCssProps = component.cssProperties.filter((p) => !p.description);
    if (undocumentedCssProps.length > 0) {
      issues.push(`${undocumentedCssProps.length} CSS properties missing descriptions`);
      score -= undocumentedCssProps.length * 3;
    }
  }

  // Check for CSS parts
  if (component.cssParts && component.cssParts.length > 0) {
    const undocumentedParts = component.cssParts.filter((p) => !p.description);
    if (undocumentedParts.length > 0) {
      issues.push(`${undocumentedParts.length} CSS parts missing descriptions`);
      score -= undocumentedParts.length * 3;
    }
  }

  return {
    isValid: issues.length === 0,
    score: Math.max(0, score),
    issues,
  };
}
