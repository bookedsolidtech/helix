/**
 * CEM Completeness Validator.
 * Checks every field type for description, type, default, and attribute reflection.
 * Outputs per-component completeness % and field-level breakdown.
 */
import { getComponentData, getAllComponents, type ComponentData } from "./cem-parser";

export type FieldStatus = "complete" | "partial" | "missing";

export interface FieldValidation {
  name: string;
  hasDescription: boolean;
  hasType: boolean;
  hasDefault: boolean;
  hasAttribute: boolean;
  status: FieldStatus;
}

export interface SectionValidation {
  section: string;
  fields: FieldValidation[];
  completeness: number; // 0-100
  total: number;
  complete: number;
  partial: number;
  missing: number;
}

export interface ComponentValidation {
  tagName: string;
  className: string;
  overallCompleteness: number; // 0-100
  sections: SectionValidation[];
  hasDescription: boolean;
  hasSummary: boolean;
}

function validateField(
  name: string,
  hasDescription: boolean,
  hasType: boolean,
  hasDefault: boolean,
  hasAttribute: boolean
): FieldValidation {
  const checks = [hasDescription, hasType, hasDefault, hasAttribute];
  const passed = checks.filter(Boolean).length;
  let status: FieldStatus;
  if (passed === checks.length) {
    status = "complete";
  } else if (passed > 0) {
    status = "partial";
  } else {
    status = "missing";
  }
  return { name, hasDescription, hasType, hasDefault, hasAttribute, status };
}

function validateSection(
  section: string,
  fields: FieldValidation[]
): SectionValidation {
  if (fields.length === 0) {
    return { section, fields, completeness: 100, total: 0, complete: 0, partial: 0, missing: 0 };
  }

  const complete = fields.filter((f) => f.status === "complete").length;
  const partial = fields.filter((f) => f.status === "partial").length;
  const missing = fields.filter((f) => f.status === "missing").length;

  // Weight: complete=1, partial=0.5, missing=0
  const score = (complete + partial * 0.5) / fields.length;

  return {
    section,
    fields,
    completeness: Math.round(score * 100),
    total: fields.length,
    complete,
    partial,
    missing,
  };
}

export function validateComponent(tagName: string): ComponentValidation | undefined {
  const data = getComponentData(tagName);
  if (!data) return undefined;

  return validateComponentData(data);
}

export function validateComponentData(data: ComponentData): ComponentValidation {
  const sections: SectionValidation[] = [];

  // Properties
  const propFields = data.properties.map((p) =>
    validateField(
      p.name,
      p.description.length > 0,
      p.type !== "unknown",
      p.default !== "\u2014",
      p.attribute.length > 0
    )
  );
  sections.push(validateSection("Properties", propFields));

  // Events
  const eventFields = data.events.map((e) =>
    validateField(
      e.name,
      e.description.length > 0,
      e.type !== "CustomEvent" && e.type.length > 0,
      true, // Events don't have defaults
      true  // Events don't have attributes
    )
  );
  sections.push(validateSection("Events", eventFields));

  // Slots
  const slotFields = data.slots.map((s) =>
    validateField(
      s.name,
      s.description.length > 0,
      true, // Slots don't have types
      true, // Slots don't have defaults
      true  // Slots don't have attributes
    )
  );
  sections.push(validateSection("Slots", slotFields));

  // CSS Parts
  const partFields = data.cssParts.map((p) =>
    validateField(
      p.name,
      p.description.length > 0,
      true, // CSS parts don't have types
      true, // CSS parts don't have defaults
      true  // CSS parts don't have attributes
    )
  );
  sections.push(validateSection("CSS Parts", partFields));

  // CSS Custom Properties
  const cssPropFields = data.cssProperties.map((p) =>
    validateField(
      p.name,
      p.description.length > 0,
      true, // CSS properties are always strings
      p.default !== "\u2014",
      true  // CSS properties don't have attribute reflection
    )
  );
  sections.push(validateSection("CSS Properties", cssPropFields));

  // Overall completeness
  const allFields = sections.flatMap((s) => s.fields);
  const totalChecks = allFields.length * 4; // 4 checks per field
  const passedChecks = allFields.reduce((sum, f) => {
    let passed = 0;
    if (f.hasDescription) passed++;
    if (f.hasType) passed++;
    if (f.hasDefault) passed++;
    if (f.hasAttribute) passed++;
    return sum + passed;
  }, 0);

  const overallCompleteness = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  return {
    tagName: data.tagName,
    className: data.className,
    overallCompleteness,
    sections,
    hasDescription: data.description.length > 0,
    hasSummary: data.summary.length > 0,
  };
}

export function validateAllComponents(): ComponentValidation[] {
  return getAllComponents().map(validateComponentData);
}
