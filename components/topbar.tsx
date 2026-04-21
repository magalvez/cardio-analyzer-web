"use client";

import { Bell, Search, User, Menu } from "lucide-react";

export default function Topbar({ userEmail }: { userEmail: string }) {
  return (
    <header className="h-20 glass border-b sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex-1" />

      <div className="flex lg:hidden items-center gap-4">
        <button className="p-2 hover:bg-slate-100  rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4">
        <button className="relative p-2.5 hover:bg-slate-100  rounded-xl transition-all group">
          <Bell className="w-5 h-5 text-slate-600  group-hover:scale-110 transition-transform" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-status-anormal rounded-full border-2 border-white " />
        </button>

        <div className="h-8 w-px bg-slate-200  mx-2" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900  leading-tight">
              {userEmail.split('@')[0]}
            </p>
            <p className="text-xs text-slate-500 ">
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
