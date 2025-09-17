"use client";

import { cn } from "@kaa/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

const DrawerVariants = cva(
  "fixed z-125 flex flex-col overflow-x-hidden rounded-t-2.5 border bg-background p-4",
  {
    variants: {
      direction: {
        top: "inset-x-0 top-0 mb-24 flex-col",
        bottom: "inset-x-0 bottom-0 mt-24 flex-col",
        right: "inset-y-0 right-0 w-[95vw] flex-row",
        left: "inset-y-0 left-0 w-[95vw] flex-row",
      },
    },
    defaultVariants: {
      direction: "bottom",
    },
  }
);

const DrawerSliderVariants = cva("absolute z-10 rounded-full bg-muted", {
  variants: {
    direction: {
      top: "bottom-0.5 mx-auto my-0.5 ml-[calc(50vw-2rem)] h-1 w-12",
      bottom: "top-0.5 mx-auto my-0.5 ml-[calc(50vw-2rem)] h-1 w-12",
      right: "left-0.5 mx-0.5 my-auto mt-[calc(50vh-2.5rem)] h-16 w-1",
      left: "right-0.5 mx-0.5 my-auto mt-[calc(50vh-2.5rem)] h-16 w-1",
    },
  },
  defaultVariants: {
    direction: "bottom",
  },
});

function Drawer({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  );
}
Drawer.displayName = "Drawer";

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      className={cn(
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      )}
      data-slot="drawer-overlay"
      {...props}
    />
  );
}
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

export interface DrawerContentProps
  extends VariantProps<typeof DrawerVariants>,
    React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {}

const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(({ className, direction, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      className={cn(DrawerVariants({ direction }), className)}
      ref={ref}
      {...props}
    >
      <div className={DrawerSliderVariants({ direction })} />
      <div className="h-full w-full">{children}</div>
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-4", className)}
      data-slot="drawer-header"
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      data-slot="drawer-footer"
      {...props}
    />
  );
}
DrawerFooter.displayName = "DrawerFooter";

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn("font-semibold text-foreground", className)}
      data-slot="drawer-title"
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="drawer-description"
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
