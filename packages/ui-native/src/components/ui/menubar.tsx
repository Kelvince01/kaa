import * as MenubarPrimitive from "@rn-primitives/menubar";
import * as React from "react";
import { Platform, Text, View } from "react-native";
import { Check } from "../../lib/icons/check";
import { ChevronDown } from "../../lib/icons/chevron-down";
import { ChevronRight } from "../../lib/icons/chevron-right";
import { ChevronUp } from "../../lib/icons/chevron-up";
import { cn } from "../../lib/utils";

import { TextClassContext } from "./text";

const MenubarMenu = MenubarPrimitive.Menu;

const MenubarGroup = MenubarPrimitive.Group;

const MenubarPortal = MenubarPrimitive.Portal;

const MenubarSub = MenubarPrimitive.Sub;

const MenubarRadioGroup = MenubarPrimitive.RadioGroup;

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    className={cn(
      "flex h-10 native:h-12 flex-row items-center space-x-1 rounded-md border border-border bg-background p-1",
      className
    )}
    ref={ref}
    {...props}
  />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { value } = MenubarPrimitive.useRootContext();
  const { value: itemValue } = MenubarPrimitive.useMenuContext();

  return (
    <MenubarPrimitive.Trigger
      className={cn(
        "flex native:h-10 web:cursor-default web:select-none flex-row items-center rounded-sm native:px-5 px-3 native:py-0 py-1.5 font-medium text-sm web:outline-none web:focus:bg-accent web:focus:text-accent-foreground active:bg-accent",
        value === itemValue && "bg-accent text-accent-foreground",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const { open } = MenubarPrimitive.useSubContext();
  const Icon =
    Platform.OS === "web" ? ChevronRight : open ? ChevronUp : ChevronDown;
  return (
    <TextClassContext.Provider
      value={cn(
        "select-none native:text-lg text-primary text-sm",
        open && "native:text-accent-foreground"
      )}
    >
      <MenubarPrimitive.SubTrigger
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
      </MenubarPrimitive.SubTrigger>
    </TextClassContext.Provider>
  );
});
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => {
  const { open } = MenubarPrimitive.useSubContext();
  return (
    <MenubarPrimitive.SubContent
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
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content> & {
    portalHost?: string;
  }
>(({ className, portalHost, ...props }, ref) => {
  const { value } = MenubarPrimitive.useRootContext();
  const { value: itemValue } = MenubarPrimitive.useMenuContext();
  return (
    <MenubarPrimitive.Portal hostName={portalHost}>
      <MenubarPrimitive.Content
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-foreground/5 shadow-md",
          value === itemValue
            ? "web:fade-in-0 web:zoom-in-95 web:animate-in"
            : "web:fade-out-0 web:zoom-out-95 web:animate-out",
          className
        )}
        ref={ref}
        {...props}
      />
    </MenubarPrimitive.Portal>
  );
});
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <TextClassContext.Provider value="select-none text-sm native:text-lg text-popover-foreground web:group-focus:text-accent-foreground">
    <MenubarPrimitive.Item
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
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
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
      <MenubarPrimitive.ItemIndicator>
        <Check className="text-foreground" size={14} strokeWidth={3} />
      </MenubarPrimitive.ItemIndicator>
    </View>
    {children as React.ReactNode}
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    className={cn(
      "web:group relative flex web:cursor-default flex-row items-center rounded-sm native:py-2 py-1.5 pr-2 pl-8 web:outline-none web:focus:bg-accent active:bg-accent",
      props.disabled && "web:pointer-events-none opacity-50",
      className
    )}
    ref={ref}
    {...props}
  >
    <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <View className="h-2 w-2 rounded-full bg-foreground" />
      </MenubarPrimitive.ItemIndicator>
    </View>
    {children as React.ReactNode}
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    className={cn(
      "web:cursor-default px-2 py-1.5 font-semibold native:text-base text-foreground text-sm",
      inset && "pl-8",
      className
    )}
    ref={ref}
    {...props}
  />
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    ref={ref}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

const MenubarShortcut = ({
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
MenubarShortcut.displayName = "MenubarShortcut";

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};
