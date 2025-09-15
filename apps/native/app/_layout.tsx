import "$/polyfills";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";

import * as Sentry from "@sentry/react-native";
import * as SplashScreen from "expo-splash-screen";

import { RootProvider } from "$/providers/root.provider";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: "https://29b9e1387c377c287748e5314aea7f08@o4507802937196544.ingest.de.sentry.io/4510022762889296",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen
        name="property/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="search/filters"
        options={{
          title: "Filters",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}

function RootLayout() {
  return (
    <RootProvider>
      <StatusBar style="auto" />
      <RootLayoutNav />
    </RootProvider>
  );
}

export default Sentry.wrap(RootLayout);
