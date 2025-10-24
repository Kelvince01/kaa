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
import { Progress } from "@kaa/ui/components/progress";
import { Separator } from "@kaa/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import { cn } from "@kaa/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Home,
  Info,
  RefreshCw,
  RotateCcw,
  Shield,
  Star,
  Users,
  XCircle,
} from "lucide-react";

import { useVerificationStatus } from "../document.queries";
import { DocumentCategory } from "../document.type";

type DocumentVerificationStatusProps = {
  className?: string;
  showDetails?: boolean;
  showProgress?: boolean;
  compact?: boolean;
  view?: "detailed" | "compact";
  showActions?: boolean;
  onCategoryClick?: (category: DocumentCategory) => void;
  onStatusChange?: (id: string, status: string, notes?: string) => void;
  onRetryVerification?: (id: string) => void;
};

const categoryIcons = {
  [DocumentCategory.GENERAL]: FileText,
  [DocumentCategory.IDENTITY]: Users,
  [DocumentCategory.ADDRESS]: Home,
  [DocumentCategory.INCOME]: DollarSign,
  [DocumentCategory.REFERENCES]: Star,
  [DocumentCategory.OTHER]: FileText,
};

const categoryLabels = {
  [DocumentCategory.GENERAL]: "General Documents",
  [DocumentCategory.IDENTITY]: "Identity Documents",
  [DocumentCategory.ADDRESS]: "Address Proof",
  [DocumentCategory.INCOME]: "Income Documents",
  [DocumentCategory.REFERENCES]: "References",
  [DocumentCategory.OTHER]: "Other Documents",
};

const categoryDescriptions = {
  [DocumentCategory.GENERAL]: "Standard documentation",
  [DocumentCategory.IDENTITY]: "ID cards, passports, licenses",
  [DocumentCategory.ADDRESS]: "Utility bills, bank statements",
  [DocumentCategory.INCOME]: "Pay stubs, tax returns, contracts",
  [DocumentCategory.REFERENCES]: "Character references, recommendations",
  [DocumentCategory.OTHER]: "Miscellaneous documents",
};

const statusColors = {
  pending: "text-yellow-600 bg-yellow-50 border-yellow-200",
  verified: "text-green-600 bg-green-50 border-green-200",
  rejected: "text-red-600 bg-red-50 border-red-200",
};

const statusIcons = {
  pending: Clock,
  verified: CheckCircle,
  rejected: XCircle,
};

export function DocumentVerificationStatus({
  className,
  showDetails = true,
  showProgress = true,
  compact = false,
  view,
  showActions = false,
  onCategoryClick,
  onStatusChange,
  onRetryVerification,
}: DocumentVerificationStatusProps) {
  const { data, isLoading, isError, refetch } = useVerificationStatus();

  const verificationStatus = data?.verification_status;
  const progress = data?.progress;

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <CardTitle className={cn("text-lg", compact && "text-base")}>
              Loading Verification Status...
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className={compact ? "pt-2" : undefined}>
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                className="h-16 animate-pulse rounded-lg bg-muted"
                key={i.toString()}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !verificationStatus || !progress) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Unable to Load Verification Status</AlertTitle>
        <AlertDescription>
          There was an error loading your document verification status.
          <Button
            className="ml-2 h-auto p-0"
            onClick={() => refetch()}
            variant="link"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const overallProgress = progress.overall || 0;
  const totalCategories = Object.keys(verificationStatus).length;
  const verifiedCategories = Object.values(verificationStatus).filter(
    (status) => status.status === "verified"
  ).length;
  const pendingCategories = Object.values(verificationStatus).filter(
    (status) => status.status === "pending"
  ).length;
  const rejectedCategories = Object.values(verificationStatus).filter(
    (status) => status.status === "rejected"
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      // case "pending":
      default:
        return "text-yellow-600";
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const renderCompactView = () => (
    <Card className={cn("", className)}>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Document Verification</h3>
            <p className="text-muted-foreground text-xs">
              {verifiedCategories} of {totalCategories} categories verified
            </p>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-primary">
              {Math.round(overallProgress)}%
            </div>
          </div>
        </div>

        <Progress className="mb-3" value={overallProgress} />

        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span>{verifiedCategories} verified</span>
          </span>
          <span className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-yellow-600" />
            <span>{pendingCategories} pending</span>
          </span>
          {rejectedCategories > 0 && (
            <span className="flex items-center space-x-1">
              <XCircle className="h-3 w-3 text-red-600" />
              <span>{rejectedCategories} rejected</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDetailedView = () => (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">
              Document Verification Status
            </CardTitle>
          </div>
          <Button
            disabled={isLoading}
            onClick={() => refetch()}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
        {showProgress && (
          <CardDescription>
            Track the verification progress of your submitted documents
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        {showProgress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Overall Progress</h3>
              <div className="flex items-center space-x-4">
                <div className="font-bold text-2xl text-primary">
                  {Math.round(overallProgress)}%
                </div>
                <div className="text-muted-foreground text-sm">
                  {verifiedCategories} / {totalCategories} categories
                </div>
              </div>
            </div>

            <Progress className="h-3" value={overallProgress} />

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-green-600 text-xl">
                    {verifiedCategories}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">Verified</p>
              </div>

              <div className="text-center">
                <div className="mb-1 flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="font-bold text-xl text-yellow-600">
                    {pendingCategories}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">Pending</p>
              </div>

              <div className="text-center">
                <div className="mb-1 flex items-center justify-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-bold text-red-600 text-xl">
                    {rejectedCategories}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">Rejected</p>
              </div>
            </div>
          </div>
        )}

        {showProgress && <Separator />}

        {/* Category Status */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Category Status</h3>

          <div className="grid gap-4">
            {Object.entries(verificationStatus).map(([category, status]) => {
              const CategoryIcon = categoryIcons[category as DocumentCategory];
              const StatusIcon =
                statusIcons[status.status as keyof typeof statusIcons];
              const categoryProgress =
                progress.categories[category as DocumentCategory] || 0;

              return (
                <Card
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    onCategoryClick && "hover:bg-muted/50"
                  )}
                  key={category}
                  onClick={() =>
                    onCategoryClick?.(category as DocumentCategory)
                  }
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-1 items-start space-x-3">
                        <div className="shrink-0">
                          <CategoryIcon className="h-8 w-8 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center space-x-2">
                            <h4 className="truncate font-medium text-sm">
                              {categoryLabels[category as DocumentCategory]}
                            </h4>
                            <Badge
                              className={cn(
                                "text-xs",
                                statusColors[
                                  status.status as keyof typeof statusColors
                                ]
                              )}
                              variant="outline"
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status.status}
                            </Badge>
                          </div>

                          <p className="mb-2 text-muted-foreground text-xs">
                            {categoryDescriptions[category as DocumentCategory]}
                          </p>

                          <div className="flex items-center justify-between text-muted-foreground text-xs">
                            <span>
                              {status.documentsCount} document
                              {status.documentsCount !== 1 ? "s" : ""}
                            </span>
                            {status.lastUpdated && (
                              <span>
                                Updated{" "}
                                {formatDistanceToNow(
                                  new Date(status.lastUpdated),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </span>
                            )}
                          </div>

                          {showDetails && categoryProgress > 0 && (
                            <div className="mt-3">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-muted-foreground text-xs">
                                  Verification Progress
                                </span>
                                <span className="font-medium text-xs">
                                  {Math.round(categoryProgress)}%
                                </span>
                              </div>
                              <Progress
                                className="h-2"
                                value={categoryProgress}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex shrink-0 items-center space-x-2">
                        {/* Action Buttons */}
                        {showActions && (
                          <div className="flex items-center space-x-1">
                            {status.status === "rejected" && onStatusChange && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      className="h-8 w-8 p-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(
                                          category,
                                          "pending",
                                          "Status updated to pending for review"
                                        );
                                      }}
                                      size="sm"
                                      variant="ghost"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Update Status</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {(status.status === "pending" ||
                              status.status === "rejected") &&
                              onRetryVerification && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        className="h-8 w-8 p-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onRetryVerification(category);
                                        }}
                                        size="sm"
                                        variant="ghost"
                                      >
                                        <RotateCcw className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Retry Verification</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                          </div>
                        )}

                        {/* Status Icon */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <StatusIcon
                                className={cn(
                                  "h-5 w-5",
                                  getStatusColor(status.status)
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {status.status === "verified"
                                  ? "All documents verified"
                                  : status.status === "rejected"
                                    ? "Some documents need attention"
                                    : "Verification in progress"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        {showDetails && (rejectedCategories > 0 || pendingCategories > 0) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Quick Actions</h3>

              <div className="flex flex-wrap gap-2">
                {rejectedCategories > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-red-800">
                      {rejectedCategories} categor
                      {rejectedCategories === 1 ? "y" : "ies"} need
                      {rejectedCategories === 1 ? "s" : ""} attention
                    </AlertTitle>
                    <AlertDescription className="text-red-700">
                      Review rejected documents and resubmit with corrections.
                    </AlertDescription>
                  </Alert>
                )}

                {pendingCategories > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-yellow-800">
                      {pendingCategories} categor
                      {pendingCategories === 1 ? "y" : "ies"} under review
                    </AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      Your documents are being verified. This typically takes
                      1-2 business days.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </>
        )}

        {/* Success Message */}
        {verifiedCategories === totalCategories && totalCategories > 0 && (
          <>
            <Separator />
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle className="text-green-800">
                🎉 All Documents Verified!
              </AlertTitle>
              <AlertDescription className="text-green-700">
                Congratulations! All your document categories have been
                successfully verified. You can now proceed with your
                application.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );

  // Determine view mode - use view prop if provided, otherwise use compact prop
  const shouldRenderCompact =
    view === "compact" || (view === undefined && compact);

  return shouldRenderCompact ? renderCompactView() : renderDetailedView();
}
