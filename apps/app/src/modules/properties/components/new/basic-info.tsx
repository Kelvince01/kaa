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
import { Progress } from "@kaa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { Building2, FileText, Sparkles, Tag, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UseFormProps } from "react-hook-form";
import { sheet } from "@/components/common/sheeter/state";
import { useStepper } from "@/components/common/stepper";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import useHideElementsById from "@/hooks/use-hide-elements-by-id";
import type { Property } from "@/modules/properties/property.type";
import { AIDescriptionGenerator } from "../ai-description-generator";
import { type PropertyFormData, propertyFormSchema } from "./schema";

type BasicInfoFormProps = {
  property: Property;
  sheet?: boolean;
  callback?: (property: Property) => void;
  hiddenFields?: string[];
  children?: React.ReactNode;
};

export const BasicInfoForm = ({
  property,
  sheet: isSheet,
  callback,
  hiddenFields,
  children,
}: BasicInfoFormProps) => {
  const t = useTranslations();
  const { nextStep } = useStepper();
  const [showTemplates, setShowTemplates] = useState(false);

  const isPending = false;

  // Memoize initial form values to prevent unnecessary re-renders
  const initialFormValues: PropertyFormData["basic"] = useMemo(
    () =>
      property
        ? {
            title: property.title,
            description: property.description,
            type: property.type,
            listingType: property.listingType ?? ("rent" as any),
          }
        : {
            title: "",
            description: "",
            type: "",
            listingType: "rent" as any,
          },
    [property]
  );

  // Hide fields if requested
  if (hiddenFields) {
    const fieldIds = hiddenFields.map(
      (field) => `${field}-form-item-container`
    );
    // biome-ignore lint/correctness/useHookAtTopLevel: we need to call this hook conditionally
    useHideElementsById(fieldIds);
  }

  const formOptions: UseFormProps<PropertyFormData["basic"]> = useMemo(
    () => ({
      resolver: zodResolver(propertyFormSchema.shape.basic),
      defaultValues: initialFormValues,
    }),
    [initialFormValues]
  );

  const sheetTitleUpdate = () => {
    const targetSheet = sheet.get("new-property");
    // Check if the title's type is a function (React component) and not a string
    if (
      !targetSheet ||
      (isValidElement(targetSheet.title) &&
        targetSheet.title.type === UnsavedBadge)
    )
      return;

    sheet.update("new-property", {
      title: <UnsavedBadge title={targetSheet?.title} />,
    });
  };

  const form = useFormWithDraft<PropertyFormData["basic"]>(
    "property-basic-info",
    {
      formOptions,
      onUnsavedChanges: () => console.info("Unsaved changes detected!"),
    }
  );
  const watchedValues = form.watch();

  // Smart suggestions and AI assistance state
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [descriptionTemplates, setDescriptionTemplates] = useState<string[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Calculate title quality score
  const titleQualityScore = useMemo(() => {
    const title = watchedValues.title || "";
    let score = 0;
    const factors: string[] = [];

    // Length check (20-80 characters is optimal)
    if (title.length >= 20 && title.length <= 80) {
      score += 25;
      factors.push("Good length");
    } else if (title.length > 0) {
      score += 10;
      factors.push(title.length < 20 ? "Too short" : "Too long");
    }

    // Keywords check
    const keywords = [
      "bedroom",
      "BR",
      "apartment",
      "house",
      "modern",
      "spacious",
      "furnished",
      "view",
    ];
    const hasKeywords = keywords.some((keyword) =>
      title.toLowerCase().includes(keyword.toLowerCase())
    );
    if (hasKeywords) {
      score += 25;
      factors.push("Contains keywords");
    }

    // Location mention
    const locations = ["Westlands", "Karen", "Kilimani", "Nairobi", "CBD"];
    const hasLocation = locations.some((loc) =>
      title.toLowerCase().includes(loc.toLowerCase())
    );
    if (hasLocation) {
      score += 25;
      factors.push("Includes location");
    }

    // Descriptive words
    const descriptiveWords = [
      "modern",
      "luxury",
      "cozy",
      "spacious",
      "bright",
      "stunning",
    ];
    const hasDescriptive = descriptiveWords.some((word) =>
      title.toLowerCase().includes(word.toLowerCase())
    );
    if (hasDescriptive) {
      score += 25;
      factors.push("Descriptive language");
    }

    return { score, factors };
  }, [watchedValues.title]);

  // Generate smart title suggestions based on property type
  const generateTitleSuggestions = useCallback(() => {
    const propertyType = watchedValues.type;
    if (!propertyType) return;

    const suggestions = {
      apartment: [
        "Modern 2BR Apartment with City View",
        "Spacious Apartment in Prime Location",
        "Luxury Furnished Apartment with Balcony",
      ],
      house: [
        "Beautiful Family House with Garden",
        "Spacious 3BR House in Quiet Neighborhood",
        "Modern House with Parking and Security",
      ],
      studio: [
        "Cozy Studio Apartment - Perfect for Young Professionals",
        "Modern Studio with All Amenities",
        "Bright Studio in Central Location",
      ],
      office: [
        "Professional Office Space in Business District",
        "Modern Office with Conference Room",
        "Prime Office Location with Parking",
      ],
    };

    setTitleSuggestions(
      suggestions[propertyType as keyof typeof suggestions] || []
    );
  }, [watchedValues.type]);

  // Generate description templates
  const generateDescriptionTemplates = useCallback(() => {
    const propertyType = watchedValues.type;
    if (!propertyType) return;

    const templates = {
      apartment: [
        "This modern apartment features spacious rooms, contemporary finishes, and excellent natural light. Located in a secure building with 24/7 security, parking, and easy access to shopping centers and public transport.",
        "Beautifully designed apartment offering comfort and convenience. The property includes modern appliances, ample storage space, and is situated in a vibrant neighborhood with great amenities nearby.",
      ],
      house: [
        "This charming family house offers generous living spaces, a well-maintained garden, and a secure compound. Perfect for families looking for a peaceful environment while staying connected to the city.",
        "Spacious house with modern amenities, including a fitted kitchen, multiple bedrooms, and outdoor space. Located in a family-friendly neighborhood with good schools and healthcare facilities nearby.",
      ],
    };

    setDescriptionTemplates(
      templates[propertyType as keyof typeof templates] || []
    );
  }, [watchedValues.type]);

  // Generate suggestions when property type changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: functions are stable via useCallback with correct deps
  useEffect(() => {
    if (watchedValues.type) {
      generateTitleSuggestions();
      generateDescriptionTemplates();
    }
  }, [watchedValues.type]);

  // Prevent data loss
  useBeforeUnload({
    when: form.formState.isDirty,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  const onSubmit = (data: PropertyFormData["basic"]) => {
    console.log(data);

    if (isSheet) sheet.remove("new-property");
    nextStep?.();
    callback?.(property);
  };

  const handleAIDescriptionGenerated = (description: string) => {
    form.setValue("description", description);
  };

  return (
    <div>
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {!isSheet && form.unsavedChanges && <UnsavedBadge />}

          {/* Property Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="font-semibold text-base">
                    Property Title *
                  </FormLabel>
                  {field.value?.length > 5 && (
                    <div className="flex items-center gap-2">
                      <Progress
                        className="h-2 w-16"
                        value={titleQualityScore.score}
                      />
                      <span
                        className={`font-medium text-xs ${
                          titleQualityScore.score >= 75
                            ? "text-green-600"
                            : titleQualityScore.score >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {titleQualityScore.score}%
                      </span>
                    </div>
                  )}
                </div>
                <FormDescription>
                  Create an attractive title that highlights your property's
                  best features
                </FormDescription>
                <FormControl>
                  <Input
                    className="text-lg"
                    placeholder="e.g., Modern 2BR Apartment with City View in Westlands"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // analytics.trackFieldInteraction("title");
                    }}
                  />
                </FormControl>
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>{field.value?.length || 0}/100 characters</span>
                  {field.value?.length > 0 && field.value.length < 20 && (
                    <span className="text-yellow-600">
                      Consider adding more details
                    </span>
                  )}
                </div>

                {/* Title Quality Factors */}
                {field.value?.length > 5 &&
                  titleQualityScore.factors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {titleQualityScore.factors.map((factor) => (
                        <Badge
                          className="text-xs"
                          key={factor}
                          variant={
                            factor.includes("Too") ? "destructive" : "secondary"
                          }
                        >
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  )}

                {/* Title Suggestions */}
                {titleSuggestions.length > 0 && (
                  <div className="mt-3">
                    <Button
                      className="h-8 text-xs"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Wand2 className="mr-1 h-3 w-3" />
                      Suggested Titles
                    </Button>
                    {showSuggestions && (
                      <div className="mt-2 space-y-1">
                        {titleSuggestions.map((suggestion) => (
                          <Button
                            className="h-auto w-full justify-start p-2 text-left text-xs"
                            key={suggestion}
                            onClick={() => {
                              field.onChange(suggestion);
                              setShowSuggestions(false);
                            }}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <FormMessage />
              </FormItem>
            )}
          />

          {/* Property Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 font-semibold text-base">
                    <FileText className="h-4 w-4" />
                    Property Description *
                  </FormLabel>
                  <FormDescription>
                    Provide a detailed description of your property, including
                    unique features and nearby amenities
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      className="min-h-[120px] resize-none"
                      placeholder="Describe your property in detail. Include information about the layout, condition, unique features, nearby amenities, and what makes it special..."
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // analytics.trackFieldInteraction("description");
                      }}
                    />
                  </FormControl>
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>{field.value?.length || 0}/1000 characters</span>
                    {field.value?.length > 0 && field.value.length < 100 && (
                      <span className="text-yellow-600">
                        Add more details for better visibility
                      </span>
                    )}
                  </div>

                  {/* Description Templates */}
                  {descriptionTemplates.length > 0 && (
                    <div className="mt-3">
                      <Button
                        className="h-8 text-xs"
                        onClick={() => setShowTemplates(!showTemplates)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Sparkles className="mr-1 h-3 w-3" />
                        Description Templates
                      </Button>
                      {showTemplates && (
                        <div className="mt-2 space-y-2">
                          {descriptionTemplates.map((template, index) => (
                            <div className="relative" key={index.toString()}>
                              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs">
                                {template}
                              </div>
                              <Button
                                className="absolute top-2 right-2 h-6 px-2 text-xs"
                                onClick={() => {
                                  field.onChange(template);
                                  setShowTemplates(false);
                                }}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Use This
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Description Generator Integration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">
                        Property Description
                      </h3>
                      <Button
                        onClick={() => setShowTemplates(!showTemplates)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {showTemplates
                          ? "Hide AI Generator"
                          : "Use AI Generator"}
                      </Button>
                    </div>

                    {showTemplates ? (
                      <AIDescriptionGenerator
                        onDescriptionGenerated={handleAIDescriptionGenerated}
                        propertyData={form.getValues() as Partial<Property>}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                className="min-h-[120px]"
                                placeholder="Describe your property..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 font-semibold text-base">
                    <Building2 className="h-4 w-4" />
                    Property Type
                  </FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="flat">🏢 Flat</SelectItem>
                      <SelectItem value="office">🏢 Office</SelectItem>
                      <SelectItem value="apartment">🏢 Apartment</SelectItem>
                      <SelectItem value="house">🏠 House</SelectItem>
                      <SelectItem value="villa">🏡 Villa</SelectItem>
                      <SelectItem value="studio">🏠 Studio</SelectItem>
                      <SelectItem value="commercial">🏢 Commercial</SelectItem>
                      <SelectItem value="land">🌍 Land</SelectItem>
                      <SelectItem value="other">🏠 Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="listingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 font-semibold text-base">
                    <Tag className="h-4 w-4" />
                    Listing Type *
                  </FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rent">🏠 For Rent</SelectItem>
                      <SelectItem value="sale">💰 For Sale</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Preview Card */}
          {(watchedValues.title || watchedValues.description) && (
            <Card className="border-blue-200 bg-linear-to-r from-gray-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {watchedValues.title ||
                        "Your property title will appear here"}
                    </h3>
                    <div className="flex gap-1">
                      <Badge className="capitalize" variant="secondary">
                        {watchedValues.type}
                      </Badge>
                      <Badge variant="outline">
                        For {watchedValues.listingType}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {watchedValues.description ||
                      "Your property description will appear here..."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-800">
                💡 Tips for Better Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  Use descriptive words like "spacious", "modern", "well-lit" in
                  your title
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  Mention the neighborhood or nearby landmarks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  Include unique features like "balcony", "parking", "furnished"
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600">•</span>
                  Properties with detailed descriptions get 40% more inquiries
                </li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row">
            {children}
            <SubmitButton
              disabled={
                !(hiddenFields?.length || form.formState.isDirty) ||
                Object.keys(form.formState.errors).length > 0
              }
              loading={isPending}
            >
              {t(
                `common.${hiddenFields?.length ? "continue" : "save_changes"}`
              )}
            </SubmitButton>
            {!children && (
              <Button
                className={form.formState.isDirty ? "" : "invisible"}
                onClick={() => form.reset()}
                type="reset"
                variant="secondary"
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};
