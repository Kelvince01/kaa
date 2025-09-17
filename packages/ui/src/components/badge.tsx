import { cn } from "@kaa/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        success:
          "border-transparent bg-green-500 text-white focus-visible:ring-green-500/20 dark:bg-green-500/60 dark:focus-visible:ring-green-500/40 [a&]:hover:bg-green-500/90",
        warning:
          "border-transparent bg-yellow-500 text-white focus-visible:ring-yellow-500/20 dark:bg-yellow-500/60 dark:focus-visible:ring-yellow-500/40 [a&]:hover:bg-yellow-500/90",
        destructive:
          "border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        tag: "rounded-none border-none bg-[#F2F1EF] font-mono font-normal text-[#878787] text-[10px] dark:bg-[#1D1D1D]",
        plain: "border border-primary/30 bg-primary/5 text-primary",
      },
      size: {
        micro: "h-4 text-[10px]",
        xs: "h-5 text-xs",
        sm: "h-6 text-xs",
        md: "h-7 text-sm",
        lg: "h-10 text-base",
        xl: "h-12 text-lg",
      },
      shape: {
        default: "rounded-full",
        rounded: "rounded-lg",
        square: "rounded-none",
      },
      textCase: {
        uppercase: "uppercase",
        lowercase: "lowercase",
        capitalize: "capitalize",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
      shape: "default",
      textCase: "lowercase",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : "span";

  return (
    <Comp
      className={cn(badgeVariants({ variant }), className)}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge, badgeVariants };
