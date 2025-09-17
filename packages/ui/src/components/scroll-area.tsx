"use client";

import { cn } from "@kaa/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import * as React from "react";

const ScrollArea = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
  VariantProps<typeof scrollbarVariants> &
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
      viewPortRef?: React.Ref<HTMLDivElement>;
      viewPortClassName?: string;
    }
>(
  (
    { className, children, id, size, viewPortRef, viewPortClassName, ...props },
    ref
  ) => (
    <ScrollAreaPrimitive.Root
      className={cn("relative overflow-hidden", className)}
      data-slot="scroll-area"
      ref={ref}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className={cn(
          "[&>div]:block! h-full w-full rounded-[inherit]",
          viewPortClassName
        )}
        // to prevent warning on autoscroll set from Pragmatic DnD
        data-slot="scroll-area-viewport"
        id={`${id}-viewport`}
        ref={viewPortRef}
        style={{
          overflowY: "scroll",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar size={size} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const scrollbarVariants = cva("z-20 flex touch-none transition-colors", {
  variants: {
    orientation: {
      vertical: "vertical",
      horizontal: "horizontal",
    },
    size: {
      defaultVertical: "h-full w-2.5 border-l border-l-transparent p-[.05rem]",
      defaultHorizontal:
        "h-2.5 flex-col border-t border-t-transparent p-[.05rem]",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    size: "defaultVertical",
  },
});

const ScrollBar = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  VariantProps<typeof scrollbarVariants> &
    React.ComponentPropsWithoutRef<
      typeof ScrollAreaPrimitive.ScrollAreaScrollbar
    >
>(
  (
    { className, size = "defaultVertical", orientation = "vertical", ...props },
    ref
  ) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      className={cn(scrollbarVariants({ size, orientation }), className)}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      ref={ref}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        className="relative flex-1 rounded-full bg-border"
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
);
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
