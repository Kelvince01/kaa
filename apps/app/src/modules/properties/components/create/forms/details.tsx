import { zodResolver } from "@hookform/resolvers/zod";
import { PropertyCondition } from "@kaa/models/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { cn } from "@kaa/ui/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  Bed,
  Building,
  Calendar,
  Eye,
  Home,
  Maximize,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { stepSchemas } from "../../../property.schema";

type DetailsFormData = {
  bedrooms: number;
  bathrooms: number;
  area?: {
    value: number;
    unit: "sqft" | "sqm";
  };
  size?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  condition: PropertyCondition;
  orientation?:
    | "north"
    | "south"
    | "east"
    | "west"
    | "northeast"
    | "northwest"
    | "southeast"
    | "southwest";
  view: Array<
    "city" | "ocean" | "mountain" | "garden" | "pool" | "courtyard" | "street"
  >;
  parking?: {
    spaces: number;
    type?:
      | "garage"
      | "carport"
      | "street"
      | "driveway"
      | "covered"
      | "uncovered";
    cost?: number;
  };
  storage?: {
    available: boolean;
    size?: string;
    location?: string;
  };
};

type DetailsFormProps = {
  defaultValues?: Partial<DetailsFormData>;
  onSubmit: (data: DetailsFormData) => void;
  onNext: () => void;
  onPrevious: () => void;
  className?: string;
};

const conditionOptions = [
  {
    value: PropertyCondition.EXCELLENT,
    label: "Excellent",
    description: "Recently renovated or brand new",
  },
  {
    value: PropertyCondition.GOOD,
    label: "Good",
    description: "Well-maintained, minor wear",
  },
  {
    value: PropertyCondition.FAIR,
    label: "Fair",
    description: "Some maintenance needed",
  },
  {
    value: PropertyCondition.NEEDS_RENOVATION,
    label: "Needs Renovation",
    description: "Requires significant updates",
  },
];

const orientationOptions = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "northeast", label: "Northeast" },
  { value: "northwest", label: "Northwest" },
  { value: "southeast", label: "Southeast" },
  { value: "southwest", label: "Southwest" },
];

const viewOptions = [
  { value: "city", label: "City View", icon: "🏙️" },
  { value: "ocean", label: "Ocean View", icon: "🌊" },
  { value: "mountain", label: "Mountain View", icon: "⛰️" },
  { value: "garden", label: "Garden View", icon: "🌳" },
  { value: "pool", label: "Pool View", icon: "🏊" },
  { value: "courtyard", label: "Courtyard", icon: "🏛️" },
  { value: "street", label: "Street View", icon: "🛣️" },
];

const parkingTypeOptions = [
  { value: "garage", label: "Garage" },
  { value: "carport", label: "Carport" },
  { value: "street", label: "Street Parking" },
  { value: "driveway", label: "Driveway" },
  { value: "covered", label: "Covered Parking" },
  { value: "uncovered", label: "Uncovered Parking" },
];

export function DetailsForm({
  defaultValues,
  onSubmit,
  onNext,
  onPrevious,
  className,
}: DetailsFormProps) {
  const form = useForm<DetailsFormData>({
    resolver: zodResolver(stepSchemas.details),
    defaultValues: {
      bedrooms: 0,
      bathrooms: 0,
      condition: PropertyCondition.GOOD,
      view: [],
      parking: {
        spaces: 0,
      },
      storage: {
        available: false,
      },
      ...defaultValues,
    },
  });

  const watchedValues = form.watch();

  const handleSubmit = (data: DetailsFormData) => {
    onSubmit(data);
    onNext();
  };

  const toggleView = (viewType: string) => {
    const currentViews = form.getValues("view");
    const updated = currentViews.includes(viewType as any)
      ? currentViews.filter((v) => v !== viewType)
      : [...currentViews, viewType as any];
    form.setValue("view", updated);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Details
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Provide detailed information about the property structure and
            features
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              {/* Basic Room Information */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-lg">
                  <Building className="h-4 w-4" />
                  Room Configuration
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Bed className="h-4 w-4" />
                          Bedrooms *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Number of bedrooms"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Total number of bedrooms
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Bath className="h-4 w-4" />
                          Bathrooms *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Number of bathrooms"
                            step="0.5"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Include half baths (e.g., 2.5 for 2 full + 1 half)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Area Information */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-lg">
                  <Maximize className="h-4 w-4" />
                  Size & Layout
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="area.value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor Area</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter area"
                            type="number"
                            {...field}
                            onChange={(e) => {
                              field.onChange(
                                Number.parseFloat(e.target.value) || undefined
                              );
                              form.setValue(
                                "size",
                                Number.parseFloat(e.target.value) || undefined
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="area.unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sqft">
                              Square Feet (sq ft)
                            </SelectItem>
                            <SelectItem value="sqm">
                              Square Meters (sq m)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Condition</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {conditionOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div>
                                  <div className="font-medium">
                                    {option.label}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {option.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Floor & Building Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Floor & Building Info</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Floor Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 3"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value, 10) || undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Ground floor = 0, Basement = negative
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalFloors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Floors in Building</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 5"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value, 10) || undefined
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
                    name="yearBuilt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Year Built
                        </FormLabel>
                        <FormControl>
                          <Input
                            max={currentYear + 2}
                            min="1800"
                            placeholder={`e.g., ${currentYear - 10}`}
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value, 10) || undefined
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

              {/* Orientation & Views */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-medium text-lg">
                  <Eye className="h-4 w-4" />
                  Orientation & Views
                </h3>

                <FormField
                  control={form.control}
                  name="orientation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Orientation</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select orientation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orientationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Primary direction the property faces
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="mb-3 block font-medium text-sm">
                    Available Views
                  </Label>
                  <p className="mb-3 text-gray-600 text-sm">
                    Select all views that apply (choose multiple)
                  </p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {viewOptions.map((view) => (
                      <Badge
                        className="cursor-pointer justify-center py-2"
                        key={view.value}
                        onClick={() => toggleView(view.value)}
                        variant={
                          watchedValues.view?.includes(view.value as any)
                            ? "default"
                            : "outline"
                        }
                      >
                        <span className="mr-1">{view.icon}</span>
                        {view.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Parking Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Parking</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="parking.spaces"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parking Spaces</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Number of spaces"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value, 10) || 0
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedValues.parking?.spaces &&
                    watchedValues.parking.spaces > 0 && (
                      <>
                        <FormField
                          control={form.control}
                          name="parking.type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parking Type</FormLabel>
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
                                  {parkingTypeOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
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
                          name="parking.cost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parking Cost (KES/month)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Additional cost"
                                  type="number"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      Number.parseFloat(e.target.value) ||
                                        undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Leave empty if included in rent
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                </div>
              </div>

              {/* Storage Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Storage</h3>

                <FormField
                  control={form.control}
                  name="storage.available"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          checked={field.value}
                          className="mt-1"
                          onChange={field.onChange}
                          type="checkbox"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Additional storage available</FormLabel>
                        <FormDescription>
                          Check if the property includes storage space
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {watchedValues.storage?.available && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="storage.size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Size</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 5x5 feet, Small closet"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="storage.location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Basement, Balcony"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-between">
                <Button
                  className="flex items-center gap-2"
                  onClick={onPrevious}
                  type="button"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Location
                </Button>

                <Button className="min-w-32" type="submit">
                  Continue to Features
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
