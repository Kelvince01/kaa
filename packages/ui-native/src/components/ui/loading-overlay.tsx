import type { PropsWithChildren } from "react";

import { ActivityIndicator, View } from "react-native";

import { cn } from "../../lib/utils";

export function LoadingOverlay({
  children,
  className,
  size = "small",
  fullPage = true,
}: PropsWithChildren<{
  className?: string;
  spinnerClassName?: string;
  fullPage?: boolean;
  displayLogo?: boolean;
  size?: "small" | "large";
}>) {
  return (
    <View
      className={cn(
        "flex flex-col items-center justify-center space-y-4",
        className,
        {
          "fixed top-0 left-0 z-[100] h-screen w-screen bg-background":
            fullPage,
        }
      )}
    >
      <ActivityIndicator size={size} />

      <View className={"text-muted-foreground text-sm"}>{children}</View>
    </View>
  );
}
