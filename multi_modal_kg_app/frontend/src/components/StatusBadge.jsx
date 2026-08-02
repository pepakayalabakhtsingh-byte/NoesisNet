import React from 'react';
import { cn } from './Logo';

export default function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    processing: 'bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-500/30 animate-pulse',
    completed: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    failed: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-semibold border capitalize flex items-center gap-1.5 shadow-sm",
      styles[status] || styles.pending
    )}>
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"></span>
      )}
      {status}
    </span>
  );
}
