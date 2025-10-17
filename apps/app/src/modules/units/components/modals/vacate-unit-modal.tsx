"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { AlertTriangle, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useVacateUnit } from "../../unit.mutations";
import type { Unit } from "../../unit.type";
import {
  formatCurrency,
  formatDate,
  getUnitDisplayTitle,
} from "../../utils/unit-utils";

const vacateUnitSchema = z.object({
  vacateDate: z.date({
    message: "Vacate date is required",
  }),
  reason: z.string().min(1, "Please select a reason for vacating"),
  notes: z.string().optional(),
});

type VacateUnitFormData = z.infer<typeof vacateUnitSchema>;

type VacateUnitModalProps = {
  unit: Unit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

const vacateReasons = [
  { value: "lease_ended", label: "Lease ended naturally" },
  { value: "tenant_moved", label: "Tenant moved out" },
  { value: "eviction", label: "Eviction" },
  { value: "non_payment", label: "Non-payment of rent" },
  { value: "property_sale", label: "Property sold" },
  { value: "renovation", label: "Renovation required" },
  { value: "other", label: "Other" },
];

export function VacateUnitModal({
  unit,
  open,
  onOpenChange,
  onSuccess,
}: VacateUnitModalProps) {
  const vacateUnitMutation = useVacateUnit();

  const form = useForm<VacateUnitFormData>({
    resolver: zodResolver(vacateUnitSchema),
    defaultValues: {
      vacateDate: new Date(),
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (data: VacateUnitFormData) => {
    if (!unit) return;

    try {
      await vacateUnitMutation.mutateAsync({
        unitId: unit._id,
        data: {
          vacateDate: data.vacateDate.toISOString(),
          reason: data.reason,
          notes: data.notes,
        },
      });

      onOpenChange(false);
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Failed to vacate unit:", error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  if (!unit) return null;

  const currentTenant = unit.currentTenant;
  const tenantName =
    typeof currentTenant === "object" && currentTenant
      ? `${currentTenant.personalInfo?.firstName || currentTenant.firstName || ""} ${currentTenant.personalInfo?.lastName || currentTenant.lastName || ""}`.trim()
      : typeof currentTenant === "string"
        ? currentTenant
        : "Unknown Tenant";

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Vacate Unit
          </DialogTitle>
          <DialogDescription>
            Mark {getUnitDisplayTitle(unit)} as vacant and end the current
            tenancy
          </DialogDescription>
        </DialogHeader>

        {/* Warning Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This action will mark the unit as vacant and end the current
            tenancy. This cannot be undone.
          </AlertDescription>
        </Alert>

        {/* Unit and Tenant Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Current Tenancy Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Unit:</span>
                <span className="ml-2 font-medium">{unit.unitNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Tenant:</span>
                <span className="ml-2 font-medium">{tenantName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(unit.rent)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Security Deposit:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(unit.depositAmount)}
                </span>
              </div>
              {unit.leaseStartDate && (
                <div>
                  <span className="text-muted-foreground">Lease Start:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(unit.leaseStartDate)}
                  </span>
                </div>
              )}
              {unit.leaseEndDate && (
                <div>
                  <span className="text-muted-foreground">Lease End:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(unit.leaseEndDate)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Vacate Date */}
            <FormField
              control={form.control}
              name="vacateDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Vacate Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          variant="outline"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        disabled={(date) => date > new Date()}
                        initialFocus
                        mode="single"
                        onSelect={field.onChange}
                        selected={field.value}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Date when the tenant vacated or will vacate the unit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Vacating *</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vacateReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional details about the vacancy, condition of the unit, deposit refund status, etc..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include details about deposit refund, unit condition, or any
                    other relevant information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                disabled={vacateUnitMutation.isPending}
                onClick={handleClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={vacateUnitMutation.isPending}
                type="submit"
                variant="destructive"
              >
                {vacateUnitMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Vacate Unit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
