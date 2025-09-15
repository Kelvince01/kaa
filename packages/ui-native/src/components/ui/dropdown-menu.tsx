import * as DropdownMenuPrimitive from "@rn-primitives/dropdown-menu";
import * as React from "react";
import {
  Platform,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { Check } from "../../lib/icons/Check";
import { ChevronDown } from "../../lib/icons/ChevronDown";
import { ChevronRight } from "../../lib/icons/ChevronRight";
import { ChevronUp } from "../../lib/icons/ChevronUp";
import { cn } from "../../lib/utils";
import { TextClassContext } from "./text";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const { open } = DropdownMenuPrimitive.useSubContext();
  const Icon =
    Platform.OS === "web" ? ChevronRight : open ? ChevronUp : ChevronDown;
  return (
    <TextClassContext.Provider
      value={cn(
        "select-none native:text-lg text-primary text-sm",
        open && "native:text-accent-foreground"
      )}
    >
      <DropdownMenuPrimitive.SubTrigger
        className={cn(
          "flex web:cursor-default web:select-none flex-row items-center gap-2 rounded-sm px-2 native:py-2 py-1.5 web:outline-none web:hover:bg-accent web:focus:bg-accent active:bg-accent",
          open && "bg-accent",
          inset && "pl-8",
          className
        )}
        ref={ref}
        {...props}
      >
        {children as React.ReactNode}
        <Icon className="ml-auto text-foreground" size={18} />
      </DropdownMenuPrimitive.SubTrigger>
    </TextClassContext.Provider>
  );
});
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const { open } = DropdownMenuPrimitive.useSubContext();
  return (
    <DropdownMenuPrimitive.SubContent
      className={cn(
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-foreground/5 shadow-md",
        open
          ? "web:fade-in-0 web:zoom-in-95 web:animate-in"
          : "web:fade-out-0 web:zoom-out web:animate-out",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    overlayStyle?: StyleProp<ViewStyle>;
    overlayClassName?: string;
    portalHost?: string;
  }
>(
  (
    { className, overlayClassName, overlayStyle, portalHost, ...props },
    ref
  ) => {
    const { open } = DropdownMenuPrimitive.useRootContext();

    const style = StyleSheet.flatten([
      Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined,
      overlayStyle,
    ]);

    return (
      <DropdownMenuPrimitive.Portal hostName={portalHost}>
        <DropdownMenuPrimitive.Overlay
          className={overlayClassName}
          style={
            overlayStyle
              ? style
              : Platform.OS !== "web"
                ? StyleSheet.absoluteFill
                : undefined
          }
        >
          <DropdownMenuPrimitive.Content
            className={cn(
              "web:data-[side=bottom]:slide-in-from-top-2 web:data-[side=left]:slide-in-from-right-2 web:data-[side=right]:slide-in-from-left-2 web:data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-foreground/5 shadow-md",
              open
                ? "web:fade-in-0 web:zoom-in-95 web:animate-in"
                : "web:fade-out-0 web:zoom-out-95 web:animate-out",
              className
            )}
            ref={ref}
            {...props}
          />
        </DropdownMenuPrimitive.Overlay>
      </DropdownMenuPrimitive.Portal>
    );
  }
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <TextClassContext.Provider value="select-none text-sm native:text-lg text-popover-foreground web:group-focus:text-accent-foreground">
    <DropdownMenuPrimitive.Item
      className={cn(
        "group relative flex web:cursor-default flex-row items-center gap-2 rounded-sm px-2 native:py-2 py-1.5 web:outline-none web:hover:bg-accent web:focus:bg-accent active:bg-accent",
        inset && "pl-8",
        props.disabled && "web:pointer-events-none opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  </TextClassContext.Provider>
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    checked={checked}
    className={cn(
      "web:group relative flex web:cursor-default flex-row items-center rounded-sm native:py-2 py-1.5 pr-2 pl-8 web:outline-none web:focus:bg-accent active:bg-accent",
      props.disabled && "web:pointer-events-none opacity-50",
      className
    )}
    ref={ref}
    {...props}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="text-foreground" size={14} strokeWidth={3} />
      </DropdownMenuPrimitive.ItemIndicator>
    </View>
    {children as React.ReactNode}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    className={cn(
      "web:group relative flex web:cursor-default flex-row items-center rounded-sm native:py-2 py-1.5 pr-2 pl-8 web:outline-none web:focus:bg-accent active:bg-accent",
      props.disabled && "web:pointer-events-none opacity-50",
      className
    )}
    ref={ref}
    {...props}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <View className="h-2 w-2 rounded-full bg-foreground" />
      </DropdownMenuPrimitive.ItemIndicator>
    </View>
    {children as React.ReactNode}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    className={cn(
      "web:cursor-default px-2 py-1.5 font-semibold native:text-base text-foreground text-sm",
      inset && "pl-8",
      className
    )}
    ref={ref}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    ref={ref}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) => {
  return (
    <Text
      className={cn(
        "ml-auto native:text-sm text-muted-foreground text-xs tracking-widest",
        className
      )}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
