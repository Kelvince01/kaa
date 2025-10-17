"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import { Switch } from "@kaa/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { format } from "date-fns";
import {
  Copy,
  Edit,
  File,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  useContractTemplates,
  useCreateContractTemplate,
  useDeleteContractTemplate,
  useDuplicateContractTemplate,
  useUpdateContractTemplate,
} from "../../contract.queries";
import {
  type ContractTemplateFormData,
  contractTemplateSchema,
} from "../../contract.schema";
import {
  type ContractTemplate,
  type ContractTemplate_v2,
  ContractType,
  PropertyType,
} from "../../contract.type";

type TemplateManagerProps = {
  open: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: ContractTemplate) => void;
};

export function TemplateManager({
  open,
  onClose,
  onSelectTemplate,
}: TemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<
    PropertyType | "all"
  >("all");

  const { data: templatesData = [], isLoading } = useContractTemplates();
  const createTemplateMutation = useCreateContractTemplate();
  const updateTemplateMutation = useUpdateContractTemplate();
  const deleteTemplateMutation = useDeleteContractTemplate();
  const duplicateTemplateMutation = useDuplicateContractTemplate();
  const templates = (
    templatesData as {
      templates: any[];
      status: string;
    }
  ).templates;

  const form = useForm<ContractTemplateFormData>({
    resolver: zodResolver(contractTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      contractType: ContractType.ASSURED_SHORTHAND_TENANCY,
      // content: "",
      terms: [],
      isActive: true,
    },
  });

  // Filter templates
  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPropertyType =
      propertyTypeFilter === "all" ||
      template.propertyType === propertyTypeFilter;

    return matchesSearch && matchesPropertyType;
  });

  // Handle template selection
  const handleSelectTemplate = (template: ContractTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
      onClose();
    } else {
      setSelectedTemplate(template);
      setIsEditing(false);
    }
  };

  // Handle edit template
  const handleEditTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);

    // Populate form with template data
    form.reset({
      name: template.name,
      description: template.description,
      contractType: template.contractType,
      // content: template.content,
      terms: template.terms,
      isActive: template.isActive,
    });
  };

  // Handle create new template
  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsEditing(true);
    form.reset();
  };

  // Submit template (create or update)
  const onSubmitTemplate = async (data: ContractTemplateFormData) => {
    try {
      if (selectedTemplate && isEditing) {
        // Update existing template
        await updateTemplateMutation.mutateAsync({
          id: selectedTemplate._id,
          data,
        });
        toast.success("Template updated successfully!");
      } else {
        // Create new template
        await createTemplateMutation.mutateAsync(data);
        toast.success("Template created successfully!");
      }

      setIsEditing(false);
      setSelectedTemplate(null);
      form.reset();
    } catch (error) {
      toast.error("Failed to save template. Please try again.");
      console.error("Template save error:", error);
    }
  };

  // Handle delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplateMutation.mutateAsync(templateId);
      toast.success("Template deleted successfully!");

      if (selectedTemplate?._id === templateId) {
        setSelectedTemplate(null);
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Failed to delete template. Please try again.");
      console.error("Template delete error:", error);
    }
  };

  // Handle duplicate template
  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      await duplicateTemplateMutation.mutateAsync(templateId);
      toast.success("Template duplicated successfully!");
    } catch (error) {
      toast.error("Failed to duplicate template. Please try again.");
      console.error("Template duplicate error:", error);
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={open}>
      <DialogContent className="max-h-[90vh] max-w-7xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Contract Templates
          </DialogTitle>
          <DialogDescription>
            Manage reusable contract templates for different property types
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(90vh-8rem)] gap-6">
          {/* Templates List */}
          <div className="flex w-1/3 flex-col">
            {/* Search and Filter */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  value={searchQuery}
                />
              </div>

              <div className="flex gap-2">
                <Select
                  onValueChange={(value) =>
                    setPropertyTypeFilter(value as PropertyType | "all")
                  }
                  value={propertyTypeFilter}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Property Types</SelectItem>
                    {Object.values(PropertyType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={handleCreateNew} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Templates List */}
            <div className="flex-1 space-y-2 overflow-y-auto">
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="text-muted-foreground">
                    Loading templates...
                  </div>
                </div>
              ) : filteredTemplates?.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-center">
                  <File className="mb-2 h-8 w-8 text-muted-foreground" />
                  <div className="text-muted-foreground">
                    No templates found
                  </div>
                  <Button className="mt-2" onClick={handleCreateNew} size="sm">
                    Create Template
                  </Button>
                </div>
              ) : (
                filteredTemplates?.map((template) => (
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      selectedTemplate?._id === template._id
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                    key={template._id}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {template.name}
                          </div>
                          <div className="mt-1 text-muted-foreground text-xs">
                            {template.description}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge className="text-xs" variant="outline">
                              {template.propertyType.replace("_", " ")}
                            </Badge>
                            {!template.isActive && (
                              <Badge className="text-xs" variant="secondary">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button size="sm" variant="ghost">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="mr-2 h-3 w-3" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDuplicateTemplate(template._id)
                              }
                            >
                              <Copy className="mr-2 h-3 w-3" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTemplate(template._id)}
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Template Details/Editor */}
          <div className="flex flex-1 flex-col">
            {isEditing ? (
              /* Template Editor */
              <Card className="flex-1 overflow-y-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {selectedTemplate ? "Edit Template" : "Create Template"}
                    </span>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedTemplate(null);
                        form.reset();
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <Form {...form}>
                    <form
                      className="space-y-4"
                      onSubmit={form.handleSubmit(onSubmitTemplate)}
                    >
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Template Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Standard Apartment Lease"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contractType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Type</FormLabel>
                              <FormControl>
                                <Select
                                  defaultValue={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select property type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.values(PropertyType).map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type.replace("_", " ")}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description of this template..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Template Content */}
                      {/*<FormField
												control={form.control}
												name="content"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Template Content</FormLabel>
														<FormControl>
															<Textarea
																className="min-h-[300px] font-mono text-sm"
																placeholder="Enter the contract template content. Use {{variable_name}} for dynamic content..."
																{...field}
															/>
														</FormControl>
														<FormDescription>
															Use double curly braces for variables: {{ property_address }},{" "}
															{{ tenant_name }}, {{ rent_amount }}, etc.
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>*/}

                      {/* Template Variables */}
                      <div className="space-y-3">
                        <Label>Template Variables</Label>
                        <div className="text-muted-foreground text-sm">
                          Define variables that will be replaced when generating
                          contracts
                        </div>

                        {/* Common Variables */}
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                          {[
                            "property_address",
                            "tenant_name",
                            "tenant_email",
                            "tenant_phone",
                            "landlord_name",
                            "rent_amount",
                            "deposit_amount",
                            "start_date",
                            "end_date",
                            "property_type",
                            "lease_duration",
                            "payment_due_date",
                          ].map((variable) => (
                            <Badge
                              className="justify-center text-xs"
                              key={variable}
                              variant="outline"
                            >
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Active Status */}
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Active Template
                              </FormLabel>
                              <FormDescription>
                                Active templates can be used when creating new
                                contracts
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

                      <div className="flex gap-2">
                        <Button
                          disabled={
                            createTemplateMutation.isPending ||
                            updateTemplateMutation.isPending
                          }
                          type="submit"
                        >
                          {createTemplateMutation.isPending ||
                          updateTemplateMutation.isPending
                            ? "Saving..."
                            : selectedTemplate
                              ? "Update Template"
                              : "Create Template"}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditing(false);
                            setSelectedTemplate(null);
                            form.reset();
                          }}
                          type="button"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : selectedTemplate ? (
              /* Template Preview */
              <Card className="flex-1 overflow-y-auto">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedTemplate.name}</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditTemplate(selectedTemplate)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() =>
                          handleDuplicateTemplate(selectedTemplate._id)
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto">
                  <Tabs className="h-full" defaultValue="preview">
                    <TabsList>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="variables">Variables</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>

                    <TabsContent className="mt-4" value="preview">
                      <div className="space-y-4">
                        <div className="text-muted-foreground text-sm">
                          Template content with variable placeholders:
                        </div>
                        <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 font-mono text-sm">
                          {/* {selectedTemplate.content} */}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent className="mt-4" value="variables">
                      <div className="space-y-4">
                        <div className="text-muted-foreground text-sm">
                          Terms used in this template:
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedTemplate.terms.map((variable) => (
                            <Badge
                              className="justify-center"
                              key={variable.title}
                              variant="outline"
                            >
                              {`{{${variable}}}`}
                            </Badge>
                          ))}
                        </div>
                        {selectedTemplate.terms.length === 0 && (
                          <div className="py-8 text-center text-muted-foreground">
                            No terms defined for this template
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent className="mt-4" value="details">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-muted-foreground">
                              Property Type
                            </Label>
                            <div className="font-medium">
                              {selectedTemplate.contractType.replace("_", " ")}
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              Status
                            </Label>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  selectedTemplate.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {selectedTemplate.isActive
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              Created
                            </Label>
                            <div className="font-medium">
                              {format(
                                new Date(selectedTemplate.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">
                              Last Updated
                            </Label>
                            <div className="font-medium">
                              {format(
                                new Date(selectedTemplate.updatedAt),
                                "MMM dd, yyyy"
                              )}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-muted-foreground">
                            Usage Count
                          </Label>
                          <div className="font-medium">
                            {/* {selectedTemplate.usageCount || 0} contracts created */}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              /* Empty State */
              <Card className="flex-1 overflow-y-auto">
                <CardContent className="flex h-full flex-col items-center justify-center text-center">
                  <File className="mb-4 h-12 w-12 text-muted-foreground" />
                  <div className="mb-2 font-medium text-lg">
                    Contract Templates
                  </div>
                  <div className="mb-6 max-w-md text-muted-foreground">
                    Create reusable contract templates to streamline your
                    contract creation process. Templates can include variables
                    that are automatically replaced with contract-specific data.
                  </div>
                  <Button onClick={handleCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter>
          {onSelectTemplate && selectedTemplate && !isEditing && (
            <Button onClick={() => handleSelectTemplate(selectedTemplate)}>
              Use This Template
            </Button>
          )}
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Pre-built template examples
export const defaultTemplates: Partial<ContractTemplate_v2>[] = [
  {
    name: "Standard Apartment Lease",
    description: "Basic residential lease agreement for apartments",
    propertyType: PropertyType.APARTMENT,
    content: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into on {{start_date}} between {{landlord_name}} ("Landlord") and {{tenant_name}} ("Tenant").

PROPERTY DETAILS:
Address: {{property_address}}
Property Type: {{property_type}}
Unit: {{unit_number}}

LEASE TERMS:
Lease Period: {{start_date}} to {{end_date}}
Monthly Rent: {{rent_amount}}
Security Deposit: {{deposit_amount}}
Payment Due Date: {{payment_due_date}} of each month

TERMS AND CONDITIONS:
1. The Tenant agrees to pay rent on time each month
2. The property shall be used for residential purposes only
3. No pets allowed without prior written consent
4. Tenant is responsible for utilities unless otherwise specified
5. Property must be maintained in good condition

SIGNATURES:
Landlord: _________________ Date: _______
Tenant: _________________ Date: _______`,
    variables: [
      "start_date",
      "landlord_name",
      "tenant_name",
      "property_address",
      "property_type",
      "unit_number",
      "end_date",
      "rent_amount",
      "deposit_amount",
      "payment_due_date",
    ],
    isActive: true,
  },
  {
    name: "Commercial Office Lease",
    description: "Standard lease agreement for office spaces",
    propertyType: PropertyType.OFFICE,
    content: `COMMERCIAL OFFICE LEASE AGREEMENT

This Commercial Lease Agreement is made between {{landlord_name}} ("Landlord") and {{tenant_name}} ("Tenant") for the premises located at {{property_address}}.

PREMISES: {{property_description}}
LEASE TERM: {{lease_duration}} months, from {{start_date}} to {{end_date}}
BASE RENT: {{rent_amount}} per month
SECURITY DEPOSIT: {{deposit_amount}}

PERMITTED USE: General office purposes only
UTILITIES: Tenant responsible for {{utilities_responsibility}}
MAINTENANCE: {{maintenance_terms}}

This agreement is subject to all applicable laws and regulations.

SIGNATURES:
Landlord: _________________ Date: _______
Tenant: _________________ Date: _______`,
    variables: [
      "landlord_name",
      "tenant_name",
      "property_address",
      "property_description",
      "lease_duration",
      "start_date",
      "end_date",
      "rent_amount",
      "deposit_amount",
      "utilities_responsibility",
      "maintenance_terms",
    ],
    isActive: true,
  },
];
