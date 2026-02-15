"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { BookOpen, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SplitButtonDropdownProps {
  storybookUrl: string;
  docsUrl: string;
}

export function SplitButtonDropdown({
  storybookUrl,
  docsUrl,
}: SplitButtonDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, closeMenu]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      {/* Primary action — Open in Storybook */}
      <a
        href={storybookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2",
          "text-sm font-medium",
          "bg-primary text-primary-foreground",
          "rounded-l-lg",
          "hover:bg-primary/90",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <BookOpen className="h-4 w-4" />
        Open in Storybook
      </a>

      {/* Divider */}
      <div className="w-px bg-primary-foreground/20" />

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="More actions"
        className={cn(
          "inline-flex items-center px-2.5 py-2",
          "bg-primary text-primary-foreground",
          "rounded-r-lg",
          "hover:bg-primary/90",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-1.5",
            "min-w-[200px]",
            "rounded-lg border border-border",
            "bg-popover text-popover-foreground",
            "shadow-lg shadow-black/20",
            "animate-in fade-in-0 zoom-in-95",
            "py-1"
          )}
        >
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={closeMenu}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 mx-1 rounded-md",
              "text-sm",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-100",
              "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground"
            )}
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Open in Docs</div>
              <div className="text-xs text-muted-foreground">
                Starlight documentation
              </div>
            </div>
          </a>
          <a
            href={storybookUrl}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={closeMenu}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 mx-1 rounded-md",
              "text-sm",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-100",
              "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground"
            )}
          >
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Open in Storybook</div>
              <div className="text-xs text-muted-foreground">
                Interactive playground
              </div>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
