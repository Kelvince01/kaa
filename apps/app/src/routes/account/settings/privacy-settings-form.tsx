"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import { Switch } from "@kaa/ui/components/switch";
import {
  AlertTriangle,
  Cookie,
  Database,
  Download,
  Eye,
  Shield,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type PrivacySettingsData, privacySettingsSchema } from "./schemas";

type PrivacySettingsFormProps = {
  onSave?: (data: PrivacySettingsData) => Promise<void>;
};

export function PrivacySettingsForm({ onSave }: PrivacySettingsFormProps) {
  const form = useForm<PrivacySettingsData>({
    resolver: zodResolver(privacySettingsSchema),
    defaultValues: {
      dataRetention: "2_years",
      profileVisibility: "private",
      dataSharing: {
        analytics: true,
        marketing: false,
        thirdParty: false,
      },
      cookiePreferences: {
        necessary: true,
        analytics: true,
        marketing: false,
      },
    },
  });

  const handleSubmit = async (data: PrivacySettingsData) => {
    try {
      if (onSave) {
        await onSave(data);
      } else {
        // Default save simulation
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      toast.success("Privacy settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save privacy settings. Please try again.");
      console.error("Error saving privacy settings:", error);
    }
  };

  const handleDataDownload = () => {
    toast.info(
      "Your data export will be prepared and sent to your email address within 24 hours."
    );
  };

  const handleAccountDeletion = () => {
    toast.info(
      "Account deletion request initiated. You will receive further instructions via email."
    );
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Retention
              </CardTitle>
              <CardDescription>
                Control how long your data is stored in our system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="dataRetention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data retention period</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select retention period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1_year">1 Year</SelectItem>
                        <SelectItem value="2_years">2 Years</SelectItem>
                        <SelectItem value="5_years">5 Years</SelectItem>
                        <SelectItem value="indefinite">Indefinite</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your data will be automatically deleted after this period
                      unless you actively use the service.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Profile Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Profile Visibility
              </CardTitle>
              <CardDescription>
                Control who can see your profile and personal information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="profileVisibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile visibility</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends_only">
                          Friends Only
                        </SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This controls who can view your profile information and
                      activity.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Sharing
              </CardTitle>
              <CardDescription>
                Control how your data is used for analytics and marketing
                purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="dataSharing.analytics"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Analytics</FormLabel>
                      <FormDescription>
                        Share anonymized data to help improve our service
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataSharing.marketing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Marketing insights
                      </FormLabel>
                      <FormDescription>
                        Use my data to personalize marketing communications
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataSharing.thirdParty"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Third-party sharing
                      </FormLabel>
                      <FormDescription>
                        Share data with trusted third-party partners
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("dataSharing.thirdParty") && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    We only share data with trusted partners who adhere to
                    strict privacy standards. You can view our list of partners
                    in our Privacy Policy.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Cookie Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookie Preferences
              </CardTitle>
              <CardDescription>
                Manage which cookies we can use to enhance your experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="cookiePreferences.necessary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Necessary cookies
                      </FormLabel>
                      <FormDescription>
                        Essential cookies required for basic functionality
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        disabled
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cookiePreferences.analytics"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Analytics cookies
                      </FormLabel>
                      <FormDescription>
                        Help us understand how you use our service
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cookiePreferences.marketing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Marketing cookies
                      </FormLabel>
                      <FormDescription>
                        Enable personalized ads and marketing content
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting
                ? "Saving..."
                : "Save Privacy Settings"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or delete your personal data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium text-base">
                <Download className="h-4 w-4" />
                Export your data
              </div>
              <div className="text-muted-foreground text-sm">
                Download a copy of your personal data in a portable format
              </div>
            </div>
            <Button onClick={handleDataDownload} size="sm" variant="outline">
              Export Data
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-medium text-base text-destructive">
                <Trash2 className="h-4 w-4" />
                Delete your account
              </div>
              <div className="text-muted-foreground text-sm">
                Permanently delete your account and all associated data
              </div>
            </div>
            <Button
              onClick={handleAccountDeletion}
              size="sm"
              variant="destructive"
            >
              Delete Account
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Account deletion is permanent and cannot be undone. Please export
              your data first if you want to keep it.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
