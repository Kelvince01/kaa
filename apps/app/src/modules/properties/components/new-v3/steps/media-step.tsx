"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { FormField, FormItem, FormMessage } from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Camera,
  Image as ImageIcon,
  Lightbulb,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

type MediaStepProps = {
  form: UseFormReturn<PropertyFormData>;
};

export function MediaStep({ form }: MediaStepProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const watchedImages = form.watch("images") || [];

  const addImage = (url: string) => {
    if (url.trim() && !watchedImages.includes(url.trim())) {
      form.setValue("images", [...watchedImages, url.trim()]);
    }
  };

  const removeImage = (index: number) => {
    form.setValue(
      "images",
      watchedImages.filter((_, i) => i !== index)
    );
  };

  const handleAddImageUrl = () => {
    if (imageUrl.trim()) {
      addImage(imageUrl);
      setImageUrl("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // In a real implementation, you would upload the files here
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-base">
          Property Photos <span className="text-red-500">*</span>
        </h3>
        <p className="text-muted-foreground text-sm">
          Upload at least 1 high-quality photo of your property (max 20)
        </p>
      </div>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary/50"
        }`}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
            <Upload className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 font-semibold text-base">
            Upload Property Photos
          </h3>
          <p className="mt-1 text-center text-muted-foreground text-sm">
            Drag and drop or click to upload
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline">JPG</Badge>
            <Badge variant="outline">PNG</Badge>
            <Badge variant="outline">WEBP</Badge>
            <Badge variant="outline">Max 5MB each</Badge>
          </div>
          <Button className="mt-4" size="sm" type="button" variant="outline">
            <Camera className="mr-2 h-4 w-4" />
            Choose Files
          </Button>
        </CardContent>
      </Card>

      {/* Add Image URL */}
      <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Image URL</CardTitle>
          <CardDescription className="text-xs">
            Or paste image URLs if you have them hosted elsewhere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              className="text-sm"
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddImageUrl();
                }
              }}
              placeholder="https://example.com/image.jpg"
              type="url"
              value={imageUrl}
            />
            <Button
              onClick={handleAddImageUrl}
              size="sm"
              type="button"
              variant="secondary"
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      <FormField
        control={form.control}
        name="images"
        render={() => (
          <FormItem>
            {watchedImages.length > 0 ? (
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      Uploaded Images ({watchedImages.length}/20)
                    </CardTitle>
                    {watchedImages.length >= 1 && (
                      <Badge variant="default">✓ Minimum requirement met</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {watchedImages.map((imageUrl, index) => (
                      <div
                        className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                        key={index.toString()}
                      >
                        <Image
                          alt={`Property ${index + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          height={100}
                          src={imageUrl}
                          width={100}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            className="h-8 w-8"
                            onClick={() => removeImage(index)}
                            size="icon"
                            type="button"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {index === 0 && (
                          <Badge
                            className="absolute top-2 left-2"
                            variant="default"
                          >
                            Primary
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-gray-300 border-dashed bg-gray-50 p-8 dark:bg-gray-900">
                <ImageIcon className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-center text-muted-foreground text-sm">
                  No images uploaded yet
                </p>
                <p className="text-center text-muted-foreground text-xs">
                  Add at least 1 image to continue
                </p>
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Photography Tips */}
      <Card className="border-yellow-200 bg-linear-to-br from-yellow-50 to-white dark:from-yellow-950 dark:to-background">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Photography Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Use natural lighting - take photos during the day</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Show each room from multiple angles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Include exterior shots and nearby amenities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Clean and declutter before taking photos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span className="font-medium">
                Listings with 5+ photos get 3x more inquiries!
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
