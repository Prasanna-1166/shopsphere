import React from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  message = 'Try adjusting your filters or search terms to find what you are looking for.',
  actionLabel = 'Browse Catalog',
  actionLink = '/products',
  onAction,
}) {
  return (
    <div className="text-center py-12 px-4 bg-white border border-slate-200 rounded-2xl max-w-md mx-auto shadow-sm">
      <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
        {message}
      </p>

      {actionLabel && (
        <div className="mt-5">
          {onAction ? (
            <button
              onClick={onAction}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition shadow-sm"
            >
              {actionLabel}
            </button>
          ) : (
            <Link
              to={actionLink}
              className="inline-block px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition shadow-sm"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
