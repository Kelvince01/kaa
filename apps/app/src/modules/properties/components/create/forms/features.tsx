import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  ArrowLeft,
  Baby,
  Building,
  Car,
  Coffee,
  Droplets,
  Dumbbell,
  Heart,
  Home,
  Plus,
  Shield,
  Star,
  Trees,
  Users,
  Wifi,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const featuresSchema = z.object({
  // Property Features
  propertyFeatures: z.array(z.string()),
  customFeatures: z.array(z.string()),

  // Amenities
  buildingAmenities: z.array(z.string()),
  customAmenities: z.array(z.string()),

  // Security Features
  securityFeatures: z.array(z.string()),

  // Appliances & Fixtures
  appliances: z.array(z.string()),
  fixtures: z.array(z.string()),

  // Accessibility
  accessibilityFeatures: z.array(z.string()),

  // Pet Policy
  petsAllowed: z.boolean(),
  petTypes: z.array(z.string()),
  petDeposit: z.number().min(0).optional(),
  petRent: z.number().min(0).optional(),
  petRestrictions: z.string().optional(),

  // Rules & Policies
  smokingAllowed: z.boolean(),
  partiesAllowed: z.boolean(),
  musicPolicy: z.string().optional(),
  guestPolicy: z.string().optional(),

  // Special Features
  uniqueFeatures: z.string().optional(),
  recentUpgrades: z.string().optional(),

  // Target Tenant
  idealFor: z.array(z.string()),
  minimumAge: z.number().min(18).optional(),
  maximumOccupants: z.number().min(1).optional(),

  // Additional Notes
  additionalNotes: z.string().optional(),
});

type FeaturesFormData = z.infer<typeof featuresSchema>;

type FeaturesFormProps = {
  defaultValues?: Partial<FeaturesFormData>;
  onSubmit: (data: FeaturesFormData) => void;
  onNext: () => void;
  onPrevious: () => void;
  className?: string;
};

const propertyFeaturesOptions = [
  { id: "balcony", label: "Balcony", icon: Home },
  { id: "garden", label: "Garden", icon: Trees },
  { id: "terrace", label: "Terrace", icon: Home },
  { id: "fireplace", label: "Fireplace", icon: Home },
  { id: "walkin-closet", label: "Walk-in Closet", icon: Home },
  { id: "study-room", label: "Study Room", icon: Home },
  { id: "storage", label: "Storage Space", icon: Home },
  { id: "laundry-room", label: "Laundry Room", icon: Home },
  { id: "basement", label: "Basement", icon: Home },
  { id: "attic", label: "Attic", icon: Home },
  { id: "hardwood", label: "Hardwood Floors", icon: Home },
  { id: "tile", label: "Tile Floors", icon: Home },
  { id: "carpet", label: "Carpeted", icon: Home },
  { id: "high-ceilings", label: "High Ceilings", icon: Home },
  { id: "large-windows", label: "Large Windows", icon: Home },
  { id: "natural-light", label: "Abundant Natural Light", icon: Home },
];

const buildingAmenitiesOptions = [
  { id: "swimming-pool", label: "Swimming Pool", icon: Droplets },
  { id: "gym", label: "Fitness Center", icon: Dumbbell },
  { id: "parking", label: "Parking", icon: Car },
  { id: "elevator", label: "Elevator", icon: Building },
  { id: "generator", label: "Backup Generator", icon: Zap },
  { id: "water-backup", label: "Water Backup", icon: Droplets },
  { id: "cctv", label: "CCTV Surveillance", icon: Shield },
  { id: "security-guard", label: "24/7 Security", icon: Shield },
  { id: "concierge", label: "Concierge Service", icon: Users },
  { id: "rooftop", label: "Rooftop Access", icon: Building },
  { id: "community-room", label: "Community Room", icon: Users },
  { id: "business-center", label: "Business Center", icon: Building },
  { id: "conference-room", label: "Conference Room", icon: Building },
  { id: "playground", label: "Children's Playground", icon: Baby },
  { id: "garden-area", label: "Garden Area", icon: Trees },
  { id: "bbq-area", label: "BBQ Area", icon: Coffee },
];

const securityFeaturesOptions = [
  { id: "alarm-system", label: "Alarm System", icon: Shield },
  { id: "intercom", label: "Intercom System", icon: Shield },
  { id: "access-control", label: "Access Control", icon: Shield },
  { id: "security-cameras", label: "Security Cameras", icon: Shield },
  { id: "gated-community", label: "Gated Community", icon: Shield },
  { id: "doorman", label: "Doorman", icon: Shield },
  { id: "key-fob", label: "Key Fob Access", icon: Shield },
  { id: "secure-parking", label: "Secure Parking", icon: Shield },
];

const appliancesOptions = [
  { id: "refrigerator", label: "Refrigerator", icon: Home },
  { id: "stove", label: "Stove/Cooktop", icon: Home },
  { id: "oven", label: "Oven", icon: Home },
  { id: "microwave", label: "Microwave", icon: Home },
  { id: "dishwasher", label: "Dishwasher", icon: Home },
  { id: "washing-machine", label: "Washing Machine", icon: Home },
  { id: "dryer", label: "Dryer", icon: Home },
  { id: "ac", label: "Air Conditioning", icon: Wind },
  { id: "heater", label: "Heater", icon: Wind },
  { id: "water-heater", label: "Water Heater", icon: Droplets },
  { id: "tv", label: "Television", icon: Home },
  { id: "internet", label: "Internet/WiFi", icon: Wifi },
];

const accessibilityOptions = [
  { id: "wheelchair-accessible", label: "Wheelchair Accessible", icon: Heart },
  { id: "elevator-access", label: "Elevator Access", icon: Building },
  { id: "grab-bars", label: "Grab Bars", icon: Heart },
  { id: "wide-doorways", label: "Wide Doorways", icon: Heart },
  { id: "accessible-bathroom", label: "Accessible Bathroom", icon: Heart },
  { id: "ramp-access", label: "Ramp Access", icon: Heart },
  { id: "accessible-parking", label: "Accessible Parking", icon: Heart },
];

const petTypesOptions = [
  "Dogs",
  "Cats",
  "Birds",
  "Fish",
  "Small Pets (Rabbits, Guinea Pigs)",
  "Reptiles",
  "Other (Specify in restrictions)",
];

const idealForOptions = [
  "Professionals",
  "Students",
  "Families",
  "Couples",
  "Singles",
  "Senior Citizens",
  "Young Professionals",
  "Corporate Housing",
  "Short-term Stays",
  "Digital Nomads",
];

export function FeaturesForm({
  defaultValues,
  onSubmit,
  onNext,
  onPrevious,
  className,
}: FeaturesFormProps) {
  const [newCustomFeature, setNewCustomFeature] = useState("");
  const [newCustomAmenity, setNewCustomAmenity] = useState("");
  const [activeTab, setActiveTab] = useState("features");

  const form = useForm<FeaturesFormData>({
    resolver: zodResolver(featuresSchema),
    defaultValues: {
      propertyFeatures: [],
      customFeatures: [],
      buildingAmenities: [],
      customAmenities: [],
      securityFeatures: [],
      appliances: [],
      fixtures: [],
      accessibilityFeatures: [],
      petsAllowed: false,
      petTypes: [],
      smokingAllowed: false,
      partiesAllowed: false,
      idealFor: [],
      ...defaultValues,
    },
  });

  const watchedValues = form.watch();

  const handleSubmit = (data: FeaturesFormData) => {
    onSubmit(data);
    onNext();
  };

  const toggleArrayItem = (fieldName: keyof FeaturesFormData, item: string) => {
    const currentArray = form.getValues(fieldName) as string[];
    const updated = currentArray.includes(item)
      ? currentArray.filter((i) => i !== item)
      : [...currentArray, item];
    form.setValue(fieldName, updated as any);
  };

  const addCustomFeature = () => {
    if (newCustomFeature.trim()) {
      const current = form.getValues("customFeatures");
      form.setValue("customFeatures", [...current, newCustomFeature.trim()]);
      setNewCustomFeature("");
    }
  };

  const removeCustomFeature = (feature: string) => {
    const current = form.getValues("customFeatures");
    form.setValue(
      "customFeatures",
      current.filter((f) => f !== feature)
    );
  };

  const addCustomAmenity = () => {
    if (newCustomAmenity.trim()) {
      const current = form.getValues("customAmenities");
      form.setValue("customAmenities", [...current, newCustomAmenity.trim()]);
      setNewCustomAmenity("");
    }
  };

  const removeCustomAmenity = (amenity: string) => {
    const current = form.getValues("customAmenities");
    form.setValue(
      "customAmenities",
      current.filter((a) => a !== amenity)
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Property Features & Amenities
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Highlight what makes your property special and attractive to tenants
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <Tabs onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="features">Property Features</TabsTrigger>
                  <TabsTrigger value="amenities">
                    Building Amenities
                  </TabsTrigger>
                  <TabsTrigger value="policies">Policies & Rules</TabsTrigger>
                  <TabsTrigger value="tenant">Ideal Tenant</TabsTrigger>
                </TabsList>

                <TabsContent className="space-y-6" value="features">
                  {/* Property Features */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Property Features</h3>
                    <p className="text-gray-600 text-sm">
                      Select features that are part of the property itself
                    </p>

                    <FeatureGrid
                      fieldName="propertyFeatures"
                      options={propertyFeaturesOptions}
                      selectedItems={watchedValues.propertyFeatures}
                      toggleArrayItem={toggleArrayItem}
                    />

                    {/* Custom Features */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Custom Features</h4>
                      <div className="flex gap-2">
                        <Input
                          onChange={(e) => setNewCustomFeature(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && addCustomFeature()
                          }
                          placeholder="Add a custom feature..."
                          value={newCustomFeature}
                        />
                        <Button
                          onClick={addCustomFeature}
                          type="button"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {watchedValues.customFeatures.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {watchedValues.customFeatures.map(
                            (feature, index) => (
                              <Badge
                                className="flex items-center gap-1"
                                key={index.toString()}
                                variant="secondary"
                              >
                                {feature}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => removeCustomFeature(feature)}
                                />
                              </Badge>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appliances & Fixtures */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">
                      Appliances & Fixtures
                    </h3>
                    <p className="text-gray-600 text-sm">
                      What appliances and fixtures are included?
                    </p>

                    <FeatureGrid
                      fieldName="appliances"
                      options={appliancesOptions}
                      selectedItems={watchedValues.appliances}
                      toggleArrayItem={toggleArrayItem}
                    />
                  </div>

                  {/* Security Features */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Security Features</h3>

                    <FeatureGrid
                      fieldName="securityFeatures"
                      options={securityFeaturesOptions}
                      selectedItems={watchedValues.securityFeatures}
                      toggleArrayItem={toggleArrayItem}
                    />
                  </div>

                  {/* Accessibility */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">
                      Accessibility Features
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Features that make the property accessible to people with
                      disabilities
                    </p>

                    <FeatureGrid
                      fieldName="accessibilityFeatures"
                      options={accessibilityOptions}
                      selectedItems={watchedValues.accessibilityFeatures}
                      toggleArrayItem={toggleArrayItem}
                    />
                  </div>
                </TabsContent>

                <TabsContent className="space-y-6" value="amenities">
                  {/* Building Amenities */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Building Amenities</h3>
                    <p className="text-gray-600 text-sm">
                      Shared facilities and services available in the building
                      or complex
                    </p>

                    <FeatureGrid
                      fieldName="buildingAmenities"
                      options={buildingAmenitiesOptions}
                      selectedItems={watchedValues.buildingAmenities}
                      toggleArrayItem={toggleArrayItem}
                    />

                    {/* Custom Amenities */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Custom Amenities</h4>
                      <div className="flex gap-2">
                        <Input
                          onChange={(e) => setNewCustomAmenity(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && addCustomAmenity()
                          }
                          placeholder="Add a custom amenity..."
                          value={newCustomAmenity}
                        />
                        <Button
                          onClick={addCustomAmenity}
                          type="button"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {watchedValues.customAmenities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {watchedValues.customAmenities.map(
                            (amenity, index) => (
                              <Badge
                                className="flex items-center gap-1"
                                key={index.toString()}
                                variant="secondary"
                              >
                                {amenity}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => removeCustomAmenity(amenity)}
                                />
                              </Badge>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Features */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">
                      Special Features & Upgrades
                    </h3>

                    <FormField
                      control={form.control}
                      name="uniqueFeatures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unique Features</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe any unique or standout features of your property..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            What makes this property special or different from
                            others?
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recentUpgrades"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recent Upgrades & Renovations</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="List any recent improvements, renovations, or upgrades..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            New appliances, renovations, fresh paint, etc.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent className="space-y-6" value="policies">
                  {/* Pet Policy */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Pet Policy</h3>

                    <FormField
                      control={form.control}
                      name="petsAllowed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Pets Allowed</FormLabel>
                            <FormDescription>
                              Check if you allow pets in your property
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {watchedValues.petsAllowed && (
                      <div className="ml-6 space-y-4">
                        <div>
                          <FormLabel>Allowed Pet Types</FormLabel>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {petTypesOptions.map((petType) => (
                              <FormField
                                control={form.control}
                                key={petType}
                                name="petTypes"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value.includes(petType)}
                                        onCheckedChange={(checked) => {
                                          const updated = checked
                                            ? [...field.value, petType]
                                            : field.value.filter(
                                                (p) => p !== petType
                                              );
                                          field.onChange(updated);
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal text-sm">
                                      {petType}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="petDeposit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pet Deposit (KES)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="5000"
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
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="petRent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Pet Rent (KES)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="2000"
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
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="petRestrictions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pet Restrictions & Rules</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Size limits, breed restrictions, additional rules..."
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {/* Other Policies */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Property Rules</h3>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="smokingAllowed"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Smoking Allowed</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="partiesAllowed"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Parties/Events Allowed</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="musicPolicy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Music/Noise Policy</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Quiet hours, noise restrictions..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="guestPolicy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guest Policy</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Overnight guests, visitor parking..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent className="space-y-6" value="tenant">
                  {/* Ideal Tenant */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">
                      Ideal Tenant Profile
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Who is this property best suited for?
                    </p>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {idealForOptions.map((option) => (
                        <FormField
                          control={form.control}
                          key={option}
                          name="idealFor"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes(option)}
                                  onCheckedChange={(checked) => {
                                    const updated = checked
                                      ? [...field.value, option]
                                      : field.value.filter((i) => i !== option);
                                    field.onChange(updated);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">
                                {option}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tenant Requirements */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Tenant Requirements</h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="minimumAge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Age</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="18"
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseInt(e.target.value, 10) ||
                                      undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Minimum age for primary tenant
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maximumOccupants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Occupants</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="4"
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseInt(e.target.value, 10) ||
                                      undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum number of people allowed
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes & Requirements</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any other important information for potential tenants..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Special requirements, preferences, or additional
                          information
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {/* Form Actions */}
              <div className="flex justify-between">
                <Button
                  className="flex items-center gap-2"
                  onClick={onPrevious}
                  type="button"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Pricing
                </Button>

                <Button className="min-w-32" type="submit">
                  Continue to Media
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

const FeatureGrid = ({
  options,
  fieldName,
  selectedItems,
  toggleArrayItem,
}: {
  options: any[];
  fieldName: keyof FeaturesFormData;
  selectedItems: string[];
  toggleArrayItem: (fieldName: keyof FeaturesFormData, item: string) => void;
}) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
    {options.map((option) => {
      const isSelected = selectedItems.includes(option.id);
      return (
        <div
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
            isSelected
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
          key={option.id}
          onClick={() => toggleArrayItem(fieldName, option.id)}
        >
          <option.icon className="h-4 w-4" />
          <span className="font-medium text-sm">{option.label}</span>
        </div>
      );
    })}
  </div>
);
