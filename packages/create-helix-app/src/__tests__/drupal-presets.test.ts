import { describe, it, expect, afterAll } from 'vitest';
import { scaffoldDrupalTheme } from '../generators/drupal-theme.js';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';

const TMP = path.join(os.tmpdir(), 'helix-drupal-test-' + Date.now());

afterAll(async () => {
  await fs.remove(TMP);
});

describe('drupal theme scaffolding', () => {
  it('scaffolds healthcare preset with correct structure', async () => {
    const dir = path.join(TMP, 'healthcare-theme');
    await scaffoldDrupalTheme({
      themeName: 'test_healthcare',
      directory: dir,
      preset: 'healthcare',
    });

    expect(fs.existsSync(path.join(dir, 'helixui.libraries.yml'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'src', 'components'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'test_healthcare.info.yml'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'package.json'))).toBe(true);
  });

  it('helixui.libraries.yml contains provider: cdn', async () => {
    const dir = path.join(TMP, 'standard-theme');
    await scaffoldDrupalTheme({
      themeName: 'test_standard',
      directory: dir,
      preset: 'standard',
    });

    const librariesYml = fs.readFileSync(path.join(dir, 'helixui.libraries.yml'), 'utf-8');
    expect(librariesYml).toContain('provider: cdn');
  });

  it('helixui.libraries.yml contains all preset SDC entries', async () => {
    const dir = path.join(TMP, 'standard-sdc-check');
    await scaffoldDrupalTheme({
      themeName: 'test_sdc_entries',
      directory: dir,
      preset: 'standard',
    });

    const librariesYml = fs.readFileSync(path.join(dir, 'helixui.libraries.yml'), 'utf-8');
    expect(librariesYml).toContain('helixui.node-teaser:');
    expect(librariesYml).toContain('helixui.hero-banner:');
    expect(librariesYml).toContain('helixui.base:');
  });

  it('behaviors use once() pattern', async () => {
    const dir = path.join(TMP, 'blog-theme');
    await scaffoldDrupalTheme({
      themeName: 'test_blog',
      directory: dir,
      preset: 'blog',
    });

    const behaviorsDir = path.join(dir, 'src', 'behaviors');
    const files = fs.readdirSync(behaviorsDir);
    expect(files.length).toBeGreaterThan(0);

    const behaviorContent = fs.readFileSync(path.join(behaviorsDir, files[0]!), 'utf-8');
    expect(behaviorContent).toContain("once('");
  });

  it('behavior file is named after the preset', async () => {
    const dir = path.join(TMP, 'intranet-behaviors');
    await scaffoldDrupalTheme({
      themeName: 'test_intranet_behaviors',
      directory: dir,
      preset: 'intranet',
    });

    const behaviorsDir = path.join(dir, 'src', 'behaviors');
    const files = fs.readdirSync(behaviorsDir);
    expect(files).toContain('intranet-behaviors.js');
  });

  it('package.json contains @helixui/drupal-starter', async () => {
    const dir = path.join(TMP, 'intranet-theme');
    await scaffoldDrupalTheme({
      themeName: 'test_intranet',
      directory: dir,
      preset: 'intranet',
    });

    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies).toHaveProperty('@helixui/drupal-starter');
  });

  it('package.json contains @helixui/tokens', async () => {
    const dir = path.join(TMP, 'tokens-check');
    await scaffoldDrupalTheme({
      themeName: 'test_tokens',
      directory: dir,
      preset: 'standard',
    });

    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8')) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies).toHaveProperty('@helixui/tokens');
  });

  it('each preset SDC has a component directory', async () => {
    const dir = path.join(TMP, 'sdc-check');
    await scaffoldDrupalTheme({
      themeName: 'test_sdc',
      directory: dir,
      preset: 'standard',
    });

    const componentsDir = path.join(dir, 'src', 'components');
    const sdcDirs = fs.readdirSync(componentsDir);
    expect(sdcDirs).toContain('node-teaser');
    expect(sdcDirs).toContain('hero-banner');
    expect(sdcDirs).toContain('views-grid');
    expect(sdcDirs).toContain('site-header');
    expect(sdcDirs).toContain('site-footer');
    expect(sdcDirs).toContain('breadcrumb');
    expect(sdcDirs).toContain('search-form');
  });

  it('each SDC directory contains .component.yml and .twig files', async () => {
    const dir = path.join(TMP, 'sdc-files');
    await scaffoldDrupalTheme({
      themeName: 'test_sdc_files',
      directory: dir,
      preset: 'standard',
    });

    const sdcDir = path.join(dir, 'src', 'components', 'node-teaser');
    expect(fs.existsSync(path.join(sdcDir, 'node-teaser.component.yml'))).toBe(true);
    expect(fs.existsSync(path.join(sdcDir, 'node-teaser.twig'))).toBe(true);
  });

  it('component.yml references theme library', async () => {
    const dir = path.join(TMP, 'sdc-yml');
    await scaffoldDrupalTheme({
      themeName: 'my_theme',
      directory: dir,
      preset: 'standard',
    });

    const yml = fs.readFileSync(
      path.join(dir, 'src', 'components', 'node-teaser', 'node-teaser.component.yml'),
      'utf-8',
    );
    expect(yml).toContain('my_theme/helixui.node-teaser');
  });

  it('composer.json has type drupal-theme', async () => {
    const dir = path.join(TMP, 'composer-check');
    await scaffoldDrupalTheme({
      themeName: 'test_composer',
      directory: dir,
      preset: 'standard',
    });

    const composer = JSON.parse(
      fs.readFileSync(path.join(dir, 'composer.json'), 'utf-8'),
    ) as { type: string };
    expect(composer.type).toBe('drupal-theme');
  });

  it('info.yml contains preset name in description', async () => {
    const dir = path.join(TMP, 'info-yml');
    await scaffoldDrupalTheme({
      themeName: 'test_info',
      directory: dir,
      preset: 'healthcare',
    });

    const infoYml = fs.readFileSync(path.join(dir, 'test_info.info.yml'), 'utf-8');
    expect(infoYml).toContain('healthcare');
    expect(infoYml).toContain('core_version_requirement: ^10 || ^11');
  });

  it('healthcare preset SDCs are all present as component directories', async () => {
    const dir = path.join(TMP, 'healthcare-sdcs');
    await scaffoldDrupalTheme({
      themeName: 'test_hc_sdcs',
      directory: dir,
      preset: 'healthcare',
    });

    const componentsDir = path.join(dir, 'src', 'components');
    const sdcDirs = fs.readdirSync(componentsDir);
    expect(sdcDirs).toContain('provider-card');
    expect(sdcDirs).toContain('appointment-cta');
    expect(sdcDirs).toContain('condition-tag');
    expect(sdcDirs).toContain('medical-disclaimer');
    // Also includes blog and standard SDCs
    expect(sdcDirs).toContain('article-full');
    expect(sdcDirs).toContain('node-teaser');
  });
});
