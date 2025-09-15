import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@kaa/ui/lib/utils";

interface HeadingProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string;
	description?: string;
	asChild?: boolean;
}

const Heading = React.forwardRef<HTMLDivElement, HeadingProps>(
	({ title, description, asChild = false, className, ...props }, ref) => {
		const Comp = asChild ? SlotPrimitive.Slot : "div";

		return (
			<Comp ref={ref} className={cn("space-y-1", className)} {...props}>
				<h2 className="font-semibold text-2xl tracking-tight">{title}</h2>
				{description && <p className="text-muted-foreground text-sm">{description}</p>}
			</Comp>
		);
	}
);

Heading.displayName = "Heading";

export { Heading };
