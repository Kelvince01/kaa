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
import { Switch } from "@kaa/ui/components/switch";
import { AlertCircle, FileText } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

export function RulesStep() {
  const form = useFormContext<PropertyFormData>();
  const petsAllowed = form.watch("petsAllowed");
  const minimumLease = form.watch("minimumLease");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold text-2xl text-foreground">
          Rules & Policies
        </h2>
        <p className="text-muted-foreground text-sm">
          Set clear rules to attract the right tenants and avoid conflicts
        </p>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5 p-5">
          <FormField
            control={form.control}
            name="petsAllowed"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <FormLabel className="text-base">Pets Allowed</FormLabel>
                  <FormDescription>
                    Allow tenants to keep pets in the property
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

          {petsAllowed && (
            <div className="ml-4 border-primary/20 border-l-2 pl-4 text-muted-foreground text-sm">
              Consider specifying pet types and sizes in your property
              description
            </div>
          )}
        </Card>

        <FormField
          control={form.control}
          name="minimumLease"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Lease Period (Months) *</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    className="max-w-xs text-base"
                    max={60}
                    min={1}
                    placeholder="6"
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseInt(e.target.value, 10) || 1)
                    }
                  />
                  <FormDescription>
                    The shortest lease period you will accept (typically 6-12
                    months)
                  </FormDescription>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card className="bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 space-y-2 text-sm">
              <h3 className="font-medium">Lease Summary</h3>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  • Pets:{" "}
                  <strong>{petsAllowed ? "Allowed" : "Not Allowed"}</strong>
                </p>
                <p>
                  • Minimum Lease: <strong>{minimumLease || 0} months</strong>
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Additional Rules & Policies
              </h4>
              <p className="text-blue-700 dark:text-blue-300">
                You can specify additional rules like:
              </p>
              <ul className="ml-4 space-y-1 text-blue-600 dark:text-blue-400">
                <li>• Smoking policy</li>
                <li>• Guest/visitor policies</li>
                <li>• Noise restrictions and quiet hours</li>
                <li>• Maintenance responsibilities</li>
                <li>• Parking rules</li>
              </ul>
              <p className="mt-2 text-blue-700 text-xs dark:text-blue-300">
                These can be included in your property description or discussed
                during viewings.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-primary/20 bg-primary/5 p-4">
          <div className="space-y-2 text-sm">
            <h4 className="font-medium">Important Notes</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Clear rules help attract compatible tenants</li>
              <li>• All terms should be included in the rental agreement</li>
              <li>• Rules must comply with local tenancy laws</li>
              <li>• Be reasonable and consistent in enforcement</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
