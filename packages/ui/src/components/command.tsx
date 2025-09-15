"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search, XCircle } from "lucide-react";
import * as React from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@kaa/ui/components/dialog";
import { SpinnerV2 } from "@kaa/ui/components/spinner";
import { cn } from "@kaa/ui/lib/utils";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn(
				"flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
				className
			)}
			{...props}
		/>
	);
}

function CommandDialog({
	title = "Command Palette",
	description = "Search for a command to run...",
	children,
	...props
}: React.ComponentProps<typeof Dialog> & {
	title?: string;
	description?: string;
}) {
	return (
		<Dialog {...props}>
			<DialogHeader className="sr-only">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>
			<DialogContent className="overflow-hidden p-0">
				<Command className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	);
}

interface CommandInputProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
	value: string;
}

interface ZeroValSet {
	clearValue?: (newVal: string) => void;
	wrapClassName?: string;
	isSearching?: boolean;
}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps & ZeroValSet>(
	({ className, wrapClassName, isSearching = false, value, clearValue, ...props }, ref) => (
		<div
			data-slot="command-input-wrapper"
			className={cn("group relative flex items-center border-b px-3", wrapClassName)}
			cmdk-input-wrapper=""
		>
			{isSearching ? (
				<SpinnerV2 className="mr-2 h-auto shrink-0 group-[.text-lg]:w-5" noDelay />
			) : (
				<Search
					size={16}
					className="mr-2 h-auto shrink-0 group-[.text-lg]:w-5"
					style={{ opacity: value ? 1 : 0.5 }}
				/>
			)}

			<CommandPrimitive.Input
				value={value}
				ref={ref}
				data-slot="command-input"
				className={cn(
					"flex h-10 w-full rounded-md border-0 bg-transparent py-3 pr-5 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
					className
				)}
				{...props}
			/>
			{value.length > 0 && (
				<XCircle
					size={16}
					className="-translate-y-1/2 absolute top-1/2 right-3 cursor-pointer opacity-70 hover:opacity-100"
					onClick={() => {
						if (clearValue) clearValue("");
					}}
				/>
			)}
		</div>
	)
);

CommandInput.displayName = CommandPrimitive.Input.displayName;

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			data-slot="command-list"
			className={cn("max-h-[300px] scroll-py-1 overflow-y-auto overflow-x-hidden", className)}
			{...props}
		/>
	);
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className="py-6 text-center text-sm"
			{...props}
		/>
	);
}

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			data-slot="command-group"
			className={cn(
				"overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs",
				className
			)}
			{...props}
		/>
	);
}

function CommandSeparator({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
	return (
		<CommandPrimitive.Separator
			data-slot="command-separator"
			className={cn("-mx-1 h-px bg-border", className)}
			{...props}
		/>
	);
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(
				"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className
			)}
			{...props}
		/>
	);
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="command-shortcut"
			className={cn("ml-auto text-muted-foreground text-xs tracking-widest", className)}
			{...props}
		/>
	);
}

// eslint-disable-next-line react/display-name
const CommandLoading = React.forwardRef<
	React.ComponentRef<typeof CommandPrimitive.Loading>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Loading>
>((props, ref) => (
	<CommandPrimitive.Loading
		className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-background bg-opacity-30"
		ref={ref}
		{...props}
	/>
));

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandShortcut,
	CommandSeparator,
	CommandLoading,
};
