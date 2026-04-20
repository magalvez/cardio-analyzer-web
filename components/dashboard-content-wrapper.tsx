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
  const { collapsed } = useSidebar();

  return (
    <div 
      className="flex-1 flex flex-col transition-[padding] duration-300 ease-in-out"
      style={{ 
        paddingLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 
          ? (collapsed ? '80px' : '280px') 
          : '0px' 
      }}
    >
      <Topbar userEmail={userEmail} />
      
      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
