"use client";

import { useMutation } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  FileText,
  Heart,
  Home,
  Mail,
  Phone,
  Settings,
  UserIcon,
} from "lucide-react";
// import ProfileForm from "./profile-form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/modules/auth/auth.store";
import type { User } from "@/modules/users/user.type";

/**
 * User account page with profile information and navigation
 */
const Account = () => {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>("profile");

  const updateUser = useMutation({
    mutationFn: (updatedUser: User) =>
      api.put(`/users/${updatedUser.id}`, updatedUser),
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  // Handle user profile updates
  const handleProfileUpdate = (updatedUser: User): void => {
    updateUser.mutate(updatedUser);
  };

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!(isLoading || user)) {
      router.push("/accounts/login?redirectTo=/account");
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
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar navigation */}
          <div className="lg:w-1/4">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <nav className="divide-y divide-gray-200">
                <button
                  className={`flex w-full items-center px-6 py-4 text-left font-medium text-sm ${
                    activeTab === "profile"
                      ? "border-primary-600 border-l-4 bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("profile")}
                  type="button"
                >
                  <UserIcon
                    className={`mr-3 h-5 w-5 ${
                      activeTab === "profile"
                        ? "text-primary-600"
                        : "text-gray-400"
                    }`}
                  />
                  My Profile
                </button>

                <button
                  className={`flex w-full items-center px-6 py-4 text-left font-medium text-sm ${
                    activeTab === "favorites"
                      ? "border-primary-600 border-l-4 bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("favorites")}
                  type="button"
                >
                  <Heart
                    className={`mr-3 h-5 w-5 ${
                      activeTab === "favorites"
                        ? "text-primary-600"
                        : "text-gray-400"
                    }`}
                  />
                  Saved Properties
                </button>

                <button
                  className={`flex w-full items-center px-6 py-4 text-left font-medium text-sm ${
                    activeTab === "applications"
                      ? "border-primary-600 border-l-4 bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("applications")}
                  type="button"
                >
                  <Clock
                    className={`mr-3 h-5 w-5 ${
                      activeTab === "applications"
                        ? "text-primary-600"
                        : "text-gray-400"
                    }`}
                  />
                  Applications
                </button>

                {user.role === "landlord" && (
                  <button
                    className={`flex w-full items-center px-6 py-4 text-left font-medium text-sm ${
                      activeTab === "properties"
                        ? "border-primary-600 border-l-4 bg-primary-50 text-primary-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveTab("properties")}
                    type="button"
                  >
                    <Home
                      className={`mr-3 h-5 w-5 ${
                        activeTab === "properties"
                          ? "text-primary-600"
                          : "text-gray-400"
                      }`}
                    />
                    My Properties
                  </button>
                )}

                <button
                  className={`flex w-full items-center px-6 py-4 text-left font-medium text-sm ${
                    activeTab === "documents"
                      ? "border-primary-600 border-l-4 bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("documents")}
                  type="button"
                >
                  <FileText
                    className={`mr-3 h-5 w-5 ${
                      activeTab === "documents"
                        ? "text-primary-600"
                        : "text-gray-400"
                    }`}
                  />
                  Documents
                </button>

                <button
                  className={`flex w-full items-center px-6 py-4 text-left font-medium text-sm ${
                    activeTab === "settings"
                      ? "border-primary-600 border-l-4 bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("settings")}
                  type="button"
                >
                  <Settings
                    className={`mr-3 h-5 w-5 ${
                      activeTab === "settings"
                        ? "text-primary-600"
                        : "text-gray-400"
                    }`}
                  />
                  Account Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              {activeTab === "profile" && (
                <>
                  <h2 className="mb-6 font-bold text-gray-900 text-xl">
                    My Profile
                  </h2>
                  {/* <ProfileForm user={user} onUpdateSuccess={handleProfileUpdate} /> */}
                </>
              )}

              {activeTab === "favorites" && (
                <>
                  <h2 className="mb-6 font-bold text-gray-900 text-xl">
                    Saved Properties
                  </h2>
                  <p className="text-gray-600">
                    Your saved properties will appear here. Browse properties
                    and click the heart icon to save them for later.
                  </p>
                  {/* Favorites list would go here */}
                </>
              )}

              {activeTab === "applications" && (
                <>
                  <h2 className="mb-6 font-bold text-gray-900 text-xl">
                    Applications
                  </h2>
                  <p className="text-gray-600">
                    Track the status of your property applications here.
                  </p>
                  {/* Applications list would go here */}
                </>
              )}

              {activeTab === "properties" && user.role === "landlord" && (
                <>
                  <h2 className="mb-6 font-bold text-gray-900 text-xl">
                    My Properties
                  </h2>
                  <p className="text-gray-600">
                    Manage your listed properties and view applicants.
                  </p>
                  {/* Properties list would go here */}
                </>
              )}

              {activeTab === "documents" && (
                <>
                  <h2 className="mb-6 font-bold text-gray-900 text-xl">
                    Documents
                  </h2>
                  <p className="text-gray-600">
                    Upload and manage important documents like ID verification,
                    proof of address, and references.
                  </p>
                  {/* Documents management would go here */}
                </>
              )}

              {activeTab === "settings" && (
                <>
                  <h2 className="mb-6 font-bold text-gray-900 text-xl">
                    Account Settings
                  </h2>
                  <p className="text-gray-600">
                    Manage your account settings, notification preferences, and
                    security options.
                  </p>
                  {/* Settings form would go here */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
