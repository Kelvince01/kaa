"use client";

import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@kaa/ui/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const ScrollArea = React.forwardRef<
	React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
	VariantProps<typeof scrollbarVariants> &
		React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
			viewPortRef?: React.Ref<HTMLDivElement>;
			viewPortClassName?: string;
		}
>(({ className, children, id, size, viewPortRef, viewPortClassName, ...props }, ref) => (
	<ScrollAreaPrimitive.Root
		ref={ref}
		data-slot="scroll-area"
		className={cn("relative overflow-hidden", className)}
		{...props}
	>
		<ScrollAreaPrimitive.Viewport
			id={`${id}-viewport`}
			// to prevent warning on autoscroll set from Pragmatic DnD
			style={{
				overflowY: "scroll",
				display: "flex",
				flexDirection: "column",
				height: "100%",
			}}
			ref={viewPortRef}
			data-slot="scroll-area-viewport"
			className={cn("[&>div]:block! h-full w-full rounded-[inherit]", viewPortClassName)}
		>
			{children}
		</ScrollAreaPrimitive.Viewport>
		<ScrollBar size={size} />
		<ScrollAreaPrimitive.Corner />
	</ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const scrollbarVariants = cva("z-20 flex touch-none transition-colors", {
	variants: {
		orientation: {
			vertical: "vertical",
			horizontal: "horizontal",
		},
		size: {
			defaultVertical: "h-full w-2.5 border-l border-l-transparent p-[.05rem]",
			defaultHorizontal: "h-2.5 flex-col border-t border-t-transparent p-[.05rem]",
		},
	},
	defaultVariants: {
		orientation: "vertical",
		size: "defaultVertical",
	},
});

const ScrollBar = React.forwardRef<
	React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
	VariantProps<typeof scrollbarVariants> &
		React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, size = "defaultVertical", orientation = "vertical", ...props }, ref) => (
	<ScrollAreaPrimitive.ScrollAreaScrollbar
		ref={ref}
		data-slot="scroll-area-scrollbar"
		orientation={orientation}
		className={cn(scrollbarVariants({ size, orientation }), className)}
		{...props}
	>
		<ScrollAreaPrimitive.ScrollAreaThumb
			data-slot="scroll-area-thumb"
			className="relative flex-1 rounded-full bg-border"
		/>
	</ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
