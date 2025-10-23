"use client";

import { useCallback, useState } from "react";
import type { UploadStats } from "./types";

export function useMediaUpload() {
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    totalFiles: 0,
    uploadedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    uploadedSize: 0,
  });

  const [isUploading, setIsUploading] = useState(false);

  const compressImage = useCallback(
    async (file: File): Promise<File> =>
      new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          const maxWidth = 1920;
          const maxHeight = 1080;
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.8
          );
        };

        img.src = URL.createObjectURL(file);
      }),
    []
  );

  const analyzeImageQuality = useCallback(
    (file: File): Promise<"excellent" | "good" | "fair" | "poor"> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          // Simple quality analysis based on file size and dimensions
          const pixelCount = img.width * img.height;
          const bytesPerPixel = file.size / pixelCount;

          if (bytesPerPixel > 3 && img.width >= 1920) resolve("excellent");
          else if (bytesPerPixel > 2 && img.width >= 1280) resolve("good");
          else if (bytesPerPixel > 1 && img.width >= 800) resolve("fair");
          else resolve("poor");
        };
        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  const uploadFile = useCallback(
    async (
      file: File,
      onProgress: (progress: number) => void
    ): Promise<string> => {
      return await new Promise((resolve) => {
        // Simulate upload with progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            // Return a mock URL - in real app, this would be the actual uploaded URL
            resolve(
              `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(file.name)}`
            );
          }
          onProgress(progress);
        }, 200);
      });
    },
    []
  );

  return {
    uploadStats,
    isUploading,
    compressImage,
    analyzeImageQuality,
    uploadFile,
    setIsUploading,
    setUploadStats,
  };
}
