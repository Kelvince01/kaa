/**
 * Create Virtual Tour Form Component
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
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
import { Progress } from "@kaa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Switch } from "@kaa/ui/components/switch";
import { Textarea } from "@kaa/ui/components/textarea";
import {
  Box,
  Camera,
  Glasses,
  Globe,
  Navigation,
  Plane,
  Settings,
  Smartphone,
  Upload,
  Video,
  Wand2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateVirtualTour } from "../virtual-tour.mutations";
import { useServiceCapabilities } from "../virtual-tour.queries";
import { TourType } from "../virtual-tour.type";

// Form validation schema
const createTourSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description too long"),
  type: z.enum(TourType),
  settings: z
    .object({
      autoRotate: z.boolean().optional(),
      autoRotateSpeed: z.number().min(0.1).max(10).optional(),
      initialView: z
        .object({
          yaw: z.number().min(-180).max(180),
          pitch: z.number().min(-90).max(90),
          fov: z.number().min(30).max(120),
        })
        .optional(),
      controlsEnabled: z.boolean().optional(),
      gyroscopeEnabled: z.boolean().optional(),
      vrMode: z.boolean().optional(),
      arEnabled: z.boolean().optional(),
      audioEnabled: z.boolean().optional(),
      branding: z
        .object({
          showLogo: z.boolean(),
          logoPosition: z.enum([
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]),
          showWatermark: z.boolean(),
          theme: z.enum(["light", "dark", "custom"]),
        })
        .optional(),
    })
    .optional(),
  metadata: z.object({
    propertyType: z.string().min(1, "Property type is required"),
    totalSize: z.number().min(1, "Total size must be greater than 0"),
    bedrooms: z.number().min(0, "Bedrooms cannot be negative"),
    bathrooms: z.number().min(0, "Bathrooms cannot be negative"),
    floor: z
      .number()
      .min(-5, "Floor number invalid")
      .max(200, "Floor number too high"),
    county: z.string().min(1, "County is required"),
    constituency: z.string().min(1, "Constituency is required"),
    ward: z.string().min(1, "Ward is required"),
    amenities: z.array(z.string()),
    features: z.array(z.string()),
  }),
});

type CreateTourFormData = z.infer<typeof createTourSchema>;

type CreateTourFormProps = {
  propertyId: string;
  onSuccess?: (tour: any) => void;
  onCancel?: () => void;
};

export const CreateTourForm: React.FC<CreateTourFormProps> = ({
  propertyId,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Queries
  const { data: capabilities } = useServiceCapabilities();

  // Mutations
  const createTourMutation = useCreateVirtualTour({
    onSuccess: (data) => {
      onSuccess?.(data);
    },
  });

  // Form setup
  const form = useForm<CreateTourFormData>({
    resolver: zodResolver(createTourSchema),
    defaultValues: {
      propertyId,
      title: "",
      description: "",
      type: TourType.PHOTO_360,
      settings: {
        autoRotate: false,
        autoRotateSpeed: 2,
        initialView: {
          yaw: 0,
          pitch: 0,
          fov: 75,
        },
        controlsEnabled: true,
        gyroscopeEnabled: true,
        vrMode: false,
        arEnabled: false,
        audioEnabled: false,
        branding: {
          showLogo: true,
          logoPosition: "top-right",
          showWatermark: true,
          theme: "light",
        },
      },
      metadata: {
        propertyType: "apartment",
        totalSize: 0,
        bedrooms: 0,
        bathrooms: 0,
        floor: 0,
        county: "",
        constituency: "",
        ward: "",
        amenities: [],
        features: [],
      },
    },
  });

  const tourType = form.watch("type");

  // Tour type configurations
  const tourTypeConfig = {
    [TourType.PHOTO_360]: {
      name: "Photo 360°",
      description: "360-degree panoramic photography",
      icon: <Camera className="h-5 w-5" />,
      supported: true,
    },
    [TourType.VIDEO_360]: {
      name: "Video 360°",
      description: "360-degree video experience",
      icon: <Video className="h-5 w-5" />,
      supported: true,
    },
    [TourType.THREE_D_MODEL]: {
      name: "3D Model",
      description: "Interactive 3D model walkthrough",
      icon: <Box className="h-5 w-5" />,
      supported: capabilities?.features.webXR,
    },
    [TourType.VIRTUAL_REALITY]: {
      name: "Virtual Reality",
      description: "VR-compatible immersive experience",
      icon: <Glasses className="h-5 w-5" />,
      supported: capabilities?.features.webXR,
    },
    [TourType.AUGMENTED_REALITY]: {
      name: "Augmented Reality",
      description: "AR overlay on real environment",
      icon: <Smartphone className="h-5 w-5" />,
      supported: capabilities?.features.webXR,
    },
    [TourType.INTERACTIVE_WALKTHROUGH]: {
      name: "Interactive Walkthrough",
      description: "Connected scenes with navigation",
      icon: <Navigation className="h-5 w-5" />,
      supported: true,
    },
    [TourType.DRONE_AERIAL]: {
      name: "Drone Aerial",
      description: "Aerial drone photography/video",
      icon: <Plane className="h-5 w-5" />,
      supported: true,
    },
  };

  // AI suggestions effect
  useEffect(() => {
    if (capabilities?.features.aiAnalysis) {
      // Simulate AI suggestions
      setAiSuggestions([
        {
          type: "title",
          suggestion: "Modern 3BR Apartment with City View",
          confidence: 0.85,
        },
        {
          type: "description",
          suggestion:
            "Spacious apartment featuring modern amenities, panoramic city views, and premium finishes in a prime location.",
          confidence: 0.78,
        },
      ]);
    }
  }, [capabilities]);

  const onSubmit = (data: CreateTourFormData) => {
    createTourMutation.mutate({
      ...data,
      propertyId,
      settings: data.settings || {},
    });
  };

  const steps = [
    { id: 0, title: "Basic Info", description: "Tour title and description" },
    { id: 1, title: "Tour Type", description: "Select tour type and settings" },
    {
      id: 2,
      title: "Property Info",
      description: "Property metadata and features",
    },
    {
      id: 3,
      title: "Advanced Settings",
      description: "Advanced features and options",
    },
    { id: 4, title: "Review", description: "Review and create tour" },
  ];

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span>
            {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
          </span>
        </div>
        <Progress
          className="h-2"
          value={((currentStep + 1) / steps.length) * 100}
        />
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 ${
              index === currentStep
                ? "bg-primary text-primary-foreground"
                : index < currentStep
                  ? "bg-green-100 text-green-800"
                  : "bg-muted text-muted-foreground"
            }`}
            key={step.id}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full font-medium text-xs ${
                index === currentStep
                  ? "bg-white text-primary"
                  : index < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-300"
              }`}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            <div>
              <div className="font-medium">{step.title}</div>
              <div className="text-xs opacity-75">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 0: Basic Info */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Basic Tour Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tour Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tour title" {...field} />
                      </FormControl>
                      {aiSuggestions.find((s) => s.type === "title") && (
                        <div className="mt-1 flex items-center gap-2">
                          <Badge className="text-xs" variant="outline">
                            <Wand2 className="mr-1 h-3 w-3" />
                            AI Suggestion
                          </Badge>
                          <button
                            className="text-blue-600 text-xs hover:underline"
                            onClick={() => {
                              const suggestion = aiSuggestions.find(
                                (s) => s.type === "title"
                              );
                              form.setValue("title", suggestion.suggestion);
                            }}
                            type="button"
                          >
                            {
                              aiSuggestions.find((s) => s.type === "title")
                                ?.suggestion
                            }
                          </button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tour Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this virtual tour"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      {aiSuggestions.find((s) => s.type === "description") && (
                        <div className="mt-1 flex items-center gap-2">
                          <Badge className="text-xs" variant="outline">
                            <Wand2 className="mr-1 h-3 w-3" />
                            AI Suggestion
                          </Badge>
                          <button
                            className="text-blue-600 text-xs hover:underline"
                            onClick={() => {
                              const suggestion = aiSuggestions.find(
                                (s) => s.type === "description"
                              );
                              form.setValue(
                                "description",
                                suggestion.suggestion
                              );
                            }}
                            type="button"
                          >
                            Use AI description
                          </button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 1: Tour Type */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tour Type & Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tour Type Selection */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tour Type</FormLabel>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {Object.entries(tourTypeConfig).map(
                          ([type, config]) => (
                            <div
                              className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:border-primary ${
                                field.value === type
                                  ? "border-primary bg-primary/5"
                                  : "border-border"
                              } ${config.supported ? "" : "cursor-not-allowed opacity-50"}`}
                              key={type}
                              onClick={() =>
                                form.setValue("type", type as TourType)
                              }
                            >
                              <div className="flex flex-col items-center gap-2 text-center">
                                {config.icon}
                                <h3 className="font-medium">{config.name}</h3>
                                <p className="text-muted-foreground text-xs">
                                  {config.description}
                                </p>
                              </div>

                              {!config.supported && (
                                <Badge
                                  className="absolute top-1 right-1 text-xs"
                                  variant="secondary"
                                >
                                  Pro
                                </Badge>
                              )}

                              {field.value === type && (
                                <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                  <div className="h-2 w-2 rounded-full bg-white" />
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Basic Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="settings.controlsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Show Controls</FormLabel>
                          <FormDescription className="text-xs">
                            Display navigation controls
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

                  <FormField
                    control={form.control}
                    name="settings.gyroscopeEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Gyroscope</FormLabel>
                          <FormDescription className="text-xs">
                            Motion-based navigation
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

                  <FormField
                    control={form.control}
                    name="settings.autoRotate"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Auto Rotate</FormLabel>
                          <FormDescription className="text-xs">
                            Automatically rotate view
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

                  <FormField
                    control={form.control}
                    name="settings.audioEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Audio Narration</FormLabel>
                          <FormDescription className="text-xs">
                            Voice narration support
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
                </div>

                {/* Advanced XR Settings */}
                {capabilities?.features.webXR && (
                  <div className="space-y-3">
                    <Label>Extended Reality Settings</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="settings.vrMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <Glasses className="h-4 w-4" />
                                VR Mode
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Virtual Reality compatibility
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

                      <FormField
                        control={form.control}
                        name="settings.arEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                AR Mode
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Augmented Reality overlay
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
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Property Info */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="metadata.propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
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
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="mansion">Mansion</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="studio">Studio</SelectItem>
                            <SelectItem value="bedsitter">Bedsitter</SelectItem>
                            <SelectItem value="maisonette">
                              Maisonette
                            </SelectItem>
                            <SelectItem value="bungalow">Bungalow</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.totalSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size (sqm)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="120"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="3"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="2"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="2"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metadata.county"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>County</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select county" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nairobi">Nairobi</SelectItem>
                            <SelectItem value="mombasa">Mombasa</SelectItem>
                            <SelectItem value="kiambu">Kiambu</SelectItem>
                            <SelectItem value="machakos">Machakos</SelectItem>
                            <SelectItem value="nakuru">Nakuru</SelectItem>
                            <SelectItem value="kisumu">Kisumu</SelectItem>
                            {/* Add all 47 counties */}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <Button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  type="button"
                  variant="outline"
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button onClick={onCancel} type="button" variant="ghost">
                  Cancel
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  type="button"
                >
                  Next
                </Button>
              ) : (
                <Button
                  className="min-w-[120px]"
                  disabled={createTourMutation.isPending}
                  type="submit"
                >
                  {createTourMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    "Create Tour"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateTourForm;
