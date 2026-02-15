/**
 * Type Safety Analyzer.
 * Static analysis of component source for TypeScript strict compliance.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getComponentDirectory } from "./cem-parser";

export interface TypeSafetyResult {
  tagName: string;
  score: number;
  checks: TypeSafetyCheck[];
  totalChecks: number;
  passedChecks: number;
  tscClean?: boolean;
  tscErrors?: number;
}

export interface TypeSafetyCheck {
  name: string;
  passed: boolean;
  detail: string;
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

function stripComments(source: string): string {
  return source
    .replace(/\/\*\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*/g, "");
}

export function analyzeTypeSafety(tagName: string): TypeSafetyResult | null {
  const source = readSource(tagName);
  if (!source) return null;

  const codeOnly = stripComments(source);
  const checks: TypeSafetyCheck[] = [];

  // 1. No `any` type usage
  const anyMatches = codeOnly.match(/:\s*any\b|<any>|as\s+any\b/g);
  checks.push({
    name: "No `any` types",
    passed: !anyMatches,
    detail: anyMatches ? `${anyMatches.length} usage(s) of \`any\`` : "Zero `any` types",
  });

  // 2. No @ts-ignore or @ts-nocheck
  const tsIgnore = source.match(/@ts-ignore|@ts-nocheck/g);
  checks.push({
    name: "No @ts-ignore",
    passed: !tsIgnore,
    detail: tsIgnore ? `${tsIgnore.length} suppression(s)` : "No type suppressions",
  });

  // 3. No unsafe `as unknown as` casts
  const unsafeCasts = codeOnly.match(/as\s+unknown\s+as\b/g);
  checks.push({
    name: "No unsafe casts",
    passed: !unsafeCasts,
    detail: unsafeCasts ? `${unsafeCasts.length} unsafe cast(s)` : "No unsafe type casts",
  });

  // 4. All @property fields have explicit type annotations
  const propertyDecls = codeOnly.match(/@property\([^)]*\)\s*\n\s*\w+/g) || [];
  const typedProperties = codeOnly.match(/@property\([^)]*\)\s*\n\s*\w+\s*[:(]/g) || [];
  const allPropsTyped = propertyDecls.length === 0 || propertyDecls.length === typedProperties.length;
  checks.push({
    name: "Properties typed",
    passed: allPropsTyped,
    detail: allPropsTyped
      ? `All ${propertyDecls.length} properties have types`
      : `${typedProperties.length}/${propertyDecls.length} typed`,
  });

  // 5. Event dispatches use typed CustomEvent (not bare CustomEvent)
  const dispatches = source.match(/new\s+CustomEvent\s*[<(]/g) || [];
  const typedDispatches = source.match(/new\s+CustomEvent\s*</g) || [];
  // Bare dispatches are OK if there are none, or if all are typed via JSDoc
  const jsDocTypedEvents = source.match(/@fires\s+\{CustomEvent<[^>]+>\}/g) || [];
  const eventsTyped = dispatches.length === 0 ||
    typedDispatches.length === dispatches.length ||
    jsDocTypedEvents.length >= dispatches.length;
  checks.push({
    name: "Typed events",
    passed: eventsTyped,
    detail: eventsTyped
      ? `${dispatches.length} event(s) properly typed`
      : `${dispatches.length - typedDispatches.length} untyped dispatch(es)`,
  });

  // 6. Uses strict class field declarations (no uninitialized without !)
  // Check for proper `declare` or `!` on non-initialized fields
  const hasStrictFields = !codeOnly.match(/^\s+\w+\s*:\s*\w+\s*;\s*$/m);
  checks.push({
    name: "Strict fields",
    passed: hasStrictFields,
    detail: hasStrictFields ? "No loose field declarations" : "Has uninitialized fields without assertion",
  });

  // 7. ElementInternals properly typed
  const usesInternals = source.includes("attachInternals");
  const internalsTyped = !usesInternals || source.includes("ElementInternals");
  checks.push({
    name: "Internals typed",
    passed: internalsTyped,
    detail: usesInternals
      ? (internalsTyped ? "ElementInternals properly typed" : "attachInternals() without type")
      : "N/A (no internals)",
  });

  // 8. Return types on public methods
  const publicMethods = codeOnly.match(/^\s+(?:override\s+)?(?:render|focus|select|check\w+|report\w+)\s*\(/gm) || [];
  const typedMethods = codeOnly.match(/^\s+(?:override\s+)?(?:render|focus|select|check\w+|report\w+)\s*\([^)]*\)\s*:\s*\w+/gm) || [];
  const methodsTyped = publicMethods.length === 0 || typedMethods.length >= publicMethods.length;
  checks.push({
    name: "Return types",
    passed: methodsTyped,
    detail: methodsTyped
      ? `${publicMethods.length} public method(s) have return types`
      : `${publicMethods.length - typedMethods.length} method(s) missing return types`,
  });

  const passedChecks = checks.filter((c) => c.passed).length;
  const staticScore = checks.length > 0 ? Math.round((passedChecks / checks.length) * 100) : 100;

  // Try to read tsc output for verified compiler results
  const tscResult = readTscOutput(tagName);

  // If tsc output available: 70% compiler + 30% static analysis
  // Otherwise: 100% static analysis (heuristic)
  let score: number;
  let tscClean: boolean | undefined;
  let tscErrors: number | undefined;

  if (tscResult !== null) {
    tscClean = tscResult.errors === 0;
    tscErrors = tscResult.errors;
    const tscScore = tscClean ? 100 : Math.max(0, 100 - tscResult.errors * 10);
    score = Math.round(tscScore * 0.7 + staticScore * 0.3);
  } else {
    score = staticScore;
  }

  return {
    tagName,
    score,
    checks,
    totalChecks: checks.length,
    passedChecks,
    tscClean,
    tscErrors,
  };
}

function readTscOutput(tagName: string): { errors: number } | null {
  const libRoot = getLibraryRoot();
  const tscOutputPath = resolve(libRoot, ".cache/tsc-output.txt");

  if (!existsSync(tscOutputPath)) return null;

  try {
    const output = readFileSync(tscOutputPath, "utf-8");

    // If output is empty, tsc ran clean
    if (output.trim() === "") return { errors: 0 };

    // Count errors related to this component's files
    const dir = getComponentDirectory(tagName);
    const componentPattern = new RegExp(`components/${dir}/`, "g");
    const errorLines = output.split("\n").filter(
      (line) => componentPattern.test(line) && line.includes("error TS")
    );

    return { errors: errorLines.length };
  } catch {
    return null;
  }
}
