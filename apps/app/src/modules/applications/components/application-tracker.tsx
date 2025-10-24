import { Avatar, AvatarFallback } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Progress } from "@kaa/ui/components/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  MessageSquare,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import OptimizedImage from "@/components/common/optimized-image";
import type { Property } from "@/modules/properties";
import type { User } from "@/modules/users/user.type";
import { useApplicationStore } from "../application.store";
import type { Application } from "../application.type";

// Application status options
const ApplicationStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  REVIEWING: "reviewing",
  PENDING_REFERENCES: "pending_references",
  BACKGROUND_CHECK: "background_check",
  LANDLORD_REVIEW: "landlord_review",
  APPROVED: "approved",
  DECLINED: "declined",
  EXPIRED: "expired",
  CONTRACT_PENDING: "contract_pending",
  CONTRACT_SIGNED: "contract_signed",
  COMPLETE: "complete",
};

// Map application status to step in progress bar
const statusToStep = {
  [ApplicationStatus.DRAFT]: 0,
  [ApplicationStatus.SUBMITTED]: 1,
  [ApplicationStatus.REVIEWING]: 2,
  [ApplicationStatus.PENDING_REFERENCES]: 2,
  [ApplicationStatus.BACKGROUND_CHECK]: 2,
  [ApplicationStatus.LANDLORD_REVIEW]: 3,
  [ApplicationStatus.APPROVED]: 4,
  [ApplicationStatus.DECLINED]: -1,
  [ApplicationStatus.EXPIRED]: -1,
  [ApplicationStatus.CONTRACT_PENDING]: 5,
  [ApplicationStatus.CONTRACT_SIGNED]: 6,
  [ApplicationStatus.COMPLETE]: 7,
};

// Get human-readable status label
const getStatusLabel = (status: string) => {
  switch (status) {
    case ApplicationStatus.DRAFT:
      return "Draft";
    case ApplicationStatus.SUBMITTED:
      return "Submitted";
    case ApplicationStatus.REVIEWING:
      return "Application Review";
    case ApplicationStatus.PENDING_REFERENCES:
      return "References Pending";
    case ApplicationStatus.BACKGROUND_CHECK:
      return "Background Check";
    case ApplicationStatus.LANDLORD_REVIEW:
      return "Landlord Review";
    case ApplicationStatus.APPROVED:
      return "Approved";
    case ApplicationStatus.DECLINED:
      return "Declined";
    case ApplicationStatus.EXPIRED:
      return "Expired";
    case ApplicationStatus.CONTRACT_PENDING:
      return "Contract Pending";
    case ApplicationStatus.CONTRACT_SIGNED:
      return "Contract Signed";
    case ApplicationStatus.COMPLETE:
      return "Complete";
    default:
      return "Unknown";
  }
};

// Get color for status label
const getStatusColor = (status: string) => {
  switch (status) {
    case ApplicationStatus.DRAFT:
      return "bg-gray-100 text-gray-800";
    case ApplicationStatus.SUBMITTED:
      return "bg-blue-100 text-blue-800";
    case ApplicationStatus.REVIEWING:
    case ApplicationStatus.PENDING_REFERENCES:
    case ApplicationStatus.BACKGROUND_CHECK:
    case ApplicationStatus.LANDLORD_REVIEW:
      return "bg-yellow-100 text-yellow-800";
    case ApplicationStatus.APPROVED:
      return "bg-green-100 text-green-800";
    case ApplicationStatus.DECLINED:
      return "bg-red-100 text-red-800";
    case ApplicationStatus.EXPIRED:
      return "bg-gray-100 text-gray-800";
    case ApplicationStatus.CONTRACT_PENDING:
      return "bg-purple-100 text-purple-800";
    case ApplicationStatus.CONTRACT_SIGNED:
      return "bg-green-100 text-green-800";
    case ApplicationStatus.COMPLETE:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Get variant for status badge
const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case ApplicationStatus.DRAFT:
      return "secondary";
    case ApplicationStatus.SUBMITTED:
      return "default";
    case ApplicationStatus.REVIEWING:
    case ApplicationStatus.PENDING_REFERENCES:
    case ApplicationStatus.BACKGROUND_CHECK:
    case ApplicationStatus.LANDLORD_REVIEW:
      return "outline";
    case ApplicationStatus.APPROVED:
    case ApplicationStatus.CONTRACT_SIGNED:
    case ApplicationStatus.COMPLETE:
      return "default";
    case ApplicationStatus.DECLINED:
    case ApplicationStatus.EXPIRED:
      return "destructive";
    case ApplicationStatus.CONTRACT_PENDING:
      return "default";
    default:
      return "secondary";
  }
};

type ApplicationTrackerProps = {
  applications: Application[];
};

const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications = [],
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("timeline");
  const {
    selectedApplication,
    setSelectedApplicationId,
    setSelectedApplication,
  } = useApplicationStore();

  // Create a function to update URL with search params
  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === null) {
        params.delete(name);
      } else {
        params.set(name, value);
      }

      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    // Set the first application as active by default
    if (applications.length > 0 && !selectedApplication) {
      setSelectedApplicationId(applications[0]?._id || null);
    }

    // If applicationId is in the URL, set that as active
    const applicationId = searchParams.get("applicationId");
    if (applicationId && applications.length > 0) {
      const selected = applications.find((app) => app._id === applicationId);
      if (selected) {
        setSelectedApplicationId(applicationId);
        setShowDetails(true);
      }
    }
  }, [
    applications,
    searchParams,
    selectedApplication,
    setSelectedApplicationId,
  ]);

  // Get step names for the progress
  const getProgressSteps = () => [
    "Draft",
    "Submitted",
    "Review",
    "Landlord Decision",
    "Approved",
    "Contract",
    "Signed",
    "Complete",
  ];

  // Get current step number based on status
  const getCurrentStep = (status: string) =>
    statusToStep[status] !== undefined ? statusToStep[status] : 0;

  // Handle view details click
  const handleViewDetails = (application: Application) => {
    setSelectedApplicationId(application._id);
    setSelectedApplication(application);
    setShowDetails(true);

    // Update URL without reloading the page
    router.push(
      `${pathname}?${createQueryString("applicationId", application._id)}`
    );
  };

  // Close details modal
  const handleCloseDetails = () => {
    setShowDetails(false);

    // Remove applicationId from URL
    router.push(`${pathname}?${createQueryString("applicationId", null)}`);
  };

  // Get property ID safely
  const getPropertyId = (property: string | Property): string =>
    typeof property === "object" ? property._id : property.toString();

  // Get property title safely
  const getPropertyTitle = (property: string | Property): string =>
    typeof property === "object" ? property.title : "Property";

  // Get property image safely
  const getPropertyImage = (property: string | Property): string =>
    typeof property === "object" &&
    property.media.images &&
    property.media.images.length > 0
      ? (property.media.images[0]?.url as string)
      : "/placeholder-property.jpg";

  // Get property address safely
  const getPropertyAddress = (property: string | Property): string => {
    if (typeof property === "object" && property.location?.address) {
      return `${property.location.address.line1}, ${property.location.address.town}`;
    }
    return "Address";
  };

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <CardTitle className="mb-2">No Applications</CardTitle>
          <p className="mb-6 text-muted-foreground">
            You haven't submitted any rental applications yet.
          </p>
          <Button asChild>
            <Link href="/properties">Browse Properties</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Tracker</CardTitle>
          <p className="text-muted-foreground text-sm">
            Track the status of your rental applications.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Applied</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Next Step</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => {
                  const currentStep = getCurrentStep(application.status);
                  const progressSteps = getProgressSteps();
                  const progressPercentage =
                    currentStep >= 0
                      ? Math.round(
                          (currentStep / (progressSteps.length - 1)) * 100
                        )
                      : 0;

                  return (
                    <TableRow key={application._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded">
                            <OptimizedImage
                              alt={getPropertyTitle(application.property)}
                              height={40}
                              objectFit="cover"
                              src={getPropertyImage(application.property)}
                              width={40}
                            />
                          </div>
                          <div>
                            <div className="font-medium">
                              {getPropertyTitle(application.property)}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {getPropertyAddress(application.property)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(application.status)}>
                          {getStatusLabel(application.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Calendar className="mr-1 h-4 w-4" />
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {currentStep >= 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">
                                {progressPercentage}%
                              </span>
                              <Progress
                                className="flex-1"
                                value={progressPercentage}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center text-destructive text-sm">
                            <X className="mr-1 h-4 w-4" />
                            Not Proceeding
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {application.status ===
                            ApplicationStatus.DECLINED && (
                            <span className="text-destructive">
                              Application declined
                            </span>
                          )}
                          {application.status === ApplicationStatus.EXPIRED && (
                            <span className="text-muted-foreground">
                              Application expired
                            </span>
                          )}
                          {currentStep >= 0 &&
                            currentStep < progressSteps.length - 1 && (
                              <span className="text-muted-foreground">
                                Wait for {progressSteps[currentStep + 1]}
                              </span>
                            )}
                          {currentStep === progressSteps.length - 1 && (
                            <div className="flex items-center text-green-600">
                              <Check className="mr-1 h-4 w-4" />
                              Complete
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={() => handleViewDetails(application)}
                            size="sm"
                            variant="outline"
                          >
                            View details
                          </Button>
                          <Button asChild size="sm" variant="ghost">
                            <Link
                              href={`/properties/${getPropertyId(application.property)}`}
                            >
                              View property
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog onOpenChange={handleCloseDetails} open={showDetails}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Property Info */}
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded">
                  <OptimizedImage
                    alt={getPropertyTitle(selectedApplication.property)}
                    height={64}
                    objectFit="cover"
                    src={getPropertyImage(selectedApplication.property)}
                    width={64}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-lg">
                    {getPropertyTitle(selectedApplication.property)}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {getPropertyAddress(selectedApplication.property)}
                  </p>
                  <Badge
                    className="mt-1"
                    variant={getStatusVariant(selectedApplication.status)}
                  >
                    {getStatusLabel(selectedApplication.status)}
                  </Badge>
                </div>
              </div>

              {/* Tabs */}
              <Tabs onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                <TabsContent className="space-y-4" value="timeline">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Application Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedApplication.timeline &&
                      selectedApplication.timeline.length > 0 ? (
                        <div className="space-y-4">
                          {selectedApplication.timeline.map((event) => (
                            <div
                              className="flex items-start space-x-3"
                              key={event._id}
                            >
                              <div className="shrink-0">
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    event.status === "completed"
                                      ? "bg-green-500"
                                      : event.status === "warning"
                                        ? "bg-yellow-500"
                                        : event.status === "error"
                                          ? "bg-red-500"
                                          : "bg-blue-500"
                                  }`}
                                >
                                  {event.status === "completed" && (
                                    <CheckCircle className="h-4 w-4 text-white" />
                                  )}
                                  {event.status === "warning" && (
                                    <AlertCircle className="h-4 w-4 text-white" />
                                  )}
                                  {event.status === "error" && (
                                    <X className="h-4 w-4 text-white" />
                                  )}
                                  {event.status === "in_progress" && (
                                    <Clock className="h-4 w-4 text-white" />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="font-medium text-sm">
                                  {event.title}
                                </p>
                                {event.description && (
                                  <p className="text-muted-foreground text-sm">
                                    {event.description}
                                  </p>
                                )}
                                <p className="text-muted-foreground text-xs">
                                  {new Date(event.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 font-medium text-sm">
                            No timeline events
                          </h3>
                          <p className="mt-1 text-muted-foreground text-sm">
                            Timeline events will appear here as your application
                            progresses.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent className="space-y-4" value="documents">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Application Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedApplication.documents &&
                      selectedApplication.documents.length > 0 ? (
                        <div className="space-y-4">
                          {selectedApplication.documents.map((doc) => (
                            <div
                              className="flex items-center justify-between rounded-lg border p-3"
                              key={doc._id}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-md ${
                                    doc.status === "verified"
                                      ? "bg-green-100"
                                      : doc.status === "rejected"
                                        ? "bg-red-100"
                                        : "bg-blue-100"
                                  }`}
                                >
                                  <FileText
                                    className={`h-5 w-5 ${
                                      doc.status === "verified"
                                        ? "text-green-600"
                                        : doc.status === "rejected"
                                          ? "text-red-600"
                                          : "text-blue-600"
                                    }`}
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {doc.name}
                                  </p>
                                  <div className="mt-1 flex items-center space-x-2">
                                    <Badge
                                      className="text-xs"
                                      variant={
                                        doc.status === "verified"
                                          ? "default"
                                          : doc.status === "rejected"
                                            ? "destructive"
                                            : doc.status === "pending"
                                              ? "outline"
                                              : "secondary"
                                      }
                                    >
                                      {doc.status === "verified" && (
                                        <Check className="mr-1 h-3 w-3" />
                                      )}
                                      {doc.status === "rejected" && (
                                        <X className="mr-1 h-3 w-3" />
                                      )}
                                      {doc.status === "pending" && (
                                        <Clock className="mr-1 h-3 w-3" />
                                      )}
                                      {doc.status.charAt(0).toUpperCase() +
                                        doc.status.slice(1)}
                                    </Badge>
                                    <span className="text-muted-foreground text-xs">
                                      Uploaded{" "}
                                      {new Date(
                                        doc.uploadedAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                <Download className="mr-1 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 font-medium text-sm">
                            No documents
                          </h3>
                          <p className="mt-1 text-muted-foreground text-sm">
                            There are no documents associated with this
                            application yet.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent className="space-y-4" value="messages">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Application Messages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedApplication.messages &&
                      selectedApplication.messages.length > 0 ? (
                        <div className="space-y-4">
                          {selectedApplication.messages.map((message) => (
                            <div
                              className="flex items-start space-x-3 rounded-lg border p-3"
                              key={message._id}
                            >
                              <Avatar>
                                <AvatarFallback>
                                  {typeof message.sender === "string"
                                    ? message.sender === "system"
                                      ? "S"
                                      : message.sender.charAt(0).toUpperCase()
                                    : `${(message.sender as User).firstName?.charAt(0) || "U"}`}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm">
                                    {typeof message.sender === "string"
                                      ? message.sender === "system"
                                        ? "System"
                                        : message.sender
                                      : `${(message.sender as User).firstName || ""} ${(message.sender as User).lastName || ""}`}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {new Date(
                                      message.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-muted-foreground text-sm">
                                  {message.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-2 font-medium text-sm">
                            No messages
                          </h3>
                          <p className="mt-1 text-muted-foreground text-sm">
                            There are no messages associated with this
                            application yet.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Application Actions */}
              {selectedApplication.status === ApplicationStatus.DRAFT && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-700">
                        Your application is in draft mode. Complete your
                        application to submit it.
                      </p>
                    </div>
                    <Button className="mt-3 w-full">
                      <FileText className="mr-1.5 h-4 w-4" />
                      Complete Application
                    </Button>
                  </CardContent>
                </Card>
              )}

              {selectedApplication.status ===
                ApplicationStatus.PENDING_REFERENCES && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-700">
                        Your references have been contacted. We're waiting for
                        their responses.
                      </p>
                    </div>
                    <Button className="mt-3 w-full" variant="outline">
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      Send Reference Reminder
                    </Button>
                  </CardContent>
                </Card>
              )}

              {selectedApplication.status ===
                ApplicationStatus.CONTRACT_PENDING && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                      <p className="text-green-700 text-sm">
                        Your application has been approved! Please review and
                        sign your tenancy agreement.
                      </p>
                    </div>
                    <Button className="mt-3 w-full">
                      <FileText className="mr-1.5 h-4 w-4" />
                      Review & Sign Agreement
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationTracker;
