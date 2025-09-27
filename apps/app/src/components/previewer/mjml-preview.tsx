"use client";

import { Maximize, Minimize, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useLayout } from "@/hooks/use-layout";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMJMLProcessor } from "@/hooks/use-mjml-processor";
import { useViewport } from "@/hooks/use-viewport";
import { HOTKEYS, STORAGE_KEYS } from "@/lib/constants";

export const MJMLPreview = () => {
  const { isFullScreen } = useLayout();
  const { size } = useViewport();
  const { refreshTemplate, html } = useMJMLProcessor();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isScaleMode, setIsScaleMode] = useLocalStorage(
    STORAGE_KEYS.PREVIEW_SCALE_MODE as keyof typeof STORAGE_KEYS,
    true
  );
  const { isAltPressed } = useKeyboard();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateScale = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const newScale = Math.min(1, (containerWidth - 48) / size.width);
      setScale(newScale);
    }
  }, [size.width]);

  useEffect(() => {
    if (!isScaleMode) {
      setScale(1);
      return;
    }

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isScaleMode, updateScale]);

  useHotkeys(
    HOTKEYS.TOGGLE_PREVIEW_SCALE?.key as string,
    (e) => {
      e.preventDefault();
      setIsScaleMode(!isScaleMode);
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshTemplate();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  useHotkeys(
    HOTKEYS.REFRESH_PREVIEW?.key as string,
    (e) => {
      e.preventDefault();
      handleRefresh();
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  if (!html)
    return (
      <div className="flex h-full items-center justify-center">
        <span className="font-sans">No preview available</span>
      </div>
    );

  return (
    <div className="relative h-full">
      <div
        className={`flex h-full w-full items-start justify-center bg-gray-100 p-6 dark:bg-gray-800 ${
          isScaleMode ? "overflow-x-hidden overflow-y-hidden" : "overflow-auto"
        }`}
        ref={containerRef}
      >
        <div className={`${isFullScreen ? "mt-14" : ""}`}>
          <div
            className="origin-top bg-white shadow-lg"
            style={{
              width: size.width,
              height: size.height,
              transform: isScaleMode ? `scale(${scale})` : "none",
              transformOrigin: "top center",
              marginBottom: isScaleMode
                ? `${size.height * (1 - scale)}px`
                : "0",
            }}
          >
            {/** biome-ignore lint/a11y/useIframeTitle: false positive */}
            {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: false positive */}
            <iframe
              className="h-full w-full"
              onLoad={(e) => {
                const iframe = e.target as HTMLIFrameElement;
                if (iframe.contentWindow) {
                  // Forward all keyboard events from iframe to parent
                  for (const eventType of ["keydown", "keyup", "keypress"]) {
                    iframe.contentWindow?.addEventListener(eventType, ((
                      event: Event
                    ) => {
                      const keyboardEvent = event as KeyboardEvent;
                      const simulatedEvent = new KeyboardEvent(eventType, {
                        key: keyboardEvent.key,
                        code: keyboardEvent.code,
                        ctrlKey: keyboardEvent.ctrlKey,
                        shiftKey: keyboardEvent.shiftKey,
                        altKey: keyboardEvent.altKey,
                        metaKey: keyboardEvent.metaKey,
                        bubbles: true,
                        cancelable: true,
                        composed: true,
                      });

                      document.dispatchEvent(simulatedEvent);
                    }) as EventListener);
                  }
                }
              }}
              srcDoc={html}
              style={{
                border: "none",
                margin: "0 auto",
                width: size.width,
                height: size.height,
              }}
            />
          </div>
        </div>
      </div>

      <div className="absolute right-4 bottom-4 flex gap-2">
        <button
          className={`relative rounded-full p-2 transition-colors ${
            isRefreshing
              ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
              : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          }`}
          onClick={handleRefresh}
          title="Refresh preview"
          type="button"
        >
          <RefreshCw
            className={`h-[1.2rem] w-[1.2rem] ${isRefreshing ? "animate-spin" : ""}`}
          />
          {isAltPressed && (
            <span className="absolute right-0 bottom-0 rounded bg-muted px-1 font-mono text-[10px]">
              r
            </span>
          )}
        </button>

        <button
          className={`relative rounded-full p-2 transition-colors ${
            isScaleMode
              ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
              : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          }`}
          onClick={() => setIsScaleMode(!isScaleMode)}
          title={
            isScaleMode ? "Switch to overflow mode" : "Switch to scale mode"
          }
          type="button"
        >
          {isScaleMode ? (
            <Minimize className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Maximize className="h-[1.2rem] w-[1.2rem]" />
          )}
          {isAltPressed && (
            <span className="absolute right-0 bottom-0 rounded bg-muted px-1 font-mono text-[10px]">
              f
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default MJMLPreview;
