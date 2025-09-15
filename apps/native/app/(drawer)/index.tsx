import { ScrollView, Text, View } from "react-native";
import { Container } from "$/components/container";

export default function Home() {
  const healthCheck = { data: true, isLoading: false }; // useQuery(trpc.healthCheck.queryOptions());

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="mb-4 font-bold font-mono text-3xl text-foreground">
          BETTER T STACK
        </Text>
        <View className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View
              className={`h-3 w-3 rounded-full ${
                healthCheck.data ? "bg-green-500" : "bg-orange-500"
              }`}
            />
            <View className="flex-1">
              <Text className="font-medium text-card-foreground text-sm">
                TRPC
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
      </ScrollView>
    </Container>
  );
}
