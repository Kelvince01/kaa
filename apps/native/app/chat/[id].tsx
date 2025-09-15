import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Phone, Send, Video } from "lucide-react-native";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MockMessage = {
  id: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
};

const mockMessages: MockMessage[] = [
  {
    id: "1",
    content: "Hello! I'm interested in your property listing.",
    timestamp: "2024-01-20T10:00:00Z",
    isFromUser: true,
  },
  {
    id: "2",
    content:
      "Hi there! Thank you for your interest. The property is still available.",
    timestamp: "2024-01-20T10:05:00Z",
    isFromUser: false,
  },
  {
    id: "3",
    content: "Great! Could we schedule a viewing?",
    timestamp: "2024-01-20T10:10:00Z",
    isFromUser: true,
  },
  {
    id: "4",
    content:
      "Of course! When would be convenient for you? I'm available tomorrow afternoon or this weekend.",
    timestamp: "2024-01-20T10:15:00Z",
    isFromUser: false,
  },
  {
    id: "5",
    content: "Tomorrow afternoon works perfectly. What time?",
    timestamp: "2024-01-20T10:20:00Z",
    isFromUser: true,
  },
  {
    id: "6",
    content: "How about 2 PM? I'll send you the exact location details.",
    timestamp: "2024-01-20T10:25:00Z",
    isFromUser: false,
  },
];

export default function ChatScreen() {
  const { id, participantName, propertyTitle } = useLocalSearchParams<{
    id: string;
    participantName: string;
    propertyTitle: string;
  }>();

  const [messages, setMessages] = useState<MockMessage[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: MockMessage = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isFromUser: true,
      };

      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    }
  };

  const renderMessage = ({ item }: { item: MockMessage }) => (
    <View
      className={`mb-4 max-w-4/5 ${
        item.isFromUser ? "items-end self-end" : "items-start self-start"
      }`}
    >
      <View
        className={`mb-1 rounded-2xl px-4 py-3 ${
          item.isFromUser
            ? "rounded-br-md bg-blue-500"
            : "rounded-bl-md bg-gray-100"
        }`}
      >
        <Text
          className={`text-base leading-5 ${
            item.isFromUser ? "text-white" : "text-black"
          }`}
        >
          {item.content}
        </Text>
      </View>
      <Text
        className={`mx-2 text-xs ${
          item.isFromUser
            ? "text-right text-gray-500"
            : "text-left text-gray-500"
        }`}
      >
        {formatTime(item.timestamp)}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View className="flex-row items-center border-gray-200 border-b bg-white px-4 py-3">
      <TouchableOpacity onPress={() => router.back()}>
        <ArrowLeft color="#000000" size={24} />
      </TouchableOpacity>

      <View className="ml-4 flex-1">
        <Text className="font-semibold text-black text-lg">
          {participantName}
        </Text>
        {propertyTitle && (
          <Text className="mt-0.5 text-gray-500 text-sm" numberOfLines={1}>
            {propertyTitle}
          </Text>
        )}
      </View>

      <View className="flex-row">
        <TouchableOpacity className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Phone color="#007AFF" size={20} />
        </TouchableOpacity>
        <TouchableOpacity className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Video color="#007AFF" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {renderHeader()}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <FlatList
          className="px-4 py-4"
          data={messages}
          inverted={false}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
        />

        <View className="flex-row items-end border-gray-200 border-t bg-white px-4 py-3">
          <TextInput
            className="mr-2 max-h-25 flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-base"
            maxLength={500}
            multiline
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#8E8E93"
            value={newMessage}
          />
          <TouchableOpacity
            className={`h-10 w-10 items-center justify-center rounded-full ${
              newMessage.trim() ? "bg-blue-500" : "bg-gray-100"
            }`}
            disabled={!newMessage.trim()}
            onPress={handleSendMessage}
          >
            <Send color={newMessage.trim() ? "#FFFFFF" : "#8E8E93"} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
