"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { FileText, Upload } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import { DocumentCategory, DocumentUploader } from "../";

/**
 * Basic Document Upload Example
 *
 * This example demonstrates the basic usage of DocumentUploader
 * with drag & drop functionality, file validation, and upload callbacks.
 */
export function BasicUploadExample() {
  const [uploadCount, setUploadCount] = React.useState(0);
  const [recentUploads, setRecentUploads] = React.useState<string[]>([]);

  const handleUploadSuccess = (documentId: string) => {
    setUploadCount((prev) => prev + 1);
    setRecentUploads((prev) => [documentId, ...prev.slice(0, 4)]);
    toast.success(
      `Document uploaded successfully! ID: ${documentId.slice(-8)}`
    );
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload failed:", error);
    toast.error(`Upload failed: ${error.message}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Basic Document Upload</span>
          </CardTitle>
          <CardDescription>
            Simple document uploader with drag & drop functionality and file
            validation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic uploader */}
          <DocumentUploader
            allowBatch={true}
            autoVerify={false}
            category={DocumentCategory.GENERAL}
            maxFiles={3}
            onError={handleUploadError}
            onSuccess={handleUploadSuccess}
            showMetadata={true}
            showPreview={true}
          />

          {/* Upload stats */}
          {uploadCount > 0 && (
            <div className="flex items-center space-x-4 border-t pt-4">
              <Badge
                className="flex items-center space-x-1"
                variant="secondary"
              >
                <FileText className="h-3 w-3" />
                <span>{uploadCount} documents uploaded</span>
              </Badge>

              {recentUploads.length > 0 && (
                <div className="text-muted-foreground text-sm">
                  Recent: {recentUploads.map((id) => id.slice(-8)).join(", ")}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            {`import { DocumentUploader, DocumentCategory } from "@/modules/documents";

function BasicUpload() {
  return (
    <DocumentUploader
      category={DocumentCategory.GENERAL}
      onSuccess={(id) => console.log('Uploaded:', id)}
      onError={(error) => console.error('Failed:', error)}
      allowBatch={true}
      maxFiles={3}
      showMetadata={true}
      showPreview={true}
      autoVerify={false}
    />
  );
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
