import { Toaster } from "@kaa/ui-native";
import { QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "$/utils/query-client";
import { GlobalThemeProvider } from "./theme.provider";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <GlobalThemeProvider>
          {children}

          <Toaster />
        </GlobalThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
