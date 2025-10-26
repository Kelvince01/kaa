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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { cn } from "@kaa/ui/lib/utils";
import {
  ArrowLeft,
  Camera,
  Download,
  ExternalLink,
  FileImage,
  Globe,
  Link,
  MapIcon,
  Play,
  Video,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { EnhancedMediaManager } from "../components/enhanced-media-manager";

const mediaSchema = z.object({
  // Photos
  photos: z
    .array(
      z
        .object({
          id: z.string().optional(),
          url: z.url().optional(),
          caption: z.string().optional(),
          isPrimary: z.boolean().optional(),
          tags: z.array(z.string()).optional(),
          quality: z.enum(["excellent", "good", "fair", "poor"]).optional(),
        })
        .optional()
    )
    .optional(),
  // .min(1, "At least one photo is required"),

  // Videos
  videos: z
    .array(
      z.object({
        id: z.string(),
        url: z.url(),
        title: z.string().optional(),
        description: z.string().optional(),
        thumbnail: z.string().optional(),
        duration: z.number().optional(),
        type: z.enum(["property_tour", "neighborhood", "amenities", "other"]),
      })
    )
    .optional(),

  // Virtual Tours
  virtualTourUrl: z.url().optional(),
  virtualTourType: z
    .enum(["360", "3d_walkthrough", "video_tour", "interactive"])
    .optional(),
  virtualTourProvider: z.string().optional(),

  // Floor Plans
  floorPlans: z
    .array(
      z.object({
        id: z.string(),
        url: z.url(),
        title: z.string().optional(),
        floor: z.string().optional(), // e.g., "Ground Floor", "1st Floor"
        type: z.enum(["layout", "dimension", "furnished", "unfurnished"]),
      })
    )
    .optional(),

  // Documents
  documents: z
    .array(
      z.object({
        id: z.string(),
        url: z.url(),
        title: z.string(),
        type: z.enum(["brochure", "lease", "rules", "amenities", "other"]),
        description: z.string().optional(),
      })
    )
    .optional(),

  // External Links
  externalLinks: z
    .array(
      z.object({
        title: z.string(),
        url: z.url(),
        type: z.enum(["website", "social", "listing", "review", "other"]),
        description: z.string().optional(),
      })
    )
    .optional(),

  // SEO & Social
  socialMediaUrls: z
    .object({
      facebook: z.url().optional(),
      instagram: z.url().optional(),
      twitter: z.url().optional(),
      youtube: z.url().optional(),
      tiktok: z.url().optional(),
    })
    .optional(),

  // Media Settings
  allowDownloads: z.boolean(),
  watermarkImages: z.boolean(),
  showContactInfo: z.boolean(),

  // Analytics
  trackViews: z.boolean(),
  allowSharing: z.boolean(),
});

type MediaFormData = z.infer<typeof mediaSchema>;

type MediaFormProps = {
  defaultValues?: Partial<MediaFormData>;
  onSubmit: (data: MediaFormData) => void;
  onNext: () => void;
  onPrevious: () => void;
  className?: string;
};

const virtualTourTypes = [
  {
    value: "360",
    label: "360° Photos",
    description: "Interactive 360-degree photos",
  },
  {
    value: "3d_walkthrough",
    label: "3D Walkthrough",
    description: "Full 3D virtual tour",
  },
  {
    value: "video_tour",
    label: "Video Tour",
    description: "Guided video walkthrough",
  },
  {
    value: "interactive",
    label: "Interactive Tour",
    description: "Interactive floor plan",
  },
];

const videoTypes = [
  { value: "property_tour", label: "Property Tour" },
  { value: "neighborhood", label: "Neighborhood Tour" },
  { value: "amenities", label: "Amenities Showcase" },
  { value: "other", label: "Other" },
];

const documentTypes = [
  { value: "brochure", label: "Property Brochure" },
  { value: "lease", label: "Lease Agreement" },
  { value: "rules", label: "Building Rules" },
  { value: "amenities", label: "Amenities Guide" },
  { value: "other", label: "Other" },
];

const linkTypes = [
  { value: "website", label: "Property Website" },
  { value: "social", label: "Social Media" },
  { value: "listing", label: "Other Listing" },
  { value: "review", label: "Reviews" },
  { value: "other", label: "Other" },
];

export function MediaForm({
  defaultValues,
  onSubmit,
  onNext,
  onPrevious,
  className,
}: MediaFormProps) {
  const [activeTab, setActiveTab] = useState("photos");
  const [newVideo, setNewVideo] = useState({
    url: "",
    title: "",
    type: "property_tour",
  });
  const [newDocument, setNewDocument] = useState({
    url: "",
    title: "",
    type: "brochure",
  });
  const [newLink, setNewLink] = useState({
    url: "",
    title: "",
    type: "website",
  });

  const form = useForm<MediaFormData>({
    resolver: zodResolver(mediaSchema),
    defaultValues: {
      photos: [
        {
          id: "1",
          url: "https://ssl.cdn-redfin.com/photo/rent/124d0781-6aff-49f4-b8c6-5e64e5ec47a1/bigphoto/0_2.jpg",
          caption: "Photo 1",
          isPrimary: true,
          tags: ["photo"],
          quality: "excellent",
        },
      ],
      videos: [],
      floorPlans: [],
      documents: [],
      externalLinks: [],
      allowDownloads: false,
      watermarkImages: true,
      showContactInfo: true,
      trackViews: true,
      allowSharing: true,
      ...defaultValues,
    },
  });

  const watchedValues = form.watch();

  const handleSubmit = (data: MediaFormData) => {
    onSubmit(data);
    onNext();
  };

  const addVideo = () => {
    if (newVideo.url && newVideo.title) {
      const video = {
        id: `video-${Date.now()}`,
        url: newVideo.url,
        title: newVideo.title,
        type: newVideo.type as any,
      };

      const currentVideos = form.getValues("videos") || [];
      form.setValue("videos", [...currentVideos, video]);
      setNewVideo({ url: "", title: "", type: "property_tour" });
    }
  };

  const removeVideo = (id: string) => {
    const currentVideos = form.getValues("videos") || [];
    form.setValue(
      "videos",
      currentVideos.filter((v) => v.id !== id)
    );
  };

  const addDocument = () => {
    if (newDocument.url && newDocument.title) {
      const document = {
        id: `doc-${Date.now()}`,
        url: newDocument.url,
        title: newDocument.title,
        type: newDocument.type as any,
      };

      const currentDocs = form.getValues("documents") || [];
      form.setValue("documents", [...currentDocs, document]);
      setNewDocument({ url: "", title: "", type: "brochure" });
    }
  };

  const removeDocument = (id: string) => {
    const currentDocs = form.getValues("documents") || [];
    form.setValue(
      "documents",
      currentDocs.filter((d) => d.id !== id)
    );
  };

  const addLink = () => {
    if (newLink.url && newLink.title) {
      const link = {
        title: newLink.title,
        url: newLink.url,
        type: newLink.type as any,
      };

      const currentLinks = form.getValues("externalLinks") || [];
      form.setValue("externalLinks", [...currentLinks, link]);
      setNewLink({ url: "", title: "", type: "website" });
    }
  };

  const removeLink = (index: number) => {
    const currentLinks = form.getValues("externalLinks") || [];
    form.setValue(
      "externalLinks",
      currentLinks.filter((_, i) => i !== index)
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Media & Virtual Content
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Upload photos, videos, and virtual tours to showcase your property
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
                  <TabsTrigger value="photos">Photos & Images</TabsTrigger>
                  <TabsTrigger value="videos">Videos & Tours</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent className="space-y-6" value="photos">
                  {/* Photo Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Property Photos</h3>
                      <Badge variant="outline">
                        {watchedValues.photos?.length || 0} photo
                        {watchedValues.photos?.length !== 1 ? "s" : ""} uploaded
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Upload high-quality photos of your property. The first
                      photo will be used as the main listing image.
                    </p>

                    <EnhancedMediaManager
                      acceptedTypes={["image/*"]}
                      items={
                        watchedValues.photos?.map((photo) => ({
                          ...photo,
                          id: photo?.id as string,
                          type: "image",
                          isPrimary: photo?.isPrimary as boolean,
                          url: photo?.url as string,
                        })) || []
                      }
                      maxFiles={50}
                      onChange={(photos) =>
                        form.setValue(
                          "photos",
                          photos.map((photo) => ({
                            ...photo,
                            isPrimary: photo.isPrimary as boolean,
                          }))
                        )
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent className="space-y-6" value="videos">
                  {/* Videos */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-medium text-lg">
                      <Video className="h-4 w-4" />
                      Property Videos
                    </h3>

                    <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-4">
                      <Input
                        onChange={(e) =>
                          setNewVideo({ ...newVideo, url: e.target.value })
                        }
                        placeholder="Video URL"
                        value={newVideo.url}
                      />
                      <Input
                        onChange={(e) =>
                          setNewVideo({ ...newVideo, title: e.target.value })
                        }
                        placeholder="Video title"
                        value={newVideo.title}
                      />
                      <select
                        className="rounded-md border px-3 py-2"
                        onChange={(e) =>
                          setNewVideo({ ...newVideo, type: e.target.value })
                        }
                        value={newVideo.type}
                      >
                        {videoTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        disabled={!(newVideo.url && newVideo.title)}
                        onClick={addVideo}
                        type="button"
                      >
                        Add Video
                      </Button>
                    </div>

                    {watchedValues.videos &&
                      watchedValues.videos.length > 0 && (
                        <div className="space-y-3">
                          {watchedValues.videos.map((video) => (
                            <div
                              className="flex items-center justify-between rounded-lg border p-3"
                              key={video.id}
                            >
                              <div className="flex items-center gap-3">
                                <Play className="h-5 w-5 text-gray-400" />
                                <div>
                                  <div className="font-medium">
                                    {video.title}
                                  </div>
                                  <div className="text-gray-500 text-sm">
                                    {
                                      videoTypes.find(
                                        (t) => t.value === video.type
                                      )?.label
                                    }
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() =>
                                    window.open(video.url, "_blank")
                                  }
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => removeVideo(video.id)}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Virtual Tours */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-medium text-lg">
                      <Globe className="h-4 w-4" />
                      Virtual Tours
                    </h3>

                    <FormField
                      control={form.control}
                      name="virtualTourUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Virtual Tour URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Link to your virtual tour (Matterport, Zillow 3D,
                            etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedValues.virtualTourUrl && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="virtualTourType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tour Type</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="w-full rounded-md border px-3 py-2"
                                >
                                  <option value="">Select type...</option>
                                  {virtualTourTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="virtualTourProvider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provider</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Matterport, Zillow"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {/* Floor Plans */}
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-medium text-lg">
                      <MapIcon className="h-4 w-4" />
                      Floor Plans
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Upload floor plan images to help tenants understand the
                      layout
                    </p>

                    {/* Floor plan upload would go here - simplified for now */}
                    <div className="rounded-lg border-2 border-gray-300 border-dashed p-8 text-center">
                      <FileImage className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <p className="text-gray-500">
                        Floor plan upload functionality would be implemented
                        here
                      </p>
                      <p className="mt-2 text-gray-400 text-sm">
                        Similar to the photo upload but specifically for floor
                        plans
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent className="space-y-6" value="documents">
                  {/* Documents */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Property Documents</h3>

                    <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-4">
                      <Input
                        onChange={(e) =>
                          setNewDocument({
                            ...newDocument,
                            url: e.target.value,
                          })
                        }
                        placeholder="Document URL"
                        value={newDocument.url}
                      />
                      <Input
                        onChange={(e) =>
                          setNewDocument({
                            ...newDocument,
                            title: e.target.value,
                          })
                        }
                        placeholder="Document title"
                        value={newDocument.title}
                      />
                      <select
                        className="rounded-md border px-3 py-2"
                        onChange={(e) =>
                          setNewDocument({
                            ...newDocument,
                            type: e.target.value,
                          })
                        }
                        value={newDocument.type}
                      >
                        {documentTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        disabled={!(newDocument.url && newDocument.title)}
                        onClick={addDocument}
                        type="button"
                      >
                        Add Document
                      </Button>
                    </div>

                    {watchedValues.documents &&
                      watchedValues.documents.length > 0 && (
                        <div className="space-y-3">
                          {watchedValues.documents.map((doc) => (
                            <div
                              className="flex items-center justify-between rounded-lg border p-3"
                              key={doc.id}
                            >
                              <div className="flex items-center gap-3">
                                <FileImage className="h-5 w-5 text-gray-400" />
                                <div>
                                  <div className="font-medium">{doc.title}</div>
                                  <div className="text-gray-500 text-sm">
                                    {
                                      documentTypes.find(
                                        (t) => t.value === doc.type
                                      )?.label
                                    }
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => window.open(doc.url, "_blank")}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => removeDocument(doc.id)}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* External Links */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">External Links</h3>

                    <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-4">
                      <Input
                        onChange={(e) =>
                          setNewLink({ ...newLink, url: e.target.value })
                        }
                        placeholder="Link URL"
                        value={newLink.url}
                      />
                      <Input
                        onChange={(e) =>
                          setNewLink({ ...newLink, title: e.target.value })
                        }
                        placeholder="Link title"
                        value={newLink.title}
                      />
                      <select
                        className="rounded-md border px-3 py-2"
                        onChange={(e) =>
                          setNewLink({ ...newLink, type: e.target.value })
                        }
                        value={newLink.type}
                      >
                        {linkTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        disabled={!(newLink.url && newLink.title)}
                        onClick={addLink}
                        type="button"
                      >
                        Add Link
                      </Button>
                    </div>

                    {watchedValues.externalLinks &&
                      watchedValues.externalLinks.length > 0 && (
                        <div className="space-y-3">
                          {watchedValues.externalLinks.map((link, index) => (
                            <div
                              className="flex items-center justify-between rounded-lg border p-3"
                              key={index.toString()}
                            >
                              <div className="flex items-center gap-3">
                                <Link className="h-5 w-5 text-gray-400" />
                                <div>
                                  <div className="font-medium">
                                    {link.title}
                                  </div>
                                  <div className="text-gray-500 text-sm">
                                    {
                                      linkTypes.find(
                                        (t) => t.value === link.type
                                      )?.label
                                    }
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() =>
                                    window.open(link.url, "_blank")
                                  }
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => removeLink(index)}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Social Media */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Social Media Links</h3>
                    <p className="text-gray-600 text-sm">
                      Link to social media pages for your property or building
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="socialMediaUrls.facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://facebook.com/..."
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="socialMediaUrls.instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://instagram.com/..."
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="socialMediaUrls.youtube"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>YouTube</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://youtube.com/..."
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="socialMediaUrls.tiktok"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TikTok</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://tiktok.com/@..."
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent className="space-y-6" value="settings">
                  {/* Media Settings */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Media Settings</h3>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="allowDownloads"
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
                              <FormLabel>Allow photo downloads</FormLabel>
                              <FormDescription>
                                Let visitors download your property photos
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="watermarkImages"
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
                              <FormLabel>Add watermark to images</FormLabel>
                              <FormDescription>
                                Protect your photos with a subtle watermark
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="showContactInfo"
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
                              <FormLabel>Show contact info on media</FormLabel>
                              <FormDescription>
                                Display your contact details on shared media
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Analytics Settings */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Analytics & Sharing</h3>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="trackViews"
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
                              <FormLabel>Track media views</FormLabel>
                              <FormDescription>
                                Monitor how many people view your photos and
                                videos
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allowSharing"
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
                              <FormLabel>Allow social sharing</FormLabel>
                              <FormDescription>
                                Enable sharing buttons for social media
                                platforms
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
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
                  Back to Features
                </Button>

                <Button
                  className="min-w-32"
                  disabled={watchedValues.photos?.length === 0}
                  type="submit"
                >
                  Continue to Availability
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
