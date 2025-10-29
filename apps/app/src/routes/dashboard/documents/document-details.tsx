"use client";

/**
 * Document Details Page
 *
 * View detailed information about a specific document
 */

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
import { format } from "date-fns";
import {
  Archive,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  PenTool,
  Shield,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  DocumentSigning,
  LegalDocumentStatus,
  useDownloadDocument,
  useLegalDocument,
  useLegalDocumentStore,
} from "@/modules/documents/legal";

const statusColors: Record<LegalDocumentStatus, string> = {
  [LegalDocumentStatus.DRAFT]: "bg-gray-500",
  [LegalDocumentStatus.PENDING_REVIEW]: "bg-yellow-500",
  [LegalDocumentStatus.PENDING_SIGNATURE]: "bg-blue-500",
  [LegalDocumentStatus.ACTIVE]: "bg-green-500",
  [LegalDocumentStatus.COMPLETED]: "bg-emerald-500",
  [LegalDocumentStatus.EXPIRED]: "bg-red-500",
  [LegalDocumentStatus.CANCELLED]: "bg-gray-600",
  [LegalDocumentStatus.ARCHIVED]: "bg-slate-500",
  [LegalDocumentStatus.GENERATED]: "bg-gray-500",
  [LegalDocumentStatus.SIGNED]: "bg-blue-500",
  [LegalDocumentStatus.EXECUTED]: "bg-green-500",
};

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.documentId as string;

  const { setSigningModalOpen, setCurrentDocument } = useLegalDocumentStore();
  const { data, isLoading } = useLegalDocument(documentId);
  const { mutate: downloadDocument, isPending: isDownloading } =
    useDownloadDocument();

  const document = data?.document;

  const handleDownload = () => {
    if (!document) return;

    downloadDocument({
      documentId: document._id,
      filename: `${document.type}-${format(new Date(document.createdAt), "yyyy-MM-dd")}.${document.format}`,
    });
  };

  const handleSign = () => {
    if (document) {
      setCurrentDocument(document);
      setSigningModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 font-semibold text-xl">Document Not Found</h2>
        <p className="mb-4 text-muted-foreground">
          The document you're looking for doesn't exist.
        </p>
        <Button onClick={() => router.push("/dashboard/documents")}>
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="font-bold text-3xl">
            {document.type.replace(/_/g, " ")}
          </h1>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[document.status]}>
              {document.status.replace(/_/g, " ")}
            </Badge>
            <Badge className="uppercase" variant="outline">
              {document.format}
            </Badge>
            <Badge variant="outline">{document.language}</Badge>
            {document.verified && (
              <Badge className="bg-green-500">
                <Shield className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {document.status === LegalDocumentStatus.PENDING_SIGNATURE && (
            <Button onClick={handleSign}>
              <PenTool className="mr-2 h-4 w-4" />
              Sign
            </Button>
          )}
          <Button
            disabled={isDownloading}
            onClick={handleDownload}
            variant="outline"
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download
          </Button>
        </div>
      </div>

      <Separator />

      {/* Document Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Template ID:</dt>
                <dd className="font-mono">{document.templateId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Version:</dt>
                <dd>{document.templateVersion}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Copies:</dt>
                <dd>{document.copies}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created:</dt>
                <dd>{format(new Date(document.createdAt), "PPp")}</dd>
              </div>
              {document.deliveredAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivered:</dt>
                  <dd>{format(new Date(document.deliveredAt), "PPp")}</dd>
                </div>
              )}
            </dl>

            {document.watermark && (
              <div>
                <h4 className="mb-1 font-semibold">Watermark</h4>
                <p className="text-muted-foreground text-sm">
                  {document.watermark}
                </p>
              </div>
            )}

            {document.encryption && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Document is encrypted</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Signatures ({document?.signatures?.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {document?.signatures?.length === 0 ? (
              <p className="text-muted-foreground text-sm">No signatures yet</p>
            ) : (
              <div className="space-y-3">
                {document?.signatures?.map((sig, index) => (
                  <div
                    className="rounded-lg border p-3"
                    key={`${sig.party}-${index}`}
                  >
                    <div className="font-medium capitalize">{sig.party}</div>
                    <div className="text-muted-foreground text-xs">
                      {format(new Date(sig.signedAt), "PPp")}
                    </div>
                    <div className="mt-1 font-mono text-muted-foreground text-xs">
                      {sig.signatureHash.slice(0, 32)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification */}
      {document.verified && document.verifiedAt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Verified:</dt>
                <dd>{format(new Date(document.verifiedAt), "PPp")}</dd>
              </div>
              {document.verifiedBy && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Verified by:</dt>
                  <dd>{document.verifiedBy}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Access Log */}
      {document.accessLog && document.accessLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Access Log
            </CardTitle>
            <CardDescription>
              View the history of actions on this document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {document.accessLog.map((log, index) => (
                <div
                  className="flex items-center justify-between border-b p-2 text-sm last:border-0"
                  key={`${log.action}-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <Badge className="capitalize" variant="outline">
                      {log.action}
                    </Badge>
                    <span className="text-muted-foreground">by {log.by}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {format(new Date(log.at), "PPp")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archive Status */}
      {document.archivedAt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archive Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <span className="font-medium">Archived</span>
              <span className="ml-2 text-muted-foreground">
                on {format(new Date(document.archivedAt), "PPp")}
              </span>
              {document.archivedBy && (
                <span className="ml-1 text-muted-foreground">
                  by {document.archivedBy}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Signing Modal */}
      <DocumentSigning />
    </div>
  );
}
