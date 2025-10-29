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
import { Loader2, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import { useAmenityMetadata, useCreateAmenity } from "../amenity.queries";
import {
  AmenityCategory,
  AmenityType,
  type CreateAmenityRequest,
} from "../amenity.type";

type CreateAmenityFormProps = {
  initialData?: Partial<CreateAmenityRequest>;
  onSuccess?: (amenity: any) => void;
  onCancel?: () => void;
};

const createAmenitySchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  type: z.enum(AmenityType),
  category: z.enum(AmenityCategory),
  description: z.string().optional(),
  location: z.object({
    country: z.string(),
    county: z.string().min(1, "County is required"),
    constituency: z.string().optional(),
    ward: z.string().optional(),
    estate: z.string().optional(),
    address: z.object({
      line1: z.string().min(1, "Address line 1 is required"),
      line2: z.string().optional(),
      town: z.string().min(1, "Town is required"),
      postalCode: z.string().optional(),
    }),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
  }),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      website: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
  operatingHours: z
    .object({
      monday: z
        .array(
          z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean().optional(),
          })
        )
        .optional(),
      tuesday: z
        .array(
          z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean().optional(),
          })
        )
        .optional(),
      wednesday: z
        .array(
          z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean().optional(),
          })
        )
        .optional(),
      thursday: z
        .array(
          z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean().optional(),
          })
        )
        .optional(),
      friday: z
        .array(
          z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean().optional(),
          })
        )
        .optional(),
      saturday: z
        .array(
          z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean().optional(),
          })
        )
        .optional(),
      sunday: z
        .array(
          z.object({
            open: z.string(),
            close: z.string(),
            closed: z.boolean().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
});

type CreateAmenityFormData = z.infer<typeof createAmenitySchema>;

export function CreateAmenityForm({
  initialData,
  onSuccess,
  onCancel,
}: CreateAmenityFormProps) {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const { data: metadata } = useAmenityMetadata();
  const createMutation = useCreateAmenity();

  const form = useFormWithDraft<CreateAmenityFormData>("create-amenity-form", {
    formOptions: {
      resolver: zodResolver(createAmenitySchema),
      defaultValues: {
        location: {
          country: "Kenya",
          county: "",
          address: {
            line1: "",
            town: "",
            line2: "",
            postalCode: "",
          },
          coordinates: {
            latitude: 0,
            longitude: 0,
          },
        },
        contact: {},
        tags: [],
        operatingHours: {
          monday: [{ open: "", close: "", closed: false }],
          tuesday: [{ open: "", close: "", closed: false }],
          wednesday: [{ open: "", close: "", closed: false }],
          thursday: [{ open: "", close: "", closed: false }],
          friday: [{ open: "", close: "", closed: false }],
          saturday: [{ open: "", close: "", closed: false }],
          sunday: [{ open: "", close: "", closed: false }],
        },
        ...initialData,
      },
    },
  });

  // Watch operatingHours for cleaning
  const operatingHours = form.watch("operatingHours");

  const selectedCategory = form.watch("category");
  const availableTypes =
    metadata?.categoryTypeMapping[selectedCategory as AmenityCategory] || [];

  const getCurrentLocation = () => {
    setLocationLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          form.setValue("location.coordinates.latitude", latitude);
          form.setValue("location.coordinates.longitude", longitude);
          setLocationLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationLoading(false);
        }
      );
    } else {
      setLocationLoading(false);
    }
  };

  const onSubmit = async (data: CreateAmenityFormData) => {
    try {
      // Clean operatingHours: filter out empty slots and set only if has valid data
      const cleanedOperatingHours = Object.fromEntries(
        Object.entries(data.operatingHours || {}).map(([day, slots]) => {
          const cleanedSlots = slots.filter(
            (slot) => slot.closed || (slot.open && slot.close)
          );
          return [day, cleanedSlots.length > 0 ? cleanedSlots : undefined];
        })
      );

      const cleanedData = {
        ...data,
        operatingHours: cleanedOperatingHours,
        geolocation: {
          coordinates: [
            data.location.coordinates.longitude,
            data.location.coordinates.latitude,
          ],
          type: "Point",
        },
      };

      console.log(cleanedData);
      const result = await createMutation.mutateAsync(cleanedData);
      onSuccess?.(result);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  console.log(form.formState.errors);
  console.log(form.getValues());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add New Amenity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Nairobi Hospital" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {metadata?.categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      defaultValue={field.value}
                      disabled={!selectedCategory}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the amenity"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Location Information</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location.county"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>County *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Nairobi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.ward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ward</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Westlands" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.address.line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1 *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Kimathi Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location.address.town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Town *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Nairobi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Coordinates */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Coordinates *</Label>
                  <Button
                    disabled={locationLoading}
                    onClick={getCurrentLocation}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {locationLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="mr-2 h-4 w-4" />
                    )}
                    Use Current Location
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location.coordinates.latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="-1.2921"
                            step="any"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location.coordinates.longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="36.8219"
                            step="any"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                Contact Information (Optional)
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="contact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+254-20-1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="info@example.com"
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
                  name="contact.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          type="url"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Operating Hours */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                Operating Hours (Optional)
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  "monday",
                  "tuesday",
                  "wednesday",
                  "thursday",
                  "friday",
                  "saturday",
                  "sunday",
                ].map((day) => {
                  const capitalizedDay =
                    day.charAt(0).toUpperCase() + day.slice(1);
                  return (
                    <FormItem key={day}>
                      <FormLabel className="capitalize">{day}</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`operatingHours.${day}[0].open` as any}
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                placeholder="Open"
                                type="time"
                                {...field}
                              />
                            </FormControl>
                          )}
                        />
                        <span className="mx-1 text-muted-foreground">to</span>
                        <FormField
                          control={form.control}
                          name={`operatingHours.${day}[0].close` as any}
                          render={({ field }) => (
                            <FormControl>
                              <Input
                                placeholder="Close"
                                type="time"
                                {...field}
                              />
                            </FormControl>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`operatingHours.${day}[0].closed` as any}
                          render={({ field }) => (
                            <div className="ml-2 flex items-center space-x-2">
                              <input
                                checked={field.value ?? false}
                                className="accent-primary-500"
                                id={`closed-${day}`}
                                onChange={(e) => {
                                  const isClosed = e.target.checked;
                                  field.onChange(isClosed);
                                  if (isClosed) {
                                    // Clear open and close when closed
                                    form.setValue(
                                      // @ts-expect-error - this is a valid path
                                      `operatingHours.${day}[0].open`,
                                      ""
                                    );
                                    form.setValue(
                                      // @ts-expect-error - this is a valid path
                                      `operatingHours.${day}[0].close`,
                                      ""
                                    );
                                  } else {
                                    // If not closed and no times, ensure default empty
                                    const openVal = form.getValues(
                                      // @ts-expect-error - this is a valid path
                                      `operatingHours.${day}[0].open`
                                    );
                                    const closeVal = form.getValues(
                                      // @ts-expect-error - this is a valid path
                                      `operatingHours.${day}[0].close`
                                    );
                                    if (!(openVal || closeVal)) {
                                      form.setValue(
                                        // @ts-expect-error - this is a valid path
                                        `operatingHours.${day}[0].open`,
                                        ""
                                      );
                                      form.setValue(
                                        // @ts-expect-error - this is a valid path
                                        `operatingHours.${day}[0].close`,
                                        ""
                                      );
                                    }
                                  }
                                }}
                                type="checkbox"
                              />
                              <label
                                className="text-sm"
                                htmlFor={`closed-${day}`}
                              >
                                Closed
                              </label>
                            </div>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button onClick={onCancel} type="button" variant="outline">
                  Cancel
                </Button>
              )}
              <Button
                className="bg-primary hover:bg-primary/90"
                disabled={createMutation.isPending}
                type="submit"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Amenity
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
