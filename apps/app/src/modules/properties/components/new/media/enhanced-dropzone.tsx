"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Progress } from "@kaa/ui/components/progress";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertCircle,
  Camera,
  Cloud,
  FileImage,
  ImageIcon,
  MapIcon,
  Upload,
  VideoIcon,
  X,
  Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";

type MediaType = "photos" | "videos" | "virtual-tour" | "floor-plan" | "epc";

type FileValidationError = {
  file: File;
  error: string;
};

type EnhancedDropzoneProps = {
  onDropAction: (files: File[]) => void;
  onUrlSubmitAction?: (url: string) => void;
  mediaType: MediaType;
  accept?: string;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  quality?: "high" | "medium" | "low";
};

const mediaTypeConfig = {
  photos: {
    icon: ImageIcon,
    label: "Property Photos",
    description: "Upload high-quality images",
    tips: [
      "Use natural lighting",
      "Capture multiple angles",
      "Include exterior and interior shots",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: ["JPG", "JPEG", "PNG", "WEBP"],
  },
  videos: {
    icon: VideoIcon,
    label: "Property Videos",
    description: "Upload video tours",
    tips: [
      "Keep videos under 2 minutes",
      "Use steady camera movements",
      "Capture good audio",
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    acceptedFormats: ["MP4", "WEBM", "MOV"],
  },
  "virtual-tour": {
    icon: MapIcon,
    label: "Virtual Tour",
    description: "Add 360° virtual tour",
    tips: [
      "Use professional virtual tour platforms",
      "Test the tour before submitting",
    ],
    maxSize: 0,
    acceptedFormats: ["URL"],
  },
  "floor-plan": {
    icon: FileImage,
    label: "Floor Plan",
    description: "Upload property layout",
    tips: [
      "Ensure measurements are visible",
      "Use high contrast",
      "Include room labels",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: ["PDF", "JPG", "JPEG", "PNG", "WEBP"],
  },
  epc: {
    icon: Zap,
    label: "EPC Certificate",
    description: "Energy Performance Certificate",
    tips: [
      "Ensure certificate is current",
      "Upload full document",
      "Check readability",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: ["PDF", "JPG", "JPEG", "PNG", "WEBP"],
  },
};

export function EnhancedDropzone({
  onDropAction,
  onUrlSubmitAction,
  mediaType,
  accept,
  multiple = false,
  className,
  disabled = false,
  maxFiles = 50,
  maxFileSize,
  quality = "high",
}: EnhancedDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    FileValidationError[]
  >([]);
  const [showTips, setShowTips] = useState(false);

  const config = mediaTypeConfig[mediaType];
  const IconComponent = config.icon;
  const effectiveMaxSize = maxFileSize || config.maxSize;

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const validateFiles = useCallback(
    (files: File[]): FileValidationError[] => {
      const errors: FileValidationError[] = [];

      for (const file of files) {
        // Size validation
        if (effectiveMaxSize > 0 && file.size > effectiveMaxSize) {
          errors.push({
            file,
            error: `File too large. Max size: ${(effectiveMaxSize / (1024 * 1024)).toFixed(1)}MB`,
          });
        }

        // Type validation
        const fileExtension = file.name.split(".").pop()?.toUpperCase();
        if (fileExtension && !config.acceptedFormats.includes(fileExtension)) {
          errors.push({
            file,
            error: `Unsupported format. Accepted: ${config.acceptedFormats.join(", ")}`,
          });
        }

        // Additional validations based on media type
        if (mediaType === "photos" && !file.type.startsWith("image/")) {
          errors.push({ file, error: "Only image files are allowed" });
        }

        if (mediaType === "videos" && !file.type.startsWith("video/")) {
          errors.push({ file, error: "Only video files are allowed" });
        }
      }

      return errors;
    },
    [mediaType]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const errors = validateFiles(files);

      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      setValidationErrors([]);
      onDropAction(files);
    },
    [disabled, validateFiles, onDropAction]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        const errors = validateFiles(files);

        if (errors.length > 0) {
          setValidationErrors(errors);
          return;
        }

        setValidationErrors([]);
        onDropAction(files);
      }
    },
    [validateFiles, onDropAction]
  );

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim() && onUrlSubmitAction) {
      // Basic URL validation
      try {
        new URL(urlInput.trim());
        onUrlSubmitAction(urlInput.trim());
        setUrlInput("");
      } catch {
        setValidationErrors([
          { file: new File([], ""), error: "Please enter a valid URL" },
        ]);
      }
    }
  }, [urlInput, onUrlSubmitAction]);

  // Virtual tour URL input
  if (mediaType === "virtual-tour") {
    return (
      <div
        className={cn(
          "rounded-lg border-2 border-dashed p-8 transition-colors",
          className
        )}
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <IconComponent className="h-8 w-8 text-primary" />
          </div>

          <div>
            <h3 className="mb-2 font-semibold text-lg">{config.label}</h3>
            <p className="mb-4 text-muted-foreground">{config.description}</p>
          </div>

          <div className="flex w-full max-w-md gap-2">
            <input
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://matterport.com/... or other 360° tour URL"
              type="url"
              value={urlInput}
            />
            <Button disabled={!urlInput.trim()} onClick={handleUrlSubmit}>
              Add Tour
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowTips(!showTips)}
              size="sm"
              variant="ghost"
            >
              {showTips ? "Hide" : "Show"} Tips
            </Button>
          </div>

          {showTips && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {config.tips.map((tip, index) => (
                    <li key={index.toString()}>{tip}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-muted-foreground text-xs">
            Supports: Matterport, Kuula, Roundme, and other 360° platforms
          </p>
        </div>

        {validationErrors.length > 0 && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationErrors[0]?.error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main dropzone */}
      <div
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200",
          isDragOver && !disabled
            ? "scale-[1.02] border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "pointer-events-none cursor-not-allowed opacity-50"
        )}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:pointer-events-none disabled:cursor-not-allowed"
          disabled={disabled}
          multiple={multiple}
          onChange={handleFileInput}
          type="file"
        />

        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div
            className={cn(
              "mb-4 rounded-full p-4 transition-colors",
              isDragOver ? "bg-primary/20" : "bg-primary/10"
            )}
          >
            {isDragOver ? (
              <Cloud className="h-8 w-8 text-primary" />
            ) : (
              <IconComponent className="h-8 w-8 text-primary" />
            )}
          </div>

          <h3 className="mb-2 font-semibold text-lg">
            {disabled
              ? "Uploading..."
              : isDragOver
                ? "Drop files here"
                : `Upload ${config.label}`}
          </h3>

          <p className="mb-4 text-muted-foreground">{config.description}</p>

          <div className="flex gap-2">
            <Button disabled={disabled} type="button" variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
            <Button
              onClick={() => setShowTips(!showTips)}
              size="sm"
              type="button"
              variant="ghost"
            >
              {showTips ? "Hide" : "Show"} Tips
            </Button>
          </div>

          {/* File format info */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {config.acceptedFormats.map((format) => (
              <Badge className="text-xs" key={format} variant="secondary">
                {format}
              </Badge>
            ))}
          </div>

          <p className="mt-2 text-muted-foreground text-xs">
            Max size:{" "}
            {effectiveMaxSize > 0
              ? `${(effectiveMaxSize / (1024 * 1024)).toFixed(1)}MB`
              : "No limit"}{" "}
            • Max files: {maxFiles}
          </p>
        </div>

        {/* Upload progress */}
        {uploadProgress !== null && (
          <div className="absolute inset-x-4 bottom-4">
            <Progress className="h-2" value={uploadProgress} />
            <p className="mt-1 text-center text-muted-foreground text-sm">
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Tips section */}
      {showTips && (
        <Alert>
          <Camera className="h-4 w-4" />
          <AlertDescription>
            <div className="mb-2 font-medium">Pro Tips:</div>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {config.tips.map((tip, index) => (
                <li key={index.toString()}>{tip}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="mb-2 font-medium">Upload Errors:</div>
            <ul className="space-y-1 text-sm">
              {validationErrors.map((error, index) => (
                <li
                  className="flex items-center justify-between"
                  key={index.toString()}
                >
                  <span>
                    {error.file.name}: {error.error}
                  </span>
                  <Button
                    onClick={() =>
                      setValidationErrors((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Quality settings for photos */}
      {mediaType === "photos" && !disabled && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
          <div>
            <p className="font-medium text-sm">Upload Quality</p>
            <p className="text-muted-foreground text-xs">
              Higher quality = larger file sizes
            </p>
          </div>
          <div className="flex gap-2">
            {["high", "medium", "low"].map((q) => (
              <Button
                key={q}
                onClick={() => {
                  /* Handle quality change */
                }}
                size="sm"
                variant={quality === q ? "default" : "outline"}
              >
                {q.charAt(0).toUpperCase() + q.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
