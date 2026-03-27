import { setProjectAnnotations } from '@storybook/web-components';
import * as projectAnnotations from './preview';

// Apply project-level annotations (decorators, parameters, global types) so that
// Storybook's addon-vitest internal setup can call beforeAll on them correctly.
// More info: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([projectAnnotations]);
