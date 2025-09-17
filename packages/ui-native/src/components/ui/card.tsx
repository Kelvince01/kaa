import type { TextRef, ViewRef } from "@rn-primitives/types";
import * as React from "react";
import { Text, View } from "react-native";

import { cn } from "../../lib/utils";
import { TextClassContext } from "./text";

const Card = React.forwardRef<
  ViewRef,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    className={cn(
      "rounded-lg border border-border bg-card shadow-foreground",
      className
    )}
    ref={ref}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  ViewRef,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    ref={ref}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  TextRef,
  React.ComponentPropsWithoutRef<typeof Text>
>(({ className, ...props }, ref) => (
  <Text
    aria-level={3}
    className={cn(
      "font-semibold text-2xl text-card-foreground leading-none tracking-tight",
      className
    )}
    ref={ref}
    role="heading"
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  TextRef,
  React.ComponentPropsWithoutRef<typeof Text>
>(({ className, ...props }, ref) => (
  <Text
    className={cn("text-muted-foreground text-sm", className)}
    ref={ref}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  ViewRef,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <TextClassContext.Provider value="text-card-foreground">
    <View className={cn("p-6 pt-0", className)} ref={ref} {...props} />
  </TextClassContext.Provider>
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  ViewRef,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    className={cn("flex flex-row items-center p-6 pt-0", className)}
    ref={ref}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
