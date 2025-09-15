import * as CheckboxPrimitive from "@rn-primitives/checkbox";
import * as React from "react";
import { Platform } from "react-native";

import { Check } from "../../lib/icons/Check";
import { cn } from "../../lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "web:peer h-4 native:h-[20] native:w-[20] w-4 shrink-0 native:rounded rounded-sm border border-primary web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        props.checked && "bg-primary",
        className
      )}
      ref={ref}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("h-full w-full items-center justify-center")}
      >
        <Check
          className="text-primary-foreground"
          size={12}
          strokeWidth={Platform.OS === "web" ? 2.5 : 3.5}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
