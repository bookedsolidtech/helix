---
title: Versioning and Changesets
description: Apply semantic versioning to @helixui/library using @changesets/cli and understand what constitutes a breaking change for web components.
---

HELiX uses semantic versioning (semver) and `@changesets/cli` to manage version numbers, changelogs, and npm publish coordination across the monorepo.

## Semantic Versioning for Web Component Libraries

Semver uses three numbers: `MAJOR.MINOR.PATCH`.

| Increment | When to use |
|---|---|
| `PATCH` (e.g., 1.1.2 → 1.1.3) | Bug fixes, accessibility fixes, internal refactors that do not change the API |
| `MINOR` (e.g., 1.1.2 → 1.2.0) | New properties, new events, new slots, new components — all backward-compatible |
| `MAJOR` (e.g., 1.1.2 → 2.0.0) | Any breaking change to the public API |

## What Constitutes a Breaking Change

Breaking changes for web components are broader than for typical JavaScript libraries because the public API includes HTML markup, CSS, and JavaScript:

### JavaScript / TypeScript API

| Change | Breaking? |
|---|---|
| Removing a `@property` | Yes |
| Renaming a `@property` | Yes |
| Changing a property's type (e.g., `string` → union) | Yes, if existing string values are excluded |
| Narrowing accepted values | Yes |
| Removing a method | Yes |
| Changing a method's signature | Yes |
| Adding a new optional property with a default | No |
| Adding a new method | No |

### Events

| Change | Breaking? |
|---|---|
| Removing an event | Yes |
| Renaming an event | Yes |
| Removing a field from `event.detail` | Yes |
| Adding an optional field to `event.detail` | No |
| Changing `bubbles` or `composed` | Yes |

### HTML / Attribute API

| Change | Breaking? |
|---|---|
| Removing an attribute | Yes |
| Renaming an attribute | Yes |
| Changing attribute value format | Yes |
| Adding a new attribute with a safe default | No |

### CSS API

| Change | Breaking? |
|---|---|
| Removing a CSS part (`::part()`) | Yes |
| Renaming a CSS part | Yes |
| Removing a CSS custom property | Yes |
| Renaming a CSS custom property | Yes |
| Adding a new CSS part or custom property | No |

### Slots

| Change | Breaking? |
|---|---|
| Removing a slot | Yes |
| Renaming a slot | Yes |
| Adding a new slot | No |

## The Changeset Workflow

### 1. Add a Changeset

After making changes, run:

```bash
pnpm changeset add
```

The CLI prompts you to:

1. Select which packages changed
2. Choose the bump type: `patch`, `minor`, or `major`
3. Write a summary of the change

This creates a file in `.changeset/` like `fuzzy-cats-run.md`:

```markdown
---
"@helixui/library": minor
---

Add `full` and `inverted` properties to `hx-button` for full-width and dark-background contexts.
```

Commit this file alongside your code changes.

### 2. Version Packages

When preparing a release, run:

```bash
pnpm changeset version
```

This:

- Reads all pending changesets in `.changeset/`
- Bumps version numbers in `package.json` files
- Appends entries to `CHANGELOG.md`
- Deletes the consumed changeset files

Commit the version bump: `git commit -m "chore(release): version packages"`.

### 3. Publish

```bash
pnpm changeset publish
```

This runs `npm publish` for all packages with version bumps that have not yet been published. CI handles this step automatically on merge to `main`.

## Pre-Release Versions

While `@helixui/library` is in `0.x.x` range, all changes may be breaking and the minor version indicates breaking changes:

```
0.1.0 → 0.2.0  Breaking change (during 0.x development)
0.1.0 → 0.1.1  Bug fix
1.0.0           First stable release
```

After reaching `1.0.0`, strict semver semantics apply.

### Pre-Release Channels

Use changeset pre-release mode for release candidates:

```bash
pnpm changeset pre enter rc
# ... make changes, add changesets ...
pnpm changeset version  # produces 1.2.0-rc.0
pnpm changeset publish --tag rc
pnpm changeset pre exit  # end the pre-release
```

## Changelog Format

`CHANGELOG.md` is maintained by `pnpm changeset version`. Follow the format in [`CHANGELOG.md`](https://github.com/bookedsolidtech/helix/blob/main/packages/hx-library/CHANGELOG.md):

```markdown
## 1.2.0

### Minor Changes

- `hx-button`: Added `full` property for full-width layout. (#1234)
- `hx-badge`: Added `xs` size variant. (#1235)

### Patch Changes

- `hx-dialog`: Fixed focus trap not releasing on programmatic close. (#1236)
- `hx-tooltip`: Fixed incorrect position when inside a scroll container. (#1237)
```

## Dependency Version Constraints

The `lit` dependency uses a caret range: `"lit": "^3.3.2"`. This allows consumers on any `3.x.x` version of Lit to use the library without installing a duplicate. The caret prevents accidental upgrades to Lit 4.x if it introduces breaking changes.

Keep the minimum version (`3.3.2`) current with the version that introduced features your components depend on, and update it in a patch release when required.

## Next Steps

- [Packaging Web Components](/components-guide/distribution/packaging/) — `package.json` fields and exports configuration
- [CDN Distribution](/components-guide/distribution/cdn/) — publishing to CDN and using import maps
- [API Documentation](/components-guide/documentation/api-docs/) — documenting breaking changes for consumers
