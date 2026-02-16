'use client';

import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReviewHistoryProps {
  currentReviewDate: string;
}

export function ReviewHistory({ currentReviewDate }: ReviewHistoryProps) {
  const formattedDate = new Date(currentReviewDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
      <Badge variant="outline" className="text-[10px] text-zinc-400 border-white/[0.08] font-mono">
        Review: {formattedDate}
      </Badge>
    </div>
  );
}
