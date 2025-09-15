import * as DialogPrimitive from "@rn-primitives/dialog";
import * as React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { X } from "../../lib/icons/X";
import { cn } from "../../lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlayWeb = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const { open } = DialogPrimitive.useRootContext();
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center bg-black/80 p-2",
        open
          ? "web:fade-in-0 web:animate-in"
          : "web:fade-out-0 web:animate-out",
        className
      )}
      {...props}
      ref={ref}
    />
  );
});

DialogOverlayWeb.displayName = "DialogOverlayWeb";

const DialogOverlayNative = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, children, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "flex items-center justify-center bg-black/80 p-2",
        className
      )}
      style={StyleSheet.absoluteFill}
      {...props}
      ref={ref}
    >
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
      >
        {children as React.ReactNode}
      </Animated.View>
    </DialogPrimitive.Overlay>
  );
});

DialogOverlayNative.displayName = "DialogOverlayNative";

const DialogOverlay = Platform.select({
  web: DialogOverlayWeb,
  default: DialogOverlayNative,
});

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    portalHost?: string;
  }
>(({ className, children, portalHost, ...props }, ref) => {
  const { open } = DialogPrimitive.useRootContext();
  return (
    <DialogPortal hostName={portalHost}>
      <DialogOverlay>
        <DialogPrimitive.Content
          className={cn(
            "max-w-lg web:cursor-default gap-4 rounded-lg border border-border bg-background p-6 shadow-lg web:duration-200",
            open
              ? "web:fade-in-0 web:zoom-in-95 web:animate-in"
              : "web:fade-out-0 web:zoom-out-95 web:animate-out",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            className={
              "web:group absolute top-4 right-4 rounded-sm p-0.5 opacity-70 web:ring-offset-background web:transition-opacity web:hover:opacity-100 web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2 web:disabled:pointer-events-none"
            }
          >
            <X
              className={cn(
                "text-muted-foreground",
                open && "text-accent-foreground"
              )}
              size={Platform.OS === "web" ? 16 : 18}
            />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) => (
  <View
    className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) => (
  <View
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    className={cn(
      "font-semibold native:text-xl text-foreground text-lg leading-none tracking-tight",
      className
    )}
    ref={ref}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    className={cn("native:text-base text-muted-foreground text-sm", className)}
    ref={ref}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
