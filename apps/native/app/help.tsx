import { Stack } from "expo-router";
import {
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Shield,
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

const faqs: FAQItem[] = [
  {
    id: "1",
    question: "How do I list my property?",
    answer:
      'To list your property, go to the Profile tab and tap on "List Property". Fill in the details and upload photos.',
    category: "Listing",
  },
  {
    id: "2",
    question: "How do I pay rent through the app?",
    answer:
      'You can pay rent using M-Pesa. Go to your active rental and tap "Pay Rent", then follow the M-Pesa prompts.',
    category: "Payments",
  },
  {
    id: "3",
    question: "Is my personal information secure?",
    answer:
      "Yes, we use industry-standard encryption to protect your personal and payment information.",
    category: "Security",
  },
  {
    id: "4",
    question: "How do I schedule a property viewing?",
    answer:
      'On the property details page, tap "Schedule Viewing" and select your preferred date and time.',
    category: "Viewing",
  },
];

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedFAQ, setExpandedFAQ] = React.useState<string | null>(null);

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const contactOptions = [
    {
      id: "chat",
      title: "Live Chat",
      subtitle: "Chat with our support team",
      icon: <MessageCircle color="#3B82F6" size={20} />,
    },
    {
      id: "phone",
      title: "Call Us",
      subtitle: "+254 700 123 456",
      icon: <Phone color="#3B82F6" size={20} />,
    },
    {
      id: "email",
      title: "Email Support",
      subtitle: "support@kenyarentals.com",
      icon: <Mail color="#3B82F6" size={20} />,
    },
  ];

  const helpTopics = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <HelpCircle color="#6B7280" size={20} />,
    },
    {
      id: "payments",
      title: "Payments & Billing",
      icon: <CreditCard color="#6B7280" size={20} />,
    },
    {
      id: "security",
      title: "Account & Security",
      icon: <Shield color="#6B7280" size={20} />,
    },
    {
      id: "policies",
      title: "Policies & Guidelines",
      icon: <FileText color="#6B7280" size={20} />,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Stack.Screen options={{ title: "Help & Support", headerShown: true }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="p-4">
          <View className="flex-row items-center rounded-lg border border-gray-200 bg-white px-4 py-3">
            <Search color="#9CA3AF" size={20} />
            <TextInput
              className="ml-3 flex-1 text-base text-gray-900"
              onChangeText={setSearchQuery}
              placeholder="Search for help..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
            />
          </View>
        </View>

        {/* Help Topics */}
        <View className="mb-6">
          <Text className="mx-4 mb-3 font-semibold text-gray-900 text-lg">
            Browse Topics
          </Text>
          <View className="flex-row flex-wrap px-3">
            {helpTopics.map((topic) => (
              <TouchableOpacity
                activeOpacity={0.7}
                className="w-1/2 p-1"
                key={topic.id}
              >
                <View className="mb-2 items-center rounded-lg border border-gray-200 bg-white p-4">
                  {topic.icon}
                </View>
                <Text className="text-center font-medium text-gray-700 text-sm">
                  {topic.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQs */}
        <View className="mb-6">
          <Text className="mx-4 mb-3 font-semibold text-gray-900 text-lg">
            Frequently Asked Questions
          </Text>
          <View className="mx-4 overflow-hidden rounded-lg bg-white">
            {filteredFAQs.map((faq) => (
              <TouchableOpacity
                activeOpacity={0.7}
                className="border-gray-100 border-b p-4"
                key={faq.id}
                onPress={() =>
                  setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                }
              >
                <View className="flex-row items-center justify-between">
                  <Text className="mr-3 flex-1 font-medium text-gray-900 text-sm">
                    {faq.question}
                  </Text>
                  <View
                    style={
                      expandedFAQ === faq.id
                        ? { transform: [{ rotate: "90deg" }] }
                        : { transform: [{ rotate: "0deg" }] }
                    }
                  >
                    <ChevronRight color="#9CA3AF" size={20} />
                  </View>
                </View>
                {expandedFAQ === faq.id && (
                  <Text className="mt-3 text-gray-500 text-sm leading-5">
                    {faq.answer}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Options */}
        <View className="mb-6">
          <Text className="mx-4 mb-3 font-semibold text-gray-900 text-lg">
            Contact Support
          </Text>
          <View className="mx-4">
            {contactOptions.map((option) => (
              <TouchableOpacity
                activeOpacity={0.7}
                className="mb-3 flex-row items-center rounded-lg border border-gray-200 bg-white p-4"
                key={option.id}
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  {option.icon}
                </View>
                <View className="flex-1">
                  <Text className="mb-0.5 font-medium text-gray-900 text-sm">
                    {option.title}
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {option.subtitle}
                  </Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
