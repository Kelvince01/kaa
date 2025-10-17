"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
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
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { UnitUtility } from "../../unit.type";

const utilityFormSchema = z.object({
  name: z.string().min(1, "Utility name is required"),
  provider: z.string().optional(),
  included: z.boolean(),
  amount: z.number().min(0, "Amount must be positive").optional(),
  paymentFrequency: z.string().optional(),
  meterNumber: z.string().optional(),
});

type UtilityFormData = z.infer<typeof utilityFormSchema>;

type UtilityFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  utility?: UnitUtility | null;
  onSubmit: (utility: UnitUtility) => void;
};

const commonUtilities = [
  "Water",
  "Electricity",
  "Gas",
  "Internet",
  "Cable TV",
  "Garbage Collection",
  "Heating",
  "Air Conditioning",
  "Security",
  "Parking",
];

const paymentFrequencies = ["month", "quarter", "year", "per_use"];

export function UtilityForm({
  open,
  onOpenChange,
  utility,
  onSubmit,
}: UtilityFormProps) {
  const isEditing = Boolean(utility);

  const form = useForm<UtilityFormData>({
    resolver: zodResolver(utilityFormSchema),
    defaultValues: {
      name: utility?.name || "",
      provider: utility?.provider || "",
      included: utility?.included ?? true,
      amount: utility?.amount || undefined,
      paymentFrequency: utility?.paymentFrequency || "month",
      meterNumber: utility?.meterNumber || "",
    },
  });

  const isIncluded = form.watch("included");

  const handleSubmit = (data: UtilityFormData) => {
    const utilityData: UnitUtility = {
      name: data.name,
      included: data.included,
      ...(data.provider && { provider: data.provider }),
      ...(data.meterNumber && { meterNumber: data.meterNumber }),
    };

    if (!data.included) {
      if (data.amount) utilityData.amount = data.amount;
      if (data.paymentFrequency)
        utilityData.paymentFrequency = data.paymentFrequency;
    }

    onSubmit(utilityData);
    form.reset();
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Utility" : "Add Utility"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the utility information"
              : "Add a new utility to this unit"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utility Name *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a utility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonUtilities.map((utilityName) => (
                        <SelectItem key={utilityName} value={utilityName}>
                          {utilityName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select from common utilities or type a custom name
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Name Input (if not from dropdown) */}
            {!commonUtilities.includes(form.watch("name")) && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Utility Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter utility name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Kenya Power, Nairobi Water"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The company providing this utility
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meterNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meter Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 12345678" {...field} />
                  </FormControl>
                  <FormDescription>
                    Meter number for utilities that have meters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="included"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Included in Rent
                    </FormLabel>
                    <FormDescription>
                      Is this utility included in the monthly rent?
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

            {!isIncluded && (
              <>
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0.00"
                          step="0.01"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number.parseFloat(e.target.value)
                            )
                          }
                          value={field.value?.toString() || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Fixed cost for this utility (if applicable)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentFrequencies.map((frequency) => (
                            <SelectItem key={frequency} value={frequency}>
                              {frequency.charAt(0).toUpperCase() +
                                frequency.slice(1).replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often this utility is billed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button onClick={handleClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update Utility" : "Add Utility"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
