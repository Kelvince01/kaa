/**
 * Response Form Component
 * Form for responding to reviews
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Textarea } from "@kaa/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCreateResponse } from "../review.mutations";
import {
  type ReviewResponseSchemaType,
  reviewResponseSchema,
} from "../review.schema";

type ResponseFormProps = {
  reviewId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const ResponseForm = ({
  reviewId,
  onSuccess,
  onCancel,
}: ResponseFormProps) => {
  const createResponse = useCreateResponse();

  const form = useForm<ReviewResponseSchemaType>({
    resolver: zodResolver(reviewResponseSchema),
    defaultValues: {
      reviewId,
      content: "",
    },
  });

  const onSubmit = (data: ReviewResponseSchemaType) => {
    createResponse.mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Response</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[120px]"
                  placeholder="Thank you for your feedback..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Minimum 10 characters, maximum 1000 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <Button
              disabled={createResponse.isPending}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
          )}
          <Button disabled={createResponse.isPending} type="submit">
            {createResponse.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Post Response
          </Button>
        </div>
      </form>
    </Form>
  );
};
