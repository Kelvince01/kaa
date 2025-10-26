"use client";

import { Button } from "@kaa/ui/components/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { cn } from "@kaa/ui/lib/utils";
import { Image as ImageIcon, Plus, Star, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { PropertyFormData } from "../schema";

export function MediaStep() {
  const form = useFormContext<PropertyFormData>();
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const images = form.watch("images") || [];

  const handleAddImage = () => {
    const url = imageUrlInput.trim();

    // Basic URL validation
    try {
      new URL(url);

      if (!images.includes(url)) {
        form.setValue("images", [...images, url], { shouldValidate: true });
        setImageUrlInput("");
      }
    } catch {
      // Invalid URL - show error or ignore
    }
  };

  const handleRemoveImage = (index: number) => {
    form.setValue(
      "images",
      images.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
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

    // Handle file drop (this is a simplified version)
    // In production, you'd upload to a server and get URLs back
    const url = e.dataTransfer.getData("text/uri-list");
    if (url) {
      setImageUrlInput(url);
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage as string);
    form.setValue("images", newImages, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl text-foreground md:text-3xl">
          Property Media
        </h2>
        <p className="text-muted-foreground text-sm md:text-base">
          Add high-quality photos to showcase your property
        </p>
      </div>

      {/* Upload Section */}
      <FormField
        control={form.control}
        name="images"
        render={() => (
          <FormItem>
            <FormLabel className="text-base">Property Photos *</FormLabel>
            <FormControl>
              <div className="space-y-4">
                {/* Drag & Drop Area */}
                <div
                  className={cn(
                    "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors",
                    isDragging
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>

                  <div className="text-center">
                    <p className="mb-1 font-medium text-base">
                      Drag & drop images or paste URLs
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Supports JPEG, PNG, WebP • Max 20 images
                    </p>
                  </div>

                  {/* URL Input */}
                  <div className="flex w-full max-w-md gap-2">
                    <Input
                      className="flex-1"
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddImage();
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      type="url"
                      value={imageUrlInput}
                    />
                    <Button
                      disabled={!imageUrlInput.trim()}
                      onClick={handleAddImage}
                      size="sm"
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Image Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {images.map((imageUrl, index) => (
                      <div
                        className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                        key={imageUrl}
                      >
                        {/* Primary Badge */}
                        {index === 0 && (
                          <div className="absolute top-2 left-2 z-10">
                            <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-primary-foreground text-xs">
                              <Star className="h-3 w-3" />
                              <span>Primary</span>
                            </div>
                          </div>
                        )}

                        {/* Image */}
                        <Image
                          alt={`Property ${index + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          height={100}
                          src={imageUrl}
                          width={100}
                        />

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                          {index > 0 && (
                            <Button
                              className="h-8 w-8"
                              onClick={() => moveImage(index, 0)}
                              size="icon"
                              type="button"
                              variant="secondary"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            className="h-8 w-8"
                            onClick={() => handleRemoveImage(index)}
                            size="icon"
                            type="button"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Position Indicator */}
                        <div className="absolute right-2 bottom-2">
                          <div className="rounded-full bg-black/70 px-2 py-0.5 text-white text-xs">
                            {index + 1}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add More Button */}
                    {images.length < 20 && (
                      <button
                        className="flex aspect-square items-center justify-center rounded-lg border-2 border-border border-dashed hover:border-primary hover:bg-primary/5"
                        onClick={() => {
                          // Focus the URL input
                          const input = document.querySelector(
                            'input[type="url"]'
                          ) as HTMLInputElement;
                          input?.focus();
                        }}
                        type="button"
                      >
                        <div className="text-center">
                          <Plus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground text-xs">
                            Add More
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </FormControl>

            <FormDescription className="text-xs md:text-sm">
              {images.length}/20 images • The first image will be the primary
              photo
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tips */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex gap-3">
          <ImageIcon className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-2">
            <p className="font-semibold text-blue-900 text-sm dark:text-blue-100">
              Photo Tips for Better Results:
            </p>
            <ul className="space-y-1 text-blue-700 text-xs dark:text-blue-300">
              <li>• Use natural lighting when possible</li>
              <li>• Show all rooms and key features</li>
              <li>• Include exterior and building photos</li>
              <li>• Clean and stage rooms before photographing</li>
              <li>• Use landscape orientation for better viewing</li>
              <li>• Take photos from multiple angles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
