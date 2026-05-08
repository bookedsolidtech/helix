/**
 * HelixDocsPage — custom autodocs template for every component page.
 *
 * Wired into `parameters.docs.page` at the preview level
 * (`.storybook/preview.ts`) so every story tagged `autodocs` (which the
 * `Components/*` stories use via `tags: ['autodocs']`) renders this layout
 * instead of Storybook's default DocsPage.
 *
 * Layout:
 *   <Title />          — story metadata title
 *   <Subtitle />       — story metadata subtitle
 *   <A11yStatusCard /> — AAA cert + helixMeta surface (THE feature)
 *   <Description />    — JSDoc summary from CEM
 *   <Primary />        — primary story canvas
 *   <Controls />       — args table for primary story
 *   <Stories />        — secondary stories (excluding primary)
 *
 * Tag resolution: pulled from `useOf('meta')` which returns the resolved
 * meta module export. The Storybook-10 `meta.preparedMeta.component`
 * field is the meta `component:` string (e.g. `"hx-button"`). The
 * `useOf` hook is the documented stable path for blocks-level context
 * access in addon-docs and is re-exported from `@storybook/addon-docs/blocks`.
 */
import * as React from 'react';
import {
  Title,
  Subtitle,
  Description,
  Primary,
  Controls,
  Stories,
  useOf,
} from '@storybook/addon-docs/blocks';
import { A11yStatusCard } from './A11yStatusCard';

/**
 * Resolve the component tag from the docs context. Returns the meta
 * `component:` string when it is a `hx-*` custom element tag; null in
 * any other shape (e.g. a non-component MDX page that somehow lands here).
 *
 * Wrapped in try/catch — `useOf('meta')` throws when the docs context
 * is not a story page (defensive, should not happen in autodocs but
 * cheaper than letting the whole page throw).
 */
function useResolvedTag(): string | null {
  try {
    const meta = useOf('meta', ['meta']);
    const candidate = (meta as { preparedMeta?: { component?: unknown } } | undefined)?.preparedMeta
      ?.component;
    if (typeof candidate === 'string' && candidate.startsWith('hx-')) {
      return candidate;
    }
  } catch {
    /* swallow — addon-docs context shape can shift between versions */
  }
  return null;
}

export function HelixDocsPage(): React.ReactElement {
  const tag = useResolvedTag();
  return (
    <>
      <Title />
      <Subtitle />
      {tag ? <A11yStatusCard tag={tag} /> : null}
      <Description />
      <Primary />
      <Controls />
      <Stories />
    </>
  );
}

export default HelixDocsPage;
