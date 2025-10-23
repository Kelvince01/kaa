"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Switch } from "@kaa/ui/components/switch";
import { Textarea } from "@kaa/ui/components/textarea";
import { format } from "date-fns";
import {
  Building,
  CalendarIcon,
  DollarSign,
  Minus,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useProperties } from "@/modules/properties/property.queries";
import { useTenants } from "@/modules/tenants/tenant.queries";
import { useCreateContract } from "../../contract.queries";
import {
  type CreateContractFormData,
  createContractSchema,
} from "../../contract.schema";
import { useContractStore } from "../../contract.store";
import { ContractType } from "../../contract.type";

type CreateContractFormProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateContractForm({ open, onClose }: CreateContractFormProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [customTerms, setCustomTerms] = useState<
    { title: string; content: string }[]
  >([]);
  const [specialConditions, setSpecialConditions] = useState<string[]>([]);

  const { setFormSubmitting } = useContractStore();
  const createContractMutation = useCreateContract();
  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();

  const form = useForm<CreateContractFormData>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      propertyId: "",
      tenantIds: [],
      startDate: "",
      endDate: "",
      rentAmount: 0,
      depositAmount: 0,
      rentDueDate: 1,
      waterBill: "Tenant pays",
      electricityBill: "Tenant pays",
      petsAllowed: false,
      smokingAllowed: false,
      sublettingAllowed: false,
      contractType: ContractType.ASSURED_SHORTHAND_TENANCY,
      terms: [],
      specialConditions: [],
    },
  });

  const onSubmit = async (data: CreateContractFormData) => {
    try {
      setFormSubmitting(true);

      const formData = {
        ...data,
        tenantIds: selectedTenants,
        terms: customTerms,
        specialConditions: specialConditions.filter(
          (condition) => condition.trim() !== ""
        ),
      };

      await createContractMutation.mutateAsync(formData);

      toast.success("Contract created successfully!");
      onClose();
      form.reset();
      setSelectedTenants([]);
      setCustomTerms([]);
      setSpecialConditions([]);
    } catch (error) {
      toast.error("Failed to create contract. Please try again.");
      console.error("Contract creation error:", error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const addCustomTerm = () => {
    setCustomTerms([...customTerms, { title: "", content: "" }]);
  };

  const removeCustomTerm = (index: number) => {
    setCustomTerms(customTerms.filter((_, i) => i !== index));
  };

  const updateCustomTerm = (
    index: number,
    field: "title" | "content",
    value: string
  ) => {
    const updated = customTerms.map((term, i) =>
      i === index ? { ...term, [field]: value } : term
    );
    setCustomTerms(updated);
  };

  const addSpecialCondition = () => {
    setSpecialConditions([...specialConditions, ""]);
  };

  const removeSpecialCondition = (index: number) => {
    setSpecialConditions(specialConditions.filter((_, i) => i !== index));
  };

  const updateSpecialCondition = (index: number, value: string) => {
    const updated = specialConditions.map((condition, i) =>
      i === index ? value : condition
    );
    setSpecialConditions(updated);
  };

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  return (
    <Dialog onOpenChange={onClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Create New Contract
          </DialogTitle>
          <DialogDescription>
            Fill in the details to create a new rental contract
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Property details and contract type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="propertyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedProperty(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a property" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {properties?.properties?.map((property) => (
                              <SelectItem
                                key={(property._id as any).toString()}
                                value={(property._id as any).toString()}
                              >
                                <div>
                                  <div className="font-medium">
                                    {property.title}
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    {property.location.address.line1}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Type</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contract type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(ContractType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tenant Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tenants
                </CardTitle>
                <CardDescription>
                  Select tenants for this contract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tenants?.items?.map((tenant) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={tenant._id}
                    >
                      <div>
                        <div className="font-medium">
                          {tenant.personalInfo.firstName}{" "}
                          {tenant.personalInfo.lastName}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {tenant.personalInfo.email}
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleTenantSelection(tenant._id)}
                        size="sm"
                        type="button"
                        variant={
                          selectedTenants.includes(tenant._id)
                            ? "default"
                            : "outline"
                        }
                      >
                        {selectedTenants.includes(tenant._id)
                          ? "Selected"
                          : "Select"}
                      </Button>
                    </div>
                  ))}
                  {selectedTenants.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {selectedTenants.map((tenantId) => {
                        const tenant = tenants?.items?.find(
                          (t) => t._id === tenantId
                        );
                        return tenant ? (
                          <Badge key={tenantId} variant="secondary">
                            {tenant.personalInfo.firstName}{" "}
                            {tenant.personalInfo.lastName}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contract Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Period</CardTitle>
                <CardDescription>
                  Set the start and end dates for the contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                                variant={"outline"}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              disabled={(date) =>
                                date < new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                              mode="single"
                              onSelect={(date) =>
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : ""
                                )
                              }
                              selected={
                                field.value ? new Date(field.value) : undefined
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
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                                variant={"outline"}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                              disabled={(date) =>
                                date < new Date(form.watch("startDate")) ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                              mode="single"
                              onSelect={(date) =>
                                field.onChange(
                                  date ? format(date, "yyyy-MM-dd") : ""
                                )
                              }
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Terms
                </CardTitle>
                <CardDescription>
                  Set rent amount, deposit, and payment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="rentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Rent</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depositAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rentDueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rent Due Date (Day of Month)</FormLabel>
                        <FormControl>
                          <Input
                            max="31"
                            min="1"
                            placeholder="1"
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value, 10) || 1
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Utilities */}
            <Card>
              <CardHeader>
                <CardTitle>Utilities & Bills</CardTitle>
                <CardDescription>
                  Configure who pays for utilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="waterBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Water Bill</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Included">
                              Included in rent
                            </SelectItem>
                            <SelectItem value="Tenant pays">
                              Tenant pays
                            </SelectItem>
                            <SelectItem value="Shared">Shared</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="electricityBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electricity Bill</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Included">
                              Included in rent
                            </SelectItem>
                            <SelectItem value="Tenant pays">
                              Tenant pays
                            </SelectItem>
                            <SelectItem value="Shared">Shared</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Property Rules</CardTitle>
                <CardDescription>
                  Set property-specific rules and restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="petsAllowed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Pets Allowed
                          </FormLabel>
                          <FormDescription>
                            Allow tenants to keep pets
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smokingAllowed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Smoking Allowed
                          </FormLabel>
                          <FormDescription>
                            Allow smoking on the property
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sublettingAllowed"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Subletting Allowed
                          </FormLabel>
                          <FormDescription>
                            Allow tenants to sublet
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Terms & Conditions</CardTitle>
                <CardDescription>
                  Add custom terms and conditions specific to this contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {customTerms.map((term, index) => (
                  <div
                    className="space-y-2 rounded-lg border p-4"
                    key={term.title}
                  >
                    <div className="flex items-center justify-between">
                      <Label>Term {index + 1}</Label>
                      <Button
                        onClick={() => removeCustomTerm(index)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      onChange={(e) =>
                        updateCustomTerm(index, "title", e.target.value)
                      }
                      placeholder="Term title"
                      value={term.title}
                    />
                    <Textarea
                      onChange={(e) =>
                        updateCustomTerm(index, "content", e.target.value)
                      }
                      placeholder="Term content"
                      value={term.content}
                    />
                  </div>
                ))}
                <Button
                  className="w-full"
                  onClick={addCustomTerm}
                  type="button"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Term
                </Button>
              </CardContent>
            </Card>

            {/* Special Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Conditions</CardTitle>
                <CardDescription>
                  Add any special conditions or notes for this contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {specialConditions.map((condition, index) => (
                  <div className="flex gap-2" key={condition}>
                    <Input
                      className="flex-1"
                      onChange={(e) =>
                        updateSpecialCondition(index, e.target.value)
                      }
                      placeholder={`Special condition ${index + 1}`}
                      value={condition}
                    />
                    <Button
                      onClick={() => removeSpecialCondition(index)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  className="w-full"
                  onClick={addSpecialCondition}
                  type="button"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Special Condition
                </Button>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button onClick={onClose} type="button" variant="outline">
                Cancel
              </Button>
              <Button
                disabled={
                  createContractMutation.isPending ||
                  selectedTenants.length === 0
                }
                type="submit"
              >
                {createContractMutation.isPending
                  ? "Creating..."
                  : "Create Contract"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
