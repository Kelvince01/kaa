import { Tabs } from "expo-router";
import { Heart, Home, MessageCircle, Search, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },

        // tabBarActiveTintColor: isDarkColorScheme
        //   ? "hsl(217.2 91.2% 59.8%)"
        //   : "hsl(221.2 83.2% 53.3%)",
        // tabBarInactiveTintColor: isDarkColorScheme
        //   ? "hsl(215 20.2% 65.1%)"
        //   : "hsl(215.4 16.3% 46.9%)",
        // tabBarStyle: {
        //   backgroundColor: isDarkColorScheme
        //     ? "hsl(222.2 84% 4.9%)"
        //     : "hsl(0 0% 100%)",
        //   borderTopColor: isDarkColorScheme
        //     ? "hsl(217.2 32.6% 17.5%)"
        //     : "hsl(214.3 31.8% 91.4%)",
        // },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
