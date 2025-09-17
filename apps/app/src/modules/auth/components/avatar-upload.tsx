"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Button } from "@kaa/ui/components/button";
import { Camera, Loader2 } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadAvatar } from "../auth.queries";

type AvatarUploadProps = {
  currentAvatar?: string;
  userName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function AvatarUpload({
  currentAvatar,
  userName,
  size = "md",
  className = "",
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatarMutation = useUploadAvatar();

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadAvatarMutation.mutate(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayAvatar = preview || currentAvatar;
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="group relative">
        <Avatar
          className={`${sizeClasses[size]} cursor-pointer transition-opacity group-hover:opacity-75`}
        >
          {displayAvatar ? (
            <AvatarImage alt="Profile picture" src={displayAvatar} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-lg text-white">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Upload button overlay */}
        <Button
          className="absolute right-0 bottom-0 h-8 w-8 rounded-full shadow-md"
          disabled={uploadAvatarMutation.isPending}
          onClick={handleClick}
          size="icon"
          type="button"
          variant="secondary"
        >
          {uploadAvatarMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>

        {/* Hidden file input */}
        <input
          accept="image/*"
          className="hidden"
          disabled={uploadAvatarMutation.isPending}
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />
      </div>

      {uploadAvatarMutation.isPending && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
