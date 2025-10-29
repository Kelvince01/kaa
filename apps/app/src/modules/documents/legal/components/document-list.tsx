"use client";

/**
 * Legal Document List Component
 *
 * Display and manage legal documents
 */

import { LegalDocumentStatus, LegalDocumentType } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import { format } from "date-fns";
import {
  Archive,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  PenTool,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  useArchiveDocument,
  useDeleteDocument,
  useDownloadDocument,
  useLegalDocuments,
} from "../legal-document.queries";
import { useLegalDocumentStore } from "../legal-document.store";
import type { LegalDocumentFilter } from "../legal-document.type";

type LegalDocumentListProps = {
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;
  showFilters?: boolean;
  onDocumentClick?: (documentId: string) => void;
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

export function LegalDocumentList({
  propertyId,
  tenantId,
  landlordId,
  showFilters = true,
  onDocumentClick,
}: LegalDocumentListProps) {
  const {
    documentFilter,
    setDocumentFilter,
    setCurrentDocument,
    setViewerModalOpen,
    setSigningModalOpen,
  } = useLegalDocumentStore();

  const [searchQuery, setSearchQuery] = useState("");

  // Build filter with props
  const filter: LegalDocumentFilter = {
    ...documentFilter,
    propertyId,
    tenantId,
    landlordId,
  };

  // Fetch documents
  const { data, isLoading } = useLegalDocuments(filter);

  // Mutations
  const { mutate: downloadDocument, isPending: isDownloading } =
    useDownloadDocument();
  const { mutate: archiveDocument, isPending: isArchiving } =
    useArchiveDocument();
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument();

  const handleViewDocument = (doc: any) => {
    setCurrentDocument(doc);
    setViewerModalOpen(true);
    onDocumentClick?.(doc._id);
  };

  const handleSignDocument = (doc: any) => {
    setCurrentDocument(doc);
    setSigningModalOpen(true);
  };

  const handleDownload = (doc: any) => {
    downloadDocument({
      documentId: doc._id,
      filename: `${doc.type}-${format(new Date(doc.createdAt), "yyyy-MM-dd")}.${doc.format}`,
    });
  };

  const handleArchive = (documentId: string) => {
    archiveDocument(documentId);
  };

  const handleDelete = (documentId: string) => {
    // TODO: Replace with proper confirmation dialog
    // biome-ignore lint/suspicious/noAlert: Will be replaced with custom dialog
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteDocument(documentId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Legal Documents
          </CardTitle>
          <Button
            onClick={() =>
              useLegalDocumentStore.getState().setGenerateModalOpen(true)
            }
          >
            Generate Document
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {showFilters && (
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  value={searchQuery}
                />
              </div>

              <Select
                onValueChange={(value) =>
                  setDocumentFilter({
                    type:
                      value === "all"
                        ? undefined
                        : (value as LegalDocumentType),
                  })
                }
                value={documentFilter.type || "all"}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(LegalDocumentType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) =>
                  setDocumentFilter({
                    status:
                      value === "all"
                        ? undefined
                        : (value as LegalDocumentStatus),
                  })
                }
                value={documentFilter.status || "all"}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(LegalDocumentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data?.documents.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">No documents found</h3>
            <p className="mb-4 text-muted-foreground">
              Generate your first legal document to get started
            </p>
            <Button
              onClick={() =>
                useLegalDocumentStore.getState().setGenerateModalOpen(true)
              }
            >
              Generate Document
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.documents
                  .filter((doc) =>
                    searchQuery
                      ? doc.type
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((doc) => (
                    <TableRow key={doc._id}>
                      <TableCell className="font-medium">
                        {doc.type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[doc.status]}>
                          {doc.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="uppercase">{doc.format}</TableCell>
                      <TableCell>
                        {format(new Date(doc.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {doc?.signatures?.length > 0 && (
                            <>
                              <PenTool className="h-4 w-4" />
                              <span>{doc?.signatures?.length}</span>
                            </>
                          )}
                          {doc?.verified && (
                            <Shield className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDocument(doc)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>

                            {doc.status ===
                              LegalDocumentStatus.PENDING_SIGNATURE && (
                              <DropdownMenuItem
                                onClick={() => handleSignDocument(doc)}
                              >
                                <PenTool className="mr-2 h-4 w-4" />
                                Sign
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              disabled={isDownloading}
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              disabled={isArchiving}
                              onClick={() => handleArchive(doc._id)}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-red-600"
                              disabled={isDeleting}
                              onClick={() => handleDelete(doc._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data && data.documents.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-muted-foreground text-sm">
            <div>
              Showing {data.documents.length} of {data.results} documents
            </div>
            {data.pagination && (
              <div className="flex gap-2">
                <Button
                  disabled={documentFilter.page === 1}
                  onClick={() =>
                    setDocumentFilter({
                      page: (documentFilter.page || 1) - 1,
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={documentFilter.page === data.pagination.pages}
                  onClick={() =>
                    setDocumentFilter({
                      page: (documentFilter.page || 1) + 1,
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
