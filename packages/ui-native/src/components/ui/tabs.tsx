import * as TabsPrimitive from "@rn-primitives/tabs";
import * as React from "react";

import { cn } from "../../lib/utils";
import { TextClassContext } from "./text";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    className={cn(
      "web:inline-flex h-10 native:h-12 items-center justify-center rounded-md bg-muted p-1 native:px-1.5",
      className
    )}
    ref={ref}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const { value } = TabsPrimitive.useRootContext();
  return (
    <TextClassContext.Provider
      value={cn(
        "font-medium native:text-base text-muted-foreground text-sm web:transition-all",
        value === props.value && "text-foreground"
      )}
    >
      <TabsPrimitive.Trigger
        className={cn(
          "inline-flex items-center justify-center web:whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-sm shadow-none web:ring-offset-background web:transition-all web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
          props.disabled && "web:pointer-events-none opacity-50",
          props.value === value &&
            "bg-background shadow-foreground/10 shadow-lg",
          className
        )}
        ref={ref}
        {...props}
      />
    </TextClassContext.Provider>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    className={cn(
      "web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
      className
    )}
    ref={ref}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
