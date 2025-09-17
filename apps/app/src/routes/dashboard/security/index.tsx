"use client";

import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Fingerprint,
  Key,
  Lock,
  Shield,
  Smartphone,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth/use-auth";
import TwoFactorAuth from "./2fa-auth";
import ChangePasswordForm from "./change-password-form";
import PasskeySecurity from "./passkey-security";

// Dynamically import the SessionManagementClient component
const SessionManagement = dynamic(() => import("./session-management"), {
  ssr: false,
});

const SecurityClient = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 rounded bg-gray-200" />
        <div className="flex space-x-4">
          <div className="h-10 w-40 rounded bg-gray-200" />
          <div className="h-10 w-40 rounded bg-gray-200" />
          <div className="h-10 w-40 rounded bg-gray-200" />
        </div>
        <div className="h-64 rounded bg-gray-200" />
      </div>
    );
  }

  if (!user) {
    // Redirect if user not logged in
    router.push("/accounts/login");
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <div className="mb-4 flex items-center">
          <Lock className="mr-3 h-8 w-8 text-primary" />
          <div>
            <h1 className="font-bold text-3xl text-gray-900">
              Account Security
            </h1>
            <p className="mt-1 text-gray-600">
              Manage your account security settings, authentication methods, and
              privacy preferences.
            </p>
          </div>
        </div>
      </div>

      <Tabs className="space-y-6" defaultValue="passkeys">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger className="flex items-center gap-2" value="passkeys">
            <Fingerprint className="h-4 w-4" />
            <span className="hidden sm:inline">Passkeys</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="2fa">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">2FA</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="sessions">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Sessions</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="password">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Password</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="privacy">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="passkeys">
          <PasskeySecurity />
        </TabsContent>

        <TabsContent className="space-y-6" value="2fa">
          <TwoFactorAuth
            onSuccess={() => {
              console.log("2FA success");
            }}
            userId={user.id}
          />
        </TabsContent>

        <TabsContent className="space-y-6" value="sessions">
          <SessionManagement />
        </TabsContent>

        <TabsContent className="space-y-6" value="password">
          <ChangePasswordForm />
        </TabsContent>

        <TabsContent className="space-y-6" value="privacy">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                Privacy Settings
              </h3>
              <p className="text-gray-600 text-sm">
                Control how your information is shared and used
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  className="mt-1"
                  defaultChecked
                  id="profile-visibility"
                  name="profile-visibility"
                />
                <div className="space-y-1">
                  <label
                    className="font-medium text-gray-700 text-sm"
                    htmlFor="profile-visibility"
                  >
                    Make my profile visible to others
                  </label>
                  <p className="text-gray-500 text-sm">
                    Allow other users to see your profile information like name
                    and contact details.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  className="mt-1"
                  defaultChecked
                  id="data-collection"
                  name="data-collection"
                />
                <div className="space-y-1">
                  <label
                    className="font-medium text-gray-700 text-sm"
                    htmlFor="data-collection"
                  >
                    Allow data collection for service improvement
                  </label>
                  <p className="text-gray-500 text-sm">
                    We collect anonymous usage data to improve our services and
                    user experience.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  className="mt-1"
                  id="marketing-emails"
                  name="marketing-emails"
                />
                <div className="space-y-1">
                  <label
                    className="font-medium text-gray-700 text-sm"
                    htmlFor="marketing-emails"
                  >
                    Receive marketing emails
                  </label>
                  <p className="text-gray-500 text-sm">
                    Get updates about new features, tips, and special offers.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <Button>Save Privacy Settings</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityClient;
