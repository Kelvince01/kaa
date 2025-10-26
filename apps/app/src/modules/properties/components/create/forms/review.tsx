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
import { Progress } from "@kaa/ui/components/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  DollarSign,
  Edit,
  Eye,
  Home,
  Loader2,
  MapPin,
  Save,
  Send,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const reviewSchema = z.object({
  // Publishing options
  publishImmediately: z.boolean(),
  saveAsDraft: z.boolean(),
  schedulePublishing: z.boolean(),
  publishDate: z.date().optional(),

  // Visibility settings
  visibility: z.enum(["public", "private", "unlisted"]),
  featuredListing: z.boolean(),

  // Marketing preferences
  allowMarketingEmails: z.boolean(),
  shareOnSocialMedia: z.boolean(),
  includeSEOOptimization: z.boolean(),

  // Terms and agreements
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  marketingConsent: z.boolean(),
  dataProcessingConsent: z.boolean().refine((val) => val === true, {
    message: "You must consent to data processing",
  }),

  // Additional notes
  internalNotes: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

type ReviewFormProps = {
  propertyData: any; // Combined data from all previous steps
  onSubmit: (data: ReviewFormData) => void;
  onSaveDraft: (data: ReviewFormData) => void;
  onPrevious: () => void;
  onEdit: (stepIndex: number) => void;
  isSubmitting?: boolean;
  className?: string;
};

export function ReviewForm({
  propertyData,
  onSubmit,
  onSaveDraft,
  onPrevious,
  onEdit,
  isSubmitting = false,
  className,
}: ReviewFormProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [completionScore, setCompletionScore] = useState(85);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      publishImmediately: true,
      saveAsDraft: false,
      schedulePublishing: false,
      visibility: "public",
      featuredListing: false,
      allowMarketingEmails: true,
      shareOnSocialMedia: false,
      includeSEOOptimization: true,
      termsAccepted: false,
      marketingConsent: false,
      dataProcessingConsent: false,
    },
  });

  const watchedValues = form.watch();

  const handleSubmit = (data: ReviewFormData) => {
    if (data.saveAsDraft) {
      onSaveDraft(data);
    } else {
      onSubmit(data);
    }
  };

  const getCompletionItems = () => {
    const items = [
      {
        category: "Basic Info",
        completed: !!(
          propertyData.basicInfo?.title && propertyData.basicInfo?.description
        ),
        score: 15,
        issues: propertyData.basicInfo?.title ? [] : ["Missing property title"],
      },
      {
        category: "Details",
        completed: !!(
          propertyData.details?.bedrooms >= 0 &&
          propertyData.details?.bathrooms >= 0
        ),
        score: 15,
        issues: [],
      },
      {
        category: "Location",
        completed: !!(
          propertyData.location?.addressLine1 && propertyData.location?.city
        ),
        score: 20,
        issues: propertyData.location?.addressLine1
          ? []
          : ["Missing address information"],
      },
      {
        category: "Pricing",
        completed: !!(propertyData.pricing?.rentAmount > 0),
        score: 20,
        issues:
          propertyData.pricing?.rentAmount > 0 ? [] : ["Missing rent amount"],
      },
      {
        category: "Features",
        completed: true, // Features are optional
        score: 10,
        issues: [],
      },
      {
        category: "Media",
        completed: !!(propertyData.media?.photos?.length > 0),
        score: 15,
        issues:
          propertyData.media?.photos?.length > 0
            ? []
            : ["Need at least one photo"],
      },
      {
        category: "Availability",
        completed: !!(
          propertyData.availability?.availableFrom &&
          propertyData.availability?.showingContact?.name
        ),
        score: 5,
        issues: [],
      },
    ];

    const totalScore = items.reduce(
      (sum, item) => sum + (item.completed ? item.score : 0),
      0
    );
    const allIssues = items.flatMap((item) => item.issues);

    return { items, totalScore, allIssues };
  };

  const {
    items: completionItems,
    totalScore,
    allIssues,
  } = getCompletionItems();

  const formatCurrency = (amount: number, currency = "KES") => {
    const symbol = currency === "USD" ? "$" : "KES";
    return `${symbol}${amount.toLocaleString()}`;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Completion Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listing Completion</span>
            <Badge
              variant={
                totalScore >= 80
                  ? "default"
                  : totalScore >= 60
                    ? "secondary"
                    : "destructive"
              }
            >
              {totalScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress className="mb-4" value={totalScore} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {completionItems.map((item, index) => (
              <div
                className="flex items-center justify-between rounded-lg border p-3"
                key={item.category}
              >
                <div className="flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">{item.score}%</span>
                  <Button
                    onClick={() => onEdit(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {allIssues.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <h4 className="mb-2 font-medium text-red-800">
                Issues to Address:
              </h4>
              <ul className="space-y-1 text-red-700 text-sm">
                {allIssues.map((issue, index) => (
                  <li key={index.toString()}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Property Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">
              {propertyData.basicInfo?.title || "Untitled Property"}
            </h3>
            <p className="mt-1 text-gray-600">
              {propertyData.basicInfo?.description?.substring(0, 200)}
              {propertyData.basicInfo?.description?.length > 200 ? "..." : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                {propertyData.details?.bedrooms || 0} bed,{" "}
                {propertyData.details?.bathrooms || 0} bath
              </span>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-sm">
                {propertyData.pricing?.rentAmount
                  ? formatCurrency(
                      propertyData.pricing.rentAmount,
                      propertyData.pricing.currency
                    )
                  : "Price TBD"}
                {propertyData.pricing?.paymentFrequency &&
                  ` /${propertyData.pricing.paymentFrequency}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                {propertyData.location?.city || "Location TBD"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                {propertyData.media?.photos?.length || 0} photos
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {propertyData.features?.propertyFeatures
              ?.slice(0, 5)
              .map((feature: string) => (
                <Badge key={feature} variant="outline">
                  {feature}
                </Badge>
              ))}
            {(propertyData.features?.propertyFeatures?.length || 0) > 5 && (
              <Badge variant="outline">
                +{(propertyData.features?.propertyFeatures?.length || 0) - 5}{" "}
                more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>How Your Listing Will Appear</CardTitle>
          <p className="text-gray-600 text-sm">
            This is a preview of how tenants will see your property listing
          </p>
        </CardHeader>
        <CardContent>
          {/* Mock listing preview */}
          <div className="overflow-hidden rounded-lg border">
            {/* Main image placeholder */}
            <div className="flex aspect-video items-center justify-center bg-gray-200">
              {propertyData.media?.photos?.length > 0 ? (
                <Image
                  alt="Property"
                  className="h-full w-full object-cover"
                  fill
                  src={propertyData.media.photos[0].url}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <Camera className="mx-auto mb-2 h-12 w-12" />
                  <p>No photos uploaded</p>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-lg">
                  {propertyData.basicInfo?.title}
                </h3>
                <div className="font-bold text-lg text-primary">
                  {propertyData.pricing?.rentAmount
                    ? formatCurrency(
                        propertyData.pricing.rentAmount,
                        propertyData.pricing.currency
                      )
                    : "Price TBD"}
                  <span className="font-normal text-gray-500 text-sm">
                    /{propertyData.pricing?.paymentFrequency || "month"}
                  </span>
                </div>
              </div>

              <p className="mb-3 text-gray-600 text-sm">
                {propertyData.location?.addressLine1},{" "}
                {propertyData.location?.city}
              </p>

              <div className="mb-3 flex gap-4 text-gray-500 text-sm">
                <span>{propertyData.details?.bedrooms || 0} bedrooms</span>
                <span>{propertyData.details?.bathrooms || 0} bathrooms</span>
                {propertyData.details?.size && (
                  <span>
                    {propertyData.details.size} {propertyData.details.sizeUnit}
                  </span>
                )}
              </div>

              <p className="line-clamp-3 text-gray-700 text-sm">
                {propertyData.basicInfo?.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <Button size="sm">View Details</Button>
                  <Button size="sm" variant="outline">
                    Schedule Viewing
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Eye className="h-3 w-3" />
                  <span>Listed {format(new Date(), "MMM d")}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Review & Publish
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Review your property listing and publish when ready
          </p>
        </CardHeader>

        <CardContent>
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-6" value="overview">
              {renderOverview()}
            </TabsContent>

            <TabsContent className="mt-6" value="preview">
              {renderPreview()}
            </TabsContent>

            <TabsContent className="mt-6" value="publish">
              <Form {...form}>
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit(handleSubmit)}
                >
                  {/* Publishing Options */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Publishing Options</h3>

                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="publishImmediately"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                checked={field.value}
                                className="mt-1"
                                onChange={() => {
                                  form.setValue("publishImmediately", true);
                                  form.setValue("saveAsDraft", false);
                                  form.setValue("schedulePublishing", false);
                                }}
                                type="radio"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Publish immediately</FormLabel>
                              <FormDescription>
                                Your listing will be live and searchable right
                                away
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="saveAsDraft"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                checked={field.value}
                                className="mt-1"
                                onChange={() => {
                                  form.setValue("publishImmediately", false);
                                  form.setValue("saveAsDraft", true);
                                  form.setValue("schedulePublishing", false);
                                }}
                                type="radio"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Save as draft</FormLabel>
                              <FormDescription>
                                Save your progress and publish later
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="schedulePublishing"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                checked={field.value}
                                className="mt-1"
                                onChange={() => {
                                  form.setValue("publishImmediately", false);
                                  form.setValue("saveAsDraft", false);
                                  form.setValue("schedulePublishing", true);
                                }}
                                type="radio"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Schedule publishing</FormLabel>
                              <FormDescription>
                                Choose when your listing goes live
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Marketing Options */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">
                      Marketing & Visibility
                    </h3>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="featuredListing"
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
                              <FormLabel>Feature this listing</FormLabel>
                              <FormDescription>
                                Get more visibility with premium placement
                                (additional fees may apply)
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shareOnSocialMedia"
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
                              <FormLabel>Share on social media</FormLabel>
                              <FormDescription>
                                Automatically post to connected social accounts
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="includeSEOOptimization"
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
                              <FormLabel>Include SEO optimization</FormLabel>
                              <FormDescription>
                                Optimize for search engines to improve
                                discoverability
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Terms and Agreements */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Terms & Agreements</h3>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="termsAccepted"
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
                              <FormLabel>
                                I accept the terms and conditions *
                              </FormLabel>
                              <FormDescription>
                                <a
                                  className="text-primary hover:underline"
                                  href="/terms"
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Read our terms and conditions
                                </a>
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dataProcessingConsent"
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
                              <FormLabel>
                                I consent to data processing *
                              </FormLabel>
                              <FormDescription>
                                <a
                                  className="text-primary hover:underline"
                                  href="/privacy"
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  Read our privacy policy
                                </a>
                              </FormDescription>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="marketingConsent"
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
                              <FormLabel>
                                I agree to receive marketing communications
                              </FormLabel>
                              <FormDescription>
                                Get updates about our platform and property
                                management tips
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <FormField
                    control={form.control}
                    name="internalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any internal notes or reminders (not visible to tenants)..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          These notes are for your reference only
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Action Buttons */}
                  <div className="flex justify-between border-t pt-6">
                    <Button
                      className="flex items-center gap-2"
                      disabled={isSubmitting}
                      onClick={onPrevious}
                      type="button"
                      variant="outline"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Availability
                    </Button>

                    <div className="flex gap-3">
                      <Button
                        disabled={isSubmitting}
                        onClick={() => form.setValue("saveAsDraft", true)}
                        type="submit"
                        variant="outline"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                      </Button>

                      <Button
                        disabled={
                          isSubmitting ||
                          !form.formState.isValid ||
                          totalScore < 60
                        }
                        onClick={() => form.setValue("saveAsDraft", false)}
                        type="submit"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Publish Listing
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
