"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Separator } from "@kaa/ui/components/separator";
import { OAuthConnectButton } from "../components/oauth-connect-button";

export function LoginWithOAuth() {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Social Login Buttons */}
        <div className="space-y-2">
          <OAuthConnectButton className="w-full" provider="google" />
          <OAuthConnectButton className="w-full" provider="microsoft" />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="Enter your email" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="Enter your password"
              type="password"
            />
          </div>
          <Button className="w-full" type="submit">
            Sign In
          </Button>
        </form>

        {/* Links */}
        <div className="text-center text-sm">
          <a
            className="text-blue-600 hover:underline"
            href="/auth/forgot-password"
          >
            Forgot your password?
          </a>
        </div>
        <div className="text-center text-sm">
          Don't have an account?{" "}
          <a className="text-blue-600 hover:underline" href="/auth/register">
            Sign up
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
