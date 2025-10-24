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
import { Progress } from "@kaa/ui/components/progress";
import { Separator } from "@kaa/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Activity,
  BarChart3,
  Clock,
  Eye,
  Files,
  Settings,
  Shield,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

import {
  DocumentBulkActions,
  DocumentCategory,
  DocumentCategoryFilter,
  DocumentList,
  DocumentMetadataEditor,
  DocumentUploader,
  DocumentVerificationStatus,
  DocumentViewer,
  type IDocument,
  useDocumentStore,
} from "@/modules/documents";

// Mock analytics data
const mockAnalytics = {
  totalUploads: 1247,
  totalSize: "24.8 GB",
  averageProcessingTime: "2.3 hours",
  verificationRate: 89.5,
  categories: {
    [DocumentCategory.IDENTITY]: { count: 245, verified: 230 },
    [DocumentCategory.ADDRESS]: { count: 198, verified: 185 },
    [DocumentCategory.INCOME]: { count: 312, verified: 280 },
    [DocumentCategory.REFERENCES]: { count: 156, verified: 142 },
    [DocumentCategory.GENERAL]: { count: 298, verified: 265 },
    [DocumentCategory.OTHER]: { count: 38, verified: 32 },
  },
  recentActivity: [
    { type: "upload", document: "passport.pdf", time: "2 minutes ago" },
    {
      type: "verified",
      document: "bank-statement.pdf",
      time: "15 minutes ago",
    },
    { type: "rejected", document: "utility-bill.jpg", time: "1 hour ago" },
    { type: "upload", document: "contract.pdf", time: "2 hours ago" },
    { type: "verified", document: "id-card.pdf", time: "3 hours ago" },
  ],
};

/**
 * Complete Document Management Dashboard
 *
 * This example demonstrates a full-featured document management dashboard
 * integrating all document module components with analytics and activity tracking.
 */
export default function DocumentDashboard() {
  const { filter, setFilter, selectedDocuments, clearSelection } =
    useDocumentStore();

  const [activeTab, setActiveTab] = React.useState("overview");
  const [selectedDocument, setSelectedDocument] =
    React.useState<IDocument | null>(null);
  const [showUploader, setShowUploader] = React.useState(false);

  const handleUploadComplete = (files: File[]) => {
    toast.success(
      `Successfully uploaded ${files.length} file${files.length !== 1 ? "s" : ""}`
    );
    console.log("Upload complete:", files);
  };

  const handleDocumentView = (document: IDocument) => {
    setSelectedDocument(document);
    setActiveTab("viewer");
    toast.info(`Viewing: ${document.name}`);
  };

  const handleBulkAction = (
    action: string,
    documentIds: string[],
    parameters?: any
  ) => {
    toast.success(`${action.toUpperCase()}: ${documentIds.length} document(s)`);
    console.log("Bulk action:", { action, documentIds, parameters });
  };

  const getVerificationProgress = (category: DocumentCategory) => {
    const data = mockAnalytics.categories[category];
    return data ? (data.verified / data.count) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Files className="h-6 w-6" />
                <span>Document Management Dashboard</span>
              </CardTitle>
              <CardDescription>
                Complete document management solution with upload, verification,
                and analytics.
              </CardDescription>
            </div>
            <Button onClick={() => setShowUploader(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Files className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-bold text-2xl">
                  {mockAnalytics.totalUploads.toLocaleString()}
                </div>
                <div className="text-muted-foreground text-xs">
                  Total Documents
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-bold text-2xl">
                  {mockAnalytics.verificationRate}%
                </div>
                <div className="text-muted-foreground text-xs">
                  Verification Rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <div>
                <div className="font-bold text-2xl">
                  {mockAnalytics.totalSize}
                </div>
                <div className="text-muted-foreground text-xs">
                  Total Storage
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <div className="font-bold text-2xl">
                  {mockAnalytics.averageProcessingTime}
                </div>
                <div className="text-muted-foreground text-xs">
                  Avg Processing
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger className="flex items-center space-x-2" value="overview">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            className="flex items-center space-x-2"
            value="documents"
          >
            <Files className="h-4 w-4" />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center space-x-2" value="viewer">
            <Eye className="h-4 w-4" />
            <span>Viewer</span>
          </TabsTrigger>
          <TabsTrigger
            className="flex items-center space-x-2"
            value="verification"
          >
            <Shield className="h-4 w-4" />
            <span>Verification</span>
          </TabsTrigger>
          <TabsTrigger className="flex items-center space-x-2" value="settings">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent className="space-y-6" value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Category Verification Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Progress by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(mockAnalytics.categories).map(
                  ([category, data]) => (
                    <div className="space-y-2" key={category}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">
                          {category.replace("_", " ")}
                        </span>
                        <span>
                          {data.verified}/{data.count}
                        </span>
                      </div>
                      <Progress
                        className="h-2"
                        value={getVerificationProgress(
                          category as DocumentCategory
                        )}
                      />
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAnalytics.recentActivity.map((activity, index) => (
                    <div
                      className="flex items-center space-x-3 rounded-lg border p-2"
                      key={index.toString()}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          activity.type === "upload"
                            ? "bg-blue-500"
                            : activity.type === "verified"
                              ? "bg-green-500"
                              : "bg-red-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {activity.document}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {activity.time}
                        </div>
                      </div>
                      <Badge
                        className="text-xs"
                        variant={
                          activity.type === "upload"
                            ? "secondary"
                            : activity.type === "verified"
                              ? "default"
                              : "destructive"
                        }
                      >
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowUploader(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
                <Button
                  onClick={() => setActiveTab("verification")}
                  variant="outline"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Review Verification
                </Button>
                <Button
                  onClick={() => setActiveTab("documents")}
                  variant="outline"
                >
                  <Files className="mr-2 h-4 w-4" />
                  Browse Documents
                </Button>
                <Button
                  onClick={() => toast.info("Export functionality")}
                  variant="outline"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Export Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent className="space-y-6" value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Browse, filter, and manage all your documents in one place.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <DocumentCategoryFilter
                onCategoriesChange={(categories) =>
                  setFilter({
                    category: categories.length ? categories : undefined,
                    page: 1,
                  })
                }
                onStatusesChange={(statuses) =>
                  setFilter({
                    status: statuses.length ? statuses : undefined,
                    page: 1,
                  })
                }
                selectedCategories={filter.category || []}
                selectedStatuses={filter.status || []}
                showClearButton={true}
                showStatusFilter={true}
                variant="chips"
              />

              <Separator />

              {/* Bulk Actions */}
              <DocumentBulkActions
                onAction={handleBulkAction}
                onClearSelection={clearSelection}
                selectedDocuments={selectedDocuments}
                totalDocuments={mockAnalytics.totalUploads}
                variant="expanded"
              />

              <Separator />

              {/* Document List */}
              <DocumentList
                maxHeight="600px"
                onDocumentClick={handleDocumentView}
                showFilters={false}
                showHeader={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Viewer Tab */}
        <TabsContent className="space-y-6" value="viewer">
          <Card>
            <CardHeader>
              <CardTitle>Document Viewer</CardTitle>
              <CardDescription>
                {selectedDocument
                  ? `Viewing: ${selectedDocument.name}`
                  : "Select a document from the Documents tab to view it here"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDocument ? (
                <DocumentViewer
                  className="min-h-[600px] rounded-lg border"
                  document={selectedDocument}
                  enableAnnotations={true}
                  enableSearch={true}
                  isOpen={!!selectedDocument}
                  mode="embedded"
                  showSidebar={true}
                  showToolbar={true}
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Eye className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No document selected</p>
                  <p className="text-sm">
                    Go to the Documents tab and click on a document to view it
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent className="space-y-6" value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Document Verification Status</CardTitle>
              <CardDescription>
                Monitor and manage document verification across all categories.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentVerificationStatus
                onCategoryClick={(category) => {
                  setFilter({ category: [category], page: 1 });
                  setActiveTab("documents");
                  toast.info(
                    `Filtered to ${category.replace("_", " ")} documents`
                  );
                }}
                onRetryVerification={(id) => {
                  toast.info("Verification retry initiated");
                  console.log("Retry verification:", id);
                }}
                onStatusChange={(id, status, notes) => {
                  toast.success(`Status updated to ${status}`);
                  console.log("Status change:", { id, status, notes });
                }}
                showActions={true}
                view="detailed"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent className="space-y-6" value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Document Settings</CardTitle>
              <CardDescription>
                Configure document management preferences and metadata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDocument ? (
                <DocumentMetadataEditor
                  document={selectedDocument}
                  // mode="edit"
                  // showAdvancedFields={true}
                  // onUpdate={(id, updates) => {
                  // 	toast.success("Metadata updated successfully");
                  // 	console.log("Metadata update:", { id, updates });
                  // }}
                />
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Settings className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>No document selected for editing</p>
                  <p className="text-sm">
                    Select a document to edit its metadata
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-h-[80vh] w-full max-w-2xl overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Documents</CardTitle>
                <Button
                  onClick={() => setShowUploader(false)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DocumentUploader
                // onUpload={handleUploadComplete}
                maxFiles={10}
                onError={(error: Error) => toast.error(error.message)}
                // acceptedFileTypes={["pdf", "jpg", "jpeg", "png"]}
                // maxFileSize={10 * 1024 * 1024} // 10MB
                showPreview={true}
                // enableDragAndDrop={true}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="flex items-center space-x-2 font-medium text-sm">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics Overview</span>
              </h4>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• Real-time verification progress</li>
                <li>• Category-wise statistics</li>
                <li>• Recent activity tracking</li>
                <li>• Storage usage monitoring</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="flex items-center space-x-2 font-medium text-sm">
                <Files className="h-4 w-4" />
                <span>Document Management</span>
              </h4>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• Advanced filtering and search</li>
                <li>• Bulk operations support</li>
                <li>• Multiple view modes</li>
                <li>• Category-based organization</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="flex items-center space-x-2 font-medium text-sm">
                <Eye className="h-4 w-4" />
                <span>Document Viewer</span>
              </h4>
              <ul className="space-y-1 text-muted-foreground text-sm">
                <li>• Enhanced PDF viewing</li>
                <li>• Annotation support</li>
                <li>• Search functionality</li>
                <li>• Print and share options</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
