import { Button } from "@kaa/ui/components/button";
import { Progress } from "@kaa/ui/components/progress";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useUploadFile } from "../file.queries";
import type { FileUploadInput } from "../file.type";

type FileUploaderProps = {
  onSuccess?: () => void;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  multiple?: boolean;
};

export function FileUploader({
  onSuccess,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  },
  multiple = false,
}: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const { mutateAsync: upload } = useUploadFile();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        setIsUploading(true);

        for (const file of acceptedFiles) {
          const uploadData: FileUploadInput = {
            file,
            description: file.name,
          };

          await upload(uploadData, {
            // onUploadProgress: (progressEvent) => {
            // 	const progress = progressEvent.total
            // 		? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            // 		: 0;
            // 	setUploadProgress(progress);
            // },
          });
        }

        toast.success(
          acceptedFiles.length === 1
            ? "File uploaded successfully"
            : `${acceptedFiles.length} files uploaded successfully`
        );
        onSuccess?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to upload file(s)"
        );
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [upload, onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept,
    multiple,
    disabled: isUploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragActive ? "border-primary bg-primary/10" : "border-border"}
                    ${isUploading ? "pointer-events-none opacity-50" : ""}
                `}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">Uploading...</p>
            <Progress className="w-full" value={uploadProgress} />
          </div>
        ) : isDragActive ? (
          <p className="text-muted-foreground text-sm">
            Drop the files here...
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Drag & drop files here, or click to select files
            </p>
            <Button type="button" variant="outline">
              Select Files
            </Button>
            <p className="text-muted-foreground text-xs">
              Maximum file size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
