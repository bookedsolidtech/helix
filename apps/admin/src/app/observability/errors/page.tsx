/**
 * Error Tracking — Panopticon v2.
 * Displays render failures, a11y violations, and other tracked errors.
 */
import Link from 'next/link';
import { loadErrorTrackingData } from '@/lib/error-tracker';
import { ErrorList } from './ErrorList';
import { ArrowLeft } from 'lucide-react';

export default function ErrorsPage(): React.JSX.Element {
  const errorData = loadErrorTrackingData();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/observability"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Observability Hub
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Error Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Render failures, accessibility violations, and type errors across components.
        </p>
      </div>

      <ErrorList initialData={errorData} />
    </div>
  );
}
