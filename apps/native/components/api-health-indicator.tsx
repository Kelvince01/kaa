import { Text } from "@kaa/ui-native";
import { View } from "react-native";

export function ApiHealthIndicator() {
  const healthCheck = { data: true, isLoading: false };

  return (
    <View className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <View className="flex-row items-center gap-3">
        <View
          className={`h-3 w-3 rounded-full ${
            healthCheck.data ? "bg-green-500" : "bg-orange-500"
          }`}
        />
        <View className="flex-1">
          <Text className="font-medium text-card-foreground text-sm">
            Kaa API
          </Text>
          <Text className="text-muted-foreground text-xs">
            {healthCheck.isLoading
              ? "Checking connection..."
              : healthCheck.data
                ? "All systems operational"
                : "Service unavailable"}
          </Text>
        </View>
      </View>
    </View>
  );
}
