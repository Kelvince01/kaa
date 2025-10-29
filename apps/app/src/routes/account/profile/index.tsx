"use client";

import { Calendar, Mail, Phone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useUpdateUser } from "@/modules/users/user.queries";
import type { UserUpdateInput } from "@/modules/users/user.type";
import { ProfileSettingsForm } from "../settings/profile-settings-form";
import type { ProfileSettingsData } from "../settings/schemas";

/**
 * User account page with profile information and navigation
 */
const Account = () => {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const updateUser = useUpdateUser();

  // Handle user profile updates
  const handleSaveProfile = async (data: ProfileSettingsData) => {
    // Handle profile settings save
    console.log("Saving profile settings:", data);
    await updateUser.mutateAsync({
      id: user?.id || "",
      data: data as UserUpdateInput,
    });
    toast.success("Profile updated successfully");
  };

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!(isLoading || user)) {
      router.push("/auth/login?redirectTo=/account");
    }
  }, [user, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary-300" />
          <h3 className="mt-4 font-medium text-gray-900 text-lg">Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12">
      <div className="container mx-auto mb-6 px-4">
        <h2 className="mb-6 font-bold text-gray-900 text-xl">
          Account Settings
        </h2>
        <p className="text-gray-600">
          Manage your account settings, notification preferences, and security
          options.
        </p>
      </div>

      <div className="container mx-auto px-4">
        {/* Page header */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center sm:flex-row">
            <div className="relative mb-4 sm:mr-6 sm:mb-0">
              <Image
                alt={`${user.firstName} ${user.lastName}`}
                className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover"
                height={80}
                src={user.avatar || "/images/default-avatar.png"}
                width={80}
              />
              {user.role === "landlord" && (
                <span className="-bottom-1 -right-1 absolute rounded-full bg-primary-600 px-2 py-0.5 text-white text-xs">
                  Landlord
                </span>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h1 className="font-bold text-2xl text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <div className="mt-1 flex flex-col text-gray-600 text-sm sm:flex-row sm:items-center">
                <div className="flex items-center justify-center sm:justify-start">
                  <Mail className="mr-1 h-4 w-4 text-gray-400" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="mt-1 flex items-center justify-center sm:mt-0 sm:ml-4 sm:justify-start">
                    <Phone className="mr-1 h-4 w-4 text-gray-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-center sm:mt-0 sm:ml-4 sm:justify-start">
                  <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                  <span>
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <ProfileSettingsForm onSave={handleSaveProfile} />
      </div>
    </div>
  );
};

export default Account;
