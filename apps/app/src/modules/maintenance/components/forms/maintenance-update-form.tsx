"use client";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { Send, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAddMaintenanceUpdate } from "../../maintenance.queries";
import { MaintenanceStatus } from "../../maintenance.type";
import { getStatusDisplayName } from "../../utils/maintenance-utils";

const updateFormSchema = z.object({
  message: z.string().min(1, "Message is required"),
  status: z.nativeEnum(MaintenanceStatus).optional(),
});

type UpdateFormData = z.infer<typeof updateFormSchema>;

type MaintenanceUpdateFormProps = {
  maintenanceId: string;
  currentStatus: MaintenanceStatus;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function MaintenanceUpdateForm({
  maintenanceId,
  currentStatus,
  onSuccess,
  onCancel,
}: MaintenanceUpdateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addUpdateMutation = useAddMaintenanceUpdate();

  const form = useForm<UpdateFormData>({
    resolver: zodResolver(updateFormSchema),
    defaultValues: {
      message: "",
      status: undefined,
    },
  });

  const onSubmit = async (data: UpdateFormData) => {
    setIsSubmitting(true);
    try {
      const updateData = {
        message: data.message,
        status: data.status,
        attachments: [], // TODO: Add file attachments
      };

      await addUpdateMutation.mutateAsync({
        id: maintenanceId,
        update: updateData,
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to add maintenance update:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = Object.values(MaintenanceStatus).filter(
    (status) => status !== currentStatus
  );

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Message */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Update Message *</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[120px]"
                  placeholder="Add an update or comment about this maintenance request..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status Change */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Change Status (Optional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current status or select new one" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/* <SelectItem value="">No status change</SelectItem> */}
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusDisplayName(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Upload className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-gray-600 text-sm">
                Add photos or documents to this update
              </p>
              <p className="mt-1 text-gray-500 text-xs">
                Progress photos, receipts, or other relevant files
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
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Adding Update..." : "Add Update"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
