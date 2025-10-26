"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { Switch } from "@kaa/ui/components/switch";
import { Calendar, FileText, PawPrint } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

type RulesStepProps = {
  form: UseFormReturn<PropertyFormData>;
};

export function RulesStep({ form }: RulesStepProps) {
  const watchedValues = form.watch();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">Property Rules & Policies</h3>
        <p className="text-muted-foreground text-sm">
          Set clear expectations for potential tenants
        </p>
      </div>

      {/* Pets Policy */}
      <FormField
        control={form.control}
        name="petsAllowed"
        render={({ field }) => (
          <FormItem>
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PawPrint className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">Pet Policy</CardTitle>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <CardDescription className="text-xs">
                  Are pets allowed in this property?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={field.value ? "default" : "secondary"}>
                    {field.value ? "✓ Pets Allowed" : "✗ No Pets"}
                  </Badge>
                </div>
                {field.value && (
                  <p className="mt-2 text-muted-foreground text-xs">
                    💡 Tip: Pet-friendly properties often attract more tenants
                  </p>
                )}
              </CardContent>
            </Card>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Minimum Lease Period */}
      <FormField
        control={form.control}
        name="minimumLease"
        render={({ field }) => (
          <FormItem>
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-base">
                    Minimum Lease Period <span className="text-red-500">*</span>
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Minimum duration tenants must commit to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormControl>
                  <div className="flex items-center gap-3">
                    <Input
                      className="max-w-[120px] font-semibold text-lg"
                      max={60}
                      min={1}
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(Number.parseInt(e.target.value, 10) || 1)
                      }
                    />
                    <span className="text-muted-foreground text-sm">
                      month{field.value !== 1 ? "s" : ""}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />

                {field.value && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        Lease duration:
                      </span>
                      <Badge variant="secondary">
                        {field.value} {field.value === 1 ? "month" : "months"}
                      </Badge>
                    </div>
                    {field.value >= 12 && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          ≈ {(field.value / 12).toFixed(1)}{" "}
                          {field.value === 12 ? "year" : "years"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Common durations quick select */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Label className="text-muted-foreground text-xs">
                    Common durations:
                  </Label>
                  {[3, 6, 12, 24].map((months) => (
                    <Badge
                      className={`cursor-pointer ${
                        field.value === months
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      key={months}
                      onClick={() => field.onChange(months)}
                      variant="outline"
                    >
                      {months} months
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FormItem>
        )}
      />

      {/* Policy Summary */}
      <Card className="border-gray-200 bg-linear-to-br from-gray-50 to-white dark:from-gray-900 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-5 w-5" />
            Policy Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground">Pets:</span>
            <Badge
              variant={watchedValues.petsAllowed ? "default" : "secondary"}
            >
              {watchedValues.petsAllowed ? "Allowed" : "Not Allowed"}
            </Badge>
          </div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground">Minimum Lease:</span>
            <Badge variant="secondary">
              {watchedValues.minimumLease || 0}{" "}
              {watchedValues.minimumLease === 1 ? "month" : "months"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="border-yellow-200 bg-linear-to-br from-yellow-50 to-white dark:from-yellow-950 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">💡 Policy Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                Clear policies help set proper expectations with tenants
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Most landlords require 6-12 months minimum lease</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                Pet-friendly policies can attract responsible pet owners
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>
                You can discuss additional rules directly with potential tenants
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
