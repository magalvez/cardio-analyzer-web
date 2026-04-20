"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext({
  collapsed: false,
  setCollapsed: (val: boolean) => {},
  toggle: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => setCollapsed(!collapsed);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      <div className={collapsed ? "sidebar-collapsed" : "sidebar-expanded"}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
