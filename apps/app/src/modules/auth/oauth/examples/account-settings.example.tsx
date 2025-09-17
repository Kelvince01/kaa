"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Separator } from "@kaa/ui/components/separator";
import { OAuthConnections } from "../components/oauth-connections";

export function AccountSettingsWithOAuth() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-2xl tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and connected services.
        </p>
      </div>

      <Separator />

      {/* Profile Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Profile form would go here */}
          <p className="text-muted-foreground text-sm">
            Profile settings form...
          </p>
        </CardContent>
      </Card>

      {/* OAuth Connections */}
      <OAuthConnections />

      {/* Security Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your password and security preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Security settings form...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
