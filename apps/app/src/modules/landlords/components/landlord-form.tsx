"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@kaa/ui/components/separator";
import { Textarea } from "@kaa/ui/components/textarea";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateLandlord, useUpdateLandlord } from "../landlord.queries";
import {
  type CreateLandlordInput,
  createLandlordSchema,
} from "../landlord.schema";
import { LandlordType } from "../landlord.type";

type LandlordFormProps = {
  initialData?: any;
  onSuccess?: () => void;
};

export default function LandlordForm({
  initialData,
  onSuccess,
}: LandlordFormProps) {
  const createLandlordMutation = useCreateLandlord();
  const updateLandlordMutation = useUpdateLandlord();

  const form = useForm<CreateLandlordInput>({
    resolver: zodResolver(createLandlordSchema),
    defaultValues: {
      landlordType: initialData?.landlordType || LandlordType.INDIVIDUAL,
      contactInfo: {
        primaryAddress: {
          street: initialData?.contactInfo?.primaryAddress?.street || "",
          city: initialData?.contactInfo?.primaryAddress?.city || "",
          state: initialData?.contactInfo?.primaryAddress?.state || "",
          country: initialData?.contactInfo?.primaryAddress?.country || "",
          postalCode:
            initialData?.contactInfo?.primaryAddress?.postalCode || "",
        },
        emergencyContact: {
          name: initialData?.contactInfo?.emergencyContact?.name || "",
          relationship:
            initialData?.contactInfo?.emergencyContact?.relationship || "",
          phone: initialData?.contactInfo?.emergencyContact?.phone || "",
          email: initialData?.contactInfo?.emergencyContact?.email || "",
        },
      },
      personalInfo: {
        firstName: initialData?.personalInfo?.firstName || "",
        lastName: initialData?.personalInfo?.lastName || "",
        email: initialData?.personalInfo?.email || "",
        phone: initialData?.personalInfo?.phone || "",
        dateOfBirth: initialData?.personalInfo?.dateOfBirth || "",
        nationality: initialData?.personalInfo?.nationality || "",
        nationalId: initialData?.personalInfo?.nationalId || "",
        preferredLanguage: initialData?.personalInfo?.preferredLanguage || "en",
      },
      communicationPreferences: {
        preferredMethod: "email",
        language: "en",
        timezone: "UTC",
        receiveMarketingEmails: true,
        receivePropertyAlerts: true,
        receiveMaintenanceUpdates: true,
        receiveRegulatoryUpdates: true,
        receivePerformanceReports: true,
      },
      metadata: {
        source: "website",
        tags: [],
        notes: "",
        internalNotes: "",
      },
    },
  });

  const landlordType = form.watch("landlordType");

  const onSubmit = async (values: CreateLandlordInput) => {
    try {
      if (initialData?._id) {
        // Update existing landlord
        await updateLandlordMutation.mutateAsync({
          id: initialData._id,
          data: values,
        });
        toast.success("Landlord updated successfully");
      } else {
        // Create new landlord
        await createLandlordMutation.mutateAsync(values);
        toast.success("Landlord created successfully");
      }
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error.message ||
          (initialData?._id
            ? "Failed to update landlord"
            : "Failed to create landlord")
      );
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Select the landlord type and provide basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="landlordType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Landlord Type</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select landlord type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LandlordType.INDIVIDUAL}>
                          Individual
                        </SelectItem>
                        <SelectItem value={LandlordType.COMPANY}>
                          Company
                        </SelectItem>
                        <SelectItem value={LandlordType.TRUST}>
                          Trust
                        </SelectItem>
                        <SelectItem value={LandlordType.PARTNERSHIP}>
                          Partnership
                        </SelectItem>
                        <SelectItem value={LandlordType.LLC}>LLC</SelectItem>
                        <SelectItem value={LandlordType.CORPORATION}>
                          Corporation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Personal Information (for Individual) */}
          {landlordType === LandlordType.INDIVIDUAL && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Provide personal details for the individual landlord
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="personalInfo.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalInfo.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalInfo.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter email address"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalInfo.dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalInfo.nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter nationality" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalInfo.nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>National ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter national ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Information (for non-Individual) */}
          {landlordType !== LandlordType.INDIVIDUAL && (
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Provide business details for the organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="businessInfo.companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessInfo.registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter registration number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessInfo.taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tax ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessInfo.industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter industry" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessInfo.establishedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Established Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessInfo.website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter website URL"
                            type="url"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>
                Provide primary address and emergency contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Primary Address</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contactInfo.primaryAddress.street"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter street address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactInfo.primaryAddress.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactInfo.primaryAddress.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactInfo.primaryAddress.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactInfo.primaryAddress.postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter postal code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Emergency Contact</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contactInfo.emergencyContact.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactInfo.emergencyContact.relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter relationship" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactInfo.emergencyContact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactInfo.emergencyContact.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter email address"
                            type="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Add any additional notes or information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="metadata.notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        placeholder="Enter any additional notes"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This information will be visible to the landlord
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              onClick={() => form.reset()}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
            <Button
              disabled={
                createLandlordMutation.isPending ||
                updateLandlordMutation.isPending
              }
              type="submit"
            >
              {createLandlordMutation.isPending ||
              updateLandlordMutation.isPending
                ? initialData?._id
                  ? "Updating..."
                  : "Creating..."
                : initialData?._id
                  ? "Update Landlord"
                  : "Create Landlord"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
