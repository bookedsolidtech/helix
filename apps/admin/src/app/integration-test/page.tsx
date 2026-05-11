'use client';

import dynamic from 'next/dynamic';

// Opt out of static export. This page mounts the full HELiX component
// library client-side via `next/dynamic({ ssr: false })`, but the page
// shell itself still tries to pre-render during `next build` and hits
// the 60s static-export deadline on GitHub-hosted runners. Forcing
// dynamic skips pre-render and the page works fine at runtime.
export const dynamic = 'force-dynamic';

// Load client-side only — web components require the DOM (no SSR)
const HelixComponents = dynamic(() => import('./helix-components'), {
  ssr: false,
  loading: () => (
    <div style={{ color: '#9ca3af', padding: '24px' }}>Loading HELIX integration test...</div>
  ),
});

export default function IntegrationTestPage() {
  return <HelixComponents />;
}
