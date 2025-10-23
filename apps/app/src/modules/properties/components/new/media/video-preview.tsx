"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card } from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import { cn } from "@kaa/ui/lib/utils";
import {
  Check,
  Clock,
  Edit3,
  Eye,
  FileVideo,
  Maximize,
  Pause,
  Play,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Video } from "./types";

type VideoPreviewProps = {
  videos: Video[];
  onVideoUpdate: (id: string, updates: Partial<Video>) => void;
  onVideoDelete: (id: string) => void;
  className?: string;
  showControls?: boolean;
  allowEditing?: boolean;
};

type VideoItemProps = {
  video: Video;
  onUpdate: (updates: Partial<Video>) => void;
  onDelete: () => void;
  showControls?: boolean;
  allowEditing?: boolean;
};

function VideoItem({
  video,
  onUpdate,
  onDelete,
  showControls = true,
  allowEditing = true,
}: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState(video.caption || "");
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Generate thumbnail from video
  const generateThumbnail = useCallback((videoElement: HTMLVideoElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!(ctx && videoElement)) return "";

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  // Auto-generate thumbnail when video loads
  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);

      // Generate thumbnail at 1 second or 10% of duration
      const seekTime = Math.min(1, videoRef.current.duration * 0.1);
      videoRef.current.currentTime = seekTime;
    }
  }, []);

  const handleVideoSeeked = useCallback(() => {
    if (videoRef.current && !video.thumbnail) {
      const thumbnailUrl = generateThumbnail(videoRef.current);
      if (thumbnailUrl) {
        onUpdate({ thumbnail: thumbnailUrl });
      }
      // Reset to beginning after thumbnail generation
      videoRef.current.currentTime = 0;
    }
  }, [video.thumbnail, generateThumbnail, onUpdate]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  }, []);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  const handleCaptionSave = useCallback(() => {
    onUpdate({ caption: captionValue });
    setIsEditingCaption(false);
  }, [captionValue, onUpdate]);

  const handleCaptionCancel = useCallback(() => {
    setCaptionValue(video.caption || "");
    setIsEditingCaption(false);
  }, [video.caption]);

  // Update caption value when video prop changes
  useEffect(() => {
    setCaptionValue(video.caption || "");
  }, [video.caption]);

  const getFileSize = useCallback((bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
  }, []);

  return (
    <Card
      className="group overflow-hidden transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video bg-black">
        {/* Video Element */}
        <video
          className="h-full w-full object-cover"
          muted={isMuted}
          onError={() => setThumbnailError(true)}
          onLoadedMetadata={handleVideoLoadedMetadata}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onSeeked={handleVideoSeeked}
          onTimeUpdate={handleTimeUpdate}
          preload="metadata"
          ref={videoRef}
          src={video.url}
        />

        {/* Thumbnail overlay when not playing */}
        {!isPlaying && video.thumbnail && !thumbnailError && (
          <div className="absolute inset-0">
            <Image
              alt={video.caption || "Video thumbnail"}
              className="h-full w-full object-cover"
              height={100}
              src={video.thumbnail}
              width={100}
            />
          </div>
        )}

        {/* Play button overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
              onClick={handlePlayPause}
              size="lg"
              variant="secondary"
            >
              <Play className="h-8 w-8 text-white" fill="white" />
            </Button>
          </div>
        )}

        {/* Video controls */}
        {showControls && (isPlaying || isHovered) && (
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={handlePlayPause}
                size="sm"
                variant="ghost"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              {/* Time progress */}
              <div className="flex flex-1 items-center gap-2 text-sm text-white">
                <span>{formatTime(currentTime)}</span>
                <div className="h-1 flex-1 rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Mute */}
              <Button
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={handleMute}
                size="sm"
                variant="ghost"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              {/* Fullscreen */}
              <Button
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={handleFullscreen}
                size="sm"
                variant="ghost"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            className="h-8 w-8 bg-white/10 p-0 backdrop-blur-sm hover:bg-white/20"
            onClick={() => window.open(video.url, "_blank")}
            size="sm"
            title="View in new tab"
            variant="secondary"
          >
            <Eye className="h-4 w-4 text-white" />
          </Button>
          {allowEditing && (
            <Button
              className="h-8 w-8 bg-red-500/10 p-0 backdrop-blur-sm hover:bg-red-500/20"
              onClick={onDelete}
              size="sm"
              title="Delete video"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 text-white" />
            </Button>
          )}
        </div>

        {/* Upload progress */}
        {video.uploadProgress !== undefined && video.uploadProgress < 100 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="mb-2 h-2 w-32 rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${video.uploadProgress}%` }}
                />
              </div>
              <div className="text-sm">{video.uploadProgress}% uploaded</div>
            </div>
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="space-y-3 p-4">
        {/* Caption */}
        {isEditingCaption ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              className="flex-1 text-sm"
              onChange={(e) => setCaptionValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCaptionSave();
                if (e.key === "Escape") handleCaptionCancel();
              }}
              placeholder="Add video caption..."
              value={captionValue}
            />
            <Button
              className="h-8 w-8 p-0"
              onClick={handleCaptionSave}
              size="sm"
              variant="ghost"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={handleCaptionCancel}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "cursor-pointer text-sm",
              allowEditing && "hover:text-primary",
              !video.caption && "text-muted-foreground italic"
            )}
            onClick={() => allowEditing && setIsEditingCaption(true)}
          >
            {video.caption || "Click to add caption"}
            {allowEditing && <Edit3 className="ml-1 inline h-3 w-3" />}
          </div>
        )}

        {/* Video metadata */}
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
          {duration > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(duration)}</span>
            </div>
          )}
          {video.metadata?.size && (
            <div className="flex items-center gap-1">
              <FileVideo className="h-3 w-3" />
              <span>{getFileSize(video.metadata.size)}</span>
            </div>
          )}
          {video.metadata?.format && (
            <Badge className="h-5 text-xs" variant="outline">
              {video.metadata.format.replace("video/", "").toUpperCase()}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

export function VideoPreview({
  videos,
  onVideoUpdate,
  onVideoDelete,
  className,
  showControls = true,
  allowEditing = true,
}: VideoPreviewProps) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">
          Uploaded Videos ({videos.length})
        </h4>
        <Badge className="text-xs" variant="secondary">
          {videos.length} video{videos.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoItem
            allowEditing={allowEditing}
            key={video.id}
            onDelete={() => onVideoDelete(video.id)}
            onUpdate={(updates) => onVideoUpdate(video.id, updates)}
            showControls={showControls}
            video={video}
          />
        ))}
      </div>
    </div>
  );
}
