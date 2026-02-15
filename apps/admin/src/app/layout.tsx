import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LayoutDashboard,
  Activity,
  FileCheck2,
  Palette,
  BookOpen,
  Component,
  Boxes,
  ExternalLink,
  Map,
} from 'lucide-react';
import { DOCS_URL, STORYBOOK_URL } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  title: 'Panopticon Platform — WC-2026 Component Library',
  description:
    'Panopticon Platform: Internal dashboard for WC-2026 component library health, CEM pipeline, and development lifecycle.',
  robots: {
    index: false,
    follow: false,
  },
};

function SidebarLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {icon}
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="sticky top-0 h-screen w-64 border-r border-border bg-sidebar p-4 flex flex-col gap-6 shrink-0 overflow-y-auto">
            <div className="px-3 py-2">
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Panopticon Platform
              </h1>
              <p className="text-xs text-muted-foreground">WC-2026 Component Library</p>
            </div>

            <nav className="flex flex-col gap-1">
              <SidebarLink href="/" icon={<LayoutDashboard className="w-4 h-4" />}>
                Dashboard
              </SidebarLink>

              <SidebarLink href="/components" icon={<Boxes className="w-4 h-4" />}>
                Components
              </SidebarLink>

              <SidebarLink href="/tests" icon={<FileCheck2 className="w-4 h-4" />}>
                Tests
              </SidebarLink>

              <SidebarLink href="/tokens" icon={<Palette className="w-4 h-4" />}>
                Tokens
              </SidebarLink>

              <SidebarLink href="/pipeline" icon={<Activity className="w-4 h-4" />}>
                Pipeline
              </SidebarLink>

              <SidebarLink href="/roadmap" icon={<Map className="w-4 h-4" />}>
                Platform Roadmap
              </SidebarLink>
            </nav>

            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-medium text-foreground mb-2">Quick Links</p>
              <div className="flex flex-col gap-1.5 text-xs">
                <a
                  href={STORYBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Component className="w-3.5 h-3.5" />
                  Storybook
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </a>
                <a
                  href={DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Documentation
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="p-8 max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
