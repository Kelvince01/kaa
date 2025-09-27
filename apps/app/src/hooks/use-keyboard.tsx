"use client";

import { createContext, useContext, useEffect, useState } from "react";

type KeyboardContextType = {
  isAltPressed: boolean;
};

const KeyboardContext = createContext<KeyboardContextType>({
  isAltPressed: false,
});

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [isAltPressed, setIsAltPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt" || e.key === "Option") {
        setIsAltPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt" || e.key === "Option") {
        setIsAltPressed(false);
      }
    };

    // Handle focus/blur events to reset state
    const handleBlur = () => setIsAltPressed(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return (
    <KeyboardContext.Provider value={{ isAltPressed }}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard() {
  return useContext(KeyboardContext);
}
