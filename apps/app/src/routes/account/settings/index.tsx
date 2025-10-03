"use client";

import { Bell, CreditCard, Lock, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { NotificationSettingsForm } from "./notification-settings-form";
import { PaymentSettingsForm } from "./payment-settings-form";
import { PrivacySettingsForm } from "./privacy-settings-form";
import { ProfileSettingsForm } from "./profile-settings-form";
import type {
  NotificationSettingsData,
  PaymentSettingsData,
  PrivacySettingsData,
  ProfileSettingsData,
  SecuritySettingsData,
  TwoFactorData,
} from "./schemas";
import { SecuritySettingsForm } from "./security-settings-form";

// Define the tabs for settings
const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "payment", label: "Payment Methods", icon: CreditCard },
];

const AccountSettingsClient = () => {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  // Save handlers for each form
  const handleSaveProfile = async (data: ProfileSettingsData) => {
    // Handle profile settings save
    console.log("Saving profile settings:", data);
    // Implement API call here
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const handleSavePassword = async (data: SecuritySettingsData) => {
    // Handle password change
    console.log("Changing password:", data);
    // Implement API call here
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const handleToggle2FA = async (data: TwoFactorData) => {
    // Handle 2FA toggle
    console.log("Toggle 2FA:", data);
    // Implement API call here
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const handleSaveNotifications = async (data: NotificationSettingsData) => {
    // Handle notification settings save
    console.log("Saving notification settings:", data);
    // Implement API call here
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const handleSavePrivacy = async (data: PrivacySettingsData) => {
    // Handle privacy settings save
    console.log("Saving privacy settings:", data);
    // Implement API call here
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const handleSavePayment = async (data: PaymentSettingsData) => {
    // Handle payment settings save
    console.log("Saving payment settings:", data);
    // Implement API call here
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-gray-200" />
          <div className="flex space-x-4">
            <div className="h-10 w-40 rounded bg-gray-200" />
            <div className="h-10 w-40 rounded bg-gray-200" />
            <div className="h-10 w-40 rounded bg-gray-200" />
          </div>
          <div className="h-64 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect if user not logged in
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 font-bold text-2xl text-gray-900">
        Account Settings
      </h1>

      {/* Settings Tabs */}
      <div className="mb-6 border-gray-200 border-b">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              className={`flex items-center whitespace-nowrap border-b-2 px-4 py-3 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content for Profile Tab */}
      {activeTab === "profile" && (
        <ProfileSettingsForm onSave={handleSaveProfile} />
      )}

      {/* Content for Security Tab */}
      {activeTab === "security" && (
        <SecuritySettingsForm
          onSavePassword={handleSavePassword}
          onToggle2FA={handleToggle2FA}
        />
      )}

      {/* Other tab contents */}
      {activeTab === "notifications" && (
        <NotificationSettingsForm onSave={handleSaveNotifications} />
      )}

      {activeTab === "privacy" && (
        <PrivacySettingsForm onSave={handleSavePrivacy} />
      )}

      {activeTab === "payment" && (
        <PaymentSettingsForm onSave={handleSavePayment} />
      )}
    </div>
  );
};

export default AccountSettingsClient;
