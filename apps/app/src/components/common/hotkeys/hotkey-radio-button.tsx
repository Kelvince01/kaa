"use client";

import { Label } from "@kaa/ui/components/label";
import { RadioGroupItem } from "@kaa/ui/components/radio-group";
import { HotkeyHint } from "@/components/common/hotkeys/hotkey-hint";
import { useKeyboard } from "@/hooks/use-keyboard";

/*
<HotkeyRadioButton
        id="export-option-1"
        value="1"
        label="Export as PDF"
        description="Export as PDF"
        hotkey="alt+shift+1"
      />
      */
type HotkeyRadioButtonProps = {
  id: string;
  value: string;
  label: string;
  description: string;
  hotkey: string;
  onSelect?: () => void;
  className?: string;
};

export function HotkeyRadioButton({
  id,
  value,
  label,
  description,
  hotkey,
  onSelect,
  className = "",
}: HotkeyRadioButtonProps) {
  const { isAltPressed } = useKeyboard();

  return (
    <div className={`relative flex items-start space-x-3 ${className}`}>
      <RadioGroupItem
        className="mt-1"
        id={id}
        onClick={onSelect}
        value={value}
      />
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <Label
            className="cursor-pointer font-medium font-sans text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            htmlFor={id}
            onClick={onSelect}
          >
            {label}
          </Label>
          <HotkeyHint
            className="hidden sm:block"
            hotkey={hotkey}
            show={isAltPressed}
            variant="middle-right"
          />
        </div>
        <p className="font-serif text-muted-foreground text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
