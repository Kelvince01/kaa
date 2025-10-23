export type Photo = {
  id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
  tags: string[];
  quality?: {
    score: number;
    description?: "excellent" | "good" | "fair" | "poor";
  };
  uploadProgress?: number;
  file?: File;
  thumbnail?: string;
  metadata?: {
    size: number;
    dimensions: { width: number; height: number };
    format: string;
    location?: { lat: number; lng: number };
  };
};

export type Video = {
  id: string;
  url: string;
  caption?: string;
  thumbnail?: string;
  duration?: number;
  uploadProgress?: number;
  file?: File;
  metadata?: {
    size: number;
    format: string;
    duration: number;
  };
};

export type MediaFormData = {
  photos: Photo[];
  videos: Video[];
  virtualTour?: string;
  floorPlan?: {
    id: string;
    url: string;
    caption?: string;
    uploadProgress?: number;
  };
  epcImage?: {
    id: string;
    url: string;
    caption?: string;
    rating?: string;
    uploadProgress?: number;
  };
};

export type UploadStats = {
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  totalSize: number;
  uploadedSize: number;
};
