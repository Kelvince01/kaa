"use client";

import useMounted from "@kaa/ui/hooks/use-mounted";
import { cn } from "@kaa/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { Slot } from "radix-ui";
import React from "react";

const bars = new Array(12).fill(0);

export const Spinner = ({ size = 16 }) => {
  return (
    <div className="loading-parent">
      <div
        className="loading-wrapper"
        data-visible
        // @ts-expect-error
        style={{ "--spinner-size": `${size}px` }}
      >
        <div className="spinner">
          {bars.map((_, i) => (
            <div className="loading-bar" key={`spinner-bar-${i.toString()}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export const SpinnerV2 = ({ className = "", noDelay = false }) => {
  const { hasStarted } = useMounted();

  return (
    <div
      className="group transition-all duration-300 data-[started=false]:data-[delay=false]:opacity-0"
      data-delay={noDelay}
      data-started={hasStarted}
    >
      <Loader2
        className={cn(
          "mx-auto h-6 w-6 animate-spin text-muted-foreground",
          className
        )}
      />
    </div>
  );
};

const spinnerVariants = cva("relative block opacity-[0.65]", {
  variants: {
    size: {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-8 w-8",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof spinnerVariants> {
  loading?: boolean;
  asChild?: boolean;
}

const SpinnerV3 = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, loading = true, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";

    const [bgColorClass, filteredClassName] = React.useMemo(() => {
      const bgClass = className?.match(/(?:dark:bg-|bg-)[a-zA-Z0-9-]+/g) || [];
      const filteredClasses = className
        ?.replace(/(?:dark:bg-|bg-)[a-zA-Z0-9-]+/g, "")
        .trim();
      return [bgClass, filteredClasses];
    }, [className]);

    if (!loading) return null;

    return (
      <Comp
        className={cn(spinnerVariants({ size, className: filteredClassName }))}
        ref={ref}
        {...props}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            className="absolute top-0 left-1/2 h-full w-[12.5%] animate-spinner-leaf-fade"
            key={i.toString()}
            style={{
              transform: `rotate(${i * 45}deg)`,
              animationDelay: `${-(7 - i) * 100}ms`,
            }}
          >
            <span
              className={cn("block h-[30%] w-full rounded-full", bgColorClass)}
            />
          </span>
        ))}
      </Comp>
    );
  }
);

SpinnerV3.displayName = "SpinnerV3";

export { SpinnerV3, spinnerVariants };
