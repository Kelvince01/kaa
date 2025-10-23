"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Progress } from "@kaa/ui/components/progress";
import { CheckCircle, Pause, Play, Upload, XCircle } from "lucide-react";
import type { UploadStats } from "./types";

type UploadProgressProps = {
  stats: UploadStats;
  isUploading: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
};

export function UploadProgress({
  stats,
  isUploading,
  onPause,
  onResume,
  onCancel,
}: UploadProgressProps) {
  const overallProgress =
    stats.totalFiles > 0 ? (stats.uploadedFiles / stats.totalFiles) * 100 : 0;
  const sizeProgress =
    stats.totalSize > 0 ? (stats.uploadedSize / stats.totalSize) * 100 : 0;

  if (stats.totalFiles === 0) return null;

  return (
    <div className="mb-4 border-primary/20 bg-primary/5">
      <div className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <span className="font-medium">Upload Progress</span>
              <Badge
                variant={
                  isUploading
                    ? "default"
                    : stats.failedFiles > 0
                      ? "destructive"
                      : "secondary"
                }
              >
                {isUploading
                  ? "Uploading"
                  : stats.failedFiles > 0
                    ? "Some Failed"
                    : "Complete"}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {isUploading && (
                <>
                  <Button onClick={onPause} size="sm" variant="outline">
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button onClick={onCancel} size="sm" variant="outline">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
              {!isUploading && stats.failedFiles > 0 && (
                <Button onClick={onResume} size="sm" variant="outline">
                  <Play className="h-4 w-4" />
                  Retry Failed
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Files: {stats.uploadedFiles}/{stats.totalFiles}
              </span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress className="h-2" value={overallProgress} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Size: {formatBytes(stats.uploadedSize)}/
                {formatBytes(stats.totalSize)}
              </span>
              <span>{Math.round(sizeProgress)}%</span>
            </div>
            <Progress className="h-1" value={sizeProgress} />
          </div>

          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{stats.uploadedFiles} uploaded</span>
              </div>
              {stats.failedFiles > 0 && (
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>{stats.failedFiles} failed</span>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span>Uploading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
