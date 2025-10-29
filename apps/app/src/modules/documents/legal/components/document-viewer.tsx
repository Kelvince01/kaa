"use client";

/**
 * Legal Document Viewer Component
 *
 * View legal documents with verification and actions
 */

import { LegalDocumentStatus } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Separator } from "@kaa/ui/components/separator";
import { format } from "date-fns";
import {
  Archive,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Loader2,
  PenTool,
  Shield,
  X,
} from "lucide-react";
import { useEffect } from "react";
import {
  useDownloadDocument,
  useLegalDocument,
} from "../legal-document.queries";
import { useLegalDocumentStore } from "../legal-document.store";
import type { ILegalDocument } from "../legal-document.type";

type LegalDocumentViewerProps = {
  open?: boolean;
  onClose?: () => void;
  documentId?: string;
  document?: ILegalDocument;
};

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

export function LegalDocumentViewer({
  open,
  onClose,
  documentId: propDocumentId,
  document: propDocument,
}: LegalDocumentViewerProps) {
  const {
    isViewerModalOpen,
    setViewerModalOpen,
    currentDocument,
    setCurrentDocument,
    setSigningModalOpen,
    addToRecent,
  } = useLegalDocumentStore();

  const isOpen = open ?? isViewerModalOpen;
  const documentId = propDocumentId || currentDocument?._id;

  const handleClose = () => {
    onClose?.();
    setViewerModalOpen(false);
    setCurrentDocument(null);
  };

  // Fetch document if not provided
  const { data: documentData, isLoading } = useLegalDocument(
    documentId || "",
    !propDocument && !!documentId
  );

  const document = propDocument || documentData?.document || currentDocument;

  const { mutate: downloadDocument, isPending: isDownloading } =
    useDownloadDocument();

  // Add to recent when viewed
  useEffect(() => {
    if (document && documentId) {
      addToRecent(documentId);
    }
  }, [addToRecent, document, documentId]);

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
      setViewerModalOpen(false);
      setSigningModalOpen(true);
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Legal Document Viewer
            </div>
            <Button onClick={handleClose} size="icon" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : document ? (
          <div className="space-y-6">
            {/* Document Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="font-bold text-2xl">
                  {document.type.replace(/_/g, " ")}
                </h2>
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
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Document Information</h3>
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
                </div>

                {document.watermark && (
                  <div>
                    <h3 className="mb-2 font-semibold">Watermark</h3>
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
              </div>

              <div className="space-y-4">
                {/* Signatures */}
                {document?.signatures?.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Signatures ({document?.signatures?.length})
                    </h3>
                    <div className="space-y-2">
                      {document?.signatures?.map((sig, index) => (
                        <div
                          className="rounded-lg border p-3"
                          key={`${sig.party}-${index}`}
                        >
                          <div className="font-medium capitalize">
                            {sig.party}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {format(new Date(sig.signedAt), "PPp")}
                          </div>
                          <div className="mt-1 font-mono text-muted-foreground text-xs">
                            {sig.signatureHash.slice(0, 16)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification */}
                {document.verified && document.verifiedAt && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 font-semibold">
                      <Shield className="h-4 w-4 text-green-500" />
                      Verification
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Verified:</dt>
                        <dd>{format(new Date(document.verifiedAt), "PPp")}</dd>
                      </div>
                      {document.verifiedBy && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">
                            Verified by:
                          </dt>
                          <dd>{document.verifiedBy}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Document Data */}
            <div>
              <h3 className="mb-3 font-semibold">Document Data</h3>
              <ScrollArea className="h-[200px] rounded-lg border p-4">
                <pre className="text-sm">
                  {JSON.stringify(document.data, null, 2)}
                </pre>
              </ScrollArea>
            </div>

            {/* Access Log */}
            {document.accessLog && document.accessLog.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <Eye className="h-4 w-4" />
                    Access Log
                  </h3>
                  <ScrollArea className="h-[150px]">
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
                            <span className="text-muted-foreground">
                              by {log.by}
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {format(new Date(log.at), "PPp")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}

            {/* Archive Status */}
            {document.archivedAt && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <Archive className="h-4 w-4" />
                <div className="text-sm">
                  <span className="font-medium">Archived</span>
                  <span className="ml-2 text-muted-foreground">
                    on {format(new Date(document.archivedAt), "PPp")}
                  </span>
                  {document.archivedBy && (
                    <span className="ml-1 text-muted-foreground">
                      by {document.archivedBy}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Document not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
