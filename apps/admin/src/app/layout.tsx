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
  HeartPulse,
  GitBranch,
  Cpu,
} from 'lucide-react';
import { DOCS_URL, STORYBOOK_URL } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  title: 'Panopticon Platform — HELIX Component Library',
  description:
    'Panopticon Platform: Internal dashboard for HELIX component library health, CEM pipeline, and development lifecycle.',
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
              <p className="text-xs text-muted-foreground">HELIX Component Library</p>
            </div>

            <nav className="flex flex-col gap-1">
              <SidebarLink href="/" icon={<LayoutDashboard className="w-4 h-4" />}>
                Dashboard
              </SidebarLink>

              <SidebarLink href="/components" icon={<Boxes className="w-4 h-4" />}>
                Components
              </SidebarLink>

              <SidebarLink href="/tests" icon={<FileCheck2 className="w-4 h-4" />}>
                Verification
              </SidebarLink>

              <SidebarLink href="/health" icon={<HeartPulse className="w-4 h-4" />}>
                Health Center
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

              <SidebarLink href="/hooks" icon={<GitBranch className="w-4 h-4" />}>
                Hooks & MCP
              </SidebarLink>

              <SidebarLink href="/mcp" icon={<Cpu className="w-4 h-4" />}>
                MCP Server
              </SidebarLink>
            </nav>

            <hr className="border-border" />

            <div className="flex flex-col gap-2">
              <a
                href={STORYBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,71,133,0.25)]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,71,133,0.12) 0%, rgba(255,71,133,0.06) 100%)',
                  border: '1px solid rgba(255,71,133,0.2)',
                }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,71,133,0.2) 0%, rgba(171,55,172,0.15) 100%)',
                  }}
                />
                <span
                  className="relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FF4785, #AB37AC)' }}
                >
                  <Component className="w-4 h-4 text-white" />
                </span>
                <span className="relative flex flex-col min-w-0">
                  <span
                    style={{ color: '#FF4785' }}
                    className="group-hover:brightness-110 transition-all"
                  >
                    Storybook
                  </span>
                  <span className="text-[10px] font-normal text-muted-foreground truncate">
                    Component playground
                  </span>
                </span>
                <ExternalLink
                  className="w-3.5 h-3.5 ml-auto shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                  style={{ color: '#FF4785' }}
                />
              </a>

              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(249,115,22,0.06) 100%)',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(249,115,22,0.12) 100%)',
                  }}
                />
                <span
                  className="relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #F97316)' }}
                >
                  <BookOpen className="w-4 h-4 text-white" />
                </span>
                <span className="relative flex flex-col min-w-0">
                  <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent group-hover:brightness-110 transition-all">
                    Documentation
                  </span>
                  <span className="text-[10px] font-normal text-muted-foreground truncate">
                    Starlight docs site
                  </span>
                </span>
                <ExternalLink
                  className="w-3.5 h-3.5 ml-auto shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                  style={{ color: '#8B5CF6' }}
                />
              </a>
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
