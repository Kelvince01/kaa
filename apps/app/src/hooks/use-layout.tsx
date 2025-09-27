"use client";

import { createContext, useContext, useState } from "react";

type LayoutContextType = {
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  offFullScreen: () => void;
};

const LayoutContext = createContext<LayoutContextType | null>(null);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => setIsFullScreen((prev) => !prev);
  const offFullScreen = () => setIsFullScreen(false);

  return (
    <LayoutContext.Provider
      value={{ isFullScreen, toggleFullScreen, offFullScreen }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
