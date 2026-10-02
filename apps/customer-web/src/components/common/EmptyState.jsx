import React from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'Try adjusting your filters or search terms to find what you are looking for.',
  actionText = 'Browse Catalog',
  actionLink = '/products',
  onAction,
}) {
  return (
    <div className="text-center py-16 px-4 bg-slate-900/50 border border-slate-800 rounded-3xl max-w-lg mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/80 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-700/50">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-100">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {(actionText && (actionLink || onAction)) && (
        <div className="mt-6">
          {onAction ? (
            <button
              onClick={onAction}
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-glow"
            >
              {actionText}
            </button>
          ) : (
            <Link
              to={actionLink}
              className="inline-block px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-glow"
            >
              {actionText}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
