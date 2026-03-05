'use client';

import { useEffect, useState } from 'react';
import { Plus, Library } from 'lucide-react';
import type { LibraryEntry } from '@/lib/library-registry';
import { LibraryCard } from './LibraryCard';
import { LibraryFormModal } from './LibraryFormModal';

interface LibrariesResponse {
  libraries: LibraryEntry[];
}

type ModalState =
  | { open: false }
  | { open: true; mode: 'add' }
  | { open: true; mode: 'edit'; library: LibraryEntry };

export function LibraryList(): React.JSX.Element {
  const [libraries, setLibraries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false });

  useEffect(() => {
    void fetchLibraries();
  }, []);

  async function fetchLibraries(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/libraries');
      if (!response.ok) {
        throw new Error(`Failed to load libraries (${response.status})`);
      }
      const data = (await response.json()) as LibrariesResponse;
      setLibraries(data.libraries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load libraries');
    } finally {
      setLoading(false);
    }
  }

  function handleAddSuccess(newLibrary: LibraryEntry): void {
    setLibraries((prev) => [...prev, newLibrary]);
    setModal({ open: false });
  }

  function handleEditSuccess(updatedLibrary: LibraryEntry): void {
    setLibraries((prev) =>
      prev.map((lib) => (lib.id === updatedLibrary.id ? updatedLibrary : lib)),
    );
    setModal({ open: false });
  }

  async function handleDelete(library: LibraryEntry): Promise<void> {
    if (!window.confirm(`Delete "${library.name}"? This cannot be undone.`)) return;

    // Optimistic update
    setLibraries((prev) => prev.filter((lib) => lib.id !== library.id));

    try {
      const response = await fetch(`/api/libraries/${library.id}`, { method: 'DELETE' });
      if (!response.ok) {
        // Revert on failure
        setLibraries((prev) => {
          const index = prev.findIndex((lib) => lib.id > library.id);
          if (index === -1) return [...prev, library];
          const next = [...prev];
          next.splice(index, 0, library);
          return next;
        });
        const data = (await response.json()) as { error: string };
        setError(data.error ?? 'Failed to delete library');
      }
    } catch {
      setLibraries((prev) => [...prev, library]);
      setError('Network error — failed to delete library');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
        Loading libraries…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <p className="text-red-400 font-medium mb-2">Failed to load libraries</p>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <button
          onClick={() => void fetchLibraries()}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Count + Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {libraries.length} {libraries.length === 1 ? 'library' : 'libraries'} registered
        </p>
        <button
          onClick={() => setModal({ open: true, mode: 'add' })}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Library
        </button>
      </div>

      {/* Grid or empty state */}
      {libraries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Library className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No libraries yet</p>
          <p className="text-xs text-muted-foreground mb-5">
            Add your first library to get started.
          </p>
          <button
            onClick={() => setModal({ open: true, mode: 'add' })}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Library
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {libraries.map((library) => (
            <LibraryCard
              key={library.id}
              library={library}
              onEdit={(lib) => setModal({ open: true, mode: 'edit', library: lib })}
              onDelete={(lib) => void handleDelete(lib)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && modal.mode === 'add' && (
        <LibraryFormModal
          mode="add"
          onClose={() => setModal({ open: false })}
          onSuccess={handleAddSuccess}
        />
      )}
      {modal.open && modal.mode === 'edit' && (
        <LibraryFormModal
          mode="edit"
          library={modal.library}
          onClose={() => setModal({ open: false })}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
