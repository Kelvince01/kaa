import { router } from "expo-router";
import {
  Calendar,
  ChevronRight,
  Heart,
  HelpCircle,
  LogOut,
  MessageCircle,
  Settings,
  Shield,
  Star,
  User,
} from "lucide-react-native";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "$/modules/auth/auth.store";
import { usePropertyStore } from "$/modules/properties/property.store";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { favorites } = usePropertyStore();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: "1",
      title: "My Favorites",
      subtitle: `${favorites.length} saved properties`,
      icon: Heart,
      onPress: () => router.push("/favorites"),
      color: "#FF3B30",
    },
    {
      id: "2",
      title: "Messages",
      subtitle: "Chat with landlords",
      icon: MessageCircle,
      onPress: () => router.push("/messages"),
      color: "#007AFF",
    },
    {
      id: "3",
      title: "My Bookings",
      subtitle: "Scheduled viewings",
      icon: Calendar,
      onPress: () => router.push("/bookings"),
      color: "#34C759",
    },
    {
      id: "4",
      title: "Account Settings",
      subtitle: "Edit profile & preferences",
      icon: Settings,
      onPress: () => router.push("/settings"),
      color: "#8E8E93",
    },
    {
      id: "5",
      title: "Help & Support",
      subtitle: "Get help and contact us",
      icon: HelpCircle,
      onPress: () => router.push("/help"),
      color: "#FF9500",
    },
  ];

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const IconComponent = item.icon;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="flex-row items-center border-gray-200 border-b px-4 py-4"
        key={item.id}
        onPress={item.onPress}
      >
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${item.color}15` }}
        >
          <IconComponent color={item.color} size={20} />
        </View>
        <View className="flex-1">
          <Text className="mb-0.5 font-semibold text-base text-black">
            {item.title}
          </Text>
          <Text className="text-gray-500 text-sm">{item.subtitle}</Text>
        </View>
        <ChevronRight color="#C7C7CC" size={20} />
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-6 font-semibold text-black text-xl">
            Sign in to continue
          </Text>
          <TouchableOpacity
            className="rounded-lg bg-blue-500 px-8 py-4"
            onPress={() => router.push("/login")}
          >
            <Text className="font-semibold text-base text-white">Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="pb-8">
        <View className="mb-4 bg-white px-4 py-6">
          <View className="mb-6 flex-row items-center">
            <View className="relative mr-4">
              {user.avatar ? (
                <Image
                  className="h-20 w-20 rounded-full"
                  source={{ uri: user.avatar }}
                />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <User color="#8E8E93" size={32} />
                </View>
              )}
              {user.isVerified && (
                <View className="absolute right-0 bottom-0 h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-green-500">
                  <Shield color="#FFFFFF" size={16} />
                </View>
              )}
            </View>

            <View className="flex-1">
              <Text className="mb-1 font-bold text-2xl text-black">
                {user.name}
              </Text>
              <Text className="mb-2 text-base text-gray-500">{user.email}</Text>
              <View className="flex-row items-center">
                <Text className="font-semibold text-blue-500 text-sm">
                  {user.userType === "tenant" ? "Tenant" : "Landlord"}
                </Text>
                {user.isVerified && (
                  <Text className="ml-1 font-semibold text-green-500 text-sm">
                    • Verified
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View className="flex-row rounded-lg bg-gray-50 p-4">
            <View className="flex-1 items-center">
              <Text className="mb-1 font-bold text-black text-xl">
                {favorites.length}
              </Text>
              <Text className="font-medium text-gray-500 text-xs">
                Favorites
              </Text>
            </View>
            <View className="mx-4 w-px bg-gray-300" />
            <View className="flex-1 items-center">
              <Text className="mb-1 font-bold text-black text-xl">4.8</Text>
              <View className="flex-row items-center">
                <Star color="#FFD700" fill="#FFD700" size={12} />
                <Text className="ml-1 font-medium text-gray-500 text-xs">
                  Rating
                </Text>
              </View>
            </View>
            <View className="mx-4 w-px bg-gray-300" />
            <View className="flex-1 items-center">
              <Text className="mb-1 font-bold text-black text-xl">12</Text>
              <Text className="font-medium text-gray-500 text-xs">Reviews</Text>
            </View>
          </View>
        </View>

        <View className="mx-4 mb-4 rounded-lg bg-white">
          {menuItems.map(renderMenuItem)}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          className="mx-4 flex-row items-center justify-center rounded-lg bg-white py-4"
          onPress={handleLogout}
        >
          <LogOut color="#FF3B30" size={20} />
          <Text className="ml-2 font-semibold text-base text-red-500">
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
