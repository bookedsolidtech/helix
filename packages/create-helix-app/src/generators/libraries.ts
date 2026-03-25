import type { PresetConfig } from '../types.js';

export function generateLibrariesYml(themeName: string, preset: PresetConfig): string {
  const sdcEntries = preset.sdcList
    .map(
      (sdc) =>
        `helixui.${sdc}:\n  version: VERSION\n  provider: cdn\n  dependencies:\n    - ${themeName}/helixui.base`,
    )
    .join('\n\n');

  return `# HELiX UI component libraries for Drupal
# Generated from preset: ${preset.id}
# SDCs: ${preset.sdcList.join(', ')}

helixui.base:
  version: VERSION
  provider: cdn
  css:
    theme:
      https://unpkg.com/@helixui/tokens/dist/index.css: {}
  js:
    https://unpkg.com/@helixui/library/dist/index.js: {}
  dependencies:
    - core/drupal
    - core/once

${sdcEntries}
`;
}
