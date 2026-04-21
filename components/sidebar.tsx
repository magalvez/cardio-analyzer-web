"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Heart
} from "lucide-react";
import { handleLogout } from "@/app/dashboard/logout-action";
import { useSidebar } from "./sidebar-context";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Estudios", icon: FileText, href: "/dashboard/estudios" },
  { name: "Pacientes", icon: Users, href: "/dashboard/pacientes" },
];

const adminItems = [
  { name: "Configuración", icon: Settings, href: "/dashboard/config" },
  { name: "Médicos", icon: Users, href: "/dashboard/medicos" },
  { name: "Tarifas", icon: CreditCard, href: "/dashboard/tarifas" },
  { name: "Liquidaciones", icon: FileText, href: "/dashboard/liquidaciones" },
];

export default function Sidebar({ userRole }: { userRole: string }) {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden lg:flex flex-col h-screen fixed left-0 top-0 glass border-r z-50"
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between overflow-hidden whitespace-nowrap">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <Heart className="w-8 h-8 text-status-anormal" />
              <span className="text-xl font-bold tracking-tight">
                CARDIO <span className="text-blue-500">Analyzer</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && <Heart className="w-8 h-8 text-status-anormal mx-auto" />}
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 bg-white border rounded-full p-1 shadow-md hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Menu */}
      <nav className="flex-1 px-4 mt-8 space-y-2 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => (
          <MenuItem
            key={item.href}
            item={item}
            active={pathname === item.href}
            collapsed={collapsed}
          />
        ))}

        {userRole === "admin" && (
          <>
            <div className="pt-6 pb-2 px-2">
              {!collapsed && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administración</p>}
              {collapsed && <div className="h-px bg-slate-200  w-full" />}
            </div>
            {adminItems.map((item) => (
              <MenuItem
                key={item.href}
                item={item}
                active={pathname === item.href}
                collapsed={collapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 ">
        <button
          onClick={() => handleLogout()}
          className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:text-status-anormal hover:bg-status-anormal/5 transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {!collapsed && <span className="font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </motion.aside>
  );
}

function MenuItem({ item, active, collapsed }: { item: any; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group
        ${active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
          : "text-slate-500 hover:bg-slate-100  hover:text-slate-900 "}
      `}
    >
      <Icon className={`w-5 h-5 shrink-0 ${active ? "animate-pulse" : ""}`} />
      {!collapsed && (
        <span className="font-medium whitespace-nowrap">{item.name}</span>
      )}

      {collapsed && (
        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100]">
          {item.name}
        </div>
      )}
    </Link>
  );
}
