"use client";

import { Button } from "@kaa/ui/components/button";
import { Card } from "@kaa/ui/components/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { cn } from "@kaa/ui/lib/utils";
import { Image as ImageIcon, Star, Upload, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

export function MediaStep() {
  const form = useFormContext<PropertyFormData>();
  const images = form.watch("images") || [];
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Convert files to base64 or upload to your storage
      // This is a placeholder - implement your actual upload logic
      const uploadedUrls: string[] = [];

      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;

        // Create a temporary URL for preview
        const url = URL.createObjectURL(file);
        uploadedUrls.push(url);

        // TODO: Implement actual upload to your storage service
        // const uploaded = await uploadToStorage(file);
        // uploadedUrls.push(uploaded.url);
      }

      form.setValue("images", [...images, ...uploadedUrls], {
        shouldValidate: true,
      });
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    form.setValue("images", updated, { shouldValidate: true });
  };

  const handleMakePrimary = (index: number) => {
    const updated = [...images];
    const [primary] = updated.splice(index, 1);
    if (primary) {
      updated.unshift(primary);
    }
    form.setValue("images", updated, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 font-semibold text-2xl text-foreground">
          Property Photos
        </h2>
        <p className="text-muted-foreground text-sm">
          Upload high-quality photos to showcase your property (minimum 3,
          maximum 20)
        </p>
      </div>

      <FormField
        control={form.control}
        name="images"
        render={() => (
          <FormItem>
            <FormLabel>Property Images *</FormLabel>
            <FormControl>
              <div className="space-y-4">
                {/* Upload Area */}
                <div
                  className={cn(
                    "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-medium text-lg">
                    Upload Property Images
                  </h3>
                  <p className="mb-4 text-muted-foreground text-sm">
                    Drag and drop images here, or click to browse
                  </p>

                  <input
                    accept="image/*"
                    className="hidden"
                    disabled={uploading || images.length >= 20}
                    id="file-upload"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    type="file"
                  />

                  <Button
                    disabled={uploading || images.length >= 20}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    type="button"
                    variant="outline"
                  >
                    {uploading ? "Uploading..." : "Choose Files"}
                  </Button>

                  <p className="mt-3 text-muted-foreground text-xs">
                    PNG, JPG, WEBP up to 10MB each
                  </p>
                </div>

                {/* Image Gallery */}
                {images.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {images.length}{" "}
                        {images.length === 1 ? "image" : "images"} uploaded
                      </p>
                      <p className="text-muted-foreground text-xs">
                        First image is the primary photo
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {images.map((url, index) => (
                        <Card
                          className={cn(
                            "group relative aspect-square overflow-hidden",
                            index === 0 && "ring-2 ring-primary"
                          )}
                          key={`${url}-${index.toString()}`}
                        >
                          <Image
                            alt={`Property ${index + 1}`}
                            className="h-full w-full object-cover"
                            height={100}
                            src={url}
                            width={100}
                          />

                          {index === 0 && (
                            <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-primary-foreground text-xs">
                              <Star className="h-3 w-3 fill-current" />
                              Primary
                            </div>
                          )}

                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                            {index !== 0 && (
                              <Button
                                className="text-xs"
                                onClick={() => handleMakePrimary(index)}
                                size="sm"
                                type="button"
                                variant="secondary"
                              >
                                <Star className="mr-1 h-3 w-3" />
                                Primary
                              </Button>
                            )}
                            <Button
                              onClick={() => handleRemoveImage(index)}
                              size="sm"
                              type="button"
                              variant="destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}

                      {/* Add More Card */}
                      {images.length < 20 && (
                        <button
                          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-accent/50"
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                          type="button"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">
                            Add More
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </FormControl>
            <FormDescription>
              High-quality photos increase tenant interest by up to 80%. Include
              photos of all rooms and key features.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Card className="bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-2 text-sm">
            <h3 className="font-medium">Tips for Great Photos</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Take photos in good natural lighting</li>
              <li>• Clean and declutter before photographing</li>
              <li>
                • Include exterior, living areas, bedrooms, kitchen, and
                bathrooms
              </li>
              <li>• Show unique features and selling points</li>
              <li>• Use landscape orientation for better display</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
