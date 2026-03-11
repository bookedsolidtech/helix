---
title: Versioning & Changelogs
description: Managing semantic versioning, changesets, and changelogs for enterprise web component libraries.
---

# Versioning & Changelogs

Enterprise consumers of a component library — Drupal teams, design system teams, embedded analytics teams — need to know exactly what changed in each release. They need to know whether they can upgrade safely on Friday afternoon or whether they should wait for a maintenance window. They need changelog entries that answer the question "does this affect me?" without reading the diff.

This page covers how HELiX uses semantic versioning and Changesets to manage releases, what counts as a breaking change in a component library (the answer is different from a pure JavaScript API library), and how to write changelog entries that serve the people who consume them.

---

## Semantic Versioning for Component Libraries

HELiX follows [Semantic Versioning 2.0.0](https://semver.org/). The version number `MAJOR.MINOR.PATCH` communicates the scope of change:

| Version part | Increment when                                          |
| ------------ | ------------------------------------------------------- |
| `MAJOR`      | A breaking change is introduced                         |
| `MINOR`      | New functionality is added in a backward-compatible way |
| `PATCH`      | A backward-compatible bug fix is shipped                |

For a component library, "breaking change" has a broader definition than for a pure JavaScript utility library. Consumers depend not just on the JavaScript API but on the rendered HTML structure, CSS custom property names, CSS parts, slot names, and event names.

### What Counts as a MAJOR (Breaking) Change

A change is breaking if it requires consumers to update their code, templates, or styles to maintain existing behaviour.

**JavaScript API:**

- Removing a public property (`@property`) or method from a component class
- Changing the type of a property in a way that rejects previously valid values (e.g., `string` to `'small' | 'medium' | 'large'` when existing consumers pass `'tiny'`)
- Changing the default value of a property in a way that alters rendered output
- Changing an event name (e.g., renaming `hx-change` to `hx-value-change`)
- Changing event detail shape — removing a field that consumers read
- Removing or renaming a component tag name
- Removing a slot

**CSS API:**

- Removing or renaming a CSS custom property (`--hx-*`)
- Removing or renaming a CSS part (`part="..."`)
- Changing which CSS custom property controls a visual property (e.g., migrating button background from `--hx-button-bg` to `--hx-button-background`)
- Adding a required `::part()` override that consumers must write to restore previous visual output

**HTML/Slot structure:**

- Removing a named slot
- Changing slot fallback content in a way that breaks layouts
- Wrapping slotted content in an additional element that changes DOM structure visible to consumers via `::slotted()`

**Example of a breaking CSS change:**

```css
/* v2.x — consumers override this to change button colour */
:host {
  --hx-button-bg: var(--hx-color-primary);
}

/* ❌ v3.0.0 BREAKING — the custom property name changed */
:host {
  --hx-button-background: var(--hx-color-primary);
}
```

Any Drupal theme that had:

```css
hx-button {
  --hx-button-bg: #0057b7;
}
```

must now be updated to `--hx-button-background`. This is a breaking change that requires a major version bump and a migration guide.

### What Counts as a MINOR (Non-Breaking) Change

- Adding a new optional property with a backward-compatible default
- Adding a new named slot (existing content is unaffected)
- Adding a new CSS custom property (consumers who do not use it are unaffected)
- Adding a new CSS part (consumers who do not target it are unaffected)
- Adding a new event (consumers who do not listen for it are unaffected)
- Adding a new component to the library
- Adding a `deprecated` property that still works but emits a console warning

**Example of a minor change:**

```typescript
// v2.3.0 — adds optional `icon` slot to hx-button
// Existing usages with no icon slot render identically
render() {
  return html`
    <button part="button">
      ${this._hasIconSlot
        ? html`<span part="icon"><slot name="icon"></slot></span>`
        : nothing}
      <slot></slot>
    </button>
  `;
}
```

### What Counts as a PATCH (Bug Fix) Change

- Fixing an ARIA attribute that was set incorrectly (e.g., `aria-disabled="false"` when the component was disabled)
- Fixing a CSS value that was preventing correct rendering in a supported browser
- Fixing an event that was not firing when it should
- Fixing incorrect TypeScript types that did not match runtime behaviour

Note: Bug fixes to accessibility attributes are treated as patches even though they change rendered HTML. The previous behaviour was wrong; consumers should not depend on incorrect behaviour.

---

## Changesets Workflow

HELiX uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelog generation. Changesets is a tool that asks contributors to declare what kind of change they are making at PR time, then aggregates those declarations into version bumps and changelog entries at release time.

### Installing Changesets

```bash
npm install --save-dev @changesets/cli
npx changeset init
```

This creates a `.changeset/` directory at the monorepo root.

### Step 1: Adding a Changeset During Development

Every PR that changes component behaviour must include a changeset. Run:

```bash
npx changeset add
```

The CLI walks you through:

1. **Select packages to release** — Select `@helixui/library` (and any other affected packages)
2. **Select bump type** — `major`, `minor`, or `patch`
3. **Write a summary** — This becomes the changelog entry (see writing guidelines below)

The command creates a file like `.changeset/purple-dolphins-jump.md`:

```markdown
---
'@helixui/library': minor
---

Add `icon` slot to `hx-button` for optional leading icon support.
```

Commit this file with your PR. Reviewers can see what version bump you are claiming and what the changelog entry will say.

### Step 2: Bumping Versions at Release Time

When the release branch is ready, the release manager runs:

```bash
npx changeset version
```

This command:

1. Reads all changeset files in `.changeset/`
2. Determines the highest bump type across all changesets (if any changeset is `major`, the result is `major`)
3. Updates `packages/hx-library/package.json` version field
4. Appends formatted entries to `packages/hx-library/CHANGELOG.md`
5. Deletes the consumed changeset files

Review the updated `package.json` and `CHANGELOG.md` before committing. This is the last chance to correct version numbers or improve changelog copy.

### Step 3: Publishing

```bash
npx changeset publish
```

This runs `npm publish` for every package whose version has changed since the last published tag. It also creates a git tag for the release.

In CI, the publish step is gated behind:

1. All 7 quality gates passing (type-check, tests, accessibility, Storybook, CEM, bundle size, code review)
2. A human approving the release workflow in GitHub Actions

---

## Writing Good Changelog Entries

A changelog is documentation for the people who did not write the code. The audience is a Drupal front-end developer who needs to decide whether to take this upgrade. Write for them.

### The Three-Part Structure

Every significant changelog entry should answer:

1. **What changed?** (one sentence, imperative mood)
2. **Why?** (optional — only when the reason is non-obvious)
3. **What do I need to do?** (for breaking changes — a migration example)

### Examples: Good vs Poor Changelog Entries

**Poor:**

```
- Updated hx-button styles
```

This tells the consumer nothing. Updated how? Does it affect my buttons?

**Good:**

```
- `hx-button`: Increase default `font-size` from `0.875rem` to `1rem` to meet
  WCAG 1.4.4 (Resize Text) in healthcare contexts. If your design requires the
  smaller size, set `--hx-button-font-size: 0.875rem` on the element.
```

**Poor:**

```
- Breaking: renamed property
```

**Good:**

````
- **BREAKING** `hx-text-input`: Rename `errorMessage` property to `error` to
  align with the rest of the form component API. Update all usages:

  ```html
  <!-- Before -->
  <hx-text-input error-message="Required"></hx-text-input>

  <!-- After -->
  <hx-text-input error="Required"></hx-text-input>
````

The `error-message` attribute will be removed in v4.0.

````

### Changelog Template for Breaking Changes

```markdown
- **BREAKING** `hx-[component]`: [What changed in one sentence].

  **Before:**
  ```[html|typescript|css]
  [Old usage example]
````

**After:**

```[html|typescript|css]
[New usage example]
```

[One sentence explaining why the change was made, if non-obvious.]

````

### Changelog Template for New Features

```markdown
- `hx-[component]`: [What was added]. [One sentence on how to use it if not obvious.]

  ```html
  [Usage example demonstrating the new feature]
````

````

### Changelog Template for Bug Fixes

```markdown
- `hx-[component]`: Fix [description of the bug]. [Impact statement: who was affected.]
````

---

## Handling Multiple Breaking Changes in a Release

When a release contains several breaking changes, group them clearly. Consumers need to see all migrations at once to assess the total upgrade cost.

```markdown
## 3.0.0

### Breaking Changes

This release includes breaking changes to the CSS API across three components.
All changes align the `--hx-*` property naming scheme with the revised design
token specification.

- **BREAKING** `hx-button`: Rename `--hx-button-bg` to `--hx-button-background`.
- **BREAKING** `hx-button`: Rename `--hx-button-color` to `--hx-button-foreground`.
- **BREAKING** `hx-card`: Rename `--hx-card-bg` to `--hx-card-background`.

**Migration:** Search your codebase for `--hx-button-bg`, `--hx-button-color`,
and `--hx-card-bg` and update them to the new names. The old names are not
supported in v3 and will have no effect.

### Migration Guide

See [Migration: v2 to v3](../migration/v2-to-v3/) for the full list of changes
and automated codemod instructions.

### New Features

- `hx-select`: Add `multiple` property for multi-select mode.
- `hx-checkbox`: Add `indeterminate` property for tri-state checkboxes.

### Bug Fixes

- `hx-text-input`: Fix `required` indicator not rendering when `label` slot is used.
```

---

## The Deprecated Property Pattern

Never remove a property in the same release you introduce its replacement. Follow a two-release deprecation cycle:

**Release N: Add replacement, mark old as deprecated**

```typescript
@customElement('hx-text-input')
export class HxTextInput extends LitElement {
  /**
   * @deprecated Use `error` instead. Will be removed in v4.0.
   */
  @property({ attribute: 'error-message' })
  get errorMessage(): string {
    return this.error;
  }
  set errorMessage(value: string) {
    console.warn(
      '[hx-text-input] The `error-message` property is deprecated. ' +
        'Use `error` instead. It will be removed in v4.0.',
    );
    this.error = value;
  }

  @property({ type: String })
  error = '';
}
```

The deprecated setter still works — no consumer code breaks. The console warning alerts developers during testing. The CEM entry for `errorMessage` gets a `@deprecated` JSDoc tag so Storybook and IDE tooling show the deprecation notice.

**Release N+1 (major): Remove the deprecated property**

```typescript
// error-message is gone. Only error remains.
@property({ type: String })
error = '';
```

The changelog for Release N+1 notes that `error-message` was deprecated in Release N and is now removed.

---

## Coordinating Storybook Migration Guides with Version Bumps

When a breaking change ships, Storybook stories must be updated to show the new API. Additionally, a migration note should appear in the relevant story's documentation tab.

```typescript
// hx-button.stories.ts — after v3.0 breaking change
export default {
  title: 'Components/hx-button',
  parameters: {
    docs: {
      description: {
        component: `
> **v3.0 Migration:** \`--hx-button-bg\` has been renamed to \`--hx-button-background\`.
> See the [v2 to v3 migration guide](/docs/migration/v2-to-v3/) for details.
        `,
      },
    },
  },
} satisfies Meta;
```

This surfaces the migration note directly in Storybook's autodocs panel, which is often where Drupal developers discover API changes before reading the full changelog.

---

## Automated Changelog Generation in CI

Changesets integrates with GitHub Actions to automate the release PR creation:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org

      - name: Install dependencies
        run: npm ci

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          # This command is run when a release PR is merged
          publish: npm run release
          # Title for the release PR
          title: 'chore: release packages'
          # Commit message for the version bump commit
          commit: 'chore: version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

The workflow has two modes:

1. **On every push to `main`:** If there are pending changesets, it creates or updates a "Release" PR that shows what version will be bumped and what the changelog will say.
2. **When the Release PR is merged:** It runs `changeset publish`, which publishes to npm and creates git tags.

---

## Versioning the Custom Elements Manifest

The `custom-elements.json` CEM file describes the public API of every component. It is generated by `npm run cem` and committed to the repository. When the API changes, the CEM must be regenerated.

The CEM version field should match the package version:

```json
{
  "schemaVersion": "1.0.0",
  "readme": "",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/components/hx-button/hx-button.ts",
      "declarations": [...]
    }
  ]
}
```

In CI, a check verifies that the committed CEM matches the output of `npm run cem`. If a developer modifies a component's public API without regenerating the CEM, the CI build fails.

```yaml
# In CI:
- name: Verify CEM is up to date
  run: |
    npm run cem
    git diff --exit-code packages/hx-library/custom-elements.json
```

If `git diff` exits non-zero, the CEM is stale and the build fails with a clear message.

---

## Communicating Breaking Changes to Drupal Teams

Drupal teams consume HELiX through a combination of CDN URLs and npm packages bundled into themes. They often run on a longer upgrade cycle than JavaScript-first teams and need extra communication when breaking changes ship.

**Standard practice for breaking releases:**

1. **Announcement issue** — Create a GitHub issue titled "v3.0 Breaking Changes" at least two weeks before the release. Tag it `breaking-change` and `drupal-impact`. List all breaking changes with before/after Twig and CSS examples.

2. **Migration guide doc page** — Write a page at `apps/docs/src/content/docs/migration/v2-to-v3.md` with step-by-step instructions. Include search-and-replace patterns for CSS custom property renames.

3. **Codemod** (when feasible) — For mechanical renames (CSS property names, attribute names), provide a script:

   ```bash
   # scripts/migrate-v2-to-v3.sh
   # Renames deprecated CSS custom properties in Drupal theme files
   find . -name "*.css" -o -name "*.scss" | xargs sed -i \
     -e 's/--hx-button-bg:/--hx-button-background:/g' \
     -e 's/--hx-button-color:/--hx-button-foreground:/g' \
     -e 's/--hx-card-bg:/--hx-card-background:/g'
   ```

4. **Extended support window** — Publish the previous major version patch releases for at least 90 days after the new major ships. CDN URLs using a pinned major version (e.g., `/hx-library@2/`) continue to work during this window.

---

## Related Pages

- [CDN Distribution](./cdn/) — Distributing HELiX via CDN with versioned URLs
- [Packaging for npm](./packaging/) — Entry points, `package.json` fields, and CEM
- [Bundle Size Fundamentals](../performance/bundle-size/) — Performance budgets and CI enforcement
