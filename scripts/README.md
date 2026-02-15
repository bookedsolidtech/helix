# Scripts

Automation scripts for the wc-2026 monorepo.

## generate-component-docs.ts

Automatically generates Starlight MDX documentation pages from the Custom Elements Manifest (CEM).

### Purpose

Reads `packages/wc-library/custom-elements.json` and generates MDX files at `apps/docs/src/content/docs/component-library/{tagName}.mdx` for each component.

### Usage

```bash
# Generate docs for all components (skips existing files)
npm run generate-docs

# Preview changes without writing files
npm run generate-docs -- --dry-run

# Overwrite existing docs (use with caution!)
npm run generate-docs -- --force
```

### What it does

1. Parses the Custom Elements Manifest to extract all component metadata
2. For each component, generates an MDX file with:
   - Frontmatter (title, description from CEM)
   - ComponentLoader import
   - ComponentDoc for summary section
   - Overview section with component description
   - ComponentDoc for API reference (properties, events, slots, CSS properties, CSS parts)

### Behavior

- **Default**: Creates MDX files for components that don't have docs yet. Skips existing files.
- **--dry-run**: Preview what would be created/updated without writing files
- **--force**: Overwrites existing docs (useful if you want to regenerate from updated CEM)

### When to run

- After adding new components to the library
- After regenerating CEM (`npm run cem`) to pick up newly added components
- When component metadata in CEM has been updated and you want fresh docs

### Example Output

```
📚 Generating Starlight component documentation from CEM...

Found 14 components in CEM:

   - wc-alert (WcAlert)
   - wc-badge (WcBadge)
   - wc-button (WcButton)
   ...

✅ Created: wc-alert.mdx
✅ Created: wc-badge.mdx
⏭️  Skipped: wc-button.mdx (already exists, use --force to overwrite)

✨ Done!
   Created: 11 files
   Updated: 0 files
   Skipped: 3 files
   Total: 11 component docs
```

### Integration

The generated docs leverage the existing `ComponentDoc.astro` component which:
- Reads CEM data and renders summary + API tables
- Automatically displays properties, events, slots, CSS custom properties, and CSS parts
- Works seamlessly with Starlight's table of contents

### Developer Notes

- The script preserves manually-added content in existing docs (demos, examples, custom sections)
- Only the basic structure is generated; developers can enhance docs with interactive demos
- See `apps/docs/src/content/docs/component-library/wc-button.mdx` for an example of enhanced docs

### Health Dashboard Integration

After running this script, the Panopticon health dashboard will automatically detect the new docs and update the "Docs Coverage" metric to 100%.
