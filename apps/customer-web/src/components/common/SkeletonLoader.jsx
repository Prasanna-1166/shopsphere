import React from 'react';

export function ProductSkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden p-4 space-y-3 animate-pulse"
        >
          <div className="aspect-square bg-slate-100 rounded-lg" />
          <div className="space-y-1.5">
            <div className="h-2.5 bg-slate-100 rounded w-1/4" />
            <div className="h-3.5 bg-slate-100 rounded w-3/4" />
            <div className="h-2.5 bg-slate-100 rounded w-full" />
          </div>
          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-7 w-14 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 bg-white rounded-lg border border-slate-200">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-3.5 bg-slate-100 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
