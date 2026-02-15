"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Palette,
  Ruler,
  Type,
  Square,
  Cloudy,
  Zap,
  LayoutGrid,
} from "lucide-react";

const tokenNav = [
  { href: "/tokens", label: "Overview", icon: LayoutGrid },
  { href: "/tokens/colors", label: "Colors", icon: Palette },
  { href: "/tokens/spacing", label: "Spacing", icon: Ruler },
  { href: "/tokens/typography", label: "Typography", icon: Type },
  { href: "/tokens/borders", label: "Borders", icon: Square },
  { href: "/tokens/shadows", label: "Shadows", icon: Cloudy },
  { href: "/tokens/utilities", label: "Utilities", icon: Zap },
];

export default function TokensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 border-b border-border pb-px overflow-x-auto">
        {tokenNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md border-b-2 transition-colors shrink-0",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
