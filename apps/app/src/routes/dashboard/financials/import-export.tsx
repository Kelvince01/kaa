"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  CheckCircle,
  Clock,
  Database,
  Download,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  History,
  RefreshCw,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { ImportExportDialog } from "@/modules/financials/components";

const ImportExportContainer = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("import");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState<
    "expenses" | "assets" | "reports"
  >("expenses");

  // Check if user is landlord or admin
  if (
    !authLoading &&
    isAuthenticated &&
    user?.role !== "landlord" &&
    user?.role !== "admin"
  ) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="text-center">
          <h1 className="font-bold text-2xl">Access Denied</h1>
          <p className="text-muted-foreground">
            Only landlords and admins can access import/export functionality.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (authLoading || !(isAuthenticated || authLoading)) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const handleImportSuccess = (result: any) => {
    console.log("Import successful:", result);
    setShowImportDialog(false);
  };

  const handleImportError = (error: string) => {
    console.error("Import error:", error);
  };

  const handleExportSuccess = (result: any) => {
    console.log("Export successful:", result);
    setShowExportDialog(false);
  };

  const handleExportError = (error: string) => {
    console.error("Export error:", error);
  };

  // Mock import/export history data
  const importHistory = [
    {
      id: "1",
      type: "import",
      dataType: "expenses",
      filename: "expenses-march-2024.xlsx",
      status: "completed",
      recordsProcessed: 45,
      recordsSuccess: 43,
      recordsError: 2,
      createdAt: "2024-03-15T10:30:00Z",
      completedAt: "2024-03-15T10:32:15Z",
    },
    {
      id: "2",
      type: "export",
      dataType: "assets",
      filename: "assets-report-2024-03-14.pdf",
      status: "completed",
      recordsProcessed: 12,
      recordsSuccess: 12,
      recordsError: 0,
      createdAt: "2024-03-14T14:20:00Z",
      completedAt: "2024-03-14T14:20:45Z",
    },
    {
      id: "3",
      type: "import",
      dataType: "expenses",
      filename: "utility-bills-q1-2024.csv",
      status: "processing",
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsError: 0,
      createdAt: "2024-03-15T16:15:00Z",
      completedAt: null,
    },
    {
      id: "4",
      type: "export",
      dataType: "reports",
      filename: "financial-summary-2024.xlsx",
      status: "failed",
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsError: 1,
      createdAt: "2024-03-13T09:45:00Z",
      completedAt: "2024-03-13T09:45:30Z",
    },
  ];

  const stats = {
    totalImports: 28,
    totalExports: 15,
    successfulOperations: 39,
    failedOperations: 4,
  };

  // Tab navigation items
  const tabs = [
    {
      id: "import",
      name: "Import Data",
      icon: Upload,
    },
    {
      id: "export",
      name: "Export Data",
      icon: Download,
    },
    {
      id: "history",
      name: "History",
      icon: History,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center font-bold text-3xl tracking-tight">
              <Database className="mr-3 h-8 w-8 text-blue-600" />
              Data Import & Export
            </h1>
            <p className="text-muted-foreground">
              Import financial data from various formats or export your data for
              analysis and backup.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </Button>
            <Button onClick={() => setShowExportDialog(true)} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Imports</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalImports}</div>
            <p className="text-muted-foreground text-xs">
              <span className="text-green-600">+3</span> this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Exports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalExports}</div>
            <p className="text-muted-foreground text-xs">Reports and backups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.successfulOperations}
            </div>
            <p className="text-muted-foreground text-xs">
              <Badge className="text-xs" variant="secondary">
                91% success rate
              </Badge>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.failedOperations}</div>
            <p className="text-muted-foreground text-xs">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Import/Export Tabs */}
      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                className="flex items-center space-x-2"
                key={tab.id}
                value={tab.id}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent className="space-y-4" value="import">
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              Import expenses, assets, or financial data from CSV, Excel, or
              JSON files. Data will be validated before import.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setSelectedDataType("expenses");
                setShowImportDialog(true);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <FileSpreadsheet className="mb-4 h-12 w-12 text-green-600" />
                <h3 className="mb-2 font-semibold text-lg">Import Expenses</h3>
                <p className="mb-4 text-muted-foreground">
                  Upload expense data from spreadsheets or CSV files
                </p>
                <Badge variant="secondary">CSV, Excel, JSON</Badge>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setSelectedDataType("assets");
                setShowImportDialog(true);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Database className="mb-4 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 font-semibold text-lg">Import Assets</h3>
                <p className="mb-4 text-muted-foreground">
                  Upload asset information and depreciation data
                </p>
                <Badge variant="secondary">CSV, Excel, JSON</Badge>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setSelectedDataType("reports");
                setShowImportDialog(true);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <FileText className="mb-4 h-12 w-12 text-purple-600" />
                <h3 className="mb-2 font-semibold text-lg">Import Reports</h3>
                <p className="mb-4 text-muted-foreground">
                  Import financial reports and analysis data
                </p>
                <Badge variant="secondary">CSV, Excel, JSON</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="export">
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              Export your financial data in various formats for analysis,
              backup, or reporting.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setSelectedDataType("expenses");
                setShowExportDialog(true);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <FileSpreadsheet className="mb-3 h-8 w-8 text-green-600" />
                <h4 className="mb-1 font-medium">Expenses</h4>
                <p className="text-muted-foreground text-xs">
                  Export expense data
                </p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setSelectedDataType("assets");
                setShowExportDialog(true);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Database className="mb-3 h-8 w-8 text-blue-600" />
                <h4 className="mb-1 font-medium">Assets</h4>
                <p className="text-muted-foreground text-xs">
                  Export asset information
                </p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setSelectedDataType("reports");
                setShowExportDialog(true);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <FileText className="mb-3 h-8 w-8 text-purple-600" />
                <h4 className="mb-1 font-medium">Reports</h4>
                <p className="text-muted-foreground text-xs">
                  Export financial reports
                </p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => {
                setShowExportDialog(true);
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <FileImage className="mb-3 h-8 w-8 text-orange-600" />
                <h4 className="mb-1 font-medium">Complete Backup</h4>
                <p className="text-muted-foreground text-xs">
                  Export all financial data
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="history">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recent Operations</h3>
            <Button size="sm" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="space-y-4">
            {importHistory.map((operation) => (
              <Card key={operation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {operation.type === "import" ? (
                          <Upload className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Download className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center space-x-2">
                          <h4 className="truncate font-medium">
                            {operation.filename}
                          </h4>
                          <Badge className="text-xs" variant="secondary">
                            {operation.dataType}
                          </Badge>
                          <Badge
                            className={`text-xs ${getStatusColor(operation.status)}`}
                          >
                            {operation.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-muted-foreground text-sm">
                          <span>
                            Started: {formatDate(operation.createdAt)}
                          </span>
                          {operation.completedAt && (
                            <span>
                              Completed: {formatDate(operation.completedAt)}
                            </span>
                          )}
                        </div>
                        {operation.recordsProcessed > 0 && (
                          <div className="mt-1 flex items-center space-x-4 text-muted-foreground text-sm">
                            <span>Processed: {operation.recordsProcessed}</span>
                            <span className="text-green-600">
                              Success: {operation.recordsSuccess}
                            </span>
                            {operation.recordsError > 0 && (
                              <span className="text-red-600">
                                Errors: {operation.recordsError}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(operation.status)}
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {operation.status === "completed" && (
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {operation.status === "failed" && (
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportExportDialog
          dataType={selectedDataType}
          mode="import"
          onError={handleImportError}
          onSuccess={handleImportSuccess}
          trigger={null}
        />
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <ImportExportDialog
          dataType={selectedDataType}
          mode="export"
          onError={handleExportError}
          onSuccess={handleExportSuccess}
          trigger={null}
        />
      )}
    </div>
  );
};

export default ImportExportContainer;
