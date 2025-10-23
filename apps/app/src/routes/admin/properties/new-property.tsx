"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
import { ChevronLeft, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateProperty } from "@/modules/properties/property.mutations";

// Define the validation schema using Zod
const propertyFormSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  type: z.string().min(1, "Property type is required"),
  propertyType: z.string().min(1, "Property subtype is required"),
  price: z.number().positive("Price must be greater than 0"),
  bedrooms: z.number().min(0, "Bedrooms cannot be negative"),
  bathrooms: z.number().min(0, "Bathrooms cannot be negative"),
  size: z.number().optional(),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().optional(),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().optional(),
  }),
  furnished: z.boolean().optional(),
  parking: z.boolean().optional(),
  published: z.boolean().optional(),
  features: z.array(z.string()).optional(),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

const AdminNewPropertyClient = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initial form values
  const initialFormValues = {
    title: "",
    description: "",
    type: "rent", // rent or sale
    propertyType: "apartment", // apartment, house, condo, etc.
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    size: 0, // in sq ft/m
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United Kingdom",
    },
    furnished: false,
    parking: false,
    published: false,
    features: [],
  };

  const createPropertyMutation =
    useCreateProperty(
      // 	{
      // 	onSuccess: () => {
      // 		toast.success("Property created successfully");
      // 		form.reset();
      // 		setImages([]);
      // 	},
      // 	onError: (error) => {
      // 		toast.error(error.message);
      // 	},
      // }
    );
  // Initialize the form
  const form = useForm<PropertyFormData>({
    defaultValues: initialFormValues,
    resolver: zodResolver(propertyFormSchema),
  });

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setImages([...images, ...fileArray]);
    }
  };

  // Remove an image from the list
  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Handle form submission
  const handleFormSubmit = async (formValues: PropertyFormData) => {
    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      // Create FormData for image upload
      const formData = new FormData();

      // Append property data
      formData.append("data", JSON.stringify(formValues));

      // Append images
      for (const image of images) {
        formData.append("images", image);
      }

      // API call would go here
      // Simulating upload progress
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);

            // Simulate success after "upload" completes
            setTimeout(() => {
              setSuccess(true);
              toast.success("Property has been added successfully");
              setIsSubmitting(false);
              form.reset();
              setImages([]);
              setUploadProgress(0);
            }, 500);
          }
        }, 300);
      };

      simulateProgress();

      await createPropertyMutation.mutateAsync(formData as any);

      // Actual API call (commented out)
      /*
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/properties`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      setSuccess(true);
      toast.success("Property has been added successfully");
      resetForm();
      setImages([]);
      */
    } catch (error) {
      console.error("Error creating property:", error);
      toast.error("Failed to create property. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Home className="mr-2 h-6 w-6 text-blue-600" />
          <h1 className="font-bold text-2xl">Add New Property</h1>
        </div>
        <Link
          className="flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-200"
          href="/admin/properties"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
          <span className="ml-2">Back to Properties</span>
        </Link>
      </div>

      {success ? (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4">
          <div className="flex">
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <div className="ml-3">
              <h3 className="font-medium text-green-800 text-sm">
                Property created successfully
              </h3>
              <div className="mt-2 text-green-700 text-sm">
                <p>
                  The new property has been added to the system and is{" "}
                  {form.getValues("published")
                    ? "published"
                    : "saved as a draft"}
                  .
                </p>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  className="rounded-md bg-green-100 px-4 py-2 text-green-800 text-sm transition-colors hover:bg-green-200"
                  onClick={() => setSuccess(false)}
                  type="button"
                >
                  Add Another Property
                </button>
                <Link
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-50"
                  href="/admin/properties"
                >
                  View All Properties
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <div className="mb-8">
              <h2 className="mb-4 border-gray-200 border-b pb-2 font-semibold text-lg">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter property title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing Type</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rent">For Rent</SelectItem>
                            <SelectItem value="sale">For Sale</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                            <SelectItem value="studio">Studio</SelectItem>
                            <SelectItem value="commercial">
                              Commercial
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[120px]"
                            placeholder="Provide a detailed description of the property"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="mb-4 border-gray-200 border-b pb-2 font-semibold text-lg">
                Property Details
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (£)</FormLabel>
                      <FormControl>
                        <Input
                          min={0}
                          placeholder="0"
                          step="1"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bedrooms</FormLabel>
                      <FormControl>
                        <Input
                          min={0}
                          placeholder="1"
                          step="1"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bathrooms</FormLabel>
                      <FormControl>
                        <Input
                          min={0}
                          placeholder="1"
                          step="0.5"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size (sq ft)</FormLabel>
                      <FormControl>
                        <Input
                          min={0}
                          placeholder="0"
                          step="1"
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-6 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="furnished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Furnished</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Parking Available</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Publish Immediately</FormLabel>
                          <FormDescription>
                            If unchecked, property will be saved as draft
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="mb-4 border-gray-200 border-b pb-2 font-semibold text-lg">
                Address
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="address.line1"
                    render={({ field }) => (
                      <FormItem>
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
                </div>

                <FormField
                  control={form.control}
                  name="address.city"
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
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/County</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state or county" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.postalCode"
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

                <FormField
                  control={form.control}
                  name="address.country"
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
              </div>
            </div>

            <div className="mb-8">
              <h2 className="mb-4 border-gray-200 border-b pb-2 font-semibold text-lg">
                Images
              </h2>
              <div className="mb-4">
                {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
                <label className="mb-1 block font-medium text-gray-700 text-sm">
                  Property Photos
                </label>
                <div className="mt-1 flex justify-center rounded-md border-2 border-gray-300 border-dashed px-6 pt-5 pb-6">
                  <div className="space-y-1 text-center">
                    <svg
                      aria-hidden="true"
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                    <div className="flex text-gray-600 text-sm">
                      <label
                        className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500"
                        htmlFor="images"
                      >
                        <span>Upload files</span>
                        <input
                          accept="image/*"
                          className="sr-only"
                          id="images"
                          multiple
                          name="images"
                          onChange={handleImageChange}
                          type="file"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-gray-500 text-xs">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </div>
                </div>
              </div>

              {images.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 font-medium text-gray-700 text-sm">
                    Selected Images ({images.length})
                  </h3>
                  <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {images.map((image, index) => (
                      <li
                        className="group relative rounded-md border p-2"
                        key={image.name}
                      >
                        <div className="aspect-h-9 aspect-w-16 overflow-hidden rounded">
                          <Image
                            alt={`Upload ${index + 1}`}
                            className="h-full w-full object-cover"
                            height={100}
                            src={URL.createObjectURL(image)}
                            width={100}
                          />
                        </div>
                        <Button
                          className="-top-2 -right-2 absolute rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => removeImage(index)}
                          type="button"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M6 18L18 6M6 6l12 12"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                            />
                          </svg>
                        </Button>
                        <p className="mt-1 truncate text-xs">{image.name}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-4 border-gray-200 border-t pt-6">
              <Link
                className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-200"
                href="/admin/properties"
              >
                Cancel
              </Link>
              <Button
                className={`rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 ${isSubmitting || !form.formState.isValid ? "cursor-not-allowed opacity-50" : ""}`}
                disabled={isSubmitting || !form.formState.isValid}
                type="submit"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        fill="currentColor"
                      />
                    </svg>
                    {uploadProgress > 0
                      ? `Uploading ${uploadProgress}%`
                      : "Creating..."}
                  </span>
                ) : (
                  "Create Property"
                )}
              </Button>
            </div>

            {isSubmitting && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="h-2.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2.5 rounded-full bg-blue-600"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-gray-500 text-xs">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
          </form>
        </Form>
      )}
    </div>
  );
};

export default AdminNewPropertyClient;
