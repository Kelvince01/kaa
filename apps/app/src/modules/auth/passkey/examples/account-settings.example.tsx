"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Bell, Key, Shield, User } from "lucide-react";
import type React from "react";
import PasskeySecurity from "@/routes/dashboard/security/passkey-security";

/**
 * Example account settings page showing how to integrate the PasskeySecurity
 * component into a user's security settings
 */
export const AccountSettingsExample: React.FC = () => {
  return (
    <div className="container mx-auto max-w-4xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-3xl">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and security preferences
          </p>
        </div>

        <Tabs className="space-y-4" defaultValue="security">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none">
            <TabsTrigger className="gap-2" value="profile">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger className="gap-2" value="security">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger className="gap-2" value="notifications">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger className="gap-2" value="api">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="profile">
            <div className="text-muted-foreground">
              Profile settings would go here...
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="security">
            {/* Passkey Security Section */}
            <PasskeySecurity />

            {/* Other Security Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Other Security Settings</h3>
              <div className="text-muted-foreground">
                Additional security options like 2FA, password change, etc.
                would go here...
              </div>
            </div>
          </TabsContent>

          <TabsContent className="space-y-4" value="notifications">
            <div className="text-muted-foreground">
              Notification preferences would go here...
            </div>
          </TabsContent>

          <TabsContent className="space-y-4" value="api">
            <div className="text-muted-foreground">
              API key management would go here...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
