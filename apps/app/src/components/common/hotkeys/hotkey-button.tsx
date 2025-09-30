"use client";

import { Button, type ButtonProps } from "@kaa/ui/components/button";
import type { LucideIcon } from "lucide-react";
import React from "react";

import { HotkeyHint } from "@/components/common/hotkeys/hotkey-hint";
import { SimpleTooltip } from "@/components/ui/simple-tooltip";
import { useKeyboard } from "@/hooks/use-keyboard";

interface HotkeyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  hotkey: string;
  onClick?: () => void;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  tooltip?: string;
  isActive?: boolean;
  leftIcon?: LucideIcon | React.ReactNode | null;
  rightIcon?: LucideIcon | React.ReactNode | null;
  showHotkeyOverride?: boolean;
  disabled?: boolean;
}

export function HotkeyButton({
  children,
  hotkey,
  onClick,
  variant = "default",
  size = "default",
  className = "",
  tooltip,
  isActive = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  showHotkeyOverride = false,
  disabled = false,
  ...props
}: HotkeyButtonProps) {
  const { isAltPressed } = useKeyboard();

  const renderIcon = (
    Icon: LucideIcon | React.ReactNode | undefined | null,
    position: "left" | "right"
  ) => {
    if (!Icon) return null;

    const iconClasses = position === "left" ? "mr-2 h-4 w-4" : "ml-2 h-4 w-4";

    return React.isValidElement(Icon)
      ? Icon
      : React.createElement(Icon as LucideIcon, { className: iconClasses });
  };

  const renderButton = () => (
    <Button
      className={`relative ${className} ${
        isActive
          ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
          : ""
      }`}
      disabled={disabled}
      onClick={onClick}
      size={size}
      variant={variant}
      {...props}
    >
      {renderIcon(LeftIcon, "left")}
      <span className="sr-only">{tooltip}</span>
      <span className="font-sans">{children}</span>
      {renderIcon(RightIcon, "right")}
      {isAltPressed && !disabled && (
        <HotkeyHint
          hintColor="foreground"
          hotkey={hotkey}
          show={isAltPressed && !showHotkeyOverride}
        />
      )}
    </Button>
  );

  if (tooltip) {
    return <SimpleTooltip content={tooltip}>{renderButton()}</SimpleTooltip>;
  }

  return renderButton();
}
