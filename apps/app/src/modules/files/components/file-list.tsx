import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  Edit,
  Eye,
  FileIcon,
  MoreVertical,
  Trash,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteFile } from "../file.queries";
import type { FileType } from "../file.type";

type FileListProps = {
  files: FileType[];
  onEdit?: (file: FileType) => void;
  onView?: (file: FileType) => void;
};

export function FileList({ files, onEdit, onView }: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { mutateAsync: deleteFile } = useDeleteFile();

  const handleDelete = async (file: FileType) => {
    try {
      setDeletingId(file._id);
      await deleteFile(file._id);
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (file: FileType) => {
    window.open(file.url, "_blank");
  };

  if (!files.length) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No files uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          className="flex items-center justify-between rounded-lg border bg-card p-4"
          key={file._id}
        >
          <div className="flex items-center space-x-4">
            <div className="rounded-md bg-muted p-2">
              <FileIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-muted-foreground text-sm">
                {file?.createdAt &&
                  formatDistanceToNow(new Date(file?.createdAt), {
                    addSuffix: true,
                  })}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={deletingId === file._id}
                size="icon"
                variant="ghost"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(file)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleDownload(file)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(file)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(file)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
