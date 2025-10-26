"use client";

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
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

export function AvailabilityStep() {
  const form = useFormContext<PropertyFormData>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl text-foreground md:text-3xl">
          Availability & Contact
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          When is the property available and how can tenants reach you?
        </p>
      </div>

      {/* Available From Date */}
      <FormField
        control={form.control}
        name="availableFrom"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">
              Available From (Optional)
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Calendar className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 text-base" type="date" {...field} />
              </div>
            </FormControl>
            <FormDescription className="text-xs md:text-sm">
              When will the property be available for occupancy?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Viewing Contact Information */}
      <div className="space-y-4 rounded-lg border p-4 md:p-6">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">Viewing Contact Details</h3>
          <p className="text-muted-foreground text-sm">
            Who should prospective tenants contact for viewings?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Contact Name */}
          <FormField
            control={form.control}
            name="viewingContact.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Contact Name *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10 text-base"
                      placeholder="e.g., John Kamau"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Phone */}
          <FormField
            control={form.control}
            name="viewingContact.phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Phone Number *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10 text-base"
                      placeholder="+254 712 345 678"
                      type="tel"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  Include country code for international visibility
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Best Practices */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
        <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-900 text-sm dark:text-green-100">
          <span>✓</span>
          <span>Best Practices</span>
        </h4>
        <ul className="space-y-1 text-green-700 text-xs dark:text-green-300">
          <li>• Respond to inquiries promptly (within 24 hours)</li>
          <li>• Be available for viewings on weekdays and weekends</li>
          <li>• Provide clear directions to the property</li>
          <li>• Keep your phone number active and reachable</li>
          <li>• Consider using WhatsApp for easier communication</li>
        </ul>
      </div>
    </div>
  );
}
