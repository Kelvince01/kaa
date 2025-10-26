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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Switch } from "@kaa/ui/components/switch";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useProperties } from "@/modules/properties/property.queries";
import { useCreateMaintenance } from "../../maintenance.queries";
import {
  type MaintenanceCreateInput,
  MaintenancePriority,
  MaintenanceType,
} from "../../maintenance.type";
import {
  getMaintenanceTypeDisplayName,
  getPriorityDisplayName,
} from "../../utils/maintenance-utils";

const maintenanceFormSchema = z.object({
  property: z.string().min(1, "Property is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  maintenanceType: z.enum(MaintenanceType),
  priority: z.enum(MaintenancePriority),
  scheduledDate: z.date().optional(),
  isRecurring: z.boolean(),
  recurrencePattern: z
    .object({
      frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
      interval: z.number().min(1),
      nextDate: z.date(),
    })
    .optional(),
  notes: z.string().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        fileName: z.string(),
        fileType: z.string(),
        size: z.number(),
      })
    )
    .optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

type CreateMaintenanceFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultPropertyId?: string;
};

export function CreateMaintenanceForm({
  onSuccess,
  onCancel,
  defaultPropertyId,
}: CreateMaintenanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: propertiesData } = useProperties();
  const createMaintenanceMutation = useCreateMaintenance();

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      property: defaultPropertyId || "",
      title: "",
      description: "",
      maintenanceType: MaintenanceType.GENERAL,
      priority: MaintenancePriority.MEDIUM,
      isRecurring: false,
      notes: "",
    },
  });

  const isRecurring = form.watch("isRecurring");

  const calculateNextDate = (_frequency: string, interval: number) => {
    const today = new Date();
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + interval);
    return nextDate;
  };

  if (
    isRecurring &&
    form.getValues("recurrencePattern") &&
    form.getValues("scheduledDate")
  ) {
    form.setValue(
      "recurrencePattern.nextDate",
      calculateNextDate(
        form.getValues("recurrencePattern.frequency") || "",
        form.getValues("recurrencePattern.interval") || 0
      )
    );
  }

  const onSubmit = async (data: MaintenanceFormData) => {
    setIsSubmitting(true);
    try {
      const createData: MaintenanceCreateInput = {
        property: data.property,
        title: data.title,
        description: data.description,
        maintenanceType: data.maintenanceType,
        priority: data.priority,
        scheduledDate: data.scheduledDate?.toISOString(),
        isRecurring: data.isRecurring,
        recurrencePattern: {
          frequency: data.recurrencePattern?.frequency || "weekly",
          interval: data.recurrencePattern?.interval || 0,
          nextDate: data.recurrencePattern?.nextDate?.toISOString() || "",
        },
        attachments: data.attachments,
        notes: data.notes,
      };

      await createMaintenanceMutation.mutateAsync(createData);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create maintenance request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Property Selection */}
          <FormField
            control={form.control}
            name="property"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property *</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {propertiesData?.properties?.map((property) => (
                      <SelectItem key={property._id} value={property._id}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Maintenance Type */}
          <FormField
            control={form.control}
            name="maintenanceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Type *</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select maintenance type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MaintenanceType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {getMaintenanceTypeDisplayName(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Brief description of the issue"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Detailed description of the maintenance request..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority *</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MaintenancePriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {getPriorityDisplayName(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Emergency: Immediate attention required
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Scheduled Date */}
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Scheduled Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        variant={"outline"}
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
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                      mode="single"
                      onSelect={field.onChange}
                      selected={field.value}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When should this maintenance be performed?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Recurring Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recurring Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Recurring Maintenance
                    </FormLabel>
                    <FormDescription>
                      Set up this maintenance to repeat automatically
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

            {isRecurring && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="recurrencePattern.frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
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
                  name="recurrencePattern.interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval</FormLabel>
                      <FormControl>
                        <Input
                          min="1"
                          placeholder="1"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>Every how many periods?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information or special instructions..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-gray-300 border-dashed p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600 text-sm">
                Drag and drop files here, or click to select files
              </p>
              <p className="mt-1 text-gray-500 text-xs">
                Supported formats: PDF, DOC, DOCX, Images
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          {onCancel && (
            <Button onClick={onCancel} type="button" variant="outline">
              Cancel
            </Button>
          )}
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating..." : "Create Maintenance Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
