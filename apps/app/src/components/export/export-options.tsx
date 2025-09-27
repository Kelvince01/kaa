"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { RadioGroup } from "@kaa/ui/components/radio-group";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { HotkeyButton } from "@/components/common/hotkeys/hotkey-button";
import { HotkeyRadioButton } from "@/components/common/hotkeys/hotkey-radio-button";
import { useHotkeysHandler } from "@/hooks/use-hotkeys-handler";

// Current solution limits hotkeys to 9 options
const EXPORT_OPTIONS_GENERIC_NUMBERED_HOTKEYS = [
  "alt+shift+1",
  "alt+shift+2",
  "alt+shift+3",
  "alt+shift+4",
  "alt+shift+5",
  "alt+shift+6",
  "alt+shift+7",
  "alt+shift+8",
  "alt+shift+9",
];

export type ExportOption = {
  id: string;
  label: string;
  description: string;
  callback: () => void | Promise<void>;
};

type ExportOptionsProps = {
  options: ExportOption[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function ExportOptions({
  options,
  isOpen,
  onOpenChange,
  title,
  description,
}: ExportOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    options[0]?.id || ""
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleConfirm = async () => {
    const option = options.find((opt) => opt.id === selectedOption);
    if (!option) return;

    setIsExporting(true);
    try {
      await option.callback();
      onOpenChange(false);
      setSelectedOption("");
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedOption("");
  };

  useHotkeysHandler({
    hotkeys: "alt+enter",
    onTrigger: () => {
      if (isOpen && selectedOption) {
        handleConfirm();
      }
    },
    dependencies: [isOpen, selectedOption],
    options: {
      enabled: isOpen && !!selectedOption,
    },
  });

  useHotkeysHandler({
    hotkeys: "alt+backspace",
    onTrigger: () => {
      handleCancel();
    },
    dependencies: [isOpen],
    options: {
      enabled: isOpen,
    },
  });

  useHotkeysHandler({
    hotkeys: EXPORT_OPTIONS_GENERIC_NUMBERED_HOTKEYS,
    onTrigger: (_, handler) => {
      if (isOpen) {
        const keyPressed = handler.keys?.join("");
        const optionIndex = Number.parseInt(keyPressed || "0", 10) - 1;

        if (optionIndex >= 0 && optionIndex < options.length) {
          setSelectedOption(options[optionIndex].id);
        }
      }
    },
    dependencies: [isOpen, selectedOption],
    options: {
      enabled: isOpen,
    },
  });

  const renderExportOptions = () => {
    return (
      <RadioGroup
        className="space-y-4"
        onValueChange={setSelectedOption}
        value={selectedOption}
      >
        {options.map((option, index) => {
          const hotkeyNumber = (index + 1).toString();
          const hotkey = `shift + ${hotkeyNumber}`;
          return (
            <HotkeyRadioButton
              description={option.description}
              hotkey={hotkey}
              id={option.id}
              key={option.id}
              label={option.label}
              onSelect={() => setSelectedOption(option.id)}
              value={option.id}
            />
          );
        })}
      </RadioGroup>
    );
  };

  const renderExportButtons = () => {
    return (
      <div className="flex justify-end gap-2">
        <HotkeyButton
          hotkey={"⌫"}
          onClick={handleCancel}
          tooltip="Cancel export"
          variant="outline"
        >
          Cancel
        </HotkeyButton>
        <HotkeyButton
          disabled={!selectedOption || isExporting}
          hotkey={"↩"}
          leftIcon={isExporting ? <Loader2 className="animate-spin" /> : null}
          onClick={handleConfirm}
          tooltip="Export data with selected option"
        >
          Export
        </HotkeyButton>
      </div>
    );
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent>
        <DialogHeader className="space-y-2">
          <DialogTitle className="font-sans">{title}</DialogTitle>
          <DialogDescription className="font-serif text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">{renderExportOptions()}</div>

        <DialogFooter>{renderExportButtons()}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
