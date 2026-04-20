"use client";

import { useSidebar } from "./sidebar-context";
import Topbar from "./topbar";

export default function DashboardContentWrapper({ 
  children, 
  userEmail 
}: { 
  children: React.ReactNode;
  userEmail: string;
}) {
  const { collapsed, isReady } = useSidebar();

  // Handle hydration mismatch: default to server-rendered state (expanded)
  // until we know the actual state from localStorage.
  const paddingClass = !isReady 
    ? "lg:pl-[280px]" 
    : (collapsed ? "lg:pl-[80px]" : "lg:pl-[280px]");

  return (
    <div 
      className={`
        flex-1 flex flex-col transition-[padding] duration-300 ease-in-out
        ${paddingClass}
        pl-0
      `}
    >
      <Topbar userEmail={userEmail} />
      
      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
