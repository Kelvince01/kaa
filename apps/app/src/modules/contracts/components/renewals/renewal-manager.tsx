"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Button } from "@kaa/ui/components/button";
import { Calendar as CalendarComponent } from "@kaa/ui/components/calendar";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { Separator } from "@kaa/ui/components/separator";
import { Switch } from "@kaa/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { addDays, addMonths, format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
} from "lucide-react";
import { useState } from "react";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRenewContract } from "@/modules/contracts";
import { formatCurrency } from "@/shared/utils/format.util";
import {
  type ContractRenewalFormData,
  contractRenewalSchema,
} from "../../contract.schema";
import type { Contract, RenewalOptions } from "../../contract.type";

type RenewalManagerProps = {
  contract: Contract | null;
  open: boolean;
  onClose: () => void;
};

export function RenewalManager({
  contract,
  open,
  onClose,
}: RenewalManagerProps) {
  const [renewalOptions, setRenewalOptions] = useState<RenewalOptions>({
    allowAutoRenewal: false,
    renewalNoticePeriod: 30,
    renewalTerms: "",
    rentIncreasePercentage: 0,
    renewalFee: 0,
  });

  const renewContractMutation = useRenewContract();

  const form = useForm<ContractRenewalFormData>({
    resolver: zodResolver(contractRenewalSchema),
    defaultValues: {
      newStartDate: "",
      newEndDate: "",
      newRentAmount: 0,
      newDepositAmount: 0,
      renewalNotes: "",
    },
  });

  if (!contract) return null;

  // Calculate renewal timeline
  const getRenewalTimeline = () => {
    const contractEndDate = new Date(contract.endDate);
    const noticeDate = addDays(
      contractEndDate,
      -renewalOptions.renewalNoticePeriod
    );
    const today = new Date();

    return {
      contractEndDate,
      noticeDate,
      isNoticeRequired: today < noticeDate,
      daysUntilExpiry: Math.ceil(
        (contractEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      ),
      daysUntilNoticeDeadline: Math.ceil(
        (noticeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };
  };

  // Calculate suggested renewal terms
  const getSuggestedRenewalTerms = () => {
    const currentEndDate = new Date(contract.endDate);
    const suggestedStartDate = addDays(currentEndDate, 1);
    const suggestedEndDate = addMonths(suggestedStartDate, 12);

    const currentRent = contract.rentAmount;
    const rentIncrease = renewalOptions.rentIncreasePercentage || 0;
    const suggestedRent = currentRent * (1 + rentIncrease / 100);

    return {
      suggestedStartDate,
      suggestedEndDate,
      suggestedRent,
      rentIncrease: suggestedRent - currentRent,
    };
  };

  // Submit renewal
  const onSubmitRenewal = async (data: ContractRenewalFormData) => {
    try {
      await renewContractMutation.mutateAsync({
        id: contract._id,
        data,
      });

      toast.success("Contract renewal initiated successfully!");
      onClose();
      form.reset();
    } catch (error) {
      toast.error("Failed to renew contract. Please try again.");
      console.error("Contract renewal error:", error);
    }
  };

  // Auto-fill suggested values
  const autoFillSuggested = () => {
    const suggested = getSuggestedRenewalTerms();

    form.setValue(
      "newStartDate",
      format(suggested.suggestedStartDate, "yyyy-MM-dd")
    );
    form.setValue(
      "newEndDate",
      format(suggested.suggestedEndDate, "yyyy-MM-dd")
    );
    form.setValue("newRentAmount", suggested.suggestedRent);
    form.setValue("newDepositAmount", contract.depositAmount);
  };

  const timeline = getRenewalTimeline();
  const suggested = getSuggestedRenewalTerms();

  return (
    <Dialog onOpenChange={onClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Contract Renewal
          </DialogTitle>
          <DialogDescription>
            Contract #{contract._id.slice(-8)} - Manage contract renewal process
          </DialogDescription>
        </DialogHeader>

        <Tabs className="w-full" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="renewal">Renew Contract</TabsTrigger>
            <TabsTrigger value="settings">Renewal Settings</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-6" value="overview">
            {/* Renewal Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Renewal Timeline
                </CardTitle>
                <CardDescription>
                  Important dates for contract renewal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4 text-center">
                    <div className="font-bold text-2xl text-muted-foreground">
                      {timeline.daysUntilNoticeDeadline > 0
                        ? timeline.daysUntilNoticeDeadline
                        : 0}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Days until notice deadline
                    </div>
                    <div className="mt-1 text-muted-foreground text-xs">
                      {format(timeline.noticeDate, "MMM dd, yyyy")}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 text-center">
                    <div className="font-bold text-2xl text-muted-foreground">
                      {timeline.daysUntilExpiry > 0
                        ? timeline.daysUntilExpiry
                        : 0}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Days until expiry
                    </div>
                    <div className="mt-1 text-muted-foreground text-xs">
                      {format(timeline.contractEndDate, "MMM dd, yyyy")}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 text-center">
                    <div
                      className={`font-bold text-2xl ${
                        renewalOptions.allowAutoRenewal
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {renewalOptions.allowAutoRenewal ? "ON" : "OFF"}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Auto Renewal
                    </div>
                    <div className="mt-1 text-muted-foreground text-xs">
                      {renewalOptions.allowAutoRenewal
                        ? "Enabled"
                        : "Manual renewal required"}
                    </div>
                  </div>
                </div>

                {timeline.daysUntilNoticeDeadline <= 7 &&
                  timeline.daysUntilNoticeDeadline > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Renewal notice deadline is approaching! You have{" "}
                        {timeline.daysUntilNoticeDeadline} days to provide
                        renewal notice.
                      </AlertDescription>
                    </Alert>
                  )}

                {timeline.daysUntilExpiry <= 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This contract has expired. Please create a new contract or
                      process the renewal immediately.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Current Contract Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Current Contract Terms</CardTitle>
                <CardDescription>
                  Summary of existing contract details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <Label className="text-muted-foreground">
                      Monthly Rent
                    </Label>
                    <div className="font-semibold">
                      {formatCurrency(contract.rentAmount)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Security Deposit
                    </Label>
                    <div className="font-semibold">
                      {formatCurrency(contract.depositAmount)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Contract Period
                    </Label>
                    <div className="font-semibold">
                      {format(new Date(contract.startDate), "MMM yyyy")} -{" "}
                      {format(new Date(contract.endDate), "MMM yyyy")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="renewal">
            {/* Suggested Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Suggested Renewal Terms
                </CardTitle>
                <CardDescription>
                  Based on current contract and renewal settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">
                        Suggested Start Date
                      </Label>
                      <div className="font-medium">
                        {format(suggested.suggestedStartDate, "MMMM dd, yyyy")}
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Suggested End Date
                      </Label>
                      <div className="font-medium">
                        {format(suggested.suggestedEndDate, "MMMM dd, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">
                        Suggested Monthly Rent
                      </Label>
                      <div className="font-medium">
                        {formatCurrency(suggested.suggestedRent)}
                      </div>
                      {suggested.rentIncrease > 0 && (
                        <div className="text-green-600 text-sm">
                          +{formatCurrency(suggested.rentIncrease)} increase
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={autoFillSuggested}
                  variant="outline"
                >
                  Use Suggested Terms
                </Button>
              </CardContent>
            </Card>

            {/* Renewal Form */}
            <Card>
              <CardHeader>
                <CardTitle>Renewal Details</CardTitle>
                <CardDescription>
                  Configure the new contract terms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit(onSubmitRenewal)}
                  >
                    {/* New Contract Dates */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="newStartDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>New Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    className="w-full pl-3 text-left font-normal"
                                    variant="outline"
                                  >
                                    {field.value ? (
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                align="start"
                                className="w-auto p-0"
                              >
                                <CalendarComponent
                                  disabled={(date) =>
                                    date < new Date(contract.endDate)
                                  }
                                  initialFocus
                                  mode="single"
                                  onSelect={(date) =>
                                    field.onChange(
                                      date ? format(date, "yyyy-MM-dd") : ""
                                    )
                                  }
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="newEndDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>New End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    className="w-full pl-3 text-left font-normal"
                                    variant="outline"
                                  >
                                    {field.value ? (
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                align="start"
                                className="w-auto p-0"
                              >
                                <CalendarComponent
                                  disabled={(date) =>
                                    date <
                                    new Date(
                                      form.watch("newStartDate") ||
                                        contract.endDate
                                    )
                                  }
                                  initialFocus
                                  mode="single"
                                  onSelect={(date) =>
                                    field.onChange(
                                      date ? format(date, "yyyy-MM-dd") : ""
                                    )
                                  }
                                  selected={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Financial Terms */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="newRentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Monthly Rent</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={contract.rentAmount.toString()}
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Current rent:{" "}
                              {formatCurrency(contract.rentAmount)}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="newDepositAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Security Deposit</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={contract.depositAmount.toString()}
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription>
                              Current deposit:{" "}
                              {formatCurrency(contract.depositAmount)}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Renewal Notes */}
                    <FormField
                      control={form.control}
                      name="renewalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renewal Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional notes or changes for the renewal..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Renewal Summary */}
                    {/* biome-ignore lint/style/noNonNullAssertion: ignore */}
                    {form.watch("newRentAmount")! > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Renewal Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {form.watch("newRentAmount") !==
                              contract.rentAmount && (
                              <div className="flex justify-between">
                                <span>Rent Change:</span>
                                <span
                                  className={`font-medium ${
                                    (form.watch("newRentAmount") as number) >
                                    contract.rentAmount
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {(form.watch("newRentAmount") as number) >
                                  contract.rentAmount
                                    ? "+"
                                    : ""}
                                  {formatCurrency(
                                    (form.watch("newRentAmount") as number) -
                                      contract.rentAmount
                                  )}
                                </span>
                              </div>
                            )}

                            {form.watch("newDepositAmount") !==
                              contract.depositAmount && (
                              <div className="flex justify-between">
                                <span>Deposit Change:</span>
                                <span
                                  className={`font-medium ${
                                    (form.watch("newDepositAmount") as number) >
                                    contract.depositAmount
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {(form.watch("newDepositAmount") as number) >
                                  contract.depositAmount
                                    ? "+"
                                    : ""}
                                  {formatCurrency(
                                    (form.watch("newDepositAmount") as number) -
                                      contract.depositAmount
                                  )}
                                </span>
                              </div>
                            )}

                            {(renewalOptions.renewalFee as number) > 0 && (
                              <div className="flex justify-between">
                                <span>Renewal Fee:</span>
                                <span className="font-medium text-red-600">
                                  +
                                  {formatCurrency(
                                    renewalOptions.renewalFee as number
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        The renewal will create a new contract period starting
                        from the specified date. All parties will need to sign
                        the renewed contract.
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Button
                        disabled={renewContractMutation.isPending}
                        type="submit"
                      >
                        {renewContractMutation.isPending
                          ? "Processing..."
                          : "Initiate Renewal"}
                      </Button>
                      <Button
                        onClick={autoFillSuggested}
                        type="button"
                        variant="outline"
                      >
                        Use Suggested Terms
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="settings">
            {/* Auto Renewal Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Auto Renewal Settings</CardTitle>
                <CardDescription>
                  Configure automatic renewal preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Auto Renewal</Label>
                    <div className="text-muted-foreground text-sm">
                      Automatically renew this contract when it expires
                    </div>
                  </div>
                  <Switch
                    checked={renewalOptions.allowAutoRenewal}
                    onCheckedChange={(checked) =>
                      setRenewalOptions((prev) => ({
                        ...prev,
                        allowAutoRenewal: checked,
                      }))
                    }
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Notice Period (Days)</Label>
                    <Input
                      className="mt-1"
                      onChange={(e) =>
                        setRenewalOptions((prev) => ({
                          ...prev,
                          renewalNoticePeriod:
                            Number.parseInt(e.target.value, 10) || 30,
                        }))
                      }
                      type="number"
                      value={renewalOptions.renewalNoticePeriod}
                    />
                    <div className="mt-1 text-muted-foreground text-xs">
                      Days before expiry to require renewal notice
                    </div>
                  </div>

                  <div>
                    <Label>Rent Increase (%)</Label>
                    <Input
                      className="mt-1"
                      onChange={(e) =>
                        setRenewalOptions((prev) => ({
                          ...prev,
                          rentIncreasePercentage:
                            Number.parseFloat(e.target.value) || 0,
                        }))
                      }
                      step="0.1"
                      type="number"
                      value={renewalOptions.rentIncreasePercentage || 0}
                    />
                    <div className="mt-1 text-muted-foreground text-xs">
                      Automatic rent increase percentage
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Renewal Terms</Label>
                  <Textarea
                    className="mt-1"
                    onChange={(e) =>
                      setRenewalOptions((prev) => ({
                        ...prev,
                        renewalTerms: e.target.value,
                      }))
                    }
                    placeholder="Default renewal terms and conditions..."
                    value={renewalOptions.renewalTerms || ""}
                  />
                </div>

                <div>
                  <Label>Renewal Fee</Label>
                  <Input
                    className="mt-1"
                    onChange={(e) =>
                      setRenewalOptions((prev) => ({
                        ...prev,
                        renewalFee: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                    type="number"
                    value={renewalOptions.renewalFee || 0}
                  />
                  <div className="mt-1 text-muted-foreground text-xs">
                    One-time fee charged for contract renewal
                  </div>
                </div>

                <Button className="w-full">Save Renewal Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
