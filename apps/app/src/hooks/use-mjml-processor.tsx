"use client";

import { Liquid } from "liquidjs";
import { createContext, useContext, useEffect, useState } from "react";

import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  DEFAULT_LOCAL_LIQUID,
  DEFAULT_MJML,
  DEFAULT_SHARED_LIQUID,
  STORAGE_KEYS,
} from "@/lib/constants";

type MJMLContextType = {
  content: string;
  setContent: (value: string) => void;
  html: string;
  vanillaHtml: () => Promise<string>;
  error: Error | null;
  isProcessing: boolean;
  refreshTemplate: () => void;
  autoSave: boolean;
  setAutoSave: (value: boolean) => void;
  forceSave: () => void;
};

const MJMLContext = createContext<MJMLContextType | null>(null);

export function MJMLProvider({ children }: { children: React.ReactNode }) {
  const [autoSave, setAutoSave] = useLocalStorage(
    STORAGE_KEYS.EDITOR_AUTO_SAVE as keyof typeof STORAGE_KEYS,
    true
  );
  const [ephemeralContent, setEphemeralContent] =
    useState<string>(DEFAULT_MJML);
  const [internalContent, setInternalContent] = useLocalStorage(
    STORAGE_KEYS.EDITOR_CONTENT as keyof typeof STORAGE_KEYS,
    DEFAULT_MJML
  );
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (internalContent) {
      setEphemeralContent(internalContent);
    }
  }, [internalContent]);

  const forceSave = () => {
    setInternalContent(ephemeralContent);
  };

  const setContent: MJMLContextType["setContent"] = (
    newContent,
    _forceSave = false
  ) => {
    setEphemeralContent(newContent);
    if (autoSave) {
      setInternalContent(newContent);
    }
  };

  const vanillaHtml = async () => {
    const mjml2html = (await import("mjml-browser")).default;
    const { html } = mjml2html(ephemeralContent, { minify: true });
    return html;
  };

  useEffect(() => {
    const processTemplate = async () => {
      setIsProcessing(true);
      setError(null);

      try {
        const mjml2html = (await import("mjml-browser")).default;
        const engine = new Liquid();

        // Get stored liquid templates with defaults
        const localLiquid =
          localStorage.getItem(
            STORAGE_KEYS.LOCAL_LIQUID as keyof typeof STORAGE_KEYS
          ) || JSON.stringify(DEFAULT_LOCAL_LIQUID);
        const sharedLiquid =
          localStorage.getItem(
            STORAGE_KEYS.SHARED_LIQUID as keyof typeof STORAGE_KEYS
          ) || JSON.stringify(DEFAULT_SHARED_LIQUID);

        // Parse liquid templates
        const localVars = JSON.parse(localLiquid);
        const sharedVars = JSON.parse(sharedLiquid);

        // Process liquid template
        const processedContent = await engine.parseAndRender(ephemeralContent, {
          ...localVars,
          ...sharedVars,
        });

        // Process MJML
        const { html: processedHtml } = mjml2html(processedContent, {
          minify: true,
        });
        setHtml(processedHtml);
      } catch (e) {
        setError(
          e instanceof Error ? e : new Error("Failed to process template")
        );
      } finally {
        setIsProcessing(false);
      }
    };

    processTemplate();
  }, [ephemeralContent]);

  const refreshTemplate = () => setRefreshKey((k) => k + 1);

  const contextValue: MJMLContextType = {
    content: ephemeralContent,
    setContent,
    html,
    vanillaHtml,
    error,
    isProcessing,
    refreshTemplate,
    autoSave,
    setAutoSave,
    forceSave,
  };

  return (
    <MJMLContext.Provider value={contextValue}>{children}</MJMLContext.Provider>
  );
}

export function useMJMLProcessor() {
  const context = useContext(MJMLContext);
  if (!context) {
    throw new Error("useMJMLProcessor must be used within a MJMLProvider");
  }
  return context;
}

export default useMJMLProcessor;
