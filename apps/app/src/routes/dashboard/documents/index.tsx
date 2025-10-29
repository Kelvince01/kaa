"use client";

/**
 * Legal Documents Dashboard
 *
 * Main dashboard for managing legal documents
 */

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { FileText, PenTool, Plus, Shield } from "lucide-react";
import { useState } from "react";
import {
  DocumentGenerator,
  DocumentSigning,
  LegalDocumentList,
  LegalDocumentViewer,
  TemplateSelector,
  useLegalDocumentStore,
  useLegalDocuments,
  useTemplates,
} from "@/modules/documents/legal";

export default function LegalDocumentsDashboard() {
  const [activeTab, setActiveTab] = useState("documents");
  const { setGenerateModalOpen } = useLegalDocumentStore();

  // Fetch documents data
  const { data: documentsData } = useLegalDocuments();
  const { data: templatesData } = useTemplates();

  // Calculate stats
  const totalDocuments = documentsData?.results || 0;
  const pendingSignature =
    documentsData?.documents.filter((d) => d.status === "pending_signature")
      .length || 0;
  const activeDocuments =
    documentsData?.documents.filter((d) => d.status === "active").length || 0;
  const totalTemplates = templatesData?.results || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Legal Documents</h1>
          <p className="text-muted-foreground">
            Generate, sign, and manage your legal documents
          </p>
        </div>
        <Button onClick={() => setGenerateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Document
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalDocuments}</div>
            <p className="text-muted-foreground text-xs">
              All generated documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Pending Signature
            </CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{pendingSignature}</div>
            <p className="text-muted-foreground text-xs">
              Requires your signature
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Active Documents
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{activeDocuments}</div>
            <p className="text-muted-foreground text-xs">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Available Templates
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalTemplates}</div>
            <p className="text-muted-foreground text-xs">Ready to use</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList>
          <TabsTrigger value="documents">My Documents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Signature
            {pendingSignature > 0 && (
              <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-white text-xs">
                {pendingSignature}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="documents">
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>
                View and manage all your legal documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LegalDocumentList showFilters={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Browse and select templates to generate documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateSelector showGenerateButton={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Signatures</CardTitle>
              <CardDescription>
                Documents waiting for your signature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LegalDocumentList showFilters={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DocumentGenerator />
      <LegalDocumentViewer />
      <DocumentSigning />
    </div>
  );
}
