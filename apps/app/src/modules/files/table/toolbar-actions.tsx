"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import type { Table } from "@tanstack/react-table";
import { Download, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { dialog } from "@/components/common/dialoger/state";
import { SearchField } from "@/components/search-field";
import { exportTableToCSV } from "@/lib/export";
import { FileUploader } from "../components/file-uploader";
import type { FileType } from "../file.type";
import RemoveFilesForm from "./remove-files-form";

type FilesTableToolbarActionsProps = {
  table: Table<FileType>;
};

export function FilesTableToolbarActions({
  table,
}: FilesTableToolbarActionsProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const selectedFiles = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const hasSelectedFiles = selectedFiles.length > 0;

  const openRemoveDialog = () => {
    dialog(<RemoveFilesForm files={selectedFiles} organizationId={""} />, {
      className: "max-w-xl",
      title: "Remove files",
      description: "Are you sure you want to remove these files?",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <SearchField placeholder="Search files" />

      {hasSelectedFiles ? (
        <Button onClick={openRemoveDialog} size="sm">
          <Trash className="mr-2 h-4 w-4" />
          Remove
        </Button>
      ) : null}

      <Dialog onOpenChange={setIsUploadModalOpen} open={isUploadModalOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add File
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <FileUploader
            accept={{
              "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
              "application/pdf": [".pdf"],
              "application/msword": [".doc"],
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                [".docx"],
              "text/*": [".txt", ".csv"],
            }}
            maxSize={10 * 1024 * 1024}
            multiple={true}
            onSuccess={() => {
              setIsUploadModalOpen(false);
              toast.success("Files uploaded successfully");
            }} // 10MB
          />
        </DialogContent>
      </Dialog>

      <Button
        onClick={() =>
          exportTableToCSV(table, {
            filename: `users-${new Date().toISOString().split("T")[0]}`,
            excludeColumns: ["select", "actions"],
          })
        }
        size="sm"
        variant="outline"
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </div>
  );
}
