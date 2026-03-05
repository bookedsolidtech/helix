'use client';

import dynamic from 'next/dynamic';

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
