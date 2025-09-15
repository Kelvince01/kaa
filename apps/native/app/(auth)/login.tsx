// import { Mail, Lock } from "lucide-react-native";
import { Button, Input } from "@kaa/ui-native";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "$/modules/auth/auth.store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!(email && password)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Invalid credentials");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-grow justify-center px-6">
          <View className="mb-12 items-center">
            <Text className="mb-2 font-bold text-3xl text-black">
              Welcome Back
            </Text>
            <Text className="text-center text-base text-gray-500">
              Sign in to find your perfect home
            </Text>
          </View>

          <View className="w-full">
            <Input
              //   label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Enter your email"
              value={email}
              //   leftIcon={<Mail size={20} color="#8E8E93" />}
            />

            <Input
              //   label="Password"
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              //   leftIcon={<Lock size={20} color="#8E8E93" />}
            />

            <Button
              className="mt-2 mb-4"
              //   loading={isLoading}
              onPress={handleLogin}
            >
              <Text>Sign In</Text>
            </Button>

            <Button
              className="mt-2"
              onPress={() => router.push("/register")}
              variant="ghost"
            >
              <Text>Don't have an account? Sign Up</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
