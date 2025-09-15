import { Stack } from "expo-router";
import { Calendar, Clock, Home, MapPin } from "lucide-react-native";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Booking = {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  type: "viewing" | "inspection";
};

const mockBookings: Booking[] = [
  {
    id: "1",
    propertyTitle: "2 Bedroom Apartment",
    propertyAddress: "Kilimani, Nairobi",
    date: "2024-01-15",
    time: "10:00 AM",
    status: "upcoming",
    type: "viewing",
  },
  {
    id: "2",
    propertyTitle: "Studio Apartment",
    propertyAddress: "Westlands, Nairobi",
    date: "2024-01-10",
    time: "2:00 PM",
    status: "completed",
    type: "viewing",
  },
  {
    id: "3",
    propertyTitle: "3 Bedroom House",
    propertyAddress: "Karen, Nairobi",
    date: "2024-01-08",
    time: "11:00 AM",
    status: "cancelled",
    type: "inspection",
  },
];

export default function BookingsScreen() {
  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "upcoming":
        return "#10B981";
      case "completed":
        return "#6B7280";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      className="mb-3 rounded-lg bg-white p-4 shadow-sm"
    >
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Home color="#6B7280" size={16} />
          <Text className="font-medium text-gray-500 text-xs">
            {item.type === "viewing"
              ? "Property Viewing"
              : "Property Inspection"}
          </Text>
        </View>
        <View
          className="rounded-md px-2 py-1"
          style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
        >
          <Text
            className="font-semibold text-xs"
            style={{ color: getStatusColor(item.status) }}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text className="mb-3 font-semibold text-base text-gray-900">
        {item.propertyTitle}
      </Text>

      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <MapPin color="#6B7280" size={14} />
          <Text className="text-gray-500 text-sm">{item.propertyAddress}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Calendar color="#6B7280" size={14} />
          <Text className="text-gray-500 text-sm">{item.date}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Clock color="#6B7280" size={14} />
          <Text className="text-gray-500 text-sm">{item.time}</Text>
        </View>
      </View>

      {item.status === "upcoming" && (
        <View className="mt-4 flex-row gap-3 border-gray-100 border-t pt-4">
          <TouchableOpacity className="flex-1 items-center rounded-lg border border-blue-500 py-2.5">
            <Text className="font-semibold text-blue-500 text-sm">
              Reschedule
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 items-center rounded-lg border border-red-500 py-2.5">
            <Text className="font-semibold text-red-500 text-sm">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Stack.Screen options={{ title: "My Bookings", headerShown: true }} />

      <FlatList
        className="p-4"
        data={mockBookings}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-15">
            <Calendar color="#9CA3AF" size={48} />
            <Text className="mt-4 mb-2 font-semibold text-gray-900 text-lg">
              No bookings yet
            </Text>
            <Text className="text-center text-gray-500 text-sm">
              Your property viewings will appear here
            </Text>
          </View>
        }
        renderItem={renderBooking}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
