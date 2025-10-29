/**
 * Flag Review Dialog Component
 * Dialog for flagging inappropriate reviews
 */

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Label } from "@kaa/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@kaa/ui/components/radio-group";
import { Textarea } from "@kaa/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useFlagReview } from "../review.mutations";
import {
  FLAG_REASON_OPTIONS,
  type FlagReviewSchemaType,
  flagReviewSchema,
} from "../review.schema";

type FlagReviewDialogProps = {
  reviewId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const FlagReviewDialog = ({
  reviewId,
  open,
  onOpenChange,
}: FlagReviewDialogProps) => {
  const flagReview = useFlagReview();

  const form = useForm<FlagReviewSchemaType>({
    resolver: zodResolver(flagReviewSchema),
    defaultValues: {
      reviewId: reviewId || "",
      reason: "inappropriate_language" as any,
      description: "",
    },
  });

  const onSubmit = (data: FlagReviewSchemaType) => {
    if (!reviewId) return;

    flagReview.mutate(
      { ...data, reviewId },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Flag Review</DialogTitle>
          <DialogDescription>
            Help us maintain quality by reporting inappropriate content. Your
            report will be reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for flagging *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="space-y-2"
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      {FLAG_REASON_OPTIONS.map((option) => (
                        <div
                          className="flex items-center space-x-2"
                          key={option.value}
                        >
                          <RadioGroupItem
                            id={option.value}
                            value={option.value}
                          />
                          <Label
                            className="cursor-pointer font-normal"
                            htmlFor={option.value}
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
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
                  <FormLabel>Additional details (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[100px]"
                      placeholder="Provide more context about why you're flagging this review..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                disabled={flagReview.isPending}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={flagReview.isPending} type="submit">
                {flagReview.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
