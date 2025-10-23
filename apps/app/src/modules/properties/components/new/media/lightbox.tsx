"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCw,
  Share2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Photo } from "./types";

type LightboxProps = {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function Lightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: LightboxProps) {
  const [rotation, setRotation] = useState(0);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    onNavigate(newIndex);
    setRotation(0);
  };

  const handleNext = () => {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Header */}
      <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {currentIndex + 1} of {photos.length}
          </Badge>
          {currentPhoto?.isPrimary && (
            <Badge className="bg-yellow-500 text-yellow-900">Primary</Badge>
          )}
          <Badge
            className={`
            ${currentPhoto?.quality?.description === "excellent" ? "border-green-500 text-green-500" : ""}
            ${currentPhoto?.quality?.description === "good" ? "border-blue-500 text-blue-500" : ""}
            ${currentPhoto?.quality?.description === "fair" ? "border-yellow-500 text-yellow-500" : ""}
            ${currentPhoto?.quality?.description === "poor" ? "border-red-500 text-red-500" : ""}
          `}
            variant="outline"
          >
            {currentPhoto?.quality?.description || "Unknown"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleRotate} size="sm" variant="ghost">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button onClick={onClose} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <Button
        className="-translate-y-1/2 absolute top-1/2 left-4 z-10 bg-black/50 hover:bg-black/70"
        onClick={handlePrevious}
        size="lg"
        variant="ghost"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        className="-translate-y-1/2 absolute top-1/2 right-4 z-10 bg-black/50 hover:bg-black/70"
        onClick={handleNext}
        size="lg"
        variant="ghost"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Main Image */}
      <div className="relative mx-auto max-h-[80vh] max-w-[90vw]">
        <Image
          alt={currentPhoto?.caption || "Property photo"}
          className="max-h-full max-w-full object-contain"
          height={800}
          src={currentPhoto?.url || "/placeholder.svg"}
          style={{ transform: `rotate(${rotation}deg)` }}
          width={1200}
        />
      </div>

      {/* Caption */}
      {currentPhoto?.caption && (
        <div className="absolute right-4 bottom-4 left-4 text-center">
          <p className="rounded-lg bg-black/50 px-4 py-2 text-white backdrop-blur-sm">
            {currentPhoto?.caption}
          </p>
        </div>
      )}

      {/* Thumbnails */}
      <div className="-translate-x-1/2 absolute bottom-4 left-1/2 flex max-w-[80vw] gap-2 overflow-x-auto">
        {photos.map((photo, index) => (
          <Button
            className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
              index === currentIndex
                ? "border-white"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
            key={photo.id}
            onClick={() => onNavigate(index)}
            type="button"
          >
            <Image
              alt=""
              className="object-cover"
              fill
              src={photo?.thumbnail || photo?.url}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </Button>
        ))}
      </div>
    </div>
  );
}
