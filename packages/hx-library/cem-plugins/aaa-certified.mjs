/**
 * AAA-CERTIFIED CEM analyzer plugin
 *
 * Reads `@aaa-certified` JSDoc tags on class declarations and emits an
 * `aaaCertified: true` field (and optionally `aaaCertifiedDate` if a date
 * follows the tag) on the matching class declaration in the manifest.
 *
 * Workstream A.3 of the AAA Cert Epic. The presence of this field in the
 * Custom Elements Manifest is the source of truth for:
 *   - Storybook docs auto-rendering an "AAA certified" badge per component.
 *   - The README / docs auto-generated AAA component count.
 *   - Eventually replacing the hand-maintained
 *     `scripts/a11y-aaa-allowlist.json` (Workstream B.1) — the script can read
 *     the CEM and derive the allow-list, eliminating dual maintenance.
 *
 * **Convention.** Place the tag in the class-level JSDoc, optionally followed
 * by an ISO-8601 date marking when the audit was completed:
 *
 *   ```ts
 *   /**
 *    * @summary Primary interactive button.
 *    * @aaa-certified 2026-05-06
 *    *\/
 *   export class HelixButton extends HelixElement { ... }
 *   ```
 *
 * The bare tag (`@aaa-certified` with no value) is also accepted; in that case
 * `aaaCertifiedDate` is omitted but `aaaCertified` is still set to `true`.
 *
 * **Field omission.** When the tag is absent the plugin emits NEITHER
 * `aaaCertified` nor `aaaCertifiedDate` (rather than `aaaCertified: false`).
 * Omission keeps the manifest JSON smaller and makes the field semantically
 * an opt-in marker — consumers check `klass.aaaCertified === true` and
 * everything else is "not certified."
 */

import { parse } from 'comment-parser';

const TAG_NAME = 'aaa-certified';
// Liberal ISO-8601 date matcher: YYYY-MM-DD with optional time. Anything else
// is captured but emitted as a free-form string so we do not reject valid
// future-format certification metadata.
const DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/;

export function aaaCertifiedPlugin() {
  return {
    name: 'AAA-CERTIFIED',

    /**
     * analyzePhase runs once per AST node. We watch for class declarations and
     * inspect their attached JSDoc blocks. The matching class declaration in
     * the in-flight `moduleDoc` was already created by the analyzer's CORE
     * plugins (CLASSES, CLASS-JSDOC) earlier in the same phase, so we look it
     * up by name and patch it in place.
     */
    analyzePhase({ ts, node, moduleDoc }) {
      if (node.kind !== ts.SyntaxKind.ClassDeclaration) return;

      const className = node?.name?.getText?.();
      if (!className) return;

      const classDoc = moduleDoc?.declarations?.find(
        (declaration) => declaration.kind === 'class' && declaration.name === className,
      );
      if (!classDoc) return;

      const jsDocBlocks = node?.jsDoc;
      if (!Array.isArray(jsDocBlocks) || jsDocBlocks.length === 0) return;

      for (const jsDoc of jsDocBlocks) {
        const fullText = jsDoc?.getFullText?.();
        if (!fullText) continue;

        const parsed = parse(fullText);
        for (const block of parsed) {
          for (const tag of block?.tags ?? []) {
            if (tag?.tag !== TAG_NAME) continue;

            classDoc.aaaCertified = true;

            // comment-parser puts the first whitespace-separated token after
            // the tag in `tag.name` and any trailing prose in `tag.description`.
            // For `@aaa-certified 2026-05-06` we get name="2026-05-06".
            const candidate = (tag.name || tag.description || '').trim();
            if (candidate) {
              if (DATE_RE.test(candidate)) {
                classDoc.aaaCertifiedDate = candidate;
              } else {
                // Preserve any other free-form value (e.g. an audit ID or
                // version string) without trying to validate it. Consumers
                // that need a date can range-check.
                classDoc.aaaCertifiedDate = candidate;
              }
            }
          }
        }
      }
    },
  };
}

export default aaaCertifiedPlugin;
