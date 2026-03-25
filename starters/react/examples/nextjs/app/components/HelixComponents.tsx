'use client';

/**
 * HelixComponents — Client Component boundary for HELiX web components.
 *
 * WHY 'use client' IS REQUIRED
 * ─────────────────────────────
 * HELiX is built on Lit 3.x web components. When @helixui/library is imported,
 * each component class calls `customElements.define('hx-button', HxButton)`.
 * The `customElements` registry is a browser API that does not exist in Node.js,
 * so importing the library in a Server Component would crash the SSR runtime.
 *
 * Marking this file 'use client' tells Next.js to:
 *   1. Exclude this module from the server bundle.
 *   2. Include it in the client bundle (React's "client graph").
 *   3. Server-render a placeholder HTML shell for this subtree via React's
 *      `renderToString` path (which does NOT execute the module).
 *   4. Hydrate the subtree in the browser, where `customElements` is available.
 *
 * HOW SSR / HYDRATION WORKS WITH WEB COMPONENTS
 * ───────────────────────────────────────────────
 * Next.js streams the page HTML to the browser. The hx-* element tags appear in
 * the HTML as unknown custom element nodes (the browser treats them as HTMLElement
 * until upgraded). Once the client bundle loads and executes:
 *   - @helixui/library registers the custom elements.
 *   - The browser "upgrades" each element, running its constructor and lifecycle.
 *   - React reconciles its virtual DOM with the server-rendered HTML.
 *
 * The @helixui/react wrappers already include 'use client' at the top of each
 * generated file, so they cannot accidentally be imported in a Server Component.
 * This file is the recommended integration point for any page that uses HELiX.
 */

// Side-effect import: registers all hx-* custom elements in the browser.
// This MUST live inside a 'use client' boundary.
import '@helixui/library';

import { useState } from 'react';
import { HxBadge, HxButton, HxCard, HxText, HxTextInput } from '@helixui/react';

export default function HelixComponents() {
  const [searchValue, setSearchValue] = useState('');
  const [clickCount, setClickCount] = useState(0);

  // onHxClick resolves to (event: Event) => void — fully typed by @helixui/react
  function handlePrimaryClick(event: Event) {
    console.log('Primary button clicked', event);
    setClickCount((prev) => prev + 1);
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    setSearchValue(target.value);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <HxBadge variant="info">Info</HxBadge>
        <HxBadge variant="success">Success</HxBadge>
        <HxBadge variant="warning">Warning</HxBadge>
        <HxBadge variant="danger">Danger</HxBadge>
        <HxBadge variant="neutral">Neutral</HxBadge>
      </div>

      {/* Button with typed onHxClick handler */}
      <HxCard>
        <div style={{ padding: '1.25rem' }}>
          <HxText variant="label" weight="semibold" as="p" style={{ marginBottom: '0.75rem' }}>
            Typed event handlers
          </HxText>
          <HxText variant="body-sm" color="subtle" as="p" style={{ marginBottom: '1rem' }}>
            onHxClick resolves to (event: Event) =&gt; void. Clicked {clickCount} time
            {clickCount !== 1 ? 's' : ''}.
          </HxText>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <HxButton variant="primary" onHxClick={handlePrimaryClick}>
              Count clicks
            </HxButton>
            <HxButton variant="secondary" onHxClick={() => setClickCount(0)}>
              Reset
            </HxButton>
          </div>
        </div>
      </HxCard>

      {/* Text input with controlled state */}
      <HxCard>
        <div style={{ padding: '1.25rem' }}>
          <HxText variant="label" weight="semibold" as="p" style={{ marginBottom: '0.75rem' }}>
            Controlled HxTextInput
          </HxText>
          <HxTextInput
            label="Search patients"
            placeholder="Enter patient name…"
            value={searchValue}
            onHxInput={handleSearchInput}
          />
          {searchValue.length > 0 && (
            <HxText variant="body-sm" color="subtle" as="p" style={{ marginTop: '0.5rem' }}>
              Query: &ldquo;{searchValue}&rdquo;
            </HxText>
          )}
        </div>
      </HxCard>
    </div>
  );
}
