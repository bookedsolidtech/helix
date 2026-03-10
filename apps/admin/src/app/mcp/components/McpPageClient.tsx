'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

interface McpRefreshButtonProps {
  className?: string;
}

export function McpRefreshButton({ className }: McpRefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-lg border border-border bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50 ${className ?? ''}`}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Probing...' : 'Re-probe'}
    </button>
  );
}
