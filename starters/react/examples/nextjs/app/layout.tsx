import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'HELiX Next.js Example',
  description: 'Next.js App Router example using @helixui/react web component wrappers',
};

/**
 * Root layout — Server Component.
 *
 * NOTE: Do NOT import @helixui/library here. Web components access browser APIs
 * (customElements, HTMLElement, DOM) at import time. Those APIs do not exist in
 * the Node.js server runtime used during SSR.
 *
 * Instead, import @helixui/library inside a 'use client' boundary (see
 * app/components/HelixComponents.tsx). Next.js defers execution of 'use client'
 * modules to the browser, so the browser-only APIs are only accessed during
 * client-side hydration — exactly when they are available.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
