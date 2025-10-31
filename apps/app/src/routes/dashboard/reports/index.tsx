"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { FileText, List, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  ReportDetailsDialog,
  ReportExecutionStatus,
  ReportFormDialog,
  ReportsList,
  SchedulesList,
  TemplatesBrowser,
} from "@/modules/reports/components";
import { useExecuteReport } from "@/modules/reports/reports.queries";
import type {
  IReportDefinition,
  IReportTemplate,
} from "@/modules/reports/reports.type";

const ReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState("reports");
  const [selectedReport, setSelectedReport] =
    useState<IReportDefinition | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingReport, setEditingReport] = useState<IReportDefinition | null>(
    null
  );
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<IReportTemplate | null>(null);

  const executeReport = useExecuteReport();

  const handleViewReport = (report: IReportDefinition) => {
    setSelectedReport(report);
  };

  const handleCreateReport = () => {
    setEditingReport(null);
    setShowReportForm(true);
  };

  const handleEditReport = (report: IReportDefinition) => {
    setEditingReport(report);
    setShowReportForm(true);
  };

  const handleExecuteReport = async (report: IReportDefinition) => {
    try {
      const result = await executeReport.mutateAsync({
        reportId: report._id.toString(),
      });
      setExecutionId(result._id.toString());
      setSelectedReport(null);
    } catch (error) {
      console.error("Failed to execute report:", error);
    }
  };

  const handleTemplateSelect = (template: IReportTemplate) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    // TODO: Pre-fill form with template data
    setEditingReport(null);
    setShowReportForm(true);
  };

  const handleFormSuccess = () => {
    setShowReportForm(false);
    setEditingReport(null);
    setSelectedTemplate(null);
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Reports</h1>
          <p className="text-muted-foreground">
            Generate, schedule, and manage your reports
          </p>
        </div>
      </div>

      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          <TabsTrigger value="reports">
            <List className="mr-2 h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Sparkles className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <FileText className="mr-2 h-4 w-4" />
            Schedules
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="reports">
          <ReportsList
            onCreateReport={handleCreateReport}
            onEditReport={handleEditReport}
            onExecuteReport={handleExecuteReport}
            onViewReport={handleViewReport}
          />
        </TabsContent>

        <TabsContent className="space-y-4" value="templates">
          <div className="space-y-4">
            <TemplatesBrowser onSelectTemplate={handleTemplateSelect} />
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="schedules">
          <SchedulesList />
        </TabsContent>
      </Tabs>

      {/* Report Details Dialog */}
      {selectedReport && (
        <ReportDetailsDialog
          onEdit={handleEditReport}
          onExecute={handleExecuteReport}
          onOpenChange={(open) => {
            if (!open) setSelectedReport(null);
          }}
          open={!!selectedReport}
          report={selectedReport}
        />
      )}

      {/* Report Form Dialog */}
      <ReportFormDialog
        onOpenChange={(open) => {
          if (!open) {
            setShowReportForm(false);
            setEditingReport(null);
            setSelectedTemplate(null);
          }
        }}
        onSuccess={handleFormSuccess}
        open={showReportForm}
        report={editingReport}
      />

      {/* Execution Status Dialog */}
      {executionId && (
        <Dialog
          onOpenChange={(open) => {
            if (!open) setExecutionId(null);
          }}
          open={!!executionId}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Execution</DialogTitle>
              <DialogDescription>
                Track the progress of your report generation
              </DialogDescription>
            </DialogHeader>
            <ReportExecutionStatus
              executionId={executionId}
              onClose={() => setExecutionId(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReportsDashboard;
