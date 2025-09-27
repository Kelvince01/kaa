"use client";

import { Input } from "@kaa/ui/components/input";
import { forwardRef } from "react";
import { useKeyboard } from "@/hooks/use-keyboard";
import { HotkeyHint } from "./hotkey-hint";

interface HotkeyInputProps extends React.ComponentProps<"input"> {
  hotkey: string;
  className?: string;
  units?: string;
}

const HotkeyInput = forwardRef<HTMLInputElement, HotkeyInputProps>(
  ({ hotkey, className = "", units = "", ...props }, ref) => {
    const { isAltPressed } = useKeyboard();

    return (
      <div className="relative w-full">
        <Input
          className={`w-full pr-6 font-sans ${className}`}
          ref={ref}
          {...props}
        />
        {units && (
          <span className="-translate-y-1/2 absolute top-1/2 right-3 font-mono text-muted-foreground text-xs">
            {units}
          </span>
        )}
        <HotkeyHint
          className="-translate-y-1/2 top-1/2 text-muted-foreground text-xs"
          hotkey={hotkey}
          show={isAltPressed}
          variant="middle-right"
        />
      </div>
    );
  }
);
HotkeyInput.displayName = "HotkeyInput";

export { HotkeyInput };
