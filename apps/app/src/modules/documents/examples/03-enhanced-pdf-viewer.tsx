"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Separator } from "@kaa/ui/components/separator";
import { Eye, FileText, Maximize } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import {
  DocumentCategory,
  DocumentPriority,
  DocumentStatus,
  DocumentViewer,
  type IDocument,
} from "../";

// Mock document for demonstration
const mockDocument: IDocument = {
  _id: "doc-123",
  name: "Sample Contract.pdf",
  size: 2_048_576,
  mimeType: "application/pdf",
  category: DocumentCategory.GENERAL,
  status: DocumentStatus.VERIFIED,
  tenant: "tenant-123",
  type: "pdf",
  priority: DocumentPriority.HIGH,
  uploadedAt: new Date().toISOString(),
  file: "/mock/sample-contract.pdf",
  metadata: {
    pages: 15,
    creator: "Adobe Acrobat",
    subject: "Service Agreement",
    keywords: ["contract", "agreement", "service"],
  },
  tags: ["important", "contract", "legal"],
  // version: 1,
  // isPublic: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Enhanced PDF Viewer Example
 *
 * This example demonstrates the advanced PDF viewing capabilities
 * including annotations, search, zoom controls, and document navigation.
 */
export function EnhancedPDFViewerExample() {
  const [viewerMode, setViewerMode] = React.useState<"embedded" | "modal">(
    "embedded"
  );
  const [annotations, setAnnotations] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  const handleAnnotationAdd = (annotation: any) => {
    setAnnotations((prev) => [
      ...prev,
      { ...annotation, id: Date.now().toString() },
    ]);
    toast.success(`Added ${annotation.type} annotation`);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    toast.info(term ? `Searching for: "${term}"` : "Search cleared");
  };

  const handleViewerAction = (action: string, data?: any) => {
    switch (action) {
      case "download":
        toast.success("Download started");
        break;
      case "print":
        toast.info("Print dialog opened");
        break;
      case "share":
        toast.info("Share options opened");
        break;
      case "fullscreen":
        toast.info("Entered fullscreen mode");
        break;
      case "zoom":
        toast.info(`Zoom level: ${data.level}%`);
        break;
      case "rotate":
        toast.info(`Rotated to ${data.angle}°`);
        break;
      case "page":
        toast.info(`Navigated to page ${data.page}`);
        break;
      default:
        console.log("Viewer action:", action, data);
    }
  };

  const resetViewer = () => {
    setAnnotations([]);
    setSearchTerm("");
    toast.info("Viewer reset");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Enhanced PDF Viewer</span>
          </CardTitle>
          <CardDescription>
            Advanced PDF viewing with annotations, search, zoom controls, and
            document navigation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{mockDocument.name}</Badge>
              <Badge variant="secondary">
                {(mockDocument.metadata as any)?.pages} pages
              </Badge>
              <Badge variant="outline">
                {(mockDocument.size / (1024 * 1024)).toFixed(1)} MB
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setViewerMode("embedded")}
                size="sm"
                variant={viewerMode === "embedded" ? "default" : "outline"}
              >
                <Eye className="mr-1 h-4 w-4" />
                Embedded
              </Button>
              <Button
                onClick={() => setViewerMode("modal")}
                size="sm"
                variant={viewerMode === "modal" ? "default" : "outline"}
              >
                <Maximize className="mr-1 h-4 w-4" />
                Modal
              </Button>
              <Button onClick={resetViewer} size="sm" variant="outline">
                Reset
              </Button>
            </div>
          </div>

          <Separator />

          {/* Document Viewer */}
          <div className="rounded-lg border">
            <DocumentViewer
              className="min-h-[600px]"
              // mode={viewerMode}
              // onAnnotationAdd={handleAnnotationAdd}
              // onSearch={handleSearch}
              // onAction={handleViewerAction}
              // showToolbar={true}
              // showSidebar={true}
              // enableAnnotations={true}
              // enableSearch={true}
              document={mockDocument}
            />
          </div>

          {/* Viewer Statistics */}
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-blue-600">
                {annotations.length}
              </div>
              <div className="text-muted-foreground text-xs">Annotations</div>
            </div>
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-green-600">
                {searchTerm ? 1 : 0}
              </div>
              <div className="text-muted-foreground text-xs">
                Active Searches
              </div>
            </div>
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-purple-600">
                {(mockDocument.metadata as any)?.pages || 0}
              </div>
              <div className="text-muted-foreground text-xs">Total Pages</div>
            </div>
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-orange-600">100%</div>
              <div className="text-muted-foreground text-xs">Zoom Level</div>
            </div>
          </div>

          {/* Annotations List */}
          {annotations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recent Annotations</h4>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {annotations.slice(-5).map((annotation) => (
                    <div
                      className="flex items-center justify-between rounded bg-muted p-2 text-sm"
                      key={annotation.id}
                    >
                      <span>
                        {annotation.type} on page {annotation.page || 1}
                      </span>
                      <Badge className="text-xs" variant="outline">
                        {annotation.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Viewer Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Navigation & Viewing</h4>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• Zoom in/out and fit-to-width</li>
                <li>• Page navigation with thumbnails</li>
                <li>• Rotation (90° increments)</li>
                <li>• Fullscreen mode</li>
                <li>• Multiple view modes (fit, width, height)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Annotations & Search</h4>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• Text highlighting and notes</li>
                <li>• Shape annotations (rectangle, arrow)</li>
                <li>• Text search with highlighting</li>
                <li>• Annotation management sidebar</li>
                <li>• Export annotations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Actions & Sharing</h4>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• Download original document</li>
                <li>• Print with annotations</li>
                <li>• Share via link or email</li>
                <li>• Copy text selections</li>
                <li>• Document information panel</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>
                  • <kbd className="rounded bg-muted px-1">+</kbd> /{" "}
                  <kbd className="rounded bg-muted px-1">-</kbd> Zoom
                </li>
                <li>
                  • <kbd className="rounded bg-muted px-1">↑</kbd> /{" "}
                  <kbd className="rounded bg-muted px-1">↓</kbd> Navigate pages
                </li>
                <li>
                  • <kbd className="rounded bg-muted px-1">F</kbd> Fullscreen
                </li>
                <li>
                  • <kbd className="rounded bg-muted px-1">Ctrl+F</kbd> Search
                </li>
                <li>
                  • <kbd className="rounded bg-muted px-1">R</kbd> Rotate
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            {`import { DocumentViewer } from "@/modules/documents";

function PDFViewerPage() {
  const [annotations, setAnnotations] = useState([]);
  
  const handleAnnotationAdd = (annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  };
  
  const handleViewerAction = (action, data) => {
    console.log('Viewer action:', action, data);
  };
  
  return (
    <DocumentViewer
      document={document}
      mode="embedded" // or "modal"
      onAnnotationAdd={handleAnnotationAdd}
      onSearch={(term) => console.log('Search:', term)}
      onAction={handleViewerAction}
      showToolbar={true}
      showSidebar={true}
      enableAnnotations={true}
      enableSearch={true}
      className="min-h-[600px]"
    />
  );
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
