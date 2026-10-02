import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-3">
      <div className="text-5xl font-extrabold text-slate-900">404</div>
      <h1 className="text-xl font-bold text-slate-800">Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-sm">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition shadow-sm mt-3"
      >
        <Home className="w-4 h-4" />
        <span>Return to Storefront</span>
      </Link>
    </div>
  );
}
