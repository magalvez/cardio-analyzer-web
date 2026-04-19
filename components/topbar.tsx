"use client";

import { Bell, Search, User, Menu } from "lucide-react";

export default function Topbar({ userEmail }: { userEmail: string }) {
  return (
    <header className="h-20 glass border-b sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Search Bar */}
      <div className="hidden md:flex relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar pacientes o estudios..."
          className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-full py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        />
      </div>

      <div className="flex lg:hidden items-center gap-4">
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4">
        <button className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-status-anormal rounded-full border-2 border-white dark:border-slate-900" />
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {userEmail.split('@')[0]}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dr. Mapas
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            {userEmail[0].toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
