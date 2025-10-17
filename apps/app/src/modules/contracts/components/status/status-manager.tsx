"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Progress } from "@kaa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import { Textarea } from "@kaa/ui/components/textarea";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  File,
  FileText,
  Pause,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateContract } from "../../contract.queries";
import {
  type UpdateContractStatusFormData,
  updateContractStatusSchema,
} from "../../contract.schema";
import { type Contract, ContractStatus } from "../../contract.type";

type StatusManagerProps = {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
};

const statusConfig = {
  [ContractStatus.DRAFT]: {
    icon: FileText,
    color: "bg-gray-100 text-gray-800",
    description: "Contract is being prepared",
    nextStates: [ContractStatus.PENDING, ContractStatus.CANCELLED],
  },
  [ContractStatus.PENDING]: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
    description: "Waiting for signatures from all parties",
    nextStates: [ContractStatus.ACTIVE, ContractStatus.CANCELLED],
  },
  [ContractStatus.ACTIVE]: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    description: "Contract is currently active",
    nextStates: [ContractStatus.TERMINATED, ContractStatus.EXPIRED],
  },
  [ContractStatus.SIGNED]: {
    icon: Pause,
    color: "bg-orange-100 text-orange-800",
    description: "Contract is signed",
    nextStates: [ContractStatus.TERMINATED],
  },
  [ContractStatus.RENEWED]: {
    icon: Pause,
    color: "bg-orange-100 text-orange-800",
    description: "Contract is signed",
    nextStates: [ContractStatus.TERMINATED],
  },
  [ContractStatus.EXPIRED]: {
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800",
    description: "Contract has reached its end date",
    nextStates: [ContractStatus.TERMINATED],
  },
  [ContractStatus.SUSPENDED]: {
    icon: XCircle,
    color: "bg-red-100 text-red-800",
    description: "Contract has been terminated",
    nextStates: [ContractStatus.TERMINATED],
  },
  [ContractStatus.TERMINATED]: {
    icon: XCircle,
    color: "bg-red-100 text-red-800",
    description: "Contract has been terminated",
    nextStates: [],
  },
  [ContractStatus.CANCELLED]: {
    icon: XCircle,
    color: "bg-gray-100 text-gray-800",
    description: "Contract was cancelled before activation",
    nextStates: [],
  },
};

export function StatusManager({ contract, open, onClose }: StatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<ContractStatus | "">("");

  const updateStatusMutation = useUpdateContract();

  const form = useForm<UpdateContractStatusFormData>({
    resolver: zodResolver(updateContractStatusSchema),
    defaultValues: {
      status: ContractStatus.DRAFT,
      reason: "",
      notes: "",
    },
  });

  if (!contract) return null;

  const currentStatusConfig = statusConfig[contract.status];
  const availableNextStates = currentStatusConfig?.nextStates;

  // Calculate contract progress
  const getContractProgress = () => {
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    const today = new Date();

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    const progress = Math.max(
      0,
      Math.min(100, (elapsed / totalDuration) * 100)
    );

    return {
      progress: Math.round(progress),
      daysRemaining: Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      ),
      isExpired: today > endDate,
    };
  };

  // Submit status update
  const onSubmitStatusUpdate = async (data: UpdateContractStatusFormData) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: contract._id,
        data,
      });

      toast.success("Contract status updated successfully!");
      onClose();
      form.reset();
      setSelectedStatus("");
    } catch (error) {
      toast.error("Failed to update contract status. Please try again.");
      console.error("Status update error:", error);
    }
  };

  // Handle status selection
  const handleStatusSelect = (status: ContractStatus) => {
    setSelectedStatus(status);
    form.setValue("status", status);
  };

  const contractProgress = getContractProgress();
  const SelectedStatusIcon = selectedStatus
    ? statusConfig[selectedStatus as ContractStatus]?.icon
    : null;

  return (
    <Dialog onOpenChange={onClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Contract Status Management
          </DialogTitle>
          <DialogDescription>
            Contract #{contract._id.slice(-8)} - Update contract status and
            track workflow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStatusConfig?.icon ? (
                  <currentStatusConfig.icon className="h-4 w-4" />
                ) : (
                  <File className="h-4 w-4" />
                )}
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={currentStatusConfig.color}>
                  {contract.status.replace("_", " ")}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {currentStatusConfig.description}
                </span>
              </div>

              {/* Contract Progress Bar */}
              {contract.status === ContractStatus.ACTIVE && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Contract Progress</span>
                    <span>{contractProgress.progress}%</span>
                  </div>
                  <Progress className="h-2" value={contractProgress.progress} />
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>
                      {format(new Date(contract.startDate), "MMM dd, yyyy")}
                    </span>
                    <span>
                      {contractProgress.daysRemaining > 0
                        ? `${contractProgress.daysRemaining} days remaining`
                        : contractProgress.isExpired
                          ? "Expired"
                          : "Ends today"}
                    </span>
                    <span>
                      {format(new Date(contract.endDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              )}

              {/* Status Warnings */}
              {contract.status === ContractStatus.EXPIRED && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This contract has expired. Consider renewing or terminating
                    it.
                  </AlertDescription>
                </Alert>
              )}

              {/* {contract.status === ContractStatus.SUSPENDED && (
								<Alert>
									<Pause className="h-4 w-4" />
									<AlertDescription>
										This contract is currently suspended. Update the status to reactivate.
									</AlertDescription>
								</Alert>
							)} */}
            </CardContent>
          </Card>

          {/* Available Status Changes */}
          {availableNextStates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Change Status</CardTitle>
                <CardDescription>
                  Select a new status for this contract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {availableNextStates.map((status) => {
                    const config = statusConfig[status];
                    const StatusIcon = config.icon;

                    return (
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedStatus === status
                            ? "shadow-md ring-2 ring-blue-500"
                            : ""
                        }`}
                        key={status}
                        onClick={() => handleStatusSelect(status)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <StatusIcon className="h-5 w-5" />
                            <div className="flex-1">
                              <div className="font-medium">
                                {status.replace("_", " ")}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {config.description}
                              </div>
                            </div>
                            {selectedStatus === status && (
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {selectedStatus && (
                  <div className="space-y-4">
                    <Separator />

                    <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
                      <currentStatusConfig.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">
                        {contract.status.replace("_", " ")}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      {SelectedStatusIcon && (
                        <SelectedStatusIcon className="h-5 w-5 text-blue-500" />
                      )}
                      <span className="font-medium text-blue-600">
                        {selectedStatus.replace("_", " ")}
                      </span>
                    </div>

                    <Form {...form}>
                      <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit(onSubmitStatusUpdate)}
                      >
                        {/* Reason Field */}
                        <FormField
                          control={form.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Status Change</FormLabel>
                              <FormControl>
                                <Select
                                  defaultValue={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a reason" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getReasonOptions(
                                      selectedStatus as ContractStatus
                                    ).map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Notes Field */}
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Provide additional context for this status change..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Status Change Confirmation */}
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            {getStatusChangeMessage(
                              contract.status,
                              selectedStatus as ContractStatus
                            )}
                          </AlertDescription>
                        </Alert>

                        <Button
                          className="w-full"
                          disabled={updateStatusMutation.isPending}
                          type="submit"
                        >
                          {updateStatusMutation.isPending
                            ? "Updating..."
                            : "Update Status"}
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
              <CardDescription>
                Track of all status changes for this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock status history - replace with actual data */}
                {[
                  {
                    status: contract.status,
                    date: new Date(),
                    user: "Current User",
                    reason: "Current status",
                    notes: "",
                  },
                  {
                    status: ContractStatus.PENDING,
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    user: "Property Manager",
                    reason: "All parties agreed to terms",
                    notes: "Contract terms finalized and ready for signing",
                  },
                  {
                    status: ContractStatus.DRAFT,
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    user: "System",
                    reason: "Contract created",
                    notes: "Initial contract creation",
                  },
                ].map((entry, index) => {
                  const config = statusConfig[entry.status];
                  const StatusIcon = config.icon;

                  return (
                    <div className="flex gap-4" key={entry.status}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`rounded-full p-2 ${config.color.replace("text-", "border-").replace("bg-", "bg-")}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        {index < 2 && (
                          <div className="mt-2 h-8 w-px bg-border" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={config.color}>
                            {entry.status.replace("_", " ")}
                          </Badge>
                          <span className="text-muted-foreground text-sm">
                            {format(entry.date, "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                        </div>

                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{entry.user}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {entry.reason}
                            </span>
                          </div>

                          {entry.notes && (
                            <div className="mt-1 text-muted-foreground">
                              {entry.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Status Actions */}
          {availableNextStates.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No status changes are available for contracts in{" "}
                {contract.status.replace("_", " ")} status.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get reason options based on target status
function getReasonOptions(targetStatus: ContractStatus) {
  const reasonMap = {
    [ContractStatus.ACTIVE]: [
      { value: "signatures_completed", label: "All signatures completed" },
      { value: "terms_agreed", label: "Terms agreed by all parties" },
      { value: "manual_activation", label: "Manual activation" },
    ],
    [ContractStatus.SUSPENDED]: [
      { value: "payment_default", label: "Payment default" },
      { value: "breach_of_terms", label: "Breach of contract terms" },
      { value: "maintenance_issues", label: "Property maintenance issues" },
      { value: "mutual_agreement", label: "Mutual agreement" },
      { value: "legal_issues", label: "Legal complications" },
    ],
    [ContractStatus.TERMINATED]: [
      { value: "mutual_termination", label: "Mutual termination" },
      { value: "breach_of_contract", label: "Breach of contract" },
      { value: "non_payment", label: "Non-payment of rent" },
      { value: "property_damage", label: "Property damage" },
      { value: "violation_of_terms", label: "Violation of lease terms" },
      { value: "legal_action", label: "Legal action required" },
    ],
    [ContractStatus.CANCELLED]: [
      { value: "tenant_withdrawal", label: "Tenant withdrew" },
      { value: "property_unavailable", label: "Property became unavailable" },
      { value: "failed_negotiations", label: "Failed to agree on terms" },
      { value: "financial_issues", label: "Financial qualification issues" },
    ],
    [ContractStatus.EXPIRED]: [
      { value: "natural_expiry", label: "Contract reached end date" },
      { value: "no_renewal_notice", label: "No renewal notice provided" },
    ],
    [ContractStatus.RENEWED]: [
      { value: "renewal_completed", label: "Renewal process completed" },
      { value: "auto_renewal", label: "Automatic renewal triggered" },
    ],
    [ContractStatus.PENDING]: [
      { value: "terms_finalized", label: "Contract terms finalized" },
      { value: "corrections_made", label: "Corrections made to contract" },
      { value: "resubmission", label: "Resubmitted for signatures" },
    ],
    [ContractStatus.DRAFT]: [
      { value: "corrections_needed", label: "Corrections needed" },
      { value: "terms_revision", label: "Terms under revision" },
      {
        value: "additional_requirements",
        label: "Additional requirements identified",
      },
    ],
    [ContractStatus.SIGNED]: [
      { value: "corrections_needed", label: "Corrections needed" },
      { value: "terms_revision", label: "Terms under revision" },
      {
        value: "additional_requirements",
        label: "Additional requirements identified",
      },
    ],
  };

  return reasonMap[targetStatus] || [{ value: "other", label: "Other" }];
}

// Helper function to get status change confirmation message
function getStatusChangeMessage(
  currentStatus: ContractStatus,
  targetStatus: ContractStatus
): string {
  const messageMap: Record<string, string> = {
    [`${ContractStatus.DRAFT}_${ContractStatus.PENDING}`]:
      "Contract will be sent for signatures from all parties.",
    [`${ContractStatus.PENDING}_${ContractStatus.ACTIVE}`]:
      "Contract will become active and tenant obligations will begin.",
    [`${ContractStatus.ACTIVE}_${ContractStatus.SUSPENDED}`]:
      "Contract will be temporarily suspended. Rent collection may be paused.",
    [`${ContractStatus.SUSPENDED}_${ContractStatus.ACTIVE}`]:
      "Contract will be reactivated and normal operations will resume.",
    [`${ContractStatus.ACTIVE}_${ContractStatus.TERMINATED}`]:
      "Contract will be permanently terminated. This action cannot be undone.",
    [`${ContractStatus.EXPIRED}_${ContractStatus.RENEWED}`]:
      "Contract will be marked as renewed. Ensure renewal process is completed.",
    [`${ContractStatus.DRAFT}_${ContractStatus.CANCELLED}`]:
      "Contract will be cancelled and removed from active workflows.",
    [`${ContractStatus.PENDING}_${ContractStatus.CANCELLED}`]:
      "Contract signing process will be cancelled.",
  };

  const key = `${currentStatus}_${targetStatus}`;
  return (
    messageMap[key] ||
    `Contract status will be changed from ${currentStatus.replace("_", " ")} to ${targetStatus.replace("_", " ")}.`
  );
}
