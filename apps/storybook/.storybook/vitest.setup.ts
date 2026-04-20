import { afterEach } from 'vitest';
import { setProjectAnnotations } from '@storybook/web-components';
import * as projectAnnotations from './preview';

// Apply project-level annotations (decorators, parameters, global types) so that
// Storybook's addon-vitest internal setup can call beforeAll on them correctly.
// More info: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([projectAnnotations]);

afterEach(() => {
  // Clear story content without removing the persistent mount container.
  // Storybook reuses #storybook-root between stories — removing the element
  // causes rendering failures on subsequent stories.
  const storybookRoot = document.getElementById('storybook-root');
  if (storybookRoot) {
    storybookRoot.replaceChildren();
  }
  // Remove orphaned test elements added outside the storybook root.
  document.querySelectorAll('[data-testid]').forEach((el) => {
    if (!el.closest('#storybook-root')) el.remove();
  });
});
