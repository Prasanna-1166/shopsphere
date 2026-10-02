import React from 'react';
import { ShieldCheck, LogOut, Bell } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function Header() {
  const { adminUser, isSuperAdmin, logout } = useAdminAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400">Environment:</span>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
          LIVE DATABASE (Neon PG)
        </span>
      </div>

      <div className="flex items-center gap-4">
        {isSuperAdmin ? (
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black rounded-lg">
            ★ SUPER ADMIN PRIVILEGES
          </span>
        ) : (
          <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold rounded-lg">
            STORE MANAGER
          </span>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Console</span>
        </button>
      </div>
    </header>
  );
}
