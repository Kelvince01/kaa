"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useHotkeysHandler } from "@/hooks/use-hotkeys-handler";
import { useLayout } from "@/hooks/use-layout";
import { HOTKEYS } from "@/lib/constants";
import { HotkeyIconButton } from "../common/hotkeys/hotkey-icon-button";

export function LayoutManager() {
  const { isFullScreen, toggleFullScreen } = useLayout();

  useHotkeysHandler({
    hotkeys: HOTKEYS.TOGGLE_LAYOUT?.key as string,
    onTrigger: () => {
      toggleFullScreen();
    },
  });

  return (
    <HotkeyIconButton
      className={`relative ${isFullScreen ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" : ""}`}
      hotkey={HOTKEYS.TOGGLE_LAYOUT?.hint as string}
      icon={isFullScreen ? Minimize2 : Maximize2}
      onClick={toggleFullScreen}
      srText={HOTKEYS.TOGGLE_LAYOUT?.description}
      title={HOTKEYS.TOGGLE_LAYOUT?.description}
    />
  );
}
