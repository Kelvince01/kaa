"use client";

import { cn } from "@kaa/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const hotkeyHintVariants = cva(
  "absolute rounded bg-muted px-1 font-mono text-[10px]",
  {
    variants: {
      variant: {
        "middle-right": "right-2",
        "bottom-right": "right-0 bottom-0",
      },
      hintColor: {
        background: "",
        foreground: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "bottom-right",
      hintColor: "background",
    },
  }
);

type HotkeyHintProps = {
  hotkey: string;
  show?: boolean;
  className?: string;
  variant?: VariantProps<typeof hotkeyHintVariants>["variant"];
  hintColor?: VariantProps<typeof hotkeyHintVariants>["hintColor"];
};

export function HotkeyHint({
  hotkey,
  show = false,
  className = "",
  variant = "bottom-right",
  hintColor = "background",
}: HotkeyHintProps) {
  if (!show) return null;

  return (
    <span className={cn(hotkeyHintVariants({ variant, hintColor }), className)}>
      {hotkey}
    </span>
  );
}
