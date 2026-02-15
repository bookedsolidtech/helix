/**
 * Drupal Integration Readiness Analyzer.
 * Static analysis checklist verifying components work in Drupal's
 * Twig templates, JS lifecycle, and asset loading patterns.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getComponentDirectory, getComponentData } from "./cem-parser";

export interface DrupalReadinessResult {
  tagName: string;
  score: number;
  checks: DrupalCheck[];
  totalChecks: number;
  passedChecks: number;
  detail: string;
}

export interface DrupalCheck {
  name: string;
  passed: boolean;
  detail: string;
  weight: number;
}

function getLibraryRoot(): string {
  return resolve(process.cwd(), "../../packages/hx-library");
}

function readSource(tagName: string): string | null {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const sourcePath = resolve(libRoot, `src/components/${dir}/${tagName}.ts`);
  try {
    return readFileSync(sourcePath, "utf-8");
  } catch {
    return null;
  }
}

export function analyzeDrupalReadiness(tagName: string): DrupalReadinessResult | null {
  const source = readSource(tagName);
  if (!source) return null;

  const data = getComponentData(tagName);
  const checks: DrupalCheck[] = [];

  // 1. Self-registers via @customElement (no manual registration needed in Drupal)
  const hasSelfRegister = source.includes("@customElement(");
  checks.push({
    name: "Self-registration",
    passed: hasSelfRegister,
    detail: hasSelfRegister
      ? "Uses @customElement() decorator — auto-registers on import"
      : "Missing @customElement() — requires manual customElements.define()",
    weight: 2,
  });

  // 2. No framework-specific dependencies (React, Angular, Vue wrappers)
  const frameworkImports = source.match(
    /from\s+['"](?:react|@angular|vue|@vue|svelte|@svelte|solid-js)/g
  );
  checks.push({
    name: "No framework deps",
    passed: !frameworkImports,
    detail: frameworkImports
      ? `Framework imports found: ${frameworkImports.length}`
      : "No React/Angular/Vue/Svelte dependencies",
    weight: 2,
  });

  // 3. All properties have attribute mapping (works with declarative HTML in Twig)
  const propertyCount = data?.properties.length ?? 0;
  const attributeMapped = data?.properties.filter((p) => p.attribute).length ?? 0;
  const allMapped = propertyCount === 0 || attributeMapped === propertyCount;
  checks.push({
    name: "Attribute mapping",
    passed: allMapped,
    detail: allMapped
      ? `All ${propertyCount} properties have HTML attributes`
      : `${attributeMapped}/${propertyCount} properties have HTML attributes`,
    weight: 2,
  });

  // 4. No module-only APIs (top-level await, import.meta beyond standard)
  const hasTopLevelAwait = source.match(/^await\s/m);
  const hasImportMeta = source.match(/import\.meta\.(?!url)/);
  const moduleOnly = hasTopLevelAwait || hasImportMeta;
  checks.push({
    name: "No module-only APIs",
    passed: !moduleOnly,
    detail: moduleOnly
      ? `Module-only APIs: ${[hasTopLevelAwait && "top-level await", hasImportMeta && "import.meta"].filter(Boolean).join(", ")}`
      : "No top-level await or non-standard import.meta usage",
    weight: 1,
  });

  // 5. Events use composed: true (cross Shadow DOM boundary for Drupal behaviors)
  const eventDispatches = [...source.matchAll(/new\s+CustomEvent[^)]+\)/g)];
  const composedEvents = eventDispatches.filter((e) =>
    e[0].includes("composed: true") || e[0].includes("composed:true")
  );
  const eventsComposed =
    eventDispatches.length === 0 || composedEvents.length === eventDispatches.length;
  checks.push({
    name: "Composed events",
    passed: eventsComposed,
    detail: eventsComposed
      ? `${eventDispatches.length} event(s) use composed: true`
      : `${composedEvents.length}/${eventDispatches.length} events are composed`,
    weight: 2,
  });

  // 6. Form components use ElementInternals (native <form> submission)
  const isFormElement =
    source.includes("formAssociated") ||
    tagName.includes("input") ||
    tagName.includes("select") ||
    tagName.includes("textarea") ||
    tagName.includes("checkbox") ||
    tagName.includes("radio") ||
    tagName.includes("switch");
  const hasInternals = source.includes("attachInternals");
  const formPassed = !isFormElement || hasInternals;
  checks.push({
    name: "Form participation",
    passed: formPassed,
    detail: isFormElement
      ? hasInternals
        ? "ElementInternals form association"
        : "Form element missing attachInternals()"
      : "Not a form element (N/A)",
    weight: 2,
  });

  // Weighted scoring
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const passedWeight = checks.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 100;

  const passedChecks = checks.filter((c) => c.passed).length;

  return {
    tagName,
    score,
    checks,
    totalChecks: checks.length,
    passedChecks,
    detail: `${passedChecks}/${checks.length} Drupal compatibility checks passed`,
  };
}
