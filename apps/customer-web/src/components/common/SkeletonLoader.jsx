import React from 'react';

export function ProductSkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-4 animate-pulse"
        >
          <div className="aspect-square bg-slate-800 rounded-xl" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-800 rounded w-full" />
          </div>
          <div className="pt-2 flex justify-between items-center">
            <div className="h-5 bg-slate-800 rounded w-1/4" />
            <div className="h-8 w-8 bg-slate-800 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-slate-800 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
