"use client";

import { Avatar, AvatarFallback } from "@kaa/ui/components/avatar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Progress } from "@kaa/ui/components/progress";
import { Separator } from "@kaa/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { format } from "date-fns";
import {
  Building,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileSignature,
  FileText,
  Mail,
  MapPin,
  Phone,
  Settings,
  Users,
} from "lucide-react";
import { useProperty } from "@/modules/properties/property.queries";
import { useTenants } from "@/modules/tenants/tenant.queries";
import { formatCurrency } from "@/shared/utils/format.util";
import { type Contract, ContractStatus } from "../../contract.type";

type ContractDetailsModalProps = {
  contract: Contract | null;
  open: boolean;
  onCloseAction: () => void;
  onEditAction?: (contract: Contract) => void;
  onSignAction?: (contract: Contract) => void;
};

export function ContractDetailsModal({
  contract,
  open,
  onCloseAction: onClose,
  onEditAction: onEdit,
  onSignAction: onSign,
}: ContractDetailsModalProps) {
  const { data: tenants } = useTenants();
  const propertyQuery = useProperty(
    typeof contract?.property === "string"
      ? (contract.property ?? "")
      : contract?.property &&
          typeof contract.property === "object" &&
          "_id" in contract.property
        ? ((contract.property as any)._id ?? "")
        : ""
  );
  const property = propertyQuery.data;

  // Status badge variant helper
  const getStatusBadgeVariant = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
      case ContractStatus.SIGNED:
        return "default";
      case ContractStatus.PENDING:
        return "secondary";
      case ContractStatus.DRAFT:
        return "outline";
      case ContractStatus.TERMINATED:
      case ContractStatus.EXPIRED:
      case ContractStatus.CANCELLED:
        return "destructive";
      default:
        return "outline";
    }
  };

  if (!contract) return null;

  // Calculate contract progress
  const getContractProgress = () => {
    const now = new Date();
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    return Math.round((elapsed / total) * 100);
  };

  // Get remaining days
  const getRemainingDays = () => {
    const now = new Date();
    const end = new Date(contract.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get property info
  const getPropertyId = () => {
    const propertyId =
      typeof contract.property === "string"
        ? contract.property
        : contract.property._id;
    // return properties?.properties?.find((p) => p._id === propertyId);

    return propertyId;
  };

  // Get tenant info
  const getTenantInfo = (tenantId: string) =>
    tenants?.items?.find((t) => t._id === tenantId);
  // const property = getPropertyInfo();

  const progress = getContractProgress();
  const remainingDays = getRemainingDays();

  return (
    <Dialog onOpenChange={onClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Details
              </DialogTitle>
              <DialogDescription>
                {property?.title} - Contract #{contract._id.slice(-8)}
              </DialogDescription>
            </div>
            <Badge variant={getStatusBadgeVariant(contract.status)}>
              {contract.status.replace("_", " ")}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs className="w-full" defaultValue="overview">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-6" value="overview">
            {/* Contract Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Contract Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Contract Duration</span>
                    <span>{progress}% Complete</span>
                  </div>
                  <Progress className="h-2" value={progress} />
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>
                      {format(new Date(contract.startDate), "MMM dd, yyyy")}
                    </span>
                    <span>
                      {remainingDays > 0
                        ? `${remainingDays} days remaining`
                        : "Expired"}
                    </span>
                    <span>
                      {format(new Date(contract.endDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {property && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold">{property.title}</h4>
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {property.location.address.line1}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <div>
                            {property.type.charAt(0).toUpperCase() +
                              property.type.slice(1)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Area:</span>
                          <div>{property.specifications.totalArea} m²</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Bedrooms:
                          </span>
                          <div>{property.specifications.bedrooms}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Bathrooms:
                          </span>
                          <div>{property.specifications.bathrooms}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Contract Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Property Rules</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Pets Allowed:</span>
                        <Badge
                          variant={
                            contract.petsAllowed ? "default" : "secondary"
                          }
                        >
                          {contract.petsAllowed ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Smoking Allowed:</span>
                        <Badge
                          variant={
                            contract.smokingAllowed ? "default" : "secondary"
                          }
                        >
                          {contract.smokingAllowed ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Subletting Allowed:</span>
                        <Badge
                          variant={
                            contract.sublettingAllowed ? "default" : "secondary"
                          }
                        >
                          {contract.sublettingAllowed ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Utilities</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Water Bill:</span>
                        <span className="text-muted-foreground">
                          {contract.waterBill}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Electricity Bill:</span>
                        <span className="text-muted-foreground">
                          {contract.electricityBill}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="tenants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tenant Information
                </CardTitle>
                <CardDescription>
                  {Array.isArray(contract.tenants)
                    ? contract.tenants.length
                    : 0}{" "}
                  tenant(s) on this contract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(contract.tenants) &&
                    contract.tenants.map((tenantId, index) => {
                      const tenant = getTenantInfo(tenantId as string);
                      if (!tenant) return null;

                      return (
                        <div
                          className="flex items-center space-x-4 rounded-lg border p-4"
                          key={tenantId as string}
                        >
                          <Avatar>
                            <AvatarFallback>
                              {tenant.personalInfo.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold">
                              {tenant.personalInfo.firstName}{" "}
                              {tenant.personalInfo.lastName}
                            </h4>
                            <div className="flex items-center gap-4 text-muted-foreground text-sm">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {tenant.personalInfo.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {tenant.personalInfo.phone}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">
                              Primary Tenant
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {index === 0 ? "Main" : "Co-tenant"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="financials">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Monthly Rent:
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(contract.rentAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Security Deposit:
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(contract.depositAmount)}
                      </span>
                    </div>
                    {contract.serviceCharge && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Service Charge:
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(contract.serviceCharge)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Monthly:</span>
                      <span>
                        {formatCurrency(
                          contract.rentAmount + (contract.serviceCharge || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">
                        {contract.rentDueDate}
                        {contract.rentDueDate === 1
                          ? "st"
                          : contract.rentDueDate === 2
                            ? "nd"
                            : contract.rentDueDate === 3
                              ? "rd"
                              : "th"}{" "}
                        of each month
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Next Payment:
                      </span>
                      <span className="font-medium">
                        {/* {format(
													new Date(
														new Date().getFullYear(),
														new Date().getMonth() + 1,
														contract.rentDueDate
													),
													"MMM dd, yyyy"
												)} */}
                      </span>
                    </div>
                    {contract.lateFee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Late Fee:</span>
                        <span className="font-medium">
                          {formatCurrency(contract.lateFee)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contract Documents
                </CardTitle>
                <CardDescription>
                  Signed agreements and related documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Main Contract Document */}
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Rental Agreement</div>
                        <div className="text-muted-foreground text-sm">
                          Main contract document
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Additional Documents */}
                  {contract.contractData?.terms &&
                    contract.contractData.terms.length > 0 && (
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Additional Terms</div>
                            <div className="text-muted-foreground text-sm">
                              Custom terms and conditions
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Signatures */}
            <Card>
              <CardHeader>
                <CardTitle>Digital Signatures</CardTitle>
                <CardDescription>
                  Contract signing status and signature details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">Landlord Signature</div>
                      <div className="text-muted-foreground text-sm">
                        {contract.landlordSignature
                          ? `Signed on ${format(new Date(contract.landlordSignature.signedAt), "MMM dd, yyyy")}`
                          : "Pending signature"}
                      </div>
                    </div>
                    <Badge
                      variant={
                        contract.landlordSignature ? "default" : "secondary"
                      }
                    >
                      {contract.landlordSignature ? "Signed" : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">Tenant Signatures</div>
                      <div className="text-muted-foreground text-sm">
                        {contract.tenantSignatures
                          ? `${Object.keys(contract.tenantSignatures).length} of ${Array.isArray(contract.tenants) ? contract.tenants.length : 0} signed`
                          : "Pending signatures"}
                      </div>
                    </div>
                    <Badge
                      variant={
                        contract.tenantSignatures &&
                        Object.keys(contract.tenantSignatures).length > 0
                          ? "default"
                          : "secondary"
                      }
                    >
                      {contract.tenantSignatures &&
                      Object.keys(contract.tenantSignatures).length > 0
                        ? "Partial"
                        : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Contract Timeline
                </CardTitle>
                <CardDescription>
                  Important dates and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <div className="font-medium">Contract Start</div>
                      <div className="text-muted-foreground text-sm">
                        {format(new Date(contract.startDate), "MMMM dd, yyyy")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">Current Status</div>
                      <div className="text-muted-foreground text-sm">
                        Contract is {contract.status.toLowerCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-lg border p-3">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                    <div className="flex-1">
                      <div className="font-medium">Contract End</div>
                      <div className="text-muted-foreground text-sm">
                        {format(new Date(contract.endDate), "MMMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(contract)} variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {contract.status === ContractStatus.PENDING && onSign && (
            <Button onClick={() => onSign(contract)}>
              <FileSignature className="mr-2 h-4 w-4" />
              Sign Contract
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
