import { router } from "expo-router";
import { Clock, MessageCircle } from "lucide-react-native";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MockConversation = {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar: string;
    isLandlord: boolean;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  property: {
    id: string;
    title: string;
    image: string;
  };
  unreadCount: number;
};

const mockConversations: MockConversation[] = [
  {
    id: "1",
    participant: {
      id: "l1",
      name: "Mary Wanjiku",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      isLandlord: true,
    },
    lastMessage: {
      content: "The property is available for viewing tomorrow at 2 PM",
      timestamp: "2024-01-20T14:30:00Z",
      isRead: false,
    },
    property: {
      id: "1",
      title: "Modern Bedsitter in Kilimani",
      image:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100&h=100&fit=crop",
    },
    unreadCount: 2,
  },
  {
    id: "2",
    participant: {
      id: "l2",
      name: "James Mwangi",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      isLandlord: true,
    },
    lastMessage: {
      content: "Thank you for your interest. Let me know when you can visit.",
      timestamp: "2024-01-19T16:45:00Z",
      isRead: true,
    },
    property: {
      id: "2",
      title: "Spacious 2BR Apartment in Westlands",
      image:
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop",
    },
    unreadCount: 0,
  },
];

export default function MessagesScreen() {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleConversationPress = (conversation: MockConversation) => {
    router.push(`/chat/${conversation.id}`);
  };

  const renderConversation = ({ item }: { item: MockConversation }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      className="flex-row border-gray-100 border-b bg-white px-4 py-4"
      onPress={() => handleConversationPress(item)}
    >
      <View className="relative mr-3">
        <Image
          className="h-12 w-12 rounded-full"
          source={{ uri: item.participant.avatar }}
        />
        {item.participant.isLandlord && (
          <View className="-bottom-0.5 -right-0.5 absolute h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white bg-blue-500">
            <Text className="font-bold text-white text-xs">L</Text>
          </View>
        )}
      </View>

      <View className="flex-1">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="font-semibold text-base text-black">
            {item.participant.name}
          </Text>
          <View className="flex-row items-center">
            <Clock color="#8E8E93" size={12} />
            <Text className="ml-1 text-gray-500 text-xs">
              {formatTime(item.lastMessage.timestamp)}
            </Text>
          </View>
        </View>

        <View className="mb-2 flex-row items-center">
          <Image
            className="mr-2 h-6 w-6 rounded"
            source={{ uri: item.property.image }}
          />
          <Text className="flex-1 text-gray-600 text-sm" numberOfLines={1}>
            {item.property.title}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text
            className={`mr-2 flex-1 text-sm ${
              item.lastMessage.isRead
                ? "text-gray-500"
                : "font-medium text-black"
            }`}
            numberOfLines={1}
          >
            {item.lastMessage.content}
          </Text>
          {item.unreadCount > 0 && (
            <View className="h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5">
              <Text className="font-semibold text-white text-xs">
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="items-center justify-center px-8 py-20">
      <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-gray-50">
        <MessageCircle color="#E5E5EA" size={48} />
      </View>
      <Text className="mb-2 font-semibold text-black text-xl">
        No messages yet
      </Text>
      <Text className="text-center text-base text-gray-500 leading-5">
        Start a conversation with property owners to inquire about rentals
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="border-gray-200 border-b bg-white px-4 py-5">
        <Text className="mb-1 font-bold text-2xl text-black">Messages</Text>
        <Text className="text-base text-gray-500">
          {mockConversations.length} conversations
        </Text>
      </View>

      <FlatList
        className="py-2"
        data={mockConversations}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        renderItem={renderConversation}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
