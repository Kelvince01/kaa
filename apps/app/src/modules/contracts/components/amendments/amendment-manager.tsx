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
import { Checkbox } from "@kaa/ui/components/checkbox";
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
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth";
import {
  useApproveContractAmendment,
  useContracts,
  useCreateContractAmendment,
  useRejectContractAmendment,
} from "@/modules/contracts";
import { useContractAmendmentHistory } from "@/modules/contracts/contract.queries";
import {
  type ContractAmendmentFormData,
  contractAmendmentSchema,
} from "../../contract.schema";
import {
  type Contract,
  type ContractAmendment,
  ContractStatus,
} from "../../contract.type";

// Mock amendments data
const mockAmendments: ContractAmendment[] = [
  {
    amendmentDate: "2025-01-20T10:30:00Z",
    amendmentReason: "Rent increase due to market conditions",
    changes: [
      { field: "rentAmount", oldValue: "15000", newValue: "16500" },
      { field: "rentDueDate", oldValue: "1", newValue: "5" },
    ],
    amendedBy: "landlord123",
    status: "pending",
  },
  {
    amendmentDate: "2024-12-15T14:20:00Z",
    amendmentReason: "Update utility billing arrangement",
    changes: [
      { field: "waterBill", oldValue: "Tenant pays", newValue: "Included" },
      { field: "electricityBill", oldValue: "Tenant pays", newValue: "Shared" },
    ],
    amendedBy: "landlord123",
    status: "approved",
  },
  {
    amendmentDate: "2024-11-10T09:15:00Z",
    amendmentReason: "Pet policy update",
    changes: [{ field: "petsAllowed", oldValue: "false", newValue: "true" }],
    amendedBy: "landlord123",
    status: "rejected",
  },
];

type AmendmentManagerProps = {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
};

export function AmendmentManager({
  contract,
  open,
  onClose,
}: AmendmentManagerProps) {
  const { user, isAuthenticated } = useAuthStore();

  const [createAmendmentOpen, setCreateAmendmentOpen] = useState(false);
  const [changes, setChanges] = useState<
    { field: string; oldValue: string; newValue: string; description: string }[]
  >([]);

  const createAmendmentMutation = useCreateContractAmendment();
  const approveAmendmentMutation = useApproveContractAmendment();
  const rejectAmendmentMutation = useRejectContractAmendment();

  const form = useForm<ContractAmendmentFormData>({
    resolver: zodResolver(contractAmendmentSchema),
    defaultValues: {
      amendmentReason: "",
      changes: [],
    },
  });

  // Use contracts module hooks
  const { data: contractsData, isLoading } = useContracts({
    status: ContractStatus.ACTIVE,
    ...(user?.role === "landlord" && { landlordId: user.id }),
    ...(user?.role === "tenant" && { tenantId: user.id }),
  });

  const { data } = useContractAmendmentHistory(contract?._id as string);
  const amendments = data?.amendments ?? [];

  if (!contract) return null;

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      case "applied":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "applied":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Add change
  const addChange = () => {
    setChanges([
      ...changes,
      { field: "", oldValue: "", newValue: "", description: "" },
    ]);
  };

  // Remove change
  const removeChange = (index: number) => {
    setChanges(changes.filter((_, i) => i !== index));
  };

  // Update change
  const updateChange = (
    index: number,
    field: keyof (typeof changes)[0],
    value: string
  ) => {
    const newChanges = [...changes];
    // @ts-expect-error
    newChanges[index] = { ...newChanges[index], [field]: value };

    // Auto-populate old value when field is selected
    if (field === "field" && contract) {
      const fieldConfig = amendableFields.find((f) => f.value === value);
      if (fieldConfig) {
        // @ts-expect-error
        newChanges[index].oldValue = getFieldValue(contract, value);
      }
    }

    setChanges(newChanges);
  };

  // Submit amendment
  const onSubmitAmendment = async (data: ContractAmendmentFormData) => {
    try {
      const amendmentData = {
        ...data,
        changes: changes.filter(
          (change) => change.field && change.oldValue && change.newValue
        ),
      } as ContractAmendmentFormData;

      if (amendmentData.changes.length === 0) {
        toast.error("Please add at least one change.");
        return;
      }

      await createAmendmentMutation.mutateAsync({
        contractId: contract._id,
        amendmentData,
      });

      // Add to local state
      const newAmendment: ContractAmendment = {
        amendmentDate: new Date().toISOString(),
        amendmentReason: amendmentData.amendmentReason,
        changes: amendmentData.changes,
        amendedBy: "current-user", // Replace with actual user ID
        status: "pending",
      } as ContractAmendment;

      toast.success("Amendment request submitted successfully!");
      setCreateAmendmentOpen(false);
      form.reset();
      setChanges([]);
    } catch (error) {
      toast.error("Failed to create amendment. Please try again.");
    }
  };

  // Approve amendment
  const approveAmendment = async (
    _amendment: ContractAmendment,
    index: number
  ) => {
    try {
      await approveAmendmentMutation.mutateAsync({
        contractId: contract._id,
        amendmentId: `amendment-${index}`, // Mock ID
      });

      toast.success("Amendment approved successfully!");
    } catch (error) {
      toast.error("Failed to approve amendment.");
    }
  };

  // Reject amendment
  const rejectAmendment = async (
    _amendment: ContractAmendment,
    index: number
  ) => {
    try {
      await rejectAmendmentMutation.mutateAsync({
        contractId: contract._id,
        amendmentId: `amendment-${index}`, // Mock ID
        reason: "Terms not acceptable",
      });

      toast.success("Amendment rejected.");
    } catch (error) {
      toast.error("Failed to reject amendment.");
    }
  };

  // Field options for amendments
  const amendableFields = [
    { value: "rentAmount", label: "Rent Amount", type: "number" },
    { value: "depositAmount", label: "Deposit Amount", type: "number" },
    { value: "serviceCharge", label: "Service Charge", type: "number" },
    { value: "lateFee", label: "Late Fee", type: "number" },
    { value: "rentDueDate", label: "Rent Due Date", type: "number" },
    {
      value: "waterBill",
      label: "Water Bill",
      type: "select",
      options: ["Included", "Tenant pays", "Shared"],
    },
    {
      value: "electricityBill",
      label: "Electricity Bill",
      type: "select",
      options: ["Included", "Tenant pays", "Shared"],
    },
    {
      value: "gasBill",
      label: "Gas Bill",
      type: "select",
      options: ["Included", "Tenant pays", "Shared"],
    },
    {
      value: "internetBill",
      label: "Internet Bill",
      type: "select",
      options: ["Included", "Tenant pays", "Shared"],
    },
    { value: "petsAllowed", label: "Pets Allowed", type: "boolean" },
    { value: "smokingAllowed", label: "Smoking Allowed", type: "boolean" },
    {
      value: "sublettingAllowed",
      label: "Subletting Allowed",
      type: "boolean",
    },
    { value: "maxOccupants", label: "Maximum Occupants", type: "number" },
    { value: "specialConditions", label: "Special Conditions", type: "text" },
    { value: "notes", label: "Notes", type: "text" },
  ];

  // Get current field value from contract
  const getFieldValue = (contract: Contract, fieldName: string): string => {
    switch (fieldName) {
      case "rentAmount":
        return contract.rentAmount?.toString() || "";
      case "depositAmount":
        return contract.depositAmount?.toString() || "";
      case "serviceCharge":
        return contract.serviceCharge?.toString() || "";
      case "lateFee":
        return contract.lateFee?.toString() || "";
      case "rentDueDate":
        return contract.rentDueDate?.toString() || "";
      case "waterBill":
        return contract.waterBill || "";
      case "electricityBill":
        return contract.electricityBill || "";
      case "gasBill":
        return contract.gasBill || "";
      case "internetBill":
        return contract.internetBill || "";
      case "petsAllowed":
        return contract.petsAllowed?.toString() || "false";
      case "smokingAllowed":
        return contract.smokingAllowed?.toString() || "false";
      case "sublettingAllowed":
        return contract.sublettingAllowed?.toString() || "false";
      case "maxOccupants":
        return contract.maxOccupants?.toString() || "";
      case "specialConditions":
        return contract.contractData?.specialConditions?.join(", ") || "";
      case "notes":
        return contract.notes || "";
      default:
        return "";
    }
  };

  // Get field display name
  const getFieldDisplayName = (field: string) => {
    const fieldMap: Record<string, string> = {
      rentAmount: "Monthly Rent",
      depositAmount: "Security Deposit",
      rentDueDate: "Rent Due Date",
      waterBill: "Water Bill",
      electricityBill: "Electricity Bill",
      petsAllowed: "Pets Allowed",
      smokingAllowed: "Smoking Allowed",
      sublettingAllowed: "Subletting Allowed",
    };
    return fieldMap[field] || field;
  };

  // Format value display
  const formatValue = (field: string, value: string) => {
    if (field.includes("Amount")) {
      return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
      }).format(Number.parseFloat(value));
    }
    if (field.includes("Allowed")) {
      return value === "true" ? "Yes" : "No";
    }
    return value;
  };

  return (
    <>
      <Dialog onOpenChange={onClose} open={open}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Contract Amendments
            </DialogTitle>
            <DialogDescription>
              Contract #{contract._id.slice(-8)} - Manage contract changes and
              amendments
            </DialogDescription>
          </DialogHeader>

          <Tabs className="w-full" defaultValue="amendments">
            <TabsList>
              <TabsTrigger value="amendments">All Amendments</TabsTrigger>
              <TabsTrigger value="create">Create Amendment</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-6" value="amendments">
              {/* Amendment List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Amendment History</CardTitle>
                      <CardDescription>
                        {amendments.length} amendment(s) found
                      </CardDescription>
                    </div>
                    <Button onClick={() => setCreateAmendmentOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Amendment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(amendments?.length as number) > 0 ? (
                      amendments.map((amendment, index) => (
                        <div
                          className="space-y-4 rounded-lg border p-4"
                          key={index.toString()}
                        >
                          {/* Amendment Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(amendment.status)}
                                <h4 className="font-medium">
                                  Amendment #{index + 1}
                                </h4>
                              </div>
                              <Badge
                                variant={getStatusBadgeVariant(
                                  amendment.status
                                )}
                              >
                                {amendment?.status.charAt(0).toUpperCase() +
                                  amendment?.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {format(
                                new Date(amendment.amendmentDate),
                                "MMM dd, yyyy"
                              )}
                            </div>
                          </div>

                          {/* Amendment Details */}
                          <div className="space-y-3">
                            <div>
                              <Label className="font-medium text-sm">
                                Reason
                              </Label>
                              <p className="mt-1 text-muted-foreground text-sm">
                                {amendment.amendmentReason}
                              </p>
                            </div>

                            <div>
                              <Label className="font-medium text-sm">
                                Changes
                              </Label>
                              <div className="mt-2 space-y-2">
                                {amendment.changes.map(
                                  (change, changeIndex) => (
                                    <div
                                      className="rounded-lg bg-muted/50 p-3"
                                      key={changeIndex.toString()}
                                    >
                                      <div className="font-medium text-sm">
                                        {getFieldDisplayName(change.field)}
                                      </div>
                                      <div className="mt-1 flex items-center gap-2 text-sm">
                                        <span className="ml-2 font-thin text-muted-foreground text-red-600 line-through">
                                          {formatValue(
                                            change.field,
                                            change.oldValue
                                          )}
                                        </span>
                                        <span>→</span>
                                        <span className="font-medium text-green-600">
                                          {formatValue(
                                            change.field,
                                            change.newValue
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          {amendment.status === "pending" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                disabled={approveAmendmentMutation.isPending}
                                onClick={() =>
                                  approveAmendment(amendment, index)
                                }
                                size="sm"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                disabled={rejectAmendmentMutation.isPending}
                                onClick={() =>
                                  rejectAmendment(amendment, index)
                                }
                                size="sm"
                                variant="destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <Edit3 className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                        <h3 className="font-medium">No amendments found</h3>
                        <p className="mb-4 text-muted-foreground text-sm">
                          Create an amendment to modify contract terms.
                        </p>
                        <Button onClick={() => setCreateAmendmentOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Amendment
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className="space-y-6" value="create">
              {/* Create Amendment Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Amendment
                  </CardTitle>
                  <CardDescription>
                    Propose changes to the existing contract terms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      className="space-y-6"
                      onSubmit={form.handleSubmit(onSubmitAmendment)}
                    >
                      {/* Amendment Reason */}
                      <FormField
                        control={form.control}
                        name="amendmentReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amendment Reason</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Explain why this amendment is needed..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Changes */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-base">
                            Contract Changes
                          </Label>
                          <Button
                            onClick={addChange}
                            type="button"
                            variant="outline"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Change
                          </Button>
                        </div>

                        {changes.map((change, index) => (
                          <Card key={index.toString()}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">
                                  Change #{index + 1}
                                </CardTitle>
                                <Button
                                  onClick={() => removeChange(index)}
                                  size="sm"
                                  type="button"
                                  variant="ghost"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                  <Label className="text-xs">
                                    Field to Change
                                  </Label>

                                  <Select
                                    onValueChange={(value) =>
                                      updateChange(index, "field", value)
                                    }
                                    value={change.field}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {amendableFields.map((field) => (
                                        <SelectItem
                                          key={field.value}
                                          value={field.value}
                                        >
                                          {field.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs">
                                    Current Value
                                  </Label>
                                  <Input
                                    className="mt-1 bg-muted"
                                    onChange={(e) =>
                                      updateChange(
                                        index,
                                        "oldValue",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Current value"
                                    readOnly
                                    type="text"
                                    value={change.oldValue}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs">New Value</Label>

                                  {(() => {
                                    const fieldConfig = amendableFields.find(
                                      (f) => f.value === change.field
                                    );
                                    if (fieldConfig?.type === "select") {
                                      return (
                                        <Select
                                          onValueChange={(value) =>
                                            updateChange(
                                              index,
                                              "newValue",
                                              value
                                            )
                                          }
                                          value={change.newValue}
                                        >
                                          <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select value" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {fieldConfig.options?.map(
                                              (option) => (
                                                <SelectItem
                                                  key={option}
                                                  value={option}
                                                >
                                                  {option}
                                                </SelectItem>
                                              )
                                            )}
                                          </SelectContent>
                                        </Select>
                                      );
                                    }
                                    if (fieldConfig?.type === "boolean") {
                                      return (
                                        <Select
                                          onValueChange={(value) =>
                                            updateChange(
                                              index,
                                              "newValue",
                                              value
                                            )
                                          }
                                          value={change.newValue}
                                        >
                                          <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select value" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="true">
                                              Yes
                                            </SelectItem>
                                            <SelectItem value="false">
                                              No
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      );
                                    }
                                    return (
                                      <Input
                                        className="mt-1"
                                        onChange={(e) =>
                                          updateChange(
                                            index,
                                            "newValue",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Enter new value"
                                        type={
                                          fieldConfig?.type === "number"
                                            ? "number"
                                            : "text"
                                        }
                                        value={change.newValue}
                                      />
                                    );
                                  })()}
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs">Description</Label>
                                  <Input
                                    className="mt-1"
                                    onChange={(e) =>
                                      updateChange(
                                        index,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Optional description"
                                    type="text"
                                    value={change.description}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {changes.length === 0 && (
                          <div className="rounded-lg border-2 border-muted-foreground/25 border-dashed py-8 text-center">
                            <Edit3 className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              No changes added yet. Click "Add Change" to start.
                            </p>
                          </div>
                        )}
                      </div>

                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Amendment requests require approval from all parties
                          before they take effect. Once approved, changes will
                          be applied to the contract.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 items-center justify-center gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="effectiveDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Effective Date</FormLabel>
                              <FormControl>
                                <Input
                                  id="effectiveDate"
                                  onChange={field.onChange}
                                  type="date"
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="requiresApproval"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    id="requiresApproval"
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>
                                  Requires Approval Before Applying
                                </FormLabel>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add any additional notes about this amendment..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button
                          disabled={
                            createAmendmentMutation.isPending ||
                            changes.length === 0
                          }
                          type="submit"
                        >
                          {createAmendmentMutation.isPending
                            ? "Submitting..."
                            : "Submit Amendment"}
                        </Button>
                        <Button
                          onClick={() => {
                            form.reset();
                            setChanges([]);
                          }}
                          type="button"
                          variant="outline"
                        >
                          Reset
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create Amendment Modal */}
      <Dialog onOpenChange={setCreateAmendmentOpen} open={createAmendmentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Amendment
            </DialogTitle>
            <DialogDescription>
              Create a simple amendment request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Amendment Reason</Label>
              <Textarea
                className="mt-1"
                onChange={(e) =>
                  form.setValue("amendmentReason", e.target.value)
                }
                placeholder="Briefly explain the reason for this amendment..."
              />
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <Label>Changes</Label>
                <Button
                  onClick={addChange}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Change
                </Button>
              </div>

              <div className="space-y-3">
                {changes.map((change, index) => (
                  <div
                    className="grid grid-cols-3 gap-2 rounded border p-3"
                    key={index.toString()}
                  >
                    <Input
                      onChange={(e) =>
                        updateChange(index, "field", e.target.value)
                      }
                      placeholder="Field name"
                      value={change.field}
                    />
                    <Input
                      onChange={(e) =>
                        updateChange(index, "oldValue", e.target.value)
                      }
                      placeholder="Old value"
                      value={change.oldValue}
                    />
                    <div className="flex gap-1">
                      <Input
                        onChange={(e) =>
                          updateChange(index, "newValue", e.target.value)
                        }
                        placeholder="New value"
                        value={change.newValue}
                      />
                      <Button
                        onClick={() => removeChange(index)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setCreateAmendmentOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={changes.length === 0}
              onClick={() => onSubmitAmendment(form.getValues())}
            >
              Submit Amendment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
