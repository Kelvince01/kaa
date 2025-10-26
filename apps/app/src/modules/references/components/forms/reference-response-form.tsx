"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
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
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  useDeclineReference,
  useSubmitReference,
  useValidationSchema,
} from "../../reference.queries";
import type { ReferenceType } from "../../reference.type";
import {
  getReferenceTypeDescription,
  getReferenceTypeDisplayName,
} from "../../utils/reference-utils";

const responseFormSchema = z.object({
  feedback: z
    .string()
    .min(10, "Please provide at least 10 characters of feedback"),
  rating: z
    .number()
    .min(1, "Rating is required")
    .max(5, "Rating must be between 1 and 5"),
  verificationDetails: z.record(z.string(), z.any()).optional(),
});

const declineFormSchema = z.object({
  reason: z.enum([
    "unreachable",
    "not_acquainted",
    "conflict_of_interest",
    "insufficient_information",
    "other",
  ]),
  comment: z.string().optional(),
});

type ResponseFormData = z.infer<typeof responseFormSchema>;
type DeclineFormData = z.infer<typeof declineFormSchema>;

type ReferenceResponseFormProps = {
  token: string;
  referenceType: ReferenceType;
  referenceProvider: {
    name: string;
    email: string;
    relationship: string;
  };
  tenantName?: string;
  customMessage?: string;
  expiresAt: string;
};

export function ReferenceResponseForm({
  token,
  referenceType,
  tenantName,
  customMessage,
  expiresAt,
}: ReferenceResponseFormProps) {
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const submitMutation = useSubmitReference();
  const declineMutation = useDeclineReference();
  const { data: validationSchema } = useValidationSchema(referenceType);

  const responseForm = useForm<ResponseFormData>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      feedback: "",
      rating: 0,
      verificationDetails: {},
    },
  });

  const declineForm = useForm<DeclineFormData>({
    resolver: zodResolver(declineFormSchema),
    defaultValues: {
      reason: undefined,
      comment: "",
    },
  });

  const isExpired = new Date(expiresAt) < new Date();

  const onSubmitResponse = async (data: ResponseFormData) => {
    try {
      await submitMutation.mutateAsync({
        token,
        data: {
          feedback: data.feedback,
          rating: data.rating,
          verificationDetails: data.verificationDetails || {},
        },
      });
      setSuccess(
        "Reference submitted successfully! Thank you for providing this reference."
      );
    } catch (error) {
      console.error("Failed to submit reference:", error);
    }
  };

  const onDeclineReference = async (data: DeclineFormData) => {
    try {
      await declineMutation.mutateAsync({
        token,
        declineData: {
          reason: data.reason,
          comment: data.comment,
        },
      });
      setSuccess("Reference declined. Thank you for your response.");
    } catch (error) {
      console.error("Failed to decline reference:", error);
    }
  };

  const renderStarRating = (field: any) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          className={`p-1 transition-colors ${
            star <= field.value
              ? "text-yellow-400 hover:text-yellow-500"
              : "text-gray-300 hover:text-gray-400"
          }`}
          key={star}
          onClick={() => field.onChange(star)}
          type="button"
        >
          <Star
            className={`h-6 w-6 ${star <= field.value ? "fill-current" : ""}`}
          />
        </button>
      ))}
      <span className="ml-2 text-muted-foreground text-sm">
        {field.value > 0 ? `${field.value}/5` : "No rating"}
      </span>
    </div>
  );

  const renderDynamicFields = () => {
    if (!validationSchema?.fields) return null;

    return Object.entries(validationSchema.fields).map(
      ([fieldName, fieldConfig]: [string, any]) => (
        <FormField
          control={responseForm.control}
          key={fieldName}
          name={`verificationDetails.${fieldName}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fieldConfig.label}</FormLabel>
              <FormControl>
                {fieldConfig.type === "select" ? (
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={fieldConfig.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldConfig.options?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : fieldConfig.type === "number" ? (
                  <Input
                    placeholder={fieldConfig.placeholder}
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                ) : (
                  <Input
                    placeholder={fieldConfig.placeholder}
                    type={fieldConfig.type === "boolean" ? "checkbox" : "text"}
                    {...field}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    );
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-green-800">
              <CheckCircle className="mb-4 h-16 w-16 text-green-600" />
              <h2 className="mb-2 font-semibold text-xl">Thank You!</h2>
              <p className="text-center">{success}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-red-800">
              <Clock className="mb-4 h-16 w-16 text-red-600" />
              <h2 className="mb-2 font-semibold text-xl">Request Expired</h2>
              <p className="text-center">
                This reference request has expired. Please contact{" "}
                {tenantName || "the requester"}
                to request a new reference link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <Shield className="mx-auto mb-4 h-12 w-12 text-blue-600" />
        <h1 className="font-bold text-2xl text-gray-900">Reference Request</h1>
        <p className="mt-2 text-muted-foreground">
          {tenantName || "Someone"} has requested a reference from you
        </p>
      </div>

      {/* Request Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-medium text-muted-foreground text-sm">
                Reference Type
              </Label>
              <p className="mt-1">
                {getReferenceTypeDisplayName(referenceType)}
              </p>
            </div>
            <div>
              <Label className="font-medium text-muted-foreground text-sm">
                Expires
              </Label>
              <p className="mt-1">{new Date(expiresAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <Label className="font-medium text-muted-foreground text-sm">
              Description
            </Label>
            <p className="mt-1 text-sm">
              {getReferenceTypeDescription(referenceType)}
            </p>
          </div>

          {customMessage && (
            <div>
              <Label className="font-medium text-muted-foreground text-sm">
                Message
              </Label>
              <p className="mt-1 rounded-lg bg-muted p-3 text-sm">
                "{customMessage}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {(submitMutation.error || declineMutation.error) && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {submitMutation.error?.message || declineMutation.error?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Response Form or Decline Form */}
      {showDeclineForm ? (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-red-800">
              Decline Reference
              <Button
                onClick={() => setShowDeclineForm(false)}
                size="sm"
                variant="ghost"
              >
                ← Back
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...declineForm}>
              <form
                className="space-y-6"
                onSubmit={declineForm.handleSubmit(onDeclineReference)}
              >
                <FormField
                  control={declineForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Declining</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unreachable">
                              Person is unreachable
                            </SelectItem>
                            <SelectItem value="not_acquainted">
                              I don't know them well enough
                            </SelectItem>
                            <SelectItem value="conflict_of_interest">
                              Conflict of interest
                            </SelectItem>
                            <SelectItem value="insufficient_information">
                              Insufficient information
                            </SelectItem>
                            <SelectItem value="other">Other reason</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={declineForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional explanation..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    disabled={declineMutation.isPending}
                    type="submit"
                    variant="destructive"
                  >
                    {declineMutation.isPending ? (
                      <>
                        <X className="mr-2 h-4 w-4 animate-pulse" />
                        Declining...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Decline Reference
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Provide Reference
              <Button
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setShowDeclineForm(true)}
                size="sm"
                variant="outline"
              >
                <X className="mr-1 h-4 w-4" />
                Decline
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...responseForm}>
              <form
                className="space-y-6"
                onSubmit={responseForm.handleSubmit(onSubmitResponse)}
              >
                {/* Dynamic fields based on reference type */}
                {renderDynamicFields()}

                {/* Overall rating */}
                <FormField
                  control={responseForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Rating</FormLabel>
                      <FormControl>
                        <div className="mt-2">{renderStarRating(field)}</div>
                      </FormControl>
                      <FormDescription>
                        Rate this person overall (required)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Feedback */}
                <FormField
                  control={responseForm.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed feedback about this person..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={submitMutation.isPending}
                    type="submit"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Shield className="mr-2 h-4 w-4 animate-pulse" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Submit Reference
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ReferenceResponseForm;
