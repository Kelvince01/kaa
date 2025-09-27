"use client";

import { DropdownMenuItem } from "@kaa/ui/components/dropdown-menu";
import type { LucideIcon } from "lucide-react";
import { useKeyboard } from "@/hooks/use-keyboard";
import { HotkeyHint } from "./hotkey-hint";

type HotkeyDropdownItemProps = {
  icon: LucideIcon;
  label: string;
  hotkey: string;
  onClick?: () => void;
  className?: string;
};

export function HotkeyDropdownItem({
  icon: Icon,
  label,
  hotkey,
  onClick,
  className = "",
}: HotkeyDropdownItemProps) {
  const { isAltPressed } = useKeyboard();

  return (
    <DropdownMenuItem className={`relative ${className}`} onClick={onClick}>
      <Icon className="mr-2 h-4 w-4" />
      <span className="font-sans">{label}</span>
      <HotkeyHint hotkey={hotkey} show={isAltPressed} variant="middle-right" />
    </DropdownMenuItem>
  );
}
