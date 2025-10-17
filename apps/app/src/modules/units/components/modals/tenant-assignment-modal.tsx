"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, Search, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTenants } from "@/modules/tenants/tenant.queries";
import type { Tenant } from "@/modules/tenants/tenant.type";
import { useAssignTenantToUnit } from "../../unit.mutations";
import type { Unit } from "../../unit.type";
import { formatCurrency, getUnitDisplayTitle } from "../../utils/unit-utils";

const tenantAssignmentSchema = z.object({
  tenantId: z.string().min(1, "Please select a tenant"),
  leaseStartDate: z.date({
    message: "Lease start date is required",
  }),
  leaseEndDate: z.date().optional(),
  // depositPaid: z.number().min(0, "Deposit paid must be positive").optional(),
  depositPaid: z.boolean().optional(),
  notes: z.string().optional(),
});

type TenantAssignmentFormData = z.infer<typeof tenantAssignmentSchema>;

type TenantAssignmentModalProps = {
  unit: Unit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function TenantAssignmentModal({
  unit,
  open,
  onOpenChange,
  onSuccess,
}: TenantAssignmentModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const assignTenantMutation = useAssignTenantToUnit();
  const { data } = useTenants();

  const form = useForm<TenantAssignmentFormData>({
    resolver: zodResolver(tenantAssignmentSchema),
    defaultValues: {
      tenantId: "",
      // depositPaid: unit?.depositAmount || 0,
      depositPaid: false,
      notes: "",
    },
  });

  const filteredTenants =
    data?.items.filter(
      (tenant: Tenant) =>
        tenant.personalInfo.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        tenant.personalInfo.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        tenant.personalInfo.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        tenant.personalInfo.phone.includes(searchTerm)
    ) || [];

  const handleTenantSelect = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    form.setValue("tenantId", tenant._id);
  };

  const onSubmit = async (data: TenantAssignmentFormData) => {
    if (!unit) return;

    try {
      await assignTenantMutation.mutateAsync({
        unitId: unit._id,
        data: {
          tenantId: data.tenantId,
          leaseStartDate: data.leaseStartDate.toISOString(),
          leaseEndDate: data.leaseEndDate?.toISOString(),
          depositPaid: data.depositPaid,
          notes: data.notes,
        },
      });

      onOpenChange(false);
      onSuccess?.();
      form.reset();
      setSelectedTenant(null);
      setSearchTerm("");
    } catch (error) {
      console.error("Failed to assign tenant:", error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setSelectedTenant(null);
    setSearchTerm("");
  };

  if (!unit) return null;

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Tenant</DialogTitle>
          <DialogDescription>
            Assign a tenant to {getUnitDisplayTitle(unit)}
          </DialogDescription>
        </DialogHeader>

        {/* Unit Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Unit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Unit:</span>
                <span className="ml-2 font-medium">{unit.unitNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rent:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(unit.rent)}/month
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Deposit:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(unit.depositAmount)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Due Day:</span>
                <span className="ml-2 font-medium">
                  {unit.rentDueDay}th of month
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Tenant Selection */}
            <div className="space-y-4">
              <FormLabel>Select Tenant</FormLabel>

              {/* Search */}
              <div className="relative">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tenants..."
                  value={searchTerm}
                />
              </div>

              {/* Selected Tenant */}
              {selectedTenant && (
                <Card className="border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {selectedTenant.personalInfo.firstName}{" "}
                            {selectedTenant.personalInfo.lastName}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {selectedTenant.personalInfo.email}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {selectedTenant.personalInfo.phone}
                          </div>
                        </div>
                      </div>
                      <Badge variant="default">Selected</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tenant List */}
              {!selectedTenant && (
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {filteredTenants.map((tenant) => (
                    <Card
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      key={tenant._id}
                      onClick={() => handleTenantSelect(tenant)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {tenant.personalInfo.firstName}{" "}
                              {tenant.personalInfo.lastName}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {tenant.personalInfo.email}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {tenant.personalInfo.phone}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredTenants.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      No tenants found
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="tenantId"
                render={() => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lease Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="leaseStartDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Lease Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            variant="outline"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          disabled={(date) => date < new Date()}
                          initialFocus
                          mode="single"
                          onSelect={field.onChange}
                          selected={field.value}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the tenant will start occupying the unit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leaseEndDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Lease End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            variant="outline"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          disabled={(date) => {
                            const startDate = form.getValues("leaseStartDate");
                            return (
                              date < new Date() ||
                              (startDate && date <= startDate)
                            );
                          }}
                          initialFocus
                          mode="single"
                          onSelect={field.onChange}
                          selected={field.value}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Leave empty for open-ended lease
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Deposit Paid */}
            <FormField
              control={form.control}
              name="depositPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Paid</FormLabel>
                  <FormControl>
                    {/* <Input
											type="number"
											step="0.01"
											{...field}
											onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
										/> */}
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      // {...field}
                      // value={field.value ? "true" : "false"}
                    />
                  </FormControl>
                  <FormDescription>
                    Amount of security deposit paid by tenant (default:{" "}
                    {formatCurrency(unit.depositAmount)})
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this assignment..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                disabled={assignTenantMutation.isPending}
                onClick={handleClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={assignTenantMutation.isPending || !selectedTenant}
                type="submit"
              >
                {assignTenantMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign Tenant
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
