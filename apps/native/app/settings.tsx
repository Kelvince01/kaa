import { Stack } from "expo-router";
import {
  Bell,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  Lock,
  Moon,
  Shield,
} from "lucide-react-native";

import React from "react";

import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SettingItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  type: "toggle" | "link";
  value?: boolean;
};

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [biometric, setBiometric] = React.useState(false);

  const settingSections = [
    {
      title: "Preferences",
      items: [
        {
          id: "notifications",
          title: "Push Notifications",
          subtitle: "Receive alerts for new messages and updates",
          icon: <Bell color="#6B7280" size={20} />,
          type: "toggle" as const,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: "darkMode",
          title: "Dark Mode",
          subtitle: "Switch between light and dark themes",
          icon: <Moon color="#6B7280" size={20} />,
          type: "toggle" as const,
          value: darkMode,
          onToggle: setDarkMode,
        },
        {
          id: "language",
          title: "Language",
          subtitle: "English",
          icon: <Globe color="#6B7280" size={20} />,
          type: "link" as const,
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          id: "biometric",
          title: "Biometric Login",
          subtitle: "Use fingerprint or face ID to login",
          icon: <Lock color="#6B7280" size={20} />,
          type: "toggle" as const,
          value: biometric,
          onToggle: setBiometric,
        },
        {
          id: "privacy",
          title: "Privacy Policy",
          icon: <Shield color="#6B7280" size={20} />,
          type: "link" as const,
        },
        {
          id: "terms",
          title: "Terms of Service",
          icon: <FileText color="#6B7280" size={20} />,
          type: "link" as const,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          title: "Help Center",
          icon: <HelpCircle color="#6B7280" size={20} />,
          type: "link" as const,
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => (
    <TouchableOpacity
      activeOpacity={item.type === "link" ? 0.7 : 1}
      className="flex-row items-center justify-between border-gray-100 border-b px-4 py-3"
      key={item.id}
      onPress={
        item.type === "link"
          ? () => console.log(`Navigate to ${item.id}`)
          : undefined
      }
    >
      <View className="flex-1 flex-row items-center">
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
          {item.icon}
        </View>
        <View className="flex-1">
          <Text className="mb-0.5 font-medium text-base text-gray-900">
            {item.title}
          </Text>
          {item.subtitle && (
            <Text className="text-gray-500 text-sm">{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.type === "toggle" ? (
        <Switch
          onValueChange={item.onToggle}
          thumbColor="#FFFFFF"
          trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
          value={item.value}
        />
      ) : (
        <ChevronRight color="#9CA3AF" size={20} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Stack.Screen options={{ title: "Settings", headerShown: true }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {settingSections.map((section, index) => (
          <View className="mb-6" key={`${index}-${section.title}`}>
            <Text className="mx-4 mb-2 font-semibold text-gray-500 text-sm uppercase tracking-wide">
              {section.title}
            </Text>
            <View className="border-gray-200 border-t border-b bg-white">
              {section.items.map((item) => renderSettingItem(item))}
            </View>
          </View>
        ))}

        <View className="items-center py-8">
          <Text className="mb-1 text-gray-400 text-sm">Version 1.0.0</Text>
          <Text className="text-gray-400 text-xs">© 2024 Kenya Rentals</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
