"use client";

import {
  TooltipContent,
  type TooltipContentProps,
  TooltipPortal,
  TooltipProvider,
  Tooltip as TooltipRoot,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import React from "react";

type TooltipOptions = Pick<
  TooltipContentProps,
  | "side"
  | "align"
  | "sideOffset"
  | "alignOffset"
  | "avoidCollisions"
  | "collisionBoundary"
  | "collisionPadding"
>;

type TooltipProps = {
  portal?: boolean;
  content: React.ReactNode;
  children: React.ReactNode;
  options?: TooltipOptions;
};

const Tooltip = React.forwardRef<
  React.ComponentRef<typeof TooltipTrigger>,
  TooltipProps
>(({ children, content, portal = false, options, ...triggerProps }, ref) => {
  const Wrapper = portal ? TooltipPortal : React.Fragment;

  return (
    <TooltipProvider
      delayDuration={500}
      disableHoverableContent={false}
      skipDelayDuration={0}
    >
      <TooltipRoot>
        <TooltipTrigger asChild={true} ref={ref} {...triggerProps}>
          {children}
        </TooltipTrigger>
        <Wrapper>
          <TooltipContent
            align={"center"}
            className="rte-tooltip"
            side={"top"}
            {...options}
          >
            {content}
          </TooltipContent>
        </Wrapper>
      </TooltipRoot>
    </TooltipProvider>
  );
});

Tooltip.displayName = "Tooltip";

export default Tooltip;
