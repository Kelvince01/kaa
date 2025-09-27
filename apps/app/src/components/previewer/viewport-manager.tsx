"use client";

import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Maximize, Monitor, Smartphone } from "lucide-react";
import { useRef, useState } from "react";
import { useHotkeysHandler } from "@/hooks/use-hotkeys-handler";
import { useUIState } from "@/hooks/use-ui-state";
import { useViewport } from "@/hooks/use-viewport";
import { HOTKEYS, UI_STATE } from "@/lib/constants";
import { HotkeyDropdownItem } from "../common/hotkeys/hotkey-dropdown-item";
import { HotkeyIconButton } from "../common/hotkeys/hotkey-icon-button";
import { HotkeyInput } from "../common/hotkeys/hotkey-input";

export const VIEWPORT_PRESETS = {
  desktop: { width: 780, height: 800 },
  mobile: { width: 375, height: 667 },
} as const;

type ViewportSize = {
  width: number;
  height: number;
};

export function ViewportManager() {
  const { preset, setPreset, setSize } = useViewport();
  const { isOpen, onOpenChange } = useUIState(
    UI_STATE.VIEWPORT as keyof typeof UI_STATE
  );
  const [customSize, setCustomSize] = useState<ViewportSize>({
    width: 800,
    height: 600,
  });
  const [inputValues, setInputValues] = useState({
    width: customSize.width.toString(),
    height: customSize.height.toString(),
  });
  const widthInputRef = useRef<HTMLInputElement>(null);
  const heightInputRef = useRef<HTMLInputElement>(null);

  const handlePresetChange = (newPreset: "desktop" | "mobile") => {
    setPreset(newPreset);
    const newSize = VIEWPORT_PRESETS[newPreset];
    setSize(newSize);
    setInputValues({
      width: newSize.width.toString(),
      height: newSize.height.toString(),
    });
    setCustomSize(newSize);
    onOpenChange(false);
  };

  const handleCustomSizeChange = (
    dimension: "width" | "height",
    value: string
  ) => {
    setInputValues((prev) => ({ ...prev, [dimension]: value }));

    const numValue = Number.parseInt(value, 10);
    if (!Number.isNaN(numValue) && numValue > 0) {
      const newSize = { ...customSize, [dimension]: numValue };
      setCustomSize(newSize);
      if (preset === "custom") {
        setSize(newSize);
      }
    }
  };

  const handleCustomSelect = () => {
    const width = Number.parseInt(inputValues.width, 10);
    const height = Number.parseInt(inputValues.height, 10);

    if (
      !(Number.isNaN(width) || Number.isNaN(height)) &&
      width > 0 &&
      height > 0
    ) {
      const newSize = { width, height };
      setCustomSize(newSize);
      setSize(newSize);
      setPreset("custom");
      onOpenChange(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "width" | "height"
  ) => {
    if (e.key === "Enter") {
      handleCustomSelect();
    } else if (e.key === "Tab" && !e.shiftKey && field === "width") {
      e.preventDefault();
      heightInputRef.current?.focus();
    } else if (e.key === "Tab" && e.shiftKey && field === "height") {
      e.preventDefault();
      widthInputRef.current?.focus();
    }
  };

  useHotkeysHandler({
    hotkeys: HOTKEYS.TOGGLE_VIEWPORT?.key as string,
    onTrigger: () => {
      onOpenChange(!isOpen);
    },
  });

  const desktopRef = useHotkeysHandler({
    hotkeys: HOTKEYS.VIEWPORT_DESKTOP?.key as string,
    onTrigger: () => {
      if (isOpen) handlePresetChange("desktop");
    },
    dependencies: [isOpen],
    options: {
      enabled: isOpen,
    },
  });

  const mobileRef = useHotkeysHandler({
    hotkeys: HOTKEYS.VIEWPORT_MOBILE?.key as string,
    onTrigger: () => {
      if (isOpen) handlePresetChange("mobile");
    },
    dependencies: [isOpen],
    options: {
      enabled: isOpen,
    },
  });

  useHotkeysHandler({
    hotkeys: HOTKEYS.VIEWPORT_WIDTH?.key as string,
    onTrigger: () => {
      if (isOpen) {
        widthInputRef.current?.focus();
        widthInputRef.current?.select();
      }
    },
    dependencies: [isOpen],
    options: {
      enabled: isOpen,
    },
  });

  useHotkeysHandler({
    hotkeys: HOTKEYS.VIEWPORT_HEIGHT?.key as string,
    onTrigger: () => {
      if (isOpen) {
        heightInputRef.current?.focus();
        heightInputRef.current?.select();
      }
    },
    dependencies: [isOpen],
    options: {
      enabled: isOpen,
    },
  });

  return (
    <DropdownMenu onOpenChange={onOpenChange} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <HotkeyIconButton
          hotkey={HOTKEYS.TOGGLE_VIEWPORT?.hint as string}
          icon={
            preset === "desktop"
              ? Monitor
              : preset === "mobile"
                ? Smartphone
                : Maximize
          }
          showHotkeyOverride={isOpen}
          srText={HOTKEYS.TOGGLE_VIEWPORT?.description as string}
          title={HOTKEYS.TOGGLE_VIEWPORT?.description as string}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[200px]"
        ref={(el) => {
          desktopRef.current = el;
          mobileRef.current = el;
        }}
      >
        <HotkeyDropdownItem
          hotkey={HOTKEYS.VIEWPORT_DESKTOP?.hint as string}
          icon={Monitor}
          label="Desktop"
          onClick={() => handlePresetChange("desktop")}
        />
        <HotkeyDropdownItem
          hotkey={HOTKEYS.VIEWPORT_MOBILE?.hint as string}
          icon={Smartphone}
          label="Mobile"
          onClick={() => handlePresetChange("mobile")}
        />
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="mb-2">
            <span className="font-sans text-sm">Custom Size</span>
          </div>
          <div className="mb-2 flex gap-2">
            <div className="relative w-full">
              <HotkeyInput
                className="w-full pr-6 font-sans"
                hotkey={HOTKEYS.VIEWPORT_WIDTH?.hint as string}
                onChange={(e) =>
                  handleCustomSizeChange("width", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, "width")}
                ref={widthInputRef}
                type="text"
                units="w"
                value={inputValues.width}
              />
            </div>
            <div className="relative w-full">
              <HotkeyInput
                className="w-full pr-6 font-sans"
                hotkey={HOTKEYS.VIEWPORT_HEIGHT?.hint as string}
                onChange={(e) =>
                  handleCustomSizeChange("height", e.target.value)
                }
                onKeyDown={(e) => handleKeyDown(e, "height")}
                ref={heightInputRef}
                type="text"
                units="h"
                value={inputValues.height}
              />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!(inputValues.width && inputValues.height)}
            onClick={handleCustomSelect}
            size="sm"
            variant="secondary"
          >
            <span className="font-sans">
              {preset === "custom"
                ? "Applying custom size..."
                : "Apply custom size"}
            </span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
