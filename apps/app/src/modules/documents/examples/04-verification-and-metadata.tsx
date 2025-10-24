"use client";

import { Alert, AlertDescription, AlertTitle } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck,
  Save,
  Settings,
  Shield,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";

import {
  DocumentCategory,
  DocumentMetadataEditor,
  DocumentPriority,
  DocumentStatus,
  DocumentVerificationStatus,
  type IDocument,
} from "../";

// Mock documents with different verification states
const mockDocuments: IDocument[] = [
  {
    _id: "doc-1",
    name: "ID Card.pdf",
    size: 1_048_576,
    mimeType: "application/pdf",
    category: DocumentCategory.IDENTITY,
    status: DocumentStatus.VERIFIED,
    uploadedAt: new Date(Date.now() - 86_400_000).toISOString(), // 1 day ago
    file: "/mock/id-card.pdf",
    tenant: "tenant-123",
    type: "pdf",
    priority: DocumentPriority.HIGH,
    metadata: {
      pages: 2,
      creator: "Scanner App",
      verificationNotes: "Document verified successfully",
    },
    tags: ["identity", "verified"],
    // version: 1,
    // isPublic: false,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    _id: "doc-2",
    name: "Bank Statement.pdf",
    size: 2_097_152,
    mimeType: "application/pdf",
    category: DocumentCategory.INCOME,
    status: DocumentStatus.PENDING,
    uploadedAt: new Date(Date.now() - 3_600_000).toISOString(), // 1 hour ago
    file: "/mock/bank-statement.pdf",
    tenant: "tenant-123",
    type: "pdf",
    priority: DocumentPriority.HIGH,
    metadata: {
      pages: 5,
      creator: "Bank System",
    },
    tags: ["income", "pending"],
    // version: 1,
    // isPublic: false,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    updatedAt: new Date(Date.now() - 1_800_000).toISOString(),
  },
  {
    _id: "doc-3",
    name: "Proof of Address.jpg",
    size: 524_288,
    mimeType: "image/jpeg",
    category: DocumentCategory.ADDRESS,
    status: DocumentStatus.REJECTED,
    uploadedAt: new Date(Date.now() - 7_200_000).toISOString(), // 2 hours ago
    file: "/mock/proof-of-address.jpg",
    tenant: "tenant-123",
    type: "image",
    priority: DocumentPriority.HIGH,
    metadata: {
      width: 1920,
      height: 1080,
      verificationNotes:
        "Image quality too low. Please upload a clearer image.",
    },
    tags: ["address", "rejected", "low-quality"],
    // version: 2,
    // isPublic: false,
    createdAt: new Date(Date.now() - 7_200_000).toISOString(),
    updatedAt: new Date(Date.now() - 1_800_000).toISOString(),
  },
];

/**
 * Document Verification and Metadata Management Example
 *
 * This example demonstrates document verification status tracking
 * and comprehensive metadata editing capabilities.
 */
export function VerificationAndMetadataExample() {
  const [selectedDocument, setSelectedDocument] =
    React.useState<IDocument | null>(mockDocuments[0] || null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [verificationView, setVerificationView] = React.useState<
    "compact" | "detailed"
  >("detailed");

  const handleDocumentSelect = (document: IDocument) => {
    setSelectedDocument(document);
    setIsEditing(false);
    toast.info(`Selected: ${document.name}`);
  };

  const handleMetadataUpdate = (
    documentId: string,
    updates: Partial<IDocument>
  ) => {
    toast.success("Metadata updated successfully");
    console.log("Metadata update:", { documentId, updates });

    // Update selected document if it's the one being edited
    if (selectedDocument?._id === documentId) {
      setSelectedDocument({ ...selectedDocument, ...updates });
    }
  };

  const handleStatusChange = (
    documentId: string,
    newStatus: DocumentStatus,
    notes?: string
  ) => {
    toast.success(`Status changed to ${newStatus}`);
    console.log("Status change:", { documentId, newStatus, notes });
  };

  const handleRetryVerification = (documentId: string) => {
    toast.info("Verification retry initiated");
    console.log("Retry verification:", documentId);
  };

  const getVerificationStats = () => {
    const stats = {
      total: mockDocuments.length,
      verified: mockDocuments.filter(
        (d) => d.status === DocumentStatus.VERIFIED
      ).length,
      pending: mockDocuments.filter((d) => d.status === DocumentStatus.PENDING)
        .length,
      rejected: mockDocuments.filter(
        (d) => d.status === DocumentStatus.REJECTED
      ).length,
      processing: mockDocuments.filter(
        (d) => d.status === DocumentStatus.PROCESSING
      ).length,
    };
    return stats;
  };

  const stats = getVerificationStats();

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Document Verification Overview</span>
          </CardTitle>
          <CardDescription>
            Monitor verification status and manage document metadata across all
            uploaded documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-green-600">
                {stats.verified}
              </div>
              <div className="text-muted-foreground text-xs">Verified</div>
            </div>
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-yellow-600">
                {stats.pending}
              </div>
              <div className="text-muted-foreground text-xs">Pending</div>
            </div>
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-red-600">
                {stats.rejected}
              </div>
              <div className="text-muted-foreground text-xs">Rejected</div>
            </div>
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-gray-600">
                {stats.total}
              </div>
              <div className="text-muted-foreground text-xs">Total</div>
            </div>
          </div>

          {/* Verification Status Component */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-sm">Verification Status</h3>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setVerificationView("compact")}
                size="sm"
                variant={verificationView === "compact" ? "default" : "outline"}
              >
                Compact
              </Button>
              <Button
                onClick={() => setVerificationView("detailed")}
                size="sm"
                variant={
                  verificationView === "detailed" ? "default" : "outline"
                }
              >
                Detailed
              </Button>
            </div>
          </div>

          <DocumentVerificationStatus
          // view={verificationView}
          // onStatusChange={handleStatusChange}
          // onRetryVerification={handleRetryVerification}
          // showActions={true}
          />
        </CardContent>
      </Card>

      {/* Document Selection and Metadata Editor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Document Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileCheck className="h-5 w-5" />
              <span>Document Selection</span>
            </CardTitle>
            <CardDescription>
              Select a document to view and edit its metadata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockDocuments.map((doc) => (
                <div
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    selectedDocument?._id === doc._id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  key={doc._id}
                  onClick={() => handleDocumentSelect(doc)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{doc.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {doc.category} • {(doc.size / (1024 * 1024)).toFixed(1)}{" "}
                        MB
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className="text-xs"
                        variant={
                          doc.status === DocumentStatus.VERIFIED
                            ? "default"
                            : doc.status === DocumentStatus.PENDING
                              ? "secondary"
                              : doc.status === DocumentStatus.REJECTED
                                ? "destructive"
                                : "outline"
                        }
                      >
                        {doc.status}
                      </Badge>
                      {doc.status === DocumentStatus.VERIFIED && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {doc.status === DocumentStatus.PENDING && (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                      {doc.status === DocumentStatus.REJECTED && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metadata Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Document Metadata</span>
              </div>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant={isEditing ? "default" : "outline"}
              >
                {isEditing ? (
                  <>
                    <Save className="mr-1 h-4 w-4" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit3 className="mr-1 h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              {selectedDocument
                ? `Edit metadata for ${selectedDocument.name}`
                : "Select a document to edit its metadata"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDocument ? (
              <DocumentMetadataEditor
                document={selectedDocument}
                // onUpdate={handleMetadataUpdate}
                // mode={isEditing ? "edit" : "view"}
                // showAdvancedFields={true}
              />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FileCheck className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Select a document to view its metadata</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Status Messages */}
      {stats.rejected > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            You have {stats.rejected} rejected document
            {stats.rejected !== 1 ? "s" : ""} that need
            {stats.rejected === 1 ? "s" : ""} to be re-uploaded or corrected.
          </AlertDescription>
        </Alert>
      )}

      {stats.pending > 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Verification in Progress</AlertTitle>
          <AlertDescription>
            {stats.pending} document{stats.pending !== 1 ? "s are" : " is"}{" "}
            currently being processed. This usually takes 1-3 business days.
          </AlertDescription>
        </Alert>
      )}

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            {`import { 
  DocumentVerificationStatus,
  DocumentMetadataEditor 
} from "@/modules/documents";

function VerificationManagement() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Verification Overview */}
      <DocumentVerificationStatus
        view="detailed"
        onStatusChange={(id, status, notes) => {
          console.log('Status change:', { id, status, notes });
        }}
        onRetryVerification={(id) => {
          console.log('Retry verification:', id);
        }}
        showActions={true}
      />
      
      {/* Metadata Editor */}
      <DocumentMetadataEditor
        document={selectedDoc}
        onUpdate={(id, updates) => {
          console.log('Metadata update:', { id, updates });
        }}
        mode={isEditing ? "edit" : "view"}
        showAdvancedFields={true}
      />
    </div>
  );
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
