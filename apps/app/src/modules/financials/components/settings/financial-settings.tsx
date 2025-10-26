import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
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
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Switch } from "@kaa/ui/components/switch";
import { Calculator, DollarSign, Mail, Save, Settings } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useFinancialSettings,
  useUpdateFinancialSettings,
} from "../../financials.queries";
import type { UpdateFinancialSettingsRequest } from "../../financials.type";

const settingsSchema = z.object({
  currency: z.string().min(1, "Currency is required"),
  taxYear: z.object({
    startMonth: z.number().min(1).max(12),
    endMonth: z.number().min(1).max(12),
  }),
  taxRates: z.object({
    income: z.number().min(0).max(100),
    property: z.number().min(0).max(100),
    vat: z.number().min(0).max(100),
  }),
  depreciationRates: z.record(z.string(), z.number().min(0).max(100)),
  reportingPreferences: z.object({
    frequency: z.enum(["monthly", "quarterly", "yearly"]),
    autoGenerate: z.boolean(),
    emailReports: z.boolean(),
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currencies = [
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
];

export function FinancialSettings() {
  const { data: settings, isLoading } = useFinancialSettings();
  const { mutate: updateSettings, isPending } = useUpdateFinancialSettings();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: settings?.currency || "KES",
      taxYear: {
        startMonth: settings?.taxYear?.startMonth || 1,
        endMonth: settings?.taxYear?.endMonth || 12,
      },
      taxRates: {
        income: settings?.taxRates?.income || 30,
        property: settings?.taxRates?.property || 1.5,
        vat: settings?.taxRates?.vat || 16,
      },
      depreciationRates: settings?.depreciationRates || {
        property: 2.5,
        equipment: 20,
        furniture: 10,
        vehicle: 25,
        other: 10,
      },
      reportingPreferences: {
        frequency: settings?.reportingPreferences?.frequency || "monthly",
        autoGenerate: settings?.reportingPreferences?.autoGenerate,
        emailReports: true,
      },
    },
  });

  // Update form when settings data loads
  React.useEffect(() => {
    if (settings) {
      form.reset({
        currency: settings.currency,
        taxYear: settings.taxYear,
        taxRates: settings.taxRates,
        depreciationRates: settings.depreciationRates,
        reportingPreferences: settings.reportingPreferences,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsFormData) => {
    const updateData: UpdateFinancialSettingsRequest = {
      currency: data.currency,
      taxYear: data.taxYear,
      taxRates: data.taxRates,
      depreciationRates: data.depreciationRates as Record<string, number>,
      reportingPreferences: data.reportingPreferences,
    };

    updateSettings(updateData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {new Array(4)
              .fill(0)
              .fill(0)
              .map((_, i) => (
                <div className="space-y-2" key={i.toString()}>
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded bg-muted" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Financial Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Currency Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <h3 className="font-semibold">Currency & Localization</h3>
              </div>

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tax Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <h3 className="font-semibold">Tax Configuration</h3>
              </div>

              {/* Tax Year */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="taxYear.startMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Year Start Month</FormLabel>
                      <Select
                        defaultValue={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(Number.parseInt(value, 10))
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem
                              key={month.value}
                              value={month.value.toString()}
                            >
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxYear.endMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Year End Month</FormLabel>
                      <Select
                        defaultValue={field.value?.toString()}
                        onValueChange={(value) =>
                          field.onChange(Number.parseInt(value, 10))
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map((month) => (
                            <SelectItem
                              key={month.value}
                              value={month.value.toString()}
                            >
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tax Rates */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="taxRates.income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Income Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          step="0.1"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxRates.property"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          step="0.1"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxRates.vat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          step="0.1"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Depreciation Rates */}
            <div className="space-y-4">
              <h3 className="font-semibold">Depreciation Rates (% per year)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {["property", "equipment", "furniture", "vehicle", "other"].map(
                  (category) => (
                    <FormField
                      control={form.control}
                      key={category}
                      name={`depreciationRates.${category}` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize">
                            {category}
                          </FormLabel>
                          <FormControl>
                            <Input
                              step="0.1"
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )
                )}
              </div>
            </div>

            {/* Reporting Preferences */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <h3 className="font-semibold">Reporting Preferences</h3>
              </div>

              <FormField
                control={form.control}
                name="reportingPreferences.frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Report Frequency</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reportingPreferences.autoGenerate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-Generate Reports
                      </FormLabel>
                      <FormDescription>
                        Automatically generate reports at the end of each period
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
                name="reportingPreferences.emailReports"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Reports</FormLabel>
                      <FormDescription>
                        Email reports to you when they are generated
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
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-6">
              <Button disabled={isPending} type="submit">
                {isPending ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
