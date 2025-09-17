import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import type { Tooltip as TooltipPrimitive } from "radix-ui";
import React from "react";

interface TooltipButtonProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  children: React.ReactElement<{ ref?: React.Ref<any> }>;
  toolTipContent: string;
  disabled?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  hideWhenDetached?: boolean;
  portal?: boolean;
}

/**
 * A button that displays a tooltip when hovered.
 */
export const TooltipButton = React.forwardRef<
  HTMLDivElement,
  TooltipButtonProps
>(
  (
    {
      children,
      toolTipContent,
      disabled,
      side = "bottom",
      sideOffset = 8,
      className,
      hideWhenDetached,
      portal = true,
      ...props
    },
    ref
  ) => {
    if (disabled) return children;

    return (
      <Tooltip>
        <TooltipTrigger asChild className={className}>
          {React.cloneElement(children, { ref: ref as any })}
        </TooltipTrigger>
        {portal ? (
          <TooltipPortal>
            <TooltipContent
              side={side}
              {...props}
              hideWhenDetached={hideWhenDetached}
              sideOffset={sideOffset}
            >
              {toolTipContent}
            </TooltipContent>
          </TooltipPortal>
        ) : (
          <TooltipContent
            side={side}
            {...props}
            hideWhenDetached={hideWhenDetached}
            sideOffset={sideOffset}
          >
            {toolTipContent}
          </TooltipContent>
        )}
      </Tooltip>
    );
  }
);

TooltipButton.displayName = "TooltipButton";
