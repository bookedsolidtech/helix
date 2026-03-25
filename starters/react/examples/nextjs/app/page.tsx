import HelixComponents from './components/HelixComponents';

/**
 * Home page — Server Component.
 *
 * Server Components render HTML on the server and stream it to the browser.
 * They cannot contain browser-only code (event handlers, hooks, web components).
 *
 * HELiX web components are imported and rendered inside <HelixComponents />,
 * which is a Client Component boundary ('use client'). Next.js server-renders
 * the initial HTML shell for that subtree using React's SSR support, then
 * hydrates the custom elements on the client.
 */
export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
        HELiX — Next.js App Router Example
      </h1>

      {/*
       * All HELiX component usage is delegated to this client boundary.
       * The pattern: keep Server Components as the outer shell (layout,
       * metadata, data-fetching) and push web component rendering into
       * 'use client' subtrees.
       */}
      <HelixComponents />
    </main>
  );
}
