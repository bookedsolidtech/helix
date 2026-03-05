'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LibraryEntry, LibrarySource } from '@/lib/library-registry';

interface LibraryFormModalProps {
  mode: 'add' | 'edit';
  library?: LibraryEntry;
  onClose: () => void;
  onSuccess: (library: LibraryEntry) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface FormErrors {
  name?: string;
  id?: string;
  source?: string;
  cemPath?: string;
  packageName?: string;
  prefix?: string;
  general?: string;
}

export function LibraryFormModal({
  mode,
  library,
  onClose,
  onSuccess,
}: LibraryFormModalProps): React.JSX.Element {
  const [name, setName] = useState(library?.name ?? '');
  const [id, setId] = useState(library?.id ?? '');
  const [source, setSource] = useState<LibrarySource>(library?.source ?? 'local');
  const [cemPath, setCemPath] = useState(library?.cemPath ?? '');
  const [packageName, setPackageName] = useState(library?.packageName ?? '');
  const [prefix, setPrefix] = useState(library?.prefix ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Auto-slugify ID from name in add mode
  useEffect(() => {
    if (mode === 'add') {
      setId(slugify(name));
    }
  }, [name, mode]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = { name, source, prefix };
      if (source === 'local') body.cemPath = cemPath;
      if (source === 'cdn' || source === 'npm') body.packageName = packageName;

      const url = mode === 'add' ? '/api/libraries' : `/api/libraries/${library?.id}`;
      const method = mode === 'add' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as
        | LibraryEntry
        | { error: string; detail?: string; required?: string[] };

      if (!response.ok) {
        const errData = data as { error: string; detail?: string };
        setErrors({ general: errData.error ?? 'Something went wrong' });
        return;
      }

      onSuccess(data as LibraryEntry);
    } catch {
      setErrors({ general: 'Network error — please try again' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>): void {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  const title = mode === 'add' ? 'Add Library' : 'Edit Library';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            {/* General error */}
            {errors.general && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
                {errors.general}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="lib-name">
                Name
              </label>
              <input
                ref={firstInputRef}
                id="lib-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Component Library"
                className={cn(
                  'w-full rounded-lg border bg-white/[0.03] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 transition-colors',
                  errors.name
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-border focus:ring-white/20',
                )}
                required
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* ID */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="lib-id">
                ID
                {mode === 'add' && (
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                    (auto-generated from name)
                  </span>
                )}
              </label>
              <input
                id="lib-id"
                type="text"
                value={id}
                readOnly={mode === 'edit'}
                onChange={(e) => mode === 'add' && setId(e.target.value)}
                placeholder="my-component-library"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm font-mono transition-colors focus:outline-none focus:ring-1',
                  mode === 'edit'
                    ? 'bg-white/[0.02] border-border/50 text-muted-foreground cursor-not-allowed'
                    : errors.id
                      ? 'bg-white/[0.03] border-red-500/50 text-foreground focus:ring-red-500/50'
                      : 'bg-white/[0.03] border-border text-foreground focus:ring-white/20',
                )}
              />
              {errors.id && <p className="text-xs text-red-400">{errors.id}</p>}
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="lib-source">
                Source
              </label>
              <select
                id="lib-source"
                value={source}
                onChange={(e) => setSource(e.target.value as LibrarySource)}
                disabled={mode === 'edit'}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1',
                  mode === 'edit'
                    ? 'bg-white/[0.02] border-border/50 text-muted-foreground cursor-not-allowed'
                    : 'bg-white/[0.03] border-border text-foreground focus:ring-white/20',
                )}
              >
                <option value="local">local</option>
                <option value="cdn">cdn</option>
                <option value="npm">npm</option>
              </select>
              {errors.source && <p className="text-xs text-red-400">{errors.source}</p>}
            </div>

            {/* cemPath — local only */}
            {source === 'local' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="lib-cem-path">
                  CEM Path
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                    (path to custom-elements.json)
                  </span>
                </label>
                <input
                  id="lib-cem-path"
                  type="text"
                  value={cemPath}
                  onChange={(e) => setCemPath(e.target.value)}
                  placeholder="packages/hx-library/custom-elements.json"
                  className={cn(
                    'w-full rounded-lg border bg-white/[0.03] px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 transition-colors',
                    errors.cemPath
                      ? 'border-red-500/50 focus:ring-red-500/50'
                      : 'border-border focus:ring-white/20',
                  )}
                />
                {errors.cemPath && <p className="text-xs text-red-400">{errors.cemPath}</p>}
              </div>
            )}

            {/* packageName — cdn or npm */}
            {(source === 'cdn' || source === 'npm') && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="lib-package-name">
                  Package Name
                </label>
                <input
                  id="lib-package-name"
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="@my-org/components"
                  className={cn(
                    'w-full rounded-lg border bg-white/[0.03] px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 transition-colors',
                    errors.packageName
                      ? 'border-red-500/50 focus:ring-red-500/50'
                      : 'border-border focus:ring-white/20',
                  )}
                />
                {errors.packageName && <p className="text-xs text-red-400">{errors.packageName}</p>}
              </div>
            )}

            {/* Prefix */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="lib-prefix">
                Prefix
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                  (e.g. hx-, sl-, my-)
                </span>
              </label>
              <input
                id="lib-prefix"
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="hx-"
                className={cn(
                  'w-full rounded-lg border bg-white/[0.03] px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 transition-colors',
                  errors.prefix
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-border focus:ring-white/20',
                )}
                required
              />
              {errors.prefix && <p className="text-xs text-red-400">{errors.prefix}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving…' : mode === 'add' ? 'Add Library' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
