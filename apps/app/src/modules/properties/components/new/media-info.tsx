import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Form } from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileImage,
  Grid3X3,
  ImageIcon,
  Info,
  List,
  MapIcon,
  Search,
  Settings,
  Share2,
  TrendingUp,
  VideoIcon,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { isValidElement, useCallback, useMemo, useState } from "react";
import type { UseFormProps } from "react-hook-form";
import { toast } from "sonner";
import { sheet } from "@/components/common/sheeter/state";
import { useStepper } from "@/components/common/stepper";
import UnsavedBadge from "@/components/common/unsaved-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import useHideElementsById from "@/hooks/use-hide-elements-by-id";
import { useOnlineManager } from "@/hooks/use-online-manager";
import type { Property } from "@/modules/properties/property.type";
import { EnhancedDropzone } from "./media/enhanced-dropzone";
import { EnhancedMediaPreview } from "./media/enhanced-media-preview";
import type { Photo, Video } from "./media/types";
import { UploadProgress } from "./media/upload-progress";
import { useMediaUpload } from "./media/use-media-upload";
import { VideoPreview } from "./media/video-preview";
import { type PropertyFormData, propertyFormSchema } from "./schema";

type MediaType = "photos" | "videos" | "virtual-tour" | "floor-plan" | "epc";

type MediaTypeOption = {
  value: MediaType;
  label: string;
  description: string;
  icon: React.ReactNode;
  accept: string;
  multiple: boolean;
};

const mediaTypeOptions: MediaTypeOption[] = [
  {
    value: "photos",
    label: "Property Photos",
    description: "Upload high-quality images of your property",
    icon: <ImageIcon className="h-5 w-5" />,
    accept: "image/*",
    multiple: true,
  },
  {
    value: "videos",
    label: "Property Videos",
    description: "Upload video tours or walkthroughs",
    icon: <VideoIcon className="h-5 w-5" />,
    accept: "video/*",
    multiple: true,
  },
  {
    value: "virtual-tour",
    label: "Virtual Tour",
    description: "Add 360° virtual tour link",
    icon: <MapIcon className="h-5 w-5" />,
    accept: "",
    multiple: false,
  },
  {
    value: "floor-plan",
    label: "Floor Plan",
    description: "Upload property layout diagram",
    icon: <FileImage className="h-5 w-5" />,
    accept: "image/*,.pdf",
    multiple: false,
  },
  {
    value: "epc",
    label: "EPC Certificate",
    description: "Energy Performance Certificate",
    icon: <Zap className="h-5 w-5" />,
    accept: "image/*,.pdf",
    multiple: false,
  },
];

type MediaInfoFormProps = {
  property: Property;
  sheet?: boolean;
  callback?: (property: Property) => void;
  hiddenFields?: string[];
  children?: React.ReactNode;
};

export const MediaInfoForm = ({
  property,
  sheet: isSheet,
  callback,
  hiddenFields,
  children,
}: MediaInfoFormProps) => {
  const t = useTranslations();
  const { nextStep } = useStepper();
  const { isOnline } = useOnlineManager();

  // UI State Management
  const [selectedMediaType, setSelectedMediaType] =
    useState<MediaType>("photos");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [previewMode, setPreviewMode] = useState<"grid" | "list" | "detailed">(
    "grid"
  );
  const [allowReordering, setAllowReordering] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    uploadStats,
    isUploading,
    compressImage,
    analyzeImageQuality,
    uploadFile,
    setIsUploading,
    setUploadStats,
  } = useMediaUpload();

  const isPending = false;
  const initialFormValues: PropertyFormData["media"] = property?.media
    ? {
        photos: property.media.images,
        virtualTour: property.media.virtualTours?.[0],
        floorPlan: property.media.floorPlans?.[0],
        // epcImage: property.media.epcImages?.[0],
        videos: property.media.videos?.map((video) => ({
          url: video.url,
          id: video.id,
          thumbnail: video.thumbnailUrl,
        })),
      }
    : {
        // Initialize with empty arrays/undefined instead of invalid objects
        photos: [], // Will be populated when user uploads
        virtualTour: "",
        floorPlan: { url: "", caption: "" },
        // epcImage: { url: "", caption: "", rating: "" },
        videos: [],
      };

  // Hide fields if requested
  if (hiddenFields) {
    const fieldIds = hiddenFields.map(
      (field) => `${field}-form-item-container`
    );
    // biome-ignore lint/correctness/useHookAtTopLevel: we need to call this hook conditionally
    useHideElementsById(fieldIds);
  }

  const formOptions: UseFormProps<PropertyFormData["media"]> = useMemo(
    () => ({
      resolver: zodResolver(propertyFormSchema.shape.media),
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

  const form = useFormWithDraft<PropertyFormData["media"]>(
    "property-media-info",
    {
      formOptions,
      onUnsavedChanges: () => console.info("Unsaved changes detected!"),
    }
  );
  const { watch, setValue, getValues } = form;
  const photos = watch("photos") || [];
  const videos = watch("videos") || [];
  const virtualTour = watch("virtualTour");
  const floorPlan = watch("floorPlan");
  const epcImage = watch("epcImage");

  // Prevent data loss
  useBeforeUnload({
    when: form.formState.isDirty,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  const onSubmit = (data: PropertyFormData["media"]) => {
    console.log("media-info submitted:", data);

    // Custom validation: Ensure at least one photo is uploaded
    if (!data.photos || data.photos.length === 0) {
      form.setError("photos", {
        type: "manual",
        message: "At least one photo is required",
      });
      return;
    }

    // Validate that all photos have valid URLs
    const invalidPhotos = data.photos.filter(
      (photo) => !photo.url || photo.url.trim() === ""
    );
    if (invalidPhotos.length > 0) {
      form.setError("photos", {
        type: "manual",
        message:
          "Some photos are still uploading or failed to upload. Please wait or remove them.",
      });
      return;
    }

    // Ensure at least one photo is marked as primary
    const primaryPhoto = data.photos.find((photo) => photo.isPrimary);
    if (!primaryPhoto) {
      // Automatically set first photo as primary
      (data.photos[0] as PropertyFormData["media"]["photos"][0]).isPrimary =
        true;
    }

    if (isSheet) sheet.remove("new-property");
    nextStep?.();
    callback?.(property);
  };

  const handleFileDrop = useCallback(
    async (files: File[]) => {
      if (!isOnline) {
        console.log("Offline - queuing files for upload");
        return;
      }

      setIsUploading(true);

      setUploadStats((prev) => ({
        ...prev,
        totalFiles: prev.totalFiles + files.length,
        totalSize:
          prev.totalSize + files.reduce((sum, file) => sum + file.size, 0),
      }));

      try {
        if (selectedMediaType === "photos") {
          const currentPhotos = getValues("photos") || [];
          const newPhotos: Photo[] = [];

          for (const file of files) {
            try {
              const compressedFile = await compressImage(file);
              const quality = await analyzeImageQuality(compressedFile);
              const fileUrl = URL.createObjectURL(compressedFile);

              const photoId = `photo-${Date.now()}-${Math.random()}`;
              const newPhoto: Photo = {
                id: photoId,
                url: fileUrl,
                caption: "",
                isPrimary: currentPhotos.length === 0 && newPhotos.length === 0,
                tags: [],
                quality: {
                  score:
                    quality === "excellent"
                      ? 100
                      : quality === "good"
                        ? 75
                        : quality === "fair"
                          ? 50
                          : 25,
                  description: quality,
                },
                uploadProgress: 0,
                file: compressedFile,
                metadata: {
                  size: compressedFile.size,
                  dimensions: { width: 0, height: 0 },
                  format: compressedFile.type,
                },
              };

              newPhotos.push(newPhoto);

              const url = await uploadFile(
                compressedFile,
                (progress: number) => {
                  // const currentPhotos = getValues("photos") || [];
                  const updatedPhotos = currentPhotos.map(
                    (p: PropertyFormData["media"]["photos"][0]) =>
                      p.id === photoId ? { ...p, uploadProgress: progress } : p
                  );
                  setValue("photos", updatedPhotos);
                }
              );

              // Update with final URL
              // const currentPhotos = getValues("photos") || [];
              const updatedPhotos = currentPhotos.map(
                (p: PropertyFormData["media"]["photos"][0]) =>
                  p.id === photoId ? { ...p, url, uploadProgress: 100 } : p
              );
              setValue("photos", updatedPhotos);

              setUploadStats((prev) => ({
                ...prev,
                uploadedFiles: prev.uploadedFiles + 1,
                uploadedSize: prev.uploadedSize + compressedFile.size,
              }));
            } catch (error) {
              console.error("Photo upload failed:", error);
              setUploadStats((prev) => ({
                ...prev,
                failedFiles: prev.failedFiles + 1,
              }));
              toast.error(`Failed to upload ${file.name}`);
            }
          }

          setValue(
            "photos",
            [
              ...currentPhotos,
              ...newPhotos,
            ] as PropertyFormData["media"]["photos"],
            {
              shouldDirty: true,
            }
          );
          toast.success(`Uploaded ${newPhotos.length} photos successfully`);
        } else if (selectedMediaType === "videos") {
          const currentVideos = getValues("videos") || [];
          const newVideos: Video[] = [];

          for (const file of files) {
            try {
              // For videos, we don't compress but upload directly
              const fileUrl = URL.createObjectURL(file);
              const videoId = `video-${Date.now()}-${Math.random()}`;

              const newVideo: Video = {
                id: videoId,
                url: fileUrl, // Will be replaced with actual URL after upload
                caption: "",
                thumbnail: "", // Will be generated from video
                uploadProgress: 0,
                file,
                metadata: {
                  size: file.size,
                  format: file.type,
                  duration: 0, // Will be determined when video loads
                },
              };

              newVideos.push(newVideo);

              // Upload the video file
              const url = await uploadFile(file, (progress: number) => {
                console.log(`Video upload progress: ${progress}%`);
              });

              // Update with final URL
              const currentVideos = getValues("videos") || [];
              const updatedVideos = currentVideos.map((v) =>
                v.id === videoId ? { ...v, url } : v
              );
              setValue("videos", updatedVideos);

              setUploadStats((prev) => ({
                ...prev,
                uploadedFiles: prev.uploadedFiles + 1,
                uploadedSize: prev.uploadedSize + file.size,
              }));
            } catch (error) {
              console.error("Video upload failed:", error);
              setUploadStats((prev) => ({
                ...prev,
                failedFiles: prev.failedFiles + 1,
              }));
              toast.error(`Failed to upload video ${file.name}`);
            }
          }

          setValue("videos", [...currentVideos, ...newVideos], {
            shouldDirty: true,
          });
          toast.success(`Uploaded ${newVideos.length} videos successfully`);
        } else if (selectedMediaType === "floor-plan") {
          // Handle single floor plan upload
          const file = files[0]; // Only take first file for single uploads
          if (!file) return;

          try {
            const fileUrl = URL.createObjectURL(file);

            // Upload the file
            const url = await uploadFile(file, (progress: number) => {
              console.log(`Floor plan upload progress: ${progress}%`);
            });

            setValue(
              "floorPlan",
              {
                url,
                // biome-ignore lint/performance/useTopLevelRegex: we need to remove the extension from the file name
                caption: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
              },
              { shouldDirty: true }
            );

            setUploadStats((prev) => ({
              ...prev,
              uploadedFiles: prev.uploadedFiles + 1,
              uploadedSize: prev.uploadedSize + file.size,
            }));

            toast.success("Floor plan uploaded successfully");
          } catch (error) {
            console.error("Floor plan upload failed:", error);
            setUploadStats((prev) => ({
              ...prev,
              failedFiles: prev.failedFiles + 1,
            }));
            toast.error(`Failed to upload floor plan: ${file.name}`);
          }
        } else if (selectedMediaType === "epc") {
          // Handle single EPC upload
          const file = files[0]; // Only take first file for single uploads
          if (!file) return;

          try {
            const fileUrl = URL.createObjectURL(file);

            // Upload the file
            const url = await uploadFile(file, (progress: number) => {
              console.log(`EPC upload progress: ${progress}%`);
            });

            setValue(
              "epcImage",
              {
                url,
                // biome-ignore lint/performance/useTopLevelRegex: we need to remove the extension from the file name
                caption: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                rating: "", // Can be filled later by user
              },
              { shouldDirty: true }
            );

            setUploadStats((prev) => ({
              ...prev,
              uploadedFiles: prev.uploadedFiles + 1,
              uploadedSize: prev.uploadedSize + file.size,
            }));

            toast.success("EPC certificate uploaded successfully");
          } catch (error) {
            console.error("EPC upload failed:", error);
            setUploadStats((prev) => ({
              ...prev,
              failedFiles: prev.failedFiles + 1,
            }));
            toast.error(`Failed to upload EPC certificate: ${file.name}`);
          }
        }
      } catch (error) {
        console.error("Upload process failed:", error);
        toast.error("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [
      isOnline,
      selectedMediaType,
      getValues,
      setValue,
      compressImage,
      analyzeImageQuality,
      uploadFile,
      setIsUploading,
      setUploadStats,
    ]
  );

  const handleUrlSubmit = useCallback(
    (url: string) => {
      if (selectedMediaType === "virtual-tour") {
        setValue("virtualTour", url);
      }
    },
    [selectedMediaType, setValue]
  );

  const handlePhotoRemove = useCallback(
    (photoId: string) => {
      const currentPhotos = getValues("photos") || [];
      const photoToRemove = currentPhotos.find((p) => p.id === photoId);
      const newPhotos = currentPhotos.filter((p) => p.id !== photoId);

      if (photoToRemove?.isPrimary && newPhotos.length > 0) {
        (newPhotos[0] as PropertyFormData["media"]["photos"][0]).isPrimary =
          true;
      }

      setValue("photos", newPhotos, { shouldDirty: true });
      setSelectedPhotoIds((prev) => prev.filter((id) => id !== photoId));
    },
    [getValues, setValue]
  );

  const handleSetPrimary = useCallback(
    (photoId: string) => {
      const currentPhotos = getValues("photos") || [];
      const updatedPhotos = currentPhotos.map((photo) => ({
        ...photo,
        isPrimary: photo.id === photoId,
      }));
      setValue("photos", updatedPhotos, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const handleCaptionChange = useCallback(
    (photoId: string, caption: string) => {
      const currentPhotos = getValues("photos") || [];
      const updatedPhotos = currentPhotos.map((photo) =>
        photo.id === photoId ? { ...photo, caption } : photo
      );
      setValue("photos", updatedPhotos, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const handleTagChange = useCallback(
    (photoId: string, tags: string[]) => {
      const currentPhotos = getValues("photos") || [];
      const updatedPhotos = currentPhotos.map((photo) =>
        photo.id === photoId
          ? { ...photo, tags: [...new Set([...(photo.tags || []), ...tags])] }
          : photo
      );
      setValue("photos", updatedPhotos, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const handleBulkDelete = useCallback(
    (ids: string[]) => {
      ids.forEach(handlePhotoRemove);
    },
    [handlePhotoRemove]
  );

  const handleBulkTag = useCallback(
    (ids: string[], tags: string[]) => {
      const currentPhotos = getValues("photos") || [];
      const updatedPhotos = currentPhotos.map((photo) =>
        ids.includes(photo.id || "")
          ? { ...photo, tags: [...new Set([...(photo.tags || []), ...tags])] }
          : photo
      );
      setValue("photos", updatedPhotos, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const handleBulkCaption = useCallback(
    (ids: string[], caption: string) => {
      const currentPhotos = getValues("photos") || [];
      const updatedPhotos = currentPhotos.map((photo) =>
        ids.includes(photo.id || "") ? { ...photo, caption } : photo
      );
      setValue("photos", updatedPhotos, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const handleSuggestionApply = useCallback((suggestionId: string) => {
    console.log("Applying suggestion:", suggestionId);
  }, []);

  const availableTags = [
    "bedroom",
    "kitchen",
    "bathroom",
    "living-room",
    "exterior",
    "garden",
    "parking",
    "security",
    "water",
    "power",
    "dining-room",
    "balcony",
    "terrace",
    "storage",
  ];

  // Convert photos to media items for enhanced preview
  const mediaItems = photos.map((photo) => ({
    id: photo.id || `photo-${photo.url}`,
    url: photo.url,
    type: "photo" as const,
    caption: photo.caption,
    tags: photo.tags,
    isPrimary: photo.isPrimary,
    isSelected: selectedPhotoIds.includes(photo.id || ""),
    // uploadProgress: photo.uploadProgress,
    // file: photo.file,
  }));

  // Handle enhanced media operations
  const handleMediaItemUpdate = useCallback(
    (id: string, updates: any) => {
      const currentPhotos = getValues("photos") || [];
      const updatedPhotos = currentPhotos.map((photo) =>
        photo.id === id ? { ...photo, ...updates } : photo
      );
      setValue("photos", updatedPhotos, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const handleMediaItemDelete = useCallback(
    (id: string) => {
      handlePhotoRemove(id);
    },
    [handlePhotoRemove]
  );

  const handleMediaItemsReorder = useCallback(
    (newOrder: any[]) => {
      const reorderedPhotos = newOrder.map((item) => {
        const photo = photos.find((p) => p.id === item.id);
        return photo || item;
      });
      setValue("photos", reorderedPhotos, { shouldDirty: true });
    },
    [photos, setValue]
  );

  const handleBulkSelectMedia = useCallback((ids: string[]) => {
    setSelectedPhotoIds(ids);
  }, []);

  const handleBulkDeleteMedia = useCallback(
    (ids: string[]) => {
      ids.forEach(handlePhotoRemove);
    },
    [handlePhotoRemove]
  );

  const handleSetPrimaryMedia = useCallback(
    (id: string) => {
      handleSetPrimary(id);
    },
    [handleSetPrimary]
  );

  // Video handler functions
  const handleVideoUpdate = useCallback(
    (videoId: string, updates: Partial<Video>) => {
      const currentVideos = getValues("videos") || [];
      const updatedVideos = currentVideos.map((video) =>
        video.id === videoId ? { ...video, ...updates } : video
      );
      setValue("videos", updatedVideos, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const handleVideoDelete = useCallback(
    (videoId: string) => {
      const currentVideos = getValues("videos") || [];
      const updatedVideos = currentVideos.filter(
        (video) => video.id !== videoId
      );
      setValue("videos", updatedVideos, { shouldDirty: true });
    },
    [getValues, setValue]
  );

  const selectedOption = mediaTypeOptions.find(
    (option) => option.value === selectedMediaType
  );
  // Optimized media count calculation
  const currentMediaCount = useMemo(() => {
    switch (selectedMediaType) {
      case "photos":
        return photos.length;
      case "videos":
        return videos.length;
      case "virtual-tour":
        return virtualTour ? 1 : 0;
      case "floor-plan":
        return floorPlan?.url ? 1 : 0;
      case "epc":
        return epcImage?.url ? 1 : 0;
      default:
        return 0;
    }
  }, [
    selectedMediaType,
    photos.length,
    videos.length,
    virtualTour,
    floorPlan,
    epcImage,
  ]);

  // Calculate upload statistics
  const mediaStats = useMemo(() => {
    const totalItems =
      photos.length +
      videos.length +
      (virtualTour ? 1 : 0) +
      (floorPlan?.url ? 1 : 0) +
      (epcImage?.url ? 1 : 0);
    const primarySet = photos.some((p) => p.isPrimary);
    const hasRequiredPhotos = photos.length >= 1;

    return {
      totalItems,
      primarySet,
      hasRequiredPhotos,
      completionPercentage: hasRequiredPhotos ? (primarySet ? 100 : 80) : 0,
    };
  }, [photos, videos, virtualTour, floorPlan, epcImage]);

  return (
    <div className="space-y-6">
      {/* Enhanced Progress and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Property Media</h2>
              <p className="text-muted-foreground text-sm">
                {mediaStats.totalItems} items •{" "}
                {mediaStats.completionPercentage}% complete
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mediaStats.hasRequiredPhotos ? (
            <Badge className="gap-1" variant="default">
              <CheckCircle className="h-3 w-3" />
              Photos Added
            </Badge>
          ) : (
            <Badge className="gap-1" variant="secondary">
              <AlertCircle className="h-3 w-3" />
              Photos Required
            </Badge>
          )}

          {mediaStats.primarySet && (
            <Badge className="gap-1" variant="outline">
              <CheckCircle className="h-3 w-3" />
              Primary Set
            </Badge>
          )}

          <Button
            className="ml-auto"
            onClick={() => setShowAdvanced(!showAdvanced)}
            size="sm"
            variant="ghost"
          >
            <Settings className="mr-2 h-4 w-4" />
            {showAdvanced ? "Basic" : "Advanced"}
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      <UploadProgress
        isUploading={isUploading}
        onCancel={() => {
          setIsUploading(false);
          setUploadStats({
            totalFiles: 0,
            uploadedFiles: 0,
            failedFiles: 0,
            totalSize: 0,
            uploadedSize: 0,
          });
        }}
        onPause={() => setIsUploading(false)}
        onResume={() => setIsUploading(true)}
        stats={uploadStats}
      />

      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {!isSheet && form.unsavedChanges && <UnsavedBadge />}

          {/* Quick Tips */}
          {!mediaStats.hasRequiredPhotos && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Add high-quality photos to showcase your property. At least one
                photo is required.
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced Media Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Media Types
              </CardTitle>
              <CardDescription>
                Choose the type of media you want to upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
                {mediaTypeOptions.map((option) => {
                  const isSelected = selectedMediaType === option.value;
                  const mediaCount =
                    option.value === "photos"
                      ? photos.length
                      : option.value === "videos"
                        ? videos.length
                        : option.value === "virtual-tour"
                          ? virtualTour
                            ? 1
                            : 0
                          : option.value === "floor-plan"
                            ? floorPlan?.url
                              ? 1
                              : 0
                            : option.value === "epc"
                              ? epcImage?.url
                                ? 1
                                : 0
                              : 0;

                  return (
                    <button
                      className={cn(
                        "relative flex flex-col items-center gap-3 rounded-lg border p-4 transition-all hover:shadow-sm",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-muted hover:border-primary/50"
                      )}
                      key={option.value}
                      onClick={() =>
                        setSelectedMediaType(option.value as MediaType)
                      }
                      type="button"
                    >
                      {option.icon}
                      <div className="text-center">
                        <div className="font-medium text-sm">
                          {option.label}
                        </div>
                        {mediaCount > 0 && (
                          <Badge className="mt-1 text-xs" variant="secondary">
                            {mediaCount} item{mediaCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      {isSelected && (
                        <div className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="mb-8">
            <div className="mb-4">
              {/* Upload Area */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col items-center justify-between">
                    <div className="mb-4 flex flex-col items-center justify-start">
                      <CardTitle className="flex items-center gap-2">
                        {selectedOption?.icon}
                        {selectedOption?.label}
                      </CardTitle>
                      <CardDescription>
                        {selectedOption?.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enhanced Upload Dropzone */}
                  <EnhancedDropzone
                    accept={selectedOption?.accept}
                    className="mt-1"
                    disabled={isUploading || !isOnline}
                    maxFileSize={
                      selectedMediaType === "photos"
                        ? 10 * 1024 * 1024
                        : 100 * 1024 * 1024
                    }
                    maxFiles={50}
                    mediaType={selectedMediaType}
                    multiple={selectedOption?.multiple}
                    onDropAction={handleFileDrop}
                    onUrlSubmitAction={handleUrlSubmit}
                    quality="high"
                  />

                  {/* Display form errors */}
                  {form.formState.errors.photos && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-red-600" />
                        <p className="font-medium text-red-800 text-sm">
                          {form.formState.errors.photos.message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Show uploaded content based on media type */}
                  {selectedMediaType === "photos" && photos.length > 0 && (
                    <>
                      {/* Enhanced Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                              className="w-64"
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search photos..."
                              value={searchQuery}
                            />
                          </div>

                          <Select
                            onValueChange={setFilterTag}
                            value={filterTag}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Filter by tag" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All tags</SelectItem>
                              {availableTags.map((tag) => (
                                <SelectItem key={tag} value={tag}>
                                  {tag.replace("-", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              const nextMode =
                                previewMode === "grid"
                                  ? "list"
                                  : previewMode === "list"
                                    ? "detailed"
                                    : "grid";
                              setPreviewMode(nextMode);
                            }}
                            size="sm"
                            variant="outline"
                          >
                            {previewMode === "grid" ? (
                              <List className="h-4 w-4" />
                            ) : previewMode === "list" ? (
                              <Grid3X3 className="h-4 w-4" />
                            ) : (
                              <Grid3X3 className="h-4 w-4" />
                            )}
                            {previewMode.charAt(0).toUpperCase() +
                              previewMode.slice(1)}
                          </Button>

                          <Button
                            className={allowReordering ? "bg-primary/10" : ""}
                            onClick={() => setAllowReordering(!allowReordering)}
                            size="sm"
                            title={`${allowReordering ? "Disable" : "Enable"} drag-and-drop reordering`}
                            variant="outline"
                          >
                            Reorder
                          </Button>

                          <Button size="sm" variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      </div>

                      {/* Enhanced Media Preview */}
                      <EnhancedMediaPreview
                        allowBulkActions={true}
                        allowReordering={allowReordering}
                        items={mediaItems}
                        onBulkDelete={handleBulkDeleteMedia}
                        onBulkSelect={handleBulkSelectMedia}
                        onItemDelete={handleMediaItemDelete}
                        onItemsReorder={handleMediaItemsReorder}
                        onItemUpdate={handleMediaItemUpdate}
                        onSetPrimary={handleSetPrimaryMedia}
                        previewMode={previewMode}
                        showTags={showTags}
                        suggestedTags={availableTags}
                      />
                    </>
                  )}

                  {/* Enhanced Video Preview */}
                  {selectedMediaType === "videos" && (
                    <VideoPreview
                      allowEditing={true}
                      onVideoDelete={handleVideoDelete}
                      onVideoUpdate={handleVideoUpdate}
                      showControls={true}
                      videos={videos as Video[]}
                    />
                  )}

                  {/* Show virtual tour */}
                  {selectedMediaType === "virtual-tour" && virtualTour && (
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MapIcon className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">Virtual Tour Added</p>
                            <p className="max-w-96 truncate text-muted-foreground text-sm">
                              {virtualTour}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => window.open(virtualTour, "_blank")}
                            size="sm"
                            variant="ghost"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => setValue("virtualTour", "")}
                            size="sm"
                            variant="outline"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Show floor plan */}
                  {selectedMediaType === "floor-plan" && floorPlan?.url && (
                    <Card className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {floorPlan.url.toLowerCase().includes(".pdf") ? (
                              <FileImage className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-8 w-8 transform text-muted-foreground" />
                            ) : (
                              <Image
                                alt="Floor plan"
                                className="object-cover"
                                fill
                                src={floorPlan.url}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Floor Plan</p>
                            <p className="text-muted-foreground text-sm">
                              {floorPlan.caption || "Floor plan document"}
                            </p>
                            <Input
                              className="mt-2 text-sm"
                              onChange={(e) =>
                                setValue(
                                  "floorPlan",
                                  { ...floorPlan, caption: e.target.value },
                                  { shouldDirty: true }
                                )
                              }
                              placeholder="Add caption..."
                              value={floorPlan.caption || ""}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => window.open(floorPlan.url, "_blank")}
                            size="sm"
                            variant="ghost"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() =>
                              setValue(
                                "floorPlan",
                                { url: "", caption: "" },
                                { shouldDirty: true }
                              )
                            }
                            size="sm"
                            variant="outline"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Show EPC certificate */}
                  {selectedMediaType === "epc" && epcImage?.url && (
                    <Card className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {epcImage.url.toLowerCase().includes(".pdf") ? (
                              <div className="flex h-full flex-col items-center justify-center">
                                <Zap className="mb-1 h-8 w-8 text-green-600" />
                                <span className="font-medium text-xs">EPC</span>
                              </div>
                            ) : (
                              <Image
                                alt="EPC certificate"
                                className="object-cover"
                                fill
                                src={epcImage.url}
                              />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="font-medium">EPC Certificate</p>
                            <Input
                              className="text-sm"
                              onChange={(e) =>
                                setValue(
                                  "epcImage",
                                  { ...epcImage, caption: e.target.value },
                                  { shouldDirty: true }
                                )
                              }
                              placeholder="Add caption..."
                              value={epcImage.caption || ""}
                            />
                            <Select
                              onValueChange={(value) =>
                                setValue(
                                  "epcImage",
                                  { ...epcImage, rating: value },
                                  { shouldDirty: true }
                                )
                              }
                              value={epcImage.rating || ""}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Energy Rating" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">
                                  A - Most Efficient
                                </SelectItem>
                                <SelectItem value="B">
                                  B - Very Efficient
                                </SelectItem>
                                <SelectItem value="C">C - Efficient</SelectItem>
                                <SelectItem value="D">D - Average</SelectItem>
                                <SelectItem value="E">
                                  E - Below Average
                                </SelectItem>
                                <SelectItem value="F">F - Poor</SelectItem>
                                <SelectItem value="G">G - Very Poor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => window.open(epcImage.url, "_blank")}
                            size="sm"
                            variant="ghost"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() =>
                              setValue(
                                "epcImage",
                                { url: "", caption: "", rating: "" },
                                { shouldDirty: true }
                              )
                            }
                            size="sm"
                            variant="outline"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

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
