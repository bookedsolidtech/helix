import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalysisIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: string;
}

export interface AnalysisResult {
  filePath: string;
  issues: AnalysisIssue[];
  summary: string;
}

// ─── Lifecycle methods that must call super ────────────────────────────────────

const LIFECYCLE_METHODS = new Set([
  'connectedCallback',
  'disconnectedCallback',
  'attributeChangedCallback',
  'adoptedCallback',
  'updated',
  'firstUpdated',
  'willUpdate',
  'update',
  'render',
  'scheduleUpdate',
  'performUpdate',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function locationOf(node: ts.Node, sourceFile: ts.SourceFile): string {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `line ${line + 1}, col ${character + 1}`;
}

function hasDecorator(node: ts.PropertyDeclaration, name: string): boolean {
  const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
  if (!decorators) return false;
  return decorators.some(
    (dec) =>
      ts.isCallExpression(dec.expression) &&
      ts.isIdentifier(dec.expression.expression) &&
      dec.expression.expression.text === name,
  );
}

function containsSuperCall(methodBody: ts.Block, methodName: string): boolean {
  let found = false;

  function visit(node: ts.Node): void {
    if (found) return;
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.kind === ts.SyntaxKind.SuperKeyword &&
      ts.isIdentifier(node.expression.name) &&
      node.expression.name.text === methodName
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(methodBody);
  return found;
}

function collectThisInnerHtmlAssignments(
  classNode: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      ts.isPropertyAccessExpression(node.left.expression) &&
      node.left.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
      node.left.expression.name.text === 'shadowRoot' &&
      node.left.name.text === 'innerHTML'
    ) {
      issues.push({
        type: 'incorrect-shadow-dom-usage',
        severity: 'error',
        message:
          'Direct assignment to this.shadowRoot.innerHTML bypasses Lit rendering. Use the render() method and slots for content projection.',
        location: locationOf(node, sourceFile),
      });
    }

    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      node.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
      node.left.name.text === 'innerHTML'
    ) {
      issues.push({
        type: 'incorrect-shadow-dom-usage',
        severity: 'error',
        message:
          'Direct assignment to this.innerHTML bypasses the shadow DOM. Use slots for content projection.',
        location: locationOf(node, sourceFile),
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(classNode);
  return issues;
}

function collectDirectStyleManipulation(
  classNode: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  function visit(node: ts.Node): void {
    // this.style.xxx = ... or this.style.setProperty(...)
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      ts.isPropertyAccessExpression(node.left.expression) &&
      node.left.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
      node.left.expression.name.text === 'style'
    ) {
      issues.push({
        type: 'direct-style-manipulation',
        severity: 'warning',
        message: `Direct style manipulation (this.style.${node.left.name.text} = ...) bypasses design tokens. Use CSS custom properties (--hx-*) instead.`,
        location: locationOf(node, sourceFile),
      });
    }

    // someElement.style.xxx = ... (where someElement is a variable, not `this`)
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      ts.isPropertyAccessExpression(node.left.expression) &&
      node.left.expression.expression.kind !== ts.SyntaxKind.ThisKeyword &&
      ts.isIdentifier(node.left.expression.expression) &&
      node.left.expression.name.text === 'style'
    ) {
      issues.push({
        type: 'direct-style-manipulation',
        severity: 'warning',
        message: `Direct style manipulation (${node.left.expression.expression.text}.style.${node.left.name.text} = ...) bypasses design tokens. Use CSS custom properties (--hx-*) instead.`,
        location: locationOf(node, sourceFile),
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(classNode);
  return issues;
}

function collectMissingSuperCalls(
  classNode: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  for (const member of classNode.members) {
    if (
      ts.isMethodDeclaration(member) &&
      ts.isIdentifier(member.name) &&
      LIFECYCLE_METHODS.has(member.name.text) &&
      member.body
    ) {
      const methodName = member.name.text;
      if (!containsSuperCall(member.body, methodName)) {
        issues.push({
          type: 'missing-super-call',
          severity: 'error',
          message: `Lifecycle method "${methodName}" does not call super.${methodName}(). This can break Lit's rendering lifecycle.`,
          location: locationOf(member, sourceFile),
        });
      }
    }
  }

  return issues;
}

function collectShadowedProperties(
  classNode: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  for (const member of classNode.members) {
    if (
      ts.isPropertyDeclaration(member) &&
      ts.isIdentifier(member.name) &&
      hasDecorator(member, 'property')
    ) {
      const propName = member.name.text;
      // If the class has a heritage clause, the property is potentially shadowing a parent @property
      const hasParent =
        classNode.heritageClauses?.some((h) => h.token === ts.SyntaxKind.ExtendsKeyword) ?? false;
      if (hasParent) {
        issues.push({
          type: 'property-shadowing',
          severity: 'warning',
          message: `Property "${propName}" is decorated with @property and may shadow a parent class @property decorator. Verify this is intentional — overriding without re-applying the decorator can break reactivity.`,
          location: locationOf(member, sourceFile),
        });
      }
    }
  }

  return issues;
}

function collectBrokenSlotForwarding(
  classNode: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Look for template literals or html`` tagged templates that contain <slot> without name forwarding
  function visit(node: ts.Node): void {
    // Detect tagged template literals: html`...`
    if (
      ts.isTaggedTemplateExpression(node) &&
      ts.isIdentifier(node.tag) &&
      node.tag.text === 'html'
    ) {
      const templateText = node.template.getText(sourceFile);

      // Detect <slot> usage without a name attribute when parent slots exist
      // Pattern: slot elements that appear to hard-code a name without interpolation
      const slotRegex = /<slot(?:\s[^>]*)?\s+name="([^"]+)"/g;
      const matches = [...templateText.matchAll(slotRegex)];

      for (const match of matches) {
        const slotName = match[1];
        // If the slot name is hardcoded (not a template expression), it can't forward dynamically
        if (slotName && !slotName.includes('${')) {
          // This is informational — hardcoded slot names in extensions can break parent forwarding
          issues.push({
            type: 'broken-slot-forwarding',
            severity: 'info',
            message: `Template contains a named slot with hardcoded name="${slotName}". If this component extends a parent that defines this slot, ensure it is properly forwarded and not accidentally swallowed.`,
            location: locationOf(node, sourceFile),
          });
        }
      }

      // Detect overriding render() without any <slot> element — slots from parent will be lost
      const hasSlot = templateText.includes('<slot');
      const isInsideRender = (() => {
        let parent: ts.Node | undefined = node.parent;
        while (parent) {
          if (
            ts.isMethodDeclaration(parent) &&
            ts.isIdentifier(parent.name) &&
            parent.name.text === 'render'
          ) {
            return true;
          }
          parent = parent.parent;
        }
        return false;
      })();

      if (isInsideRender && !hasSlot) {
        const hasParent =
          classNode.heritageClauses?.some((h) => h.token === ts.SyntaxKind.ExtendsKeyword) ?? false;
        if (hasParent) {
          issues.push({
            type: 'broken-slot-forwarding',
            severity: 'warning',
            message:
              'render() method template contains no <slot> elements. If the parent component defined slots, they will not be forwarded and consumers cannot project content.',
            location: locationOf(node, sourceFile),
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(classNode);
  return issues;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export function analyzeExtension(filePath: string): string {
  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const source = readFileSync(absolutePath, 'utf8');
  const sourceFile = ts.createSourceFile(absolutePath, source, ts.ScriptTarget.ESNext, true);

  const issues: AnalysisIssue[] = [];
  let analyzedClass: string | undefined;

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement)) continue;

    // Only analyze classes that extend something (they could be extending HELiX components)
    const extendsClause = statement.heritageClauses?.find(
      (h) => h.token === ts.SyntaxKind.ExtendsKeyword,
    );
    if (!extendsClause) continue;

    const className = statement.name?.text ?? '(anonymous)';
    analyzedClass = className;

    issues.push(...collectMissingSuperCalls(statement, sourceFile));
    issues.push(...collectThisInnerHtmlAssignments(statement, sourceFile));
    issues.push(...collectShadowedProperties(statement, sourceFile));
    issues.push(...collectBrokenSlotForwarding(statement, sourceFile));
    issues.push(...collectDirectStyleManipulation(statement, sourceFile));
  }

  if (!analyzedClass) {
    return JSON.stringify(
      {
        filePath: absolutePath,
        issues: [],
        summary: 'No class declarations extending a base class were found in this file.',
      } satisfies AnalysisResult,
      null,
      2,
    );
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const summary =
    issues.length === 0
      ? `No issues found in ${analyzedClass}.`
      : `Found ${issues.length} issue${issues.length === 1 ? '' : 's'} in ${analyzedClass}: ${errorCount} error${errorCount === 1 ? '' : 's'}, ${warnCount} warning${warnCount === 1 ? '' : 's'}, ${infoCount} info.`;

  const result: AnalysisResult = {
    filePath: absolutePath,
    issues,
    summary,
  };

  return JSON.stringify(result, null, 2);
}
