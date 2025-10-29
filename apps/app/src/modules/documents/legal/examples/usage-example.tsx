"use client";

/**
 * Legal Documents Module Usage Examples
 *
 * Demonstrates how to use the legal documents module
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
import { FileText, PenTool, Search } from "lucide-react";
import {
  DocumentGenerator,
  DocumentSigning,
  LegalDocumentList,
  LegalDocumentViewer,
  TemplateSelector,
  useLegalDocumentStore,
} from "../index";

/**
 * Complete legal documents dashboard
 */
export function LegalDocumentsDashboard() {
  const { setGenerateModalOpen } = useLegalDocumentStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Legal Documents</h1>
          <p className="text-muted-foreground">
            Generate, sign, and manage your legal documents
          </p>
        </div>
        <Button onClick={() => setGenerateModalOpen(true)}>
          <FileText className="mr-2 h-4 w-4" />
          Generate Document
        </Button>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <LegalDocumentList showFilters={true} />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateSelector showGenerateButton={true} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DocumentGenerator />
      <LegalDocumentViewer />
      <DocumentSigning />
    </div>
  );
}

/**
 * Property-specific legal documents
 */
export function PropertyLegalDocuments({ propertyId }: { propertyId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Documents</CardTitle>
        <CardDescription>
          View and manage legal documents for this property
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LegalDocumentList propertyId={propertyId} showFilters={true} />

        <DocumentGenerator propertyId={propertyId} />
        <LegalDocumentViewer />
        <DocumentSigning />
      </CardContent>
    </Card>
  );
}

/**
 * Tenant legal documents view
 */
export function TenantLegalDocuments({ tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Documents
          </CardTitle>
          <CardDescription>View and sign your rental documents</CardDescription>
        </CardHeader>
        <CardContent>
          <LegalDocumentList
            onDocumentClick={(docId) => console.log("Viewing document:", docId)}
            showFilters={false}
            tenantId={tenantId}
          />
        </CardContent>
      </Card>

      <DocumentSigning />
      <LegalDocumentViewer />
    </div>
  );
}

/**
 * Template selection for document generation
 */
export function GenerateDocumentFlow({ propertyId }: { propertyId: string }) {
  const { currentTemplate, setGenerateModalOpen } = useLegalDocumentStore();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select a Template
          </CardTitle>
          <CardDescription>
            Choose the type of document you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateSelector
            onSelect={(template) => {
              console.log("Selected template:", template);
              setGenerateModalOpen(true);
            }}
            showGenerateButton={false}
          />
        </CardContent>
      </Card>

      {currentTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Document</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setGenerateModalOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Continue with {currentTemplate.name}
            </Button>
          </CardContent>
        </Card>
      )}

      <DocumentGenerator propertyId={propertyId} />
    </div>
  );
}

/**
 * Document signing workflow
 */
export function SigningWorkflow({ documentId }: { documentId: string }) {
  const { setSigningModalOpen, setCurrentDocument } = useLegalDocumentStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Sign Document
        </CardTitle>
        <CardDescription>
          Review and digitally sign your legal document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          This document requires your signature. Please review it carefully
          before signing.
        </p>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              // Preview first
              console.log("Viewing document:", documentId);
            }}
            variant="outline"
          >
            <FileText className="mr-2 h-4 w-4" />
            Review Document
          </Button>

          <Button
            onClick={() => {
              setSigningModalOpen(true);
            }}
          >
            <PenTool className="mr-2 h-4 w-4" />
            Sign Now
          </Button>
        </div>

        <DocumentSigning documentId={documentId} />
        <LegalDocumentViewer documentId={documentId} />
      </CardContent>
    </Card>
  );
}

/**
 * Minimal document viewer
 */
export function QuickDocumentView({ documentId }: { documentId: string }) {
  return (
    <>
      <Button variant="outline">
        <FileText className="mr-2 h-4 w-4" />
        View Document
      </Button>

      <LegalDocumentViewer documentId={documentId} />
    </>
  );
}
