"use client";

/**
 * Templates Page
 *
 * Browse and manage document templates
 */

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { FileText, Plus } from "lucide-react";
import {
  DocumentGenerator,
  TemplateSelector,
  useLegalDocumentStore,
  useTemplates,
} from "@/modules/documents/legal";

export default function TemplatesPage() {
  const { setGenerateModalOpen } = useLegalDocumentStore();
  const { data } = useTemplates();

  const totalTemplates = data?.results || 0;
  const activeTemplates =
    data?.templates.filter((t) => t.status === "active").length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Document Templates</h1>
          <p className="text-muted-foreground">
            Browse and select templates to generate legal documents
          </p>
        </div>
        <Button onClick={() => setGenerateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Templates
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalTemplates}</div>
            <p className="text-muted-foreground text-xs">Available templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Active Templates
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{activeTemplates}</div>
            <p className="text-muted-foreground text-xs">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Most Popular</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">Rental Agreement</div>
            <p className="text-muted-foreground text-xs">Most used template</p>
          </CardContent>
        </Card>
      </div>

      {/* Template Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>
            Select a template to generate a new document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateSelector showGenerateButton={true} />
        </CardContent>
      </Card>

      {/* Generator Modal */}
      <DocumentGenerator />
    </div>
  );
}
