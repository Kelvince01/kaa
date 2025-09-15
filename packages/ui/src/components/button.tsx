import { type VariantProps, cva } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@kaa/ui/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
				destructive:
					"bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
				destructiveOutline:
					"border border-destructive/30 bg-background/20 text-destructive hover:border-destructive/50 hover:bg-destructive/5",
				destructiveOutline2:
					"mt-2 inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 font-medium text-red-700 text-sm leading-4 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
				success: "bg-success text-primary-foreground hover:bg-success/80",
				outline:
					"border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
				secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
				outlineGhost:
					"border border-foreground/20 bg-background/20 hover:border-foreground/30 hover:bg-background/40 hover:text-accent-foreground",
				outlinePrimary:
					"border border-primary/30 bg-background/20 text-primary hover:border-primary/50 hover:bg-primary/5",
				link: "text-primary underline-offset-4 hover:underline",
				darkSuccess: "bg-green-700 text-white hover:bg-green-700/80",
				cell: "text-regular underline-offset-4 opacity-75 hover:underline hover:opacity-100 focus-visible:ring-transparent focus-visible:ring-offset-transparent",
				plain:
					"border border-primary/30 bg-primary/5 text-primary hover:border-primary/50 hover:bg-primary/10",
				input:
					"hover:transparent border border-input bg-background [&:not(.absolute)]:active:translate-y-0",
				none: "border-none bg-transparent",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				micro: "h-6 rounded-md p-1 text-xs",
				xs: "h-8 rounded-md px-2",
				sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
				lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
				icon: "size-9",
				xl: "h-14 rounded-lg px-6 text-lg",
				auto: "h-auto",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	loading?: boolean;
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, children, loading, disabled, ...props }, ref) => {
		const Comp = asChild ? SlotPrimitive.Slot : "button";

		if (asChild) {
			return (
				<Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
			);
		}

		return (
			<Comp
				className={cn(
					buttonVariants({ variant, size, className }),
					loading && "relative text-transparent"
				)}
				ref={ref}
				disabled={loading || disabled}
				{...props}
			>
				{loading && (
					<div className="absolute inset-0 flex items-center justify-center">
						<Loader2 className="animate-spin text-primary-foreground" />
					</div>
				)}
				{children}
			</Comp>
		);
	}
);

export { Button, buttonVariants };
