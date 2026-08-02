import React from 'react';
import { Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Logo({ compact = false, className }) {
  return (
    <Link to="/" className={cn("flex items-center gap-3 group", className)}>
      <div className="relative flex items-center justify-center p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-lg group-hover:shadow-primary-500/25 transition-shadow">
        <Network size={24} className="text-white" strokeWidth={2.5} />
      </div>
      {!compact && (
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
          Noesis<span className="text-primary-600 dark:text-primary-400">Net</span>
        </span>
      )}
    </Link>
  );
}
