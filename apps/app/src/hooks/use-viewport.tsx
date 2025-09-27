"use client";

import { createContext, useContext, useState } from "react";
import { VIEWPORT_PRESETS } from "@/components/previewer/viewport-manager";

type ViewportSize = {
  width: number;
  height: number;
};

type ViewportContextType = {
  size: ViewportSize;
  setSize: (size: ViewportSize) => void;
  preset: "desktop" | "mobile" | "custom";
  setPreset: (preset: "desktop" | "mobile" | "custom") => void;
};

const ViewportContext = createContext<ViewportContextType | null>(null);

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  const [size, setSize] = useState<ViewportSize>(VIEWPORT_PRESETS.desktop);
  const [preset, setPreset] = useState<"desktop" | "mobile" | "custom">(
    "desktop"
  );

  return (
    <ViewportContext.Provider
      value={{
        size,
        setSize,
        preset,
        setPreset,
      }}
    >
      {children}
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new Error("useViewport must be used within a ViewportProvider");
  }
  return context;
}
