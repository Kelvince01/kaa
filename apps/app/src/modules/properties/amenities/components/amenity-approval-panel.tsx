"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useApprovalStats,
  useApproveAmenity,
  useBulkApproveAmenities,
  usePendingAmenities,
  useRejectAmenity,
  useVerificationStats,
} from "../amenity.queries";
import type { Amenity, AmenitySource } from "../amenity.type";
import { AmenityCard } from "./amenity-card";
import { VerificationDialog } from "./verification-dialog";

type AmenityApprovalPanelProps = {
  county?: string;
  onAmenityApproved?: (amenity: Amenity) => void;
  onAmenityRejected?: (amenity: Amenity) => void;
};

export function AmenityApprovalPanel({
  county,
  onAmenityApproved,
  onAmenityRejected,
}: AmenityApprovalPanelProps) {
  const [selectedSource, setSelectedSource] = useState<AmenitySource | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(
    new Set()
  );
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingAmenity, setRejectingAmenity] = useState<Amenity | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyingAmenity, setVerifyingAmenity] = useState<Amenity | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries with server-side filtering and pagination
  const {
    data: pendingData,
    isLoading,
    refetch,
  } = usePendingAmenities({
    name: debouncedSearchQuery || undefined,
    county,
    source: selectedSource === "all" ? undefined : selectedSource,
    limit: itemsPerPage,
    skip: (currentPage - 1) * itemsPerPage,
  });

  const { data: approvalStats } = useApprovalStats(county);
  const { data: verificationStats } = useVerificationStats(county);

  // Mutations
  const approveMutation = useApproveAmenity();
  const rejectMutation = useRejectAmenity();
  const bulkApproveMutation = useBulkApproveAmenities();

  // Server-side paginated data
  const amenities = pendingData?.amenities || [];
  const totalCount = pendingData?.pagination?.total || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  // Reset to page 1 when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

  const handleApprove = async (amenityId: string) => {
    try {
      const result = await approveMutation.mutateAsync({ amenityId });
      onAmenityApproved?.(result);
      setSelectedAmenities((prev) => {
        const newSet = new Set(prev);
        newSet.delete(amenityId);
        return newSet;
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleReject = (amenity: Amenity) => {
    setRejectingAmenity(amenity);
    setRejectDialogOpen(true);
  };

  const handleVerify = (amenity: Amenity) => {
    setVerifyingAmenity(amenity);
    setVerifyDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!(rejectingAmenity && rejectionReason.trim())) return;

    try {
      const result = await rejectMutation.mutateAsync({
        amenityId: rejectingAmenity._id,
        reason: rejectionReason,
      });
      onAmenityRejected?.(result);
      setSelectedAmenities((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rejectingAmenity._id);
        return newSet;
      });
      setRejectDialogOpen(false);
      setRejectingAmenity(null);
      setRejectionReason("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleBulkApprove = async () => {
    if (selectedAmenities.size === 0) return;

    try {
      await bulkApproveMutation.mutateAsync(Array.from(selectedAmenities));
      setSelectedAmenities(new Set());
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSelectAll = () => {
    if (selectedAmenities.size === amenities.length) {
      setSelectedAmenities(new Set());
    } else {
      setSelectedAmenities(new Set(amenities.map((a) => a._id)));
    }
  };

  const handleSelectAmenity = (amenityId: string) => {
    setSelectedAmenities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(amenityId)) {
        newSet.delete(amenityId);
      } else {
        newSet.add(amenityId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Amenity Approval</h2>
          <p className="text-muted-foreground">
            Review and approve auto-discovered amenities
          </p>
        </div>
        <Button
          disabled={isLoading}
          onClick={() => refetch()}
          size="sm"
          variant="outline"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Approval Statistics */}
      {approvalStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-sm">Pending Approval</p>
                  <p className="font-bold text-2xl">{approvalStats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">Approved</p>
                  <p className="font-bold text-2xl">{approvalStats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-sm">Rejected</p>
                  <p className="font-bold text-2xl">{approvalStats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {verificationStats && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Verification Rate</p>
                    <p className="font-bold text-2xl">
                      {verificationStats.verificationRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters and Search */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="font-medium text-sm" htmlFor="search">
                Search Amenities
              </Label>
              <div className="relative mt-1.5">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-9 pl-9"
                  id="search"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or type..."
                  value={searchQuery}
                />
              </div>
            </div>
            <div>
              <Label className="font-medium text-sm" htmlFor="source">
                Source
              </Label>
              <Select
                onValueChange={(value) => {
                  setSelectedSource(value as typeof selectedSource);
                  resetPagination();
                }}
                value={selectedSource}
              >
                <SelectTrigger className="mt-1.5 h-9">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="auto_discovered_google">
                    Google Places
                  </SelectItem>
                  <SelectItem value="auto_discovered_osm">
                    OpenStreetMap
                  </SelectItem>
                  <SelectItem value="user_submitted">User Submitted</SelectItem>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {amenities.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={
                selectedAmenities.size === amenities.length &&
                amenities.length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-muted-foreground text-sm">
              <span className="font-medium text-foreground">
                {selectedAmenities.size}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalCount}</span>{" "}
              selected
            </span>
          </div>
          {selectedAmenities.size > 0 && (
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={bulkApproveMutation.isPending}
              onClick={handleBulkApprove}
              size="sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Selected ({selectedAmenities.size})
            </Button>
          )}
        </div>
      )}

      {/* Amenities List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card className="animate-pulse" key={i.toString()}>
                <CardHeader>
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 rounded bg-gray-200" />
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : amenities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {amenities.map((amenity) => (
                <div className="relative" key={amenity._id}>
                  <Checkbox
                    checked={selectedAmenities.has(amenity._id)}
                    className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur-sm"
                    onCheckedChange={() => handleSelectAmenity(amenity._id)}
                  />
                  <AmenityCard
                    amenity={amenity}
                    className="transition-shadow hover:shadow-md"
                    onApprove={handleApprove}
                    onReject={() => handleReject(amenity)}
                    onView={handleVerify}
                    showActions={true}
                    showApprovalStatus={true}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4 shadow-sm">
                <div className="text-muted-foreground text-sm">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {endIndex}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {totalCount}
                  </span>{" "}
                  amenities
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis between non-consecutive pages
                        const prevPage = array[index - 1];
                        const showEllipsisBefore =
                          index > 0 &&
                          prevPage !== undefined &&
                          page - prevPage > 1;
                        return (
                          <div key={index.toString()}>
                            {showEllipsisBefore && (
                              <span
                                className="px-2 text-muted-foreground"
                                key={`ellipsis-${page}`}
                              >
                                ...
                              </span>
                            )}
                            <Button
                              className={
                                currentPage === page
                                  ? "bg-primary text-primary-foreground"
                                  : ""
                              }
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              size="sm"
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    size="sm"
                    variant="outline"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert className="border-border/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No pending amenities found.
              {debouncedSearchQuery && " Try adjusting your search or filters."}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog onOpenChange={setRejectDialogOpen} open={rejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Amenity</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{rejectingAmenity?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Incorrect location, duplicate entry, outdated information..."
                rows={3}
                value={rejectionReason}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectingAmenity(null);
                setRejectionReason("");
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              onClick={confirmReject}
              variant="destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Amenity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Verification Dialog */}
      <VerificationDialog
        amenity={verifyingAmenity}
        onOpenChange={setVerifyDialogOpen}
        onVerified={async () => {
          setVerifyingAmenity(null);
          // Refresh data
          await refetch();
        }}
        open={verifyDialogOpen}
      />
    </div>
  );
}
