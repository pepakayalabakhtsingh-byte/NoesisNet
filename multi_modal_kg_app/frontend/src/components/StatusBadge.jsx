import React from 'react';
import { cn } from './Sidebar';

export default function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
    failed: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-medium border capitalize flex items-center gap-1.5",
      styles[status] || styles.pending
    )}>
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
      )}
      {status}
    </span>
  );
}
