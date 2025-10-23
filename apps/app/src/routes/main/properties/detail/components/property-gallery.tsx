/**
 * Enhanced Property image gallery component with carousel, lightbox and advanced features
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@kaa/ui/components/carousel";
import { Dialog, DialogContent } from "@kaa/ui/components/dialog";
import { Progress } from "@kaa/ui/components/progress";
import { cn } from "@kaa/ui/lib/utils";
import {
  Camera,
  Download,
  Expand,
  Eye,
  Pause,
  Play,
  Share2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Property } from "@/modules/properties/property.type";

type PropertyGalleryProps = {
  property: Property;
  className?: string;
};

export function PropertyGallery({ property, className }: PropertyGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>();
  const [viewCount, setViewCount] = useState(0);

  const photos = property.media?.images || [];
  const primaryPhoto =
    photos.find((photo: { isPrimary: boolean }) => photo.isPrimary) ||
    photos[0];
  const hasVirtualTour = (property.media?.virtualTours?.length as number) > 0;
  const totalViews = photos.length + (hasVirtualTour ? 1 : 0);

  // Auto-slideshow functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSlideshow && lightboxApi) {
      interval = setInterval(() => {
        lightboxApi.scrollNext();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSlideshow, lightboxApi]);

  // Track image views
  useEffect(() => {
    if (photos.length > 0) {
      setViewCount((prev) => prev + 1);
    }
  }, [photos.length]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = imageName || "property-image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Image downloaded successfully");
    } catch (error) {
      toast.error("Failed to download image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (imageUrl: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${property.title} - Property Image`,
          url: imageUrl,
        });
      } else {
        await navigator.clipboard.writeText(imageUrl);
        toast.success("Image URL copied to clipboard");
      }
    } catch (error) {
      toast.error("Failed to share image");
    }
  };

  if (!photos.length) {
    return (
      <div
        className={cn(
          "relative aspect-16/10 overflow-hidden rounded-lg bg-muted",
          className
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/20">
              <Image
                alt="No images"
                className="opacity-50"
                height={32}
                src="/placeholder-property.jpg"
                width={32}
              />
            </div>
            <p className="text-muted-foreground">No images available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Carousel Gallery */}
      <div className={cn("", className)}>
        <Carousel className="w-full" setApi={setCarouselApi}>
          <CarouselContent>
            {photos.map((photo, index) => (
              <CarouselItem key={photo.url || index}>
                <div className="group relative aspect-16/10 cursor-pointer overflow-hidden rounded-lg">
                  <Image
                    alt={photo.caption || `Property image ${index + 1}`}
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyebhOzTRWylzZYd+fq"
                    className="object-cover transition-all duration-300 group-hover:scale-105"
                    fill
                    onClick={() => openLightbox(index)}
                    placeholder="blur"
                    priority={index === 0}
                    quality={85}
                    src={photo.url || "/placeholder-property.jpg"}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

                  {/* Image Overlay Information */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge
                      className="bg-black/70 text-white"
                      variant="secondary"
                    >
                      <Camera className="mr-1 h-3 w-3" />
                      {photos.length}
                    </Badge>
                    {hasVirtualTour && (
                      <Badge
                        className="bg-blue-600/90 text-white"
                        variant="secondary"
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Virtual Tour
                      </Badge>
                    )}
                    {index === 0 && (
                      <Badge
                        className="bg-green-600/90 text-white"
                        variant="secondary"
                      >
                        Main
                      </Badge>
                    )}
                  </div>

                  {/* View Counter */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      className="bg-black/70 text-white"
                      variant="secondary"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      {viewCount} views
                    </Badge>
                  </div>

                  {/* Expand Button */}
                  <div className="absolute right-2 bottom-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
                    <Button
                      className="border-0 bg-black/70 text-white hover:bg-black/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(index);
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      <Expand className="mr-1 h-4 w-4" />
                      View Fullscreen
                    </Button>
                  </div>

                  {/* Image Caption */}
                  {photo.caption && (
                    <div className="absolute bottom-2 left-2 opacity-0 transition-all duration-200 group-hover:opacity-100">
                      <Badge
                        className="max-w-xs truncate bg-black/70 text-white"
                        variant="secondary"
                      >
                        {photo.caption}
                      </Badge>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}

            {/* Virtual Tour Slide */}
            {hasVirtualTour && (
              <CarouselItem>
                <div className="relative aspect-16/10 overflow-hidden rounded-lg bg-linear-to-br from-blue-500 to-purple-600">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-white">
                      <Play className="mx-auto mb-4 h-16 w-16" />
                      <h3 className="mb-2 font-bold text-xl">Virtual Tour</h3>
                      <p className="text-sm opacity-90">
                        Take a 360° virtual tour of this property
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() =>
                          window.open(
                            property.media.virtualTours?.[0] || "",
                            "_blank"
                          )
                        }
                        size="lg"
                        variant="secondary"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Tour
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            )}
          </CarouselContent>

          <CarouselPrevious className="-left-12" />
          <CarouselNext className="-right-12" />
        </Carousel>

        {/* Thumbnail Navigation */}
        {photos.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <button
                className={cn(
                  "relative h-16 w-20 shrink-0 overflow-hidden rounded border-2 transition-all",
                  index === currentImageIndex
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-muted hover:border-muted-foreground"
                )}
                key={photo.url || index}
                onClick={() => {
                  setCurrentImageIndex(index);
                  carouselApi?.scrollTo(index);
                }}
                type="button"
              >
                <Image
                  alt={`Thumbnail ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={photo.url}
                />
                {index === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="font-medium text-[10px] text-white">
                      MAIN
                    </span>
                  </div>
                )}
              </button>
            ))}

            {/* Virtual Tour Thumbnail */}
            {hasVirtualTour && (
              <button
                className="relative h-16 w-20 shrink-0 overflow-hidden rounded border-2 border-blue-500 bg-linear-to-br from-blue-500 to-purple-600 transition-all hover:from-blue-600 hover:to-purple-700"
                onClick={() => {
                  carouselApi?.scrollTo(photos.length);
                }}
                type="button"
              >
                <div className="flex h-full items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
                <div className="absolute right-0 bottom-0 left-0 bg-black/70 px-1 py-0.5">
                  <span className="font-medium text-[8px] text-white">
                    360°
                  </span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Lightbox Modal with Carousel */}
      <Dialog onOpenChange={closeLightbox} open={isLightboxOpen}>
        <DialogContent className="max-h-[95vh] max-w-[95vw] border-none bg-black p-0">
          <div className="relative flex h-[95vh] w-full items-center justify-center">
            {/* Top Action Bar */}
            <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  className="text-white hover:bg-white/20"
                  onClick={() => setIsSlideshow(!isSlideshow)}
                  size="sm"
                  variant="ghost"
                >
                  {isSlideshow ? (
                    <>
                      <Pause className="mr-1 h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-4 w-4" /> Slideshow
                    </>
                  )}
                </Button>
                <Button
                  className="text-white hover:bg-white/20"
                  onClick={() => setZoomLevel((prev) => (prev === 1 ? 2 : 1))}
                  size="sm"
                  variant="ghost"
                >
                  {zoomLevel === 1 ? (
                    <>
                      <ZoomIn className="mr-1 h-4 w-4" /> Zoom In
                    </>
                  ) : (
                    <>
                      <ZoomOut className="mr-1 h-4 w-4" /> Zoom Out
                    </>
                  )}
                </Button>
                <Button
                  className="text-white hover:bg-white/20"
                  disabled={isLoading}
                  onClick={() =>
                    handleDownload(
                      photos[currentImageIndex]?.url || "",
                      `property-${property._id}-image-${currentImageIndex + 1}.jpg`
                    )
                  }
                  size="sm"
                  variant="ghost"
                >
                  <Download className="mr-1 h-4 w-4" />
                  {isLoading ? "Downloading..." : "Download"}
                </Button>
                <Button
                  className="text-white hover:bg-white/20"
                  onClick={() =>
                    handleShare(photos[currentImageIndex]?.url || "")
                  }
                  size="sm"
                  variant="ghost"
                >
                  <Share2 className="mr-1 h-4 w-4" />
                  Share
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="border-white/20 bg-black/50 text-white">
                  {currentImageIndex + 1} / {photos.length}
                </Badge>
                <Button
                  className="text-white hover:bg-white/20"
                  onClick={closeLightbox}
                  size="icon"
                  variant="ghost"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Progress Bar for Slideshow */}
            {isSlideshow && (
              <div className="absolute top-16 right-4 left-4 z-10">
                <Progress
                  className="h-1"
                  value={((currentImageIndex + 1) / photos.length) * 100}
                />
              </div>
            )}

            {/* Main Carousel */}
            <Carousel
              className="h-full w-full"
              opts={{
                startIndex: currentImageIndex,
                loop: true,
              }}
              setApi={setLightboxApi}
            >
              <CarouselContent className="h-full">
                {photos.map((photo, index) => (
                  <CarouselItem className="h-full" key={photo.url || index}>
                    <div className="relative flex h-full w-full items-center justify-center p-8">
                      <div
                        className="relative max-h-full max-w-full"
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transition: "transform 0.3s ease-in-out",
                        }}
                      >
                        <Image
                          alt={photo.caption || `Property image ${index + 1}`}
                          className="max-h-full max-w-full object-contain"
                          height={800}
                          priority={index === currentImageIndex}
                          quality={95}
                          src={photo.url}
                          width={1200}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {photos.length > 1 && (
                <>
                  <CarouselPrevious className="-translate-y-1/2 absolute top-1/2 left-4 border-white/20 bg-black/50 text-white hover:bg-black/70" />
                  <CarouselNext className="-translate-y-1/2 absolute top-1/2 right-4 border-white/20 bg-black/50 text-white hover:bg-black/70" />
                </>
              )}
            </Carousel>

            {/* Bottom Info and Thumbnails */}
            <div className="absolute right-4 bottom-4 left-4 z-10">
              {/* Image Caption */}
              {photos[currentImageIndex]?.caption && (
                <div className="mb-4 text-center">
                  <Badge className="max-w-lg border-white/20 bg-black/70 text-white">
                    {photos[currentImageIndex].caption}
                  </Badge>
                </div>
              )}

              {/* Thumbnail Strip */}
              {photos.length > 1 && (
                <div className="flex justify-center">
                  <div className="flex max-w-full gap-2 overflow-x-auto rounded-lg bg-black/50 p-2">
                    {photos.map((photo, index) => (
                      <button
                        className={cn(
                          "relative h-16 w-20 shrink-0 overflow-hidden rounded border-2 transition-all duration-200",
                          index === currentImageIndex
                            ? "scale-110 border-white ring-2 ring-white/50"
                            : "border-white/30 hover:scale-105 hover:border-white/70"
                        )}
                        key={photo.url || index}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          lightboxApi?.scrollTo(index);
                        }}
                        type="button"
                      >
                        <Image
                          alt={`Thumbnail ${index + 1}`}
                          className="object-cover"
                          fill
                          sizes="80px"
                          src={photo.url}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
