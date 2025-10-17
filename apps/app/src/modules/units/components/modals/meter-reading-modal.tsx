"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@kaa/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Droplets,
  Gauge,
  Loader2,
  Zap,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUpdateMeterReadings } from "../../unit.mutations";
import type { Unit } from "../../unit.type";
import { formatDate, getUnitDisplayTitle } from "../../utils/unit-utils";

const meterReadingSchema = z.object({
  waterMeterReading: z
    .number()
    .min(0, "Water meter reading must be positive")
    .optional(),
  electricityMeterReading: z
    .number()
    .min(0, "Electricity meter reading must be positive")
    .optional(),
  gasMeterReading: z
    .number()
    .min(0, "Gas meter reading must be positive")
    .optional(),
  readingDate: z.date({
    message: "Reading date is required",
  }),
  notes: z.string().optional(),
});

type MeterReadingFormData = z.infer<typeof meterReadingSchema>;

type MeterReadingModalProps = {
  unit: Unit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function MeterReadingModal({
  unit,
  open,
  onOpenChange,
  onSuccess,
}: MeterReadingModalProps) {
  const updateMeterReadingsMutation = useUpdateMeterReadings();

  const form = useForm<MeterReadingFormData>({
    resolver: zodResolver(meterReadingSchema),
    defaultValues: {
      waterMeterReading: unit?.waterMeterReading || undefined,
      electricityMeterReading: unit?.electricityMeterReading || undefined,
      gasMeterReading: undefined,
      readingDate: new Date(),
      notes: "",
    },
  });

  const onSubmit = async (data: MeterReadingFormData) => {
    if (!unit) return;

    try {
      const meterReadings: any = {};

      if (data.waterMeterReading !== undefined) {
        meterReadings.water = data.waterMeterReading;
      }
      if (data.electricityMeterReading !== undefined) {
        meterReadings.electricity = data.electricityMeterReading;
      }
      if (data.gasMeterReading !== undefined) {
        meterReadings.gas = data.gasMeterReading;
      }

      await updateMeterReadingsMutation.mutateAsync({
        unitId: unit._id,
        data: {
          meterReadings,
          readingDate: data.readingDate.toISOString(),
        },
      });

      onOpenChange(false);
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Failed to update meter readings:", error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  if (!unit) return null;

  // Find utility information for the unit
  const waterUtility = unit.utilities?.find((u) =>
    u.name.toLowerCase().includes("water")
  );
  const electricityUtility = unit.utilities?.find(
    (u) =>
      u.name.toLowerCase().includes("electricity") ||
      u.name.toLowerCase().includes("power")
  );
  const gasUtility = unit.utilities?.find((u) =>
    u.name.toLowerCase().includes("gas")
  );

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Meter Readings</DialogTitle>
          <DialogDescription>
            Record new meter readings for {getUnitDisplayTitle(unit)}
          </DialogDescription>
        </DialogHeader>

        {/* Unit Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Unit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Unit:</span>
                <span className="ml-2 font-medium">{unit.unitNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Tenant:</span>
                <span className="ml-2 font-medium">
                  {unit.currentTenant && typeof unit.currentTenant === "object"
                    ? `${unit.currentTenant.personalInfo.firstName} ${unit.currentTenant.personalInfo.lastName}`
                    : unit.currentTenant || "No tenant"}
                </span>
              </div>
              {unit.lastMeterReadingDate && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Last Reading:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(unit.lastMeterReadingDate)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Readings */}
        {(unit.waterMeterReading || unit.electricityMeterReading) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {unit.waterMeterReading && (
                  <div className="flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Water Meter</div>
                      <div className="text-muted-foreground text-sm">
                        Current: {unit.waterMeterReading}
                        {waterUtility?.meterNumber &&
                          ` (${waterUtility.meterNumber})`}
                      </div>
                    </div>
                  </div>
                )}
                {unit.electricityMeterReading && (
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-medium">Electricity Meter</div>
                      <div className="text-muted-foreground text-sm">
                        Current: {unit.electricityMeterReading}
                        {electricityUtility?.meterNumber &&
                          ` (${electricityUtility.meterNumber})`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Reading Date */}
            <FormField
              control={form.control}
              name="readingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Reading Date *</FormLabel>
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
                    Date when the meter readings were taken
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Meter Readings */}
            <div className="space-y-6">
              <h3 className="font-medium text-lg">Meter Readings</h3>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Water Meter */}
                {(waterUtility || unit.waterMeterReading !== undefined) && (
                  <FormField
                    control={form.control}
                    name="waterMeterReading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          Water Meter Reading
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter reading"
                            step="0.01"
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === ""
                                  ? undefined
                                  : Number.parseFloat(value)
                              );
                            }}
                            value={field.value?.toString() || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          {waterUtility?.meterNumber &&
                            `Meter #: ${waterUtility.meterNumber}`}
                          {unit.waterMeterReading &&
                            ` • Current: ${unit.waterMeterReading}`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Electricity Meter */}
                {(electricityUtility ||
                  unit.electricityMeterReading !== undefined) && (
                  <FormField
                    control={form.control}
                    name="electricityMeterReading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          Electricity Meter Reading
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter reading"
                            step="0.01"
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === ""
                                  ? undefined
                                  : Number.parseFloat(value)
                              );
                            }}
                            value={field.value?.toString() || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          {electricityUtility?.meterNumber &&
                            `Meter #: ${electricityUtility.meterNumber}`}
                          {unit.electricityMeterReading &&
                            ` • Current: ${unit.electricityMeterReading}`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Gas Meter (if utility exists) */}
                {gasUtility && (
                  <FormField
                    control={form.control}
                    name="gasMeterReading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Gauge className="h-4 w-4 text-orange-500" />
                          Gas Meter Reading
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter reading"
                            step="0.01"
                            type="number"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === ""
                                  ? undefined
                                  : Number.parseFloat(value)
                              );
                            }}
                            value={field.value?.toString() || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          {gasUtility.meterNumber &&
                            `Meter #: ${gasUtility.meterNumber}`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes about the readings, meter condition, etc..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Usage Calculation */}
            {unit.waterMeterReading !== undefined &&
              form.watch("waterMeterReading") && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-sm">
                      <span className="font-medium">Water Usage:</span>
                      <span className="ml-2">
                        {Math.max(
                          0,
                          (form.watch("waterMeterReading") || 0) -
                            (unit.waterMeterReading || 0)
                        )}{" "}
                        units
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

            <DialogFooter>
              <Button
                disabled={updateMeterReadingsMutation.isPending}
                onClick={handleClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={updateMeterReadingsMutation.isPending}
                type="submit"
              >
                {updateMeterReadingsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Readings
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
