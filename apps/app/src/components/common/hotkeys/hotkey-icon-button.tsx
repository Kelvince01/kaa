"use client";

import { Button } from "@kaa/ui/components/button";
import type { LucideIcon } from "lucide-react";
import React from "react";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";
import { useKeyboard } from "@/hooks/use-keyboard";
import { HotkeyHint } from "./hotkey-hint";

interface HotkeyIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon | React.ReactNode;
  hotkey: string;
  onClick?: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  title?: string;
  isActive?: boolean;
  srText?: string;
  showHotkeyOverride?: boolean;
}

export function HotkeyIconButton({
  icon: Icon,
  hotkey,
  onClick,
  variant = "ghost",
  size = "icon",
  className = "",
  title,
  isActive = false,
  showHotkeyOverride = false,
  srText = "",
  ...props
}: HotkeyIconButtonProps) {
  const { isAltPressed } = useKeyboard();

  return (
    <SimpleTooltip content={title}>
      <Button
        className={`relative ${className} ${
          isActive
            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
            : ""
        }`}
        onClick={onClick}
        size={size}
        variant={variant}
        {...props}
      >
        <span className="sr-only">{srText}</span>
        {React.isValidElement(Icon)
          ? Icon
          : React.createElement(Icon as LucideIcon, {
              className: "h-[1.2rem] w-[1.2rem]",
            })}
        {isAltPressed && (
          <HotkeyHint
            hotkey={hotkey}
            show={isAltPressed && !showHotkeyOverride}
          />
        )}
      </Button>
    </SimpleTooltip>
  );
}
