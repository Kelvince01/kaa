"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import {
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Grid,
  List,
  Plus,
  Search,
  Trash,
  Upload,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
// import ErrorBoundary from "@/components/error-boundary";
// import { ErrorFallback } from "@/components/error-fallback";
import { Shell } from "@/components/shell";
import type { TemplateType } from "@/modules/templates";
import {
  TemplateCard,
  TemplateExportModal,
  TemplateForm,
  TemplateImportModal,
  TemplatePreview,
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  usePreviewSMSTemplate,
  usePreviewTemplate,
  useSendTestEmail,
  useTemplates,
  useUpdateTemplate,
} from "@/modules/templates";

type TemplatesPageProps = {
  searchParams: Promise<{
    category?: string;
    engine?: string;
    search?: string;
    page?: string;
  }>;
};

export default function TemplatesPage(props: TemplatesPageProps) {
  const searchParams = React.use(props.searchParams);
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.category || "all"
  );
  const [selectedEngine, setSelectedEngine] = useState<string>(
    searchParams.engine || "all"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(
    null
  );
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const {
    data: templatesData,
    isLoading,
    error,
  } = useTemplates({
    search: searchQuery,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    engine: selectedEngine !== "all" ? selectedEngine : undefined,
    page: Number(searchParams.page) || 1,
    limit: 20,
  });

  const { mutateAsync: createTemplate, isPending: isCreating } =
    useCreateTemplate();
  const { mutateAsync: updateTemplate, isPending: isUpdating } =
    useUpdateTemplate();
  const { mutateAsync: deleteTemplate } = useDeleteTemplate();
  const { mutateAsync: duplicateTemplate } = useDuplicateTemplate();
  const { mutateAsync: previewTemplate } = usePreviewTemplate();
  const { mutateAsync: previewSMSTemplate } = usePreviewSMSTemplate();
  const { mutateAsync: sendTestEmail } = useSendTestEmail();

  const templates = templatesData?.templates || [];
  const pagination = templatesData?.pagination;

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    const matchesEngine =
      selectedEngine === "all" || template.engine === selectedEngine;

    return matchesSearch && matchesCategory && matchesEngine;
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTemplates.length === filteredTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(filteredTemplates.map((t) => t._id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedTemplates.map((id) => deleteTemplate(id)));
      setSelectedTemplates([]);
      toast.success(
        `${selectedTemplates.length} templates deleted successfully`
      );
    } catch (error) {
      toast.error("Failed to delete some templates");
    }
  };

  const handleCreateTemplate = async (data: any) => {
    try {
      await createTemplate(data);
      setIsCreateModalOpen(false);
      toast.success("Template created successfully");
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  const handleUpdateTemplate = async (data: any) => {
    if (!selectedTemplate) return;

    try {
      await updateTemplate({ id: selectedTemplate._id, updates: data });
      setIsEditModalOpen(false);
      setSelectedTemplate(null);
      toast.success("Template updated successfully");
    } catch (error) {
      toast.error("Failed to update template");
    }
  };

  const handleEdit = (template: TemplateType) => {
    setSelectedTemplate(template);
    setIsEditModalOpen(true);
  };

  const handlePreview = (template: TemplateType) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const handleDuplicate = async (template: TemplateType) => {
    try {
      await duplicateTemplate(template._id);
      toast.success("Template duplicated successfully");
    } catch (error) {
      toast.error("Failed to duplicate template");
    }
  };

  const handleDelete = async (template: TemplateType) => {
    try {
      await deleteTemplate(template._id);
      toast.success("Template deleted successfully");
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  if (isLoading) {
    return (
      <Shell className="gap-2">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell className="gap-2">
        <div className="flex h-64 items-center justify-center">
          <div className="text-destructive">Error loading templates</div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell className="gap-2 space-y-4">
      {/* Header */}
      {/* <div className="flex items-center justify-between"> */}
      <div>
        <h1 className="font-bold text-2xl">Templates</h1>
        <p className="text-muted-foreground">
          Create and manage dynamic templates for emails, documents, and SMS
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => setIsImportModalOpen(true)} variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button onClick={() => setIsExportModalOpen(true)} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Dialog onOpenChange={setIsCreateModalOpen} open={isCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-x-auto overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              isLoading={isCreating}
              onCancel={() => setIsCreateModalOpen(false)}
              onSubmit={handleCreateTemplate}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="font-bold text-2xl">{templates.length}</div>
          <div className="text-muted-foreground text-sm">Total Templates</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="font-bold text-2xl">
            {templates.filter((t) => t.category === "email").length}
          </div>
          <div className="text-muted-foreground text-sm">Email Templates</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="font-bold text-2xl">
            {
              templates.filter((t) => t.category === "sms" || t.smsMetadata)
                .length
            }
          </div>
          <div className="text-muted-foreground text-sm">SMS Templates</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="font-bold text-2xl">
            {templates.filter((t) => t.isActive).length}
          </div>
          <div className="text-muted-foreground text-sm">Active Templates</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              value={searchQuery}
            />
          </div>
          <Select onValueChange={setSelectedCategory} value={selectedCategory}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="report">Report</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="welcome">Welcome</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="verification">Verification</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setSelectedEngine} value={selectedEngine}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engines</SelectItem>
              <SelectItem value="handlebars">Handlebars</SelectItem>
              <SelectItem value="ejs">EJS</SelectItem>
              <SelectItem value="pug">Pug</SelectItem>
              <SelectItem value="nunjucks">Nunjucks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          {selectedTemplates.length > 0 && (
            <>
              <Badge variant="secondary">
                {selectedTemplates.length} selected
              </Badge>
              <Button
                className="text-destructive"
                onClick={handleBulkDelete}
                size="sm"
                variant="outline"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button
                onClick={() => setSelectedTemplates([])}
                size="sm"
                variant="outline"
              >
                Clear
              </Button>
              <Separator className="h-6" orientation="vertical" />
            </>
          )}
          <div className="flex items-center rounded-md border">
            <Button
              className="rounded-r-none border-0"
              onClick={() => setViewMode("grid")}
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              className="rounded-l-none border-0"
              onClick={() => setViewMode("list")}
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      {filteredTemplates.length > 0 && (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={
              selectedTemplates.length === filteredTemplates.length &&
              filteredTemplates.length > 0
            }
            onCheckedChange={handleSelectAll}
          />
          <span className="text-muted-foreground text-sm">
            Select all {filteredTemplates.length} templates
          </span>
        </div>
      )}

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-medium text-lg">No templates found</h3>
          <p className="mb-4 text-muted-foreground">
            {searchQuery ||
            selectedCategory !== "all" ||
            selectedEngine !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first template to get started"}
          </p>
          {!searchQuery &&
            selectedCategory === "all" &&
            selectedEngine === "all" && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <div className="relative" key={template._id}>
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedTemplates.includes(template._id)}
                  onCheckedChange={() => handleTemplateSelect(template._id)}
                />
              </div>
              <TemplateCard
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onEdit={handleEdit}
                onPreview={handlePreview}
                onView={handlePreview}
                template={template}
              />
            </div>
          ))}
        </div>
      ) : (
        // List view - could implement a table component here
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <div
              className="flex items-center space-x-4 rounded-lg border bg-card p-4"
              key={template._id}
            >
              <Checkbox
                checked={selectedTemplates.includes(template._id)}
                onCheckedChange={() => handleTemplateSelect(template._id)}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{template.name}</h3>
                  <Badge className="text-xs">{template.category}</Badge>
                  <Badge className="text-xs" variant="outline">
                    {template.engine}
                  </Badge>
                </div>
                <p className="line-clamp-1 text-muted-foreground text-sm">
                  {template.description}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePreview(template)}
                  size="sm"
                  variant="ghost"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleEdit(template)}
                  size="sm"
                  variant="ghost"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDuplicate(template)}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(template)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Template Modal */}
      <Dialog onOpenChange={setIsEditModalOpen} open={isEditModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <TemplateForm
              isLoading={isUpdating}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedTemplate(null);
              }}
              onSubmit={handleUpdateTemplate}
              template={selectedTemplate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Template Modal */}
      <Dialog onOpenChange={setIsPreviewModalOpen} open={isPreviewModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <TemplatePreview
              onRender={(data) =>
                previewTemplate({
                  templateId: selectedTemplate._id,
                  data,
                })
              }
              onRenderSMS={
                selectedTemplate.category === "sms" ||
                selectedTemplate.smsMetadata
                  ? (data) =>
                      previewSMSTemplate({
                        id: selectedTemplate._id,
                        sampleData: data,
                      }) as any
                  : (_) =>
                      Promise.resolve({
                        data: {
                          rendered: "",
                          segments: 0,
                          length: 0,
                          encoding: "",
                          metadata: {},
                        },
                      })
              }
              onSendTest={
                selectedTemplate.category === "email"
                  ? (data) =>
                      sendTestEmail({ id: selectedTemplate._id, data }) as any
                  : (_) =>
                      Promise.resolve({
                        success: false,
                        message: "",
                      })
              }
              template={selectedTemplate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Templates Modal */}
      <TemplateImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Export Templates Modal */}
      <TemplateExportModal
        allTemplates={templates}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedTemplates={selectedTemplates}
      />
      {/* </div> */}
    </Shell>
  );
}
