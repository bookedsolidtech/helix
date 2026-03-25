import fs from 'fs-extra';
import path from 'node:path';
import type { DrupalOptions, PresetConfig } from '../types.js';
import { getPreset } from '../presets/loader.js';
import { generateLibrariesYml } from './libraries.js';

function toTitleCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateThemeInfoYml(themeName: string, preset: PresetConfig): string {
  const displayName = toTitleCase(themeName);
  return `name: '${displayName}'
type: theme
description: 'Drupal theme scaffolded with HELiX preset: ${preset.id}'
core_version_requirement: ^10 || ^11
base theme: false
libraries:
  - ${themeName}/global
`;
}

function generateThemeLibrariesYml(_themeName: string): string {
  return `global:
  version: VERSION
  css:
    theme:
      css/style.css: {}
`;
}

function generateComposerJson(themeName: string): string {
  return JSON.stringify(
    {
      name: `helixui/${themeName}`,
      description: 'Drupal theme with HELiX components',
      type: 'drupal-theme',
      require: {
        'drupal/core': '^10 || ^11',
      },
    },
    null,
    2,
  );
}

function generatePackageJson(themeName: string, preset: PresetConfig): string {
  return JSON.stringify(
    {
      name: themeName,
      version: '1.0.0',
      private: true,
      description: `Drupal theme with HELiX ${preset.id} preset`,
      dependencies: { ...preset.dependencies },
    },
    null,
    2,
  );
}

function generateBehaviorsJs(preset: PresetConfig): string {
  return `/**
 * @file
 * HELiX UI Drupal behaviors for ${preset.id} preset.
 * Uses once() for idempotent initialization.
 */
(function (Drupal, once) {
  'use strict';

  /**
   * Initialize HELiX web components.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.helixuiInit = {
    attach: function (context, settings) {
      once('helixui:sdc-init', '[data-helix-component]', context).forEach(function (element) {
        // Component initialization logic
        const componentName = element.dataset.helixComponent;
        element.setAttribute('data-initialized', 'true');
      });
    },
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        // Cleanup logic
      }
    }
  };

}(Drupal, once));
`;
}

function generateComponentYml(sdcName: string, themeName: string): string {
  const displayName = toTitleCase(sdcName);
  return `$schema: 'https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/modules/sdc/src/metadata.schema.json'
name: '${displayName}'
description: 'Teaser display of a node using HELiX components'
props:
  type: object
  properties:
    title:
      type: string
      title: 'Title'
    url:
      type: string
      title: 'URL'
slots:
  content:
    title: 'Content'
libraryOverrides:
  dependencies:
    - ${themeName}/helixui.${sdcName}
`;
}

function generateComponentTwig(sdcName: string): string {
  const cssClass = sdcName;
  const displayName = toTitleCase(sdcName);
  return `{#
/**
 * @file
 * Template for ${sdcName} SDC component.
 *
 * Available props:
 * - title: ${displayName} title
 * - url: ${displayName} URL
 */
#}
<article class="${cssClass}">
  <h2 class="${cssClass}__title">
    <a href="{{ url }}">{{ title }}</a>
  </h2>
  <div class="${cssClass}__content">
    {% block content %}{% endblock %}
  </div>
</article>
`;
}

export async function scaffoldDrupalTheme(options: DrupalOptions): Promise<void> {
  const preset = getPreset(options.preset);
  const dir = options.directory;
  const themeName = options.themeName;

  // Create root directory
  await fs.ensureDir(dir);

  // Write {themeName}.info.yml
  await fs.writeFile(
    path.join(dir, `${themeName}.info.yml`),
    generateThemeInfoYml(themeName, preset),
    'utf-8',
  );

  // Write {themeName}.libraries.yml
  await fs.writeFile(
    path.join(dir, `${themeName}.libraries.yml`),
    generateThemeLibrariesYml(themeName),
    'utf-8',
  );

  // Write helixui.libraries.yml
  await fs.writeFile(
    path.join(dir, 'helixui.libraries.yml'),
    generateLibrariesYml(themeName, preset),
    'utf-8',
  );

  // Write package.json
  await fs.writeFile(
    path.join(dir, 'package.json'),
    generatePackageJson(themeName, preset),
    'utf-8',
  );

  // Write composer.json
  await fs.writeFile(path.join(dir, 'composer.json'), generateComposerJson(themeName), 'utf-8');

  // Create src/components directory and one subdir+files per SDC
  const componentsDir = path.join(dir, 'src', 'components');
  await fs.ensureDir(componentsDir);

  for (const sdc of preset.sdcList) {
    const sdcDir = path.join(componentsDir, sdc);
    await fs.ensureDir(sdcDir);

    await fs.writeFile(
      path.join(sdcDir, `${sdc}.component.yml`),
      generateComponentYml(sdc, themeName),
      'utf-8',
    );

    await fs.writeFile(path.join(sdcDir, `${sdc}.twig`), generateComponentTwig(sdc), 'utf-8');
  }

  // Create src/behaviors directory with preset behaviors file
  const behaviorsDir = path.join(dir, 'src', 'behaviors');
  await fs.ensureDir(behaviorsDir);

  await fs.writeFile(
    path.join(behaviorsDir, `${preset.id}-behaviors.js`),
    generateBehaviorsJs(preset),
    'utf-8',
  );
}
