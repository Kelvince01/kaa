"use client";

import { cn } from "@kaa/ui/lib/utils";
import Image from "next/image";
import { Avatar as AvatarPrimitive } from "radix-ui";
// biome-ignore lint/performance/noNamespaceImport: false positive
import * as React from "react";

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      data-slot="avatar"
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      className={cn("aspect-square size-full", className)}
      data-slot="avatar-image"
      {...props}
    />
  );
}

export const AvatarImageNext = React.forwardRef<
  React.ComponentRef<typeof Image>,
  React.ComponentPropsWithoutRef<typeof Image>
>(({ className, onError, ...props }, ref) => {
  const [hasError, setHasError] = React.useState(false);

  if (hasError || !props.src) {
    return null;
  }

  return (
    <Image
      className={cn("absolute z-10 aspect-square h-full w-full", className)}
      onError={(e: any) => {
        setHasError(true);
        onError?.(e);
      }}
      ref={ref}
      {...props}
    />
  );
});

AvatarImageNext.displayName = "AvatarImageNext";

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted",
        className
      )}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

const AvatarInitials = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span className={cn("font-medium leading-none", className)} {...props}>
      {children}
    </span>
  );
};

export { Avatar, AvatarImage, AvatarFallback, AvatarInitials };
