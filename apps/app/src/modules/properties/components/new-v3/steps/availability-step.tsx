"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Calendar, Phone, User } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

type AvailabilityStepProps = {
  form: UseFormReturn<PropertyFormData>;
};

export function AvailabilityStep({ form }: AvailabilityStepProps) {
  const watchedValues = form.watch();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Availability & Contact</h3>
        <p className="text-muted-foreground text-sm">
          Let potential tenants know when they can move in and how to reach you
        </p>
      </div>

      {/* Available From Date */}
      <FormField
        control={form.control}
        name="availableFrom"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 font-semibold text-base">
              <Calendar className="h-4 w-4" />
              Available From (Optional)
            </FormLabel>
            <FormDescription className="text-xs">
              When can tenants move into this property?
            </FormDescription>
            <FormControl>
              <Input min={today} type="date" {...field} />
            </FormControl>
            {field.value && (
              <p className="text-muted-foreground text-xs">
                Property will be available from{" "}
                {new Date(field.value).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Viewing Contact Information */}
      <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Viewing Contact <span className="text-red-500">*</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Who should interested tenants contact for property viewings?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="viewingContact.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5" />
                  Contact Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormDescription className="text-xs">
                  Full name of the contact person
                </FormDescription>
                <FormControl>
                  <Input placeholder="e.g., John Kamau" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="viewingContact.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm">
                  <Phone className="h-3.5 w-3.5" />
                  Phone Number <span className="text-red-500">*</span>
                </FormLabel>
                <FormDescription className="text-xs">
                  Contact number for property inquiries (include country code)
                </FormDescription>
                <FormControl>
                  <Input placeholder="+254 712 345 678" type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Contact Preview */}
      {(watchedValues.viewingContact?.name ||
        watchedValues.viewingContact?.phone) && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Contact Preview</CardTitle>
            <CardDescription className="text-xs">
              How your contact information will appear
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {watchedValues.viewingContact?.name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {watchedValues.viewingContact.name}
                </span>
              </div>
            )}
            {watchedValues.viewingContact?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  className="text-blue-600 hover:underline"
                  href={`tel:${watchedValues.viewingContact.phone}`}
                >
                  {watchedValues.viewingContact.phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Next Steps Card */}
      <Card className="border-green-200 bg-linear-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600">1.</span>
              <span>
                Your property will be listed for potential tenants to view
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">2.</span>
              <span>
                Interested tenants will contact you using the provided details
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">3.</span>
              <span>
                You can schedule viewings and answer questions directly
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">4.</span>
              <span>You'll receive notifications for new inquiries</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
