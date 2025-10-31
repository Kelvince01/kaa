"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ICreateReportRequest } from "@kaa/models/types";
import {
  ReportFormat,
  ReportFrequency,
  ReportPriority,
  ReportType,
} from "@kaa/models/types";
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
import { Textarea } from "@kaa/ui/components/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateReport, useUpdateReport } from "../reports.queries";
import type { IReportDefinition } from "../reports.type";

const reportFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  type: z.nativeEnum(ReportType),
  format: z
    .array(z.nativeEnum(ReportFormat))
    .min(1, "At least one format is required"),
  frequency: z.nativeEnum(ReportFrequency),
  priority: z.nativeEnum(ReportPriority).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

type ReportFormDialogProps = {
  report?: IReportDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ReportFormDialog({
  report,
  open,
  onOpenChange,
  onSuccess,
}: ReportFormDialogProps) {
  const isEdit = !!report;
  const createReport = useCreateReport();
  const updateReport = useUpdateReport();
  const [selectedFormats, setSelectedFormats] = useState<ReportFormat[]>(
    report?.format || [ReportFormat.PDF]
  );

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      name: report?.name || "",
      description: report?.description || "",
      type: report?.type || ReportType.CUSTOM_QUERY,
      format: report?.format || [ReportFormat.PDF],
      frequency: report?.frequency || ReportFrequency.ON_DEMAND,
      priority: report?.priority || ReportPriority.NORMAL,
      tags: report?.tags || [],
      isActive: report?.isActive ?? true,
    },
  });

  const onSubmit = async (data: ReportFormValues) => {
    try {
      const reportData: ICreateReportRequest = {
        ...data,
        format: selectedFormats,
        query: report?.query || {
          dataSource: "properties" as any,
          filters: [],
          limit: 1000,
        },
        recipients: report?.recipients || [],
        parameters: report?.parameters || {},
      };

      if (isEdit && report) {
        await updateReport.mutateAsync({
          reportId: report._id.toString(),
          data: reportData,
        });
      } else {
        await createReport.mutateAsync(reportData);
      }

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving report:", error);
    }
  };

  const toggleFormat = (format: ReportFormat) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
    form.setValue("format", selectedFormats);
  };

  const reportTypes = Object.values(ReportType);
  const reportFormats = Object.values(ReportFormat);
  const reportFrequencies = Object.values(ReportFrequency);
  const reportPriorities = Object.values(ReportPriority);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Report" : "Create New Report"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the report configuration below."
              : "Fill in the details to create a new report."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Report" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this report
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Report description..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Additional details about this report
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value as ReportType)
                      }
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of data this report will analyze
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Output Configuration */}
            <div className="space-y-4">
              <FormItem>
                <FormLabel>Output Formats</FormLabel>
                <FormDescription>
                  Select one or more formats for report output
                </FormDescription>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reportFormats.map((format) => (
                    <Button
                      key={format}
                      onClick={() => toggleFormat(format)}
                      size="sm"
                      type="button"
                      variant={
                        selectedFormats.includes(format) ? "default" : "outline"
                      }
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value as ReportFrequency)
                      }
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportFrequencies.map((frequency) => (
                          <SelectItem key={frequency} value={frequency}>
                            {frequency.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often this report should be generated
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value as ReportPriority)
                      }
                      value={field.value || ReportPriority.NORMAL}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportPriorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() +
                              priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Priority level for report processing
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={createReport.isPending || updateReport.isPending}
                type="submit"
              >
                {isEdit ? "Update Report" : "Create Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
