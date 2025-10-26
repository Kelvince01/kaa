"use client";

import { Card } from "@kaa/ui/components/card";
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
      <div>
        <h2 className="mb-2 font-semibold text-2xl text-foreground">
          Availability & Contact
        </h2>
        <p className="text-muted-foreground text-sm">
          When is the property available and how can tenants reach you?
        </p>
      </div>

      <div className="grid gap-6">
        <FormField
          control={form.control}
          name="availableFrom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Available From (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 text-base"
                    min={new Date().toISOString().split("T")[0]}
                    type="date"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                When can tenants move in? Leave empty if available immediately
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Viewing Contact Information</h3>
          </div>

          <p className="text-muted-foreground text-sm">
            Who should interested tenants contact for property viewings?
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="viewingContact.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10 text-base"
                        placeholder="e.g., John Doe"
                        {...field}
                      />
                    </div>
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
                  <FormLabel>Contact Phone *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10 text-base"
                        placeholder="e.g., 0712345678"
                        type="tel"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Include country code if not in Kenya (e.g., +254712345678)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-muted-foreground text-sm">
            <p>
              💡 <strong>Tip:</strong> Respond promptly to viewing requests.
              Quick responses increase your chances of finding the right tenant.
            </p>
          </div>
        </Card>

        <Card className="border-primary/20 bg-primary/5 p-4">
          <div className="space-y-2 text-sm">
            <h4 className="font-medium text-foreground">What Happens Next?</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                • Interested tenants will contact you using this information
              </li>
              <li>• You can arrange property viewings at your convenience</li>
              <li>
                • Your contact details remain private until viewing is confirmed
              </li>
              <li>• You can update availability anytime from your dashboard</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
