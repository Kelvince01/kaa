"use client";

import { cn } from "@kaa/ui/lib/utils";
// biome-ignore lint/style/noExportedImports: by author
import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const tooltipVariants = cva(
  "fade-in-0 zoom-in-95 absolute z-50 animate-in overflow-hidden whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-xs",
  {
    variants: {
      horizontal: {
        left: "left-0",
        center: "-translate-x-1/2 left-1/2",
        right: "right-0",
      },
      vertical: {
        top: "-top-8",
        bottom: "top-full mt-2",
      },
    },
    defaultVariants: {
      horizontal: "center",
      vertical: "bottom",
    },
  }
);

type SimpleTooltipProps = {
  children: React.ReactNode;
  content?: React.ReactNode;
  className?: string;
  tooltipClassName?: string;
  tooltipVariants?: Partial<VariantProps<typeof tooltipVariants>>;
};

export function SimpleTooltip({
  children,
  content,
  className,
  tooltipClassName,
  tooltipVariants: userTooltipVariants,
}: SimpleTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoTooltipVariants, setAutoTooltipVariants] = useState<
    VariantProps<typeof tooltipVariants>
  >({
    horizontal: "center",
    vertical: "bottom",
  });

  useEffect(() => {
    if (containerRef.current && showTooltip) {
      const rect = containerRef.current.getBoundingClientRect();
      const rightSpace = window.innerWidth - rect.right;
      const leftSpace = rect.left;
      const bottomSpace = window.innerHeight - rect.bottom;

      setAutoTooltipVariants({
        horizontal:
          rightSpace < 100 ? "right" : leftSpace < 100 ? "left" : "center",
        vertical: bottomSpace < 50 ? "top" : "bottom",
      });
    }
  }, [showTooltip]);

  const finalTooltipVariants = userTooltipVariants || autoTooltipVariants;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      ref={containerRef}
    >
      {children}
      {showTooltip && content && (
        <div
          className={cn(
            tooltipVariants(finalTooltipVariants),
            tooltipClassName
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export { type VariantProps as TooltipVariantProps, tooltipVariants };
