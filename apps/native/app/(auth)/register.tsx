import { Button, Input } from "@kaa/ui-native";
import { router } from "expo-router";
// import { Lock, Mail, Phone, User } from "lucide-react-native";
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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!(name && email && phone && password && confirmPassword)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      await register({
        name,
        email,
        phone,
        userType: "tenant",
      });
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Registration failed");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-grow justify-center px-6 py-6">
          <View className="mb-8 items-center">
            <Text className="mb-2 font-bold text-3xl text-black">
              Create Account
            </Text>
            <Text className="text-center text-base text-gray-500">
              Join thousands finding their perfect home
            </Text>
          </View>

          <View className="w-full">
            <Input
              // label="Full Name"
              // leftIcon={<User color="#8E8E93" size={20} />}
              onChangeText={setName}
              placeholder="Enter your full name"
              value={name}
            />

            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              // label="Email"
              // leftIcon={<Mail color="#8E8E93" size={20} />}
              onChangeText={setEmail}
              placeholder="Enter your email"
              value={email}
            />

            <Input
              keyboardType="phone-pad"
              // label="Phone Number"
              // leftIcon={<Phone color="#8E8E93" size={20} />}
              onChangeText={setPhone}
              placeholder="+254 712 345 678"
              value={phone}
            />

            <Input
              // label="Password"
              // leftIcon={<Lock color="#8E8E93" size={20} />}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
              value={password}
            />

            <Input
              // label="Confirm Password"
              // leftIcon={<Lock color="#8E8E93" size={20} />}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
            />

            <Button
              // loading={isLoading}
              className="mt-2 mb-4"
              onPress={handleRegister}
            >
              <Text>Create Account</Text>
            </Button>

            <Button
              className="mt-2"
              onPress={() => router.push("/login")}
              variant="ghost"
            >
              <Text>Already have an account? Sign In</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
