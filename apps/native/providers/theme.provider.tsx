import { NAV_THEME, useColorScheme } from "@kaa/ui-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider } from "@react-navigation/native";
import { SplashScreen } from "expo-router";
import type React from "react";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function GlobalThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const theme = await AsyncStorage.getItem("theme");

      if (Platform.OS === "web") {
        // biome-ignore lint/style/useCollapsedIf: false positive
        if (typeof document !== "undefined") {
          // Adds the background color to the html element to prevent white background on overscroll.
          document.documentElement.classList.add("bg-background");
        }
      }

      if (!theme) {
        await AsyncStorage.setItem("theme", colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }

      const colorTheme = theme === "dark" ? "dark" : "light";

      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);

        setIsColorSchemeLoaded(true);
        return;
      }

      setIsColorSchemeLoaded(true);
    })().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [colorScheme, setColorScheme]);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={isDarkColorScheme ? NAV_THEME.dark : NAV_THEME.light}>
      {children}
    </ThemeProvider>
  );
}
