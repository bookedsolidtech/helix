/**
 * Alerting — Panopticon v2.
 * Configure webhook and email notifications for health drops.
 */
import Link from 'next/link';
import { loadAlertConfig } from '@/lib/alert-config';
import { AlertForm } from './AlertForm';
import { ArrowLeft } from 'lucide-react';

export default function AlertsPage(): React.JSX.Element {
  const config = loadAlertConfig();

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
        <h1 className="text-2xl font-bold tracking-tight">Alert Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Configure webhook and email alerts for health score drops.
        </p>
      </div>

      <AlertForm initialConfig={config} />
    </div>
  );
}
