"use client";

import useMounted from "@kaa/ui/hooks/use-mounted";
import { cn } from "@kaa/ui/lib/utils";
import { Loader2 } from "lucide-react";

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
