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
import { Briefcase, Home, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useCreateReference } from "../../reference.queries";
import { type CreateReferenceInput, ReferenceType } from "../../reference.type";
import { getReferenceTypeDisplayName } from "../../utils/reference-utils";

const referenceFormSchema = z.object({
  referenceType: z.enum(ReferenceType),
  referenceProvider: z.object({
    name: z.string().min(1, "Reference provider name is required"),
    email: z.email("Please enter a valid email address"),
    phone: z.string().optional(),
    relationship: z.string().min(1, "Relationship is required"),
  }),
});

type ReferenceFormData = z.infer<typeof referenceFormSchema>;

type CreateReferenceFormProps = {
  tenantId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function CreateReferenceForm({
  tenantId,
  onSuccess,
  onCancel,
}: CreateReferenceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReferenceMutation = useCreateReference();

  const form = useForm<ReferenceFormData>({
    resolver: zodResolver(referenceFormSchema),
    defaultValues: {
      referenceType: ReferenceType.EMPLOYER,
      referenceProvider: {
        name: "",
        email: "",
        phone: "",
        relationship: "",
      },
    },
  });

  const selectedType = form.watch("referenceType");

  const onSubmit = async (data: ReferenceFormData) => {
    setIsSubmitting(true);
    try {
      const createData: CreateReferenceInput = {
        referenceType: data.referenceType,
        referenceProvider: {
          name: data.referenceProvider.name,
          email: data.referenceProvider.email,
          phone: data.referenceProvider.phone,
          relationship: data.referenceProvider.relationship,
        },
      };

      await createReferenceMutation.mutateAsync({
        tenantId,
        data: createData,
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create reference request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReferenceTypeDescription = (type: ReferenceType) => {
    switch (type) {
      case ReferenceType.EMPLOYER:
        return "Employment verification from current or previous employer";
      case ReferenceType.PREVIOUS_LANDLORD:
        return "Rental history verification from previous landlord";
      case ReferenceType.CHARACTER:
        return "Character reference from someone who knows you well";
      case ReferenceType.BUSINESS_PARTNER:
        return "Professional reference from a business partner or associate";
      case ReferenceType.FAMILY_GUARANTOR:
        return "Family member willing to guarantee your tenancy";
      case ReferenceType.SACCOS_MEMBER:
        return "Reference from your SACCOS (Savings and Credit Cooperative)";
      case ReferenceType.CHAMA_MEMBER:
        return "Reference from your Chama (investment group) members";
      case ReferenceType.RELIGIOUS_LEADER:
        return "Reference from your religious leader or spiritual advisor";
      case ReferenceType.COMMUNITY_ELDER:
        return "Reference from a respected community elder or leader";
      default:
        return "";
    }
  };

  const getRelationshipPlaceholder = (type: ReferenceType) => {
    switch (type) {
      case ReferenceType.EMPLOYER:
        return "e.g., Manager, HR Representative, Supervisor";
      case ReferenceType.PREVIOUS_LANDLORD:
        return "e.g., Landlord, Property Manager";
      case ReferenceType.CHARACTER:
        return "e.g., Friend, Colleague, Mentor";
      default:
        return "Describe your relationship";
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Reference Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reference Type</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="referenceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Reference *</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reference type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ReferenceType).map((type) => {
                        const iconMap = {
                          [ReferenceType.EMPLOYER]: Briefcase,
                          [ReferenceType.PREVIOUS_LANDLORD]: Home,
                          [ReferenceType.CHARACTER]: User,
                          [ReferenceType.BUSINESS_PARTNER]: Briefcase,
                          [ReferenceType.FAMILY_GUARANTOR]: User,
                          [ReferenceType.SACCOS_MEMBER]: Briefcase,
                          [ReferenceType.CHAMA_MEMBER]: User,
                          [ReferenceType.RELIGIOUS_LEADER]: User,
                          [ReferenceType.COMMUNITY_ELDER]: User,
                        };
                        const IconComponent = iconMap[type] || User;
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {getReferenceTypeDisplayName(type)}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getReferenceTypeDescription(selectedType)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Reference Provider Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Reference Provider Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="referenceProvider.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="referenceProvider.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Enter email address"
                        type="email"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    We'll send them an invitation to complete your reference
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone (Optional) */}
            <FormField
              control={form.control}
              name="referenceProvider.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Enter phone number"
                        type="tel"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Relationship */}
            <FormField
              control={form.control}
              name="referenceProvider.relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship to You *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={getRelationshipPlaceholder(selectedType)}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe how this person knows you
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Information Notice */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  What happens next?
                </h4>
                <p className="mt-1 text-blue-700 text-sm dark:text-blue-300">
                  We'll send an email invitation to your reference provider with
                  a secure link to complete your reference. They'll have 7 days
                  to respond, and you'll be notified once it's completed.
                </p>
              </div>
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
            {isSubmitting ? "Sending Invitation..." : "Send Reference Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
