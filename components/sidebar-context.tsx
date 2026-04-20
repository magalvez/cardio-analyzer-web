"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext({
  collapsed: false,
  isReady: false,
  setCollapsed: (val: boolean) => {},
  toggle: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Load preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
    setIsReady(true);
  }, []);

  const toggle = () => {
    const newVal = !collapsed;
    setCollapsed(newVal);
    localStorage.setItem("sidebar-collapsed", String(newVal));
  };

  return (
    <SidebarContext.Provider value={{ collapsed, isReady, setCollapsed, toggle }}>
      <div 
        className={`${collapsed ? "sidebar-collapsed" : "sidebar-expanded"} ${!isReady ? "opacity-0" : "opacity-100 transition-opacity duration-300"}`}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
