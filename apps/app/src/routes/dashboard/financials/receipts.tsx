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
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Calendar,
  Camera,
  DollarSign,
  Download,
  Eye,
  FileImage,
  Grid3X3,
  List,
  Search,
  Tag,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { ReceiptManager } from "@/modules/financials/components";

const ReceiptsContainer = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("upload");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);

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
            Only landlords and admins can access receipt management.
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

  const handleUploadNew = () => {
    setIsUploadOpen(true);
    setIsGalleryOpen(false);
  };

  const handleUploadClose = () => {
    setIsUploadOpen(false);
  };

  const handleViewGallery = () => {
    setIsGalleryOpen(true);
    setIsUploadOpen(false);
  };

  const handleGalleryClose = () => {
    setIsGalleryOpen(false);
  };

  const handleBulkDelete = () => {
    console.log("Bulk deleting receipts:", selectedReceipts);
    // TODO: Implement bulk delete functionality
    setSelectedReceipts([]);
  };

  const handleExportReceipts = () => {
    console.log("Exporting receipts...");
    // TODO: Implement export functionality
  };

  // Mock receipt data
  const mockReceipts = [
    {
      id: "1",
      filename: "maintenance-receipt-001.jpg",
      category: "Maintenance",
      amount: 125.5,
      date: "2024-03-15",
      property: "123 Main St",
      status: "processed",
      thumbnail: "/api/placeholder/150/150",
    },
    {
      id: "2",
      filename: "utility-bill-mar-2024.pdf",
      category: "Utilities",
      amount: 89.2,
      date: "2024-03-10",
      property: "456 Oak Ave",
      status: "pending",
      thumbnail: "/api/placeholder/150/150",
    },
    {
      id: "3",
      filename: "office-supplies-receipt.jpg",
      category: "Office Supplies",
      amount: 45.75,
      date: "2024-03-08",
      property: "All Properties",
      status: "processed",
      thumbnail: "/api/placeholder/150/150",
    },
  ];

  const categories = [
    "All",
    "Maintenance",
    "Utilities",
    "Office Supplies",
    "Marketing",
    "Insurance",
  ];

  const stats = {
    totalReceipts: 48,
    totalAmount: 3250.75,
    pendingReview: 12,
    processedThisMonth: 23,
  };

  // Tab navigation items
  const tabs = [
    {
      id: "upload",
      name: "Upload Receipts",
      icon: Upload,
    },
    {
      id: "gallery",
      name: "Receipt Gallery",
      icon: FileImage,
    },
    {
      id: "bulk-process",
      name: "Bulk Process",
      icon: Zap,
    },
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center font-bold text-3xl tracking-tight">
              <FileImage className="mr-3 h-8 w-8 text-blue-600" />
              Receipt Management
            </h1>
            <p className="text-muted-foreground">
              Upload, organize, and process your expense receipts with
              AI-powered extraction.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleUploadNew}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Receipts
            </Button>
            <Button onClick={handleViewGallery} variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View Gallery
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Receipts
            </CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalReceipts}</div>
            <p className="text-muted-foreground text-xs">
              <span className="text-green-600">+5</span> this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${stats.totalAmount.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              Processed receipts value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Pending Review
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.pendingReview}</div>
            <p className="text-muted-foreground text-xs">
              <Badge className="text-xs" variant="secondary">
                Needs Action
              </Badge>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.processedThisMonth}</div>
            <p className="text-muted-foreground text-xs">Receipts processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Search & Filter Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input
                className="w-full"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipts by filename, category, or amount..."
                value={searchQuery}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Select onValueChange={setFilterCategory} value={filterCategory}>
                <SelectTrigger className="w-32">
                  <Tag className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={setFilterDateRange}
                value={filterDateRange}
              >
                <SelectTrigger className="w-32">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center rounded-md border border-input">
                <Button
                  onClick={() => setViewMode("grid")}
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setViewMode("list")}
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Management Tabs */}
      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <div className="flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-3">
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
          {selectedReceipts.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {selectedReceipts.length} selected
              </Badge>
              <Button onClick={handleBulkDelete} size="sm" variant="outline">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button
                onClick={handleExportReceipts}
                size="sm"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          )}
        </div>

        <TabsContent className="space-y-4" value="upload">
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              Upload receipt images (JPG, PNG) or PDF files. Our AI will
              automatically extract expense information including amount, date,
              vendor, and category.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="cursor-pointer border-2 border-dashed transition-colors hover:border-blue-300">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Upload className="mb-4 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 font-semibold text-lg">
                  Upload from Device
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Select receipt images or PDFs from your computer
                </p>
                <Button onClick={handleUploadNew}>Choose Files</Button>
              </CardContent>
            </Card>
            <Card className="cursor-pointer border-2 border-dashed transition-colors hover:border-blue-300">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Camera className="mb-4 h-12 w-12 text-green-600" />
                <h3 className="mb-2 font-semibold text-lg">Take Photo</h3>
                <p className="mb-4 text-muted-foreground">
                  Use your device camera to capture receipts instantly
                </p>
                <Button variant="outline">Open Camera</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="gallery">
          <div
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {mockReceipts.map((receipt) => (
              <Card
                className="group transition-shadow hover:shadow-md"
                key={receipt.id}
              >
                <CardContent className="p-4">
                  {viewMode === "grid" ? (
                    <div className="space-y-3">
                      <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
                        <FileImage className="h-12 w-12 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="truncate font-medium text-sm">
                          {receipt.filename}
                        </h4>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge className="text-xs" variant="secondary">
                            {receipt.category}
                          </Badge>
                          <Badge
                            className="text-xs"
                            variant={
                              receipt.status === "processed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {receipt.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
                          <span>${receipt.amount}</span>
                          <span>{receipt.date}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <FileImage className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-medium">
                          {receipt.filename}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {receipt.property}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className="text-xs" variant="secondary">
                          {receipt.category}
                        </Badge>
                        <div className="text-right">
                          <div className="font-medium">${receipt.amount}</div>
                          <div className="text-muted-foreground text-xs">
                            {receipt.date}
                          </div>
                        </div>
                        <Badge
                          className="text-xs"
                          variant={
                            receipt.status === "processed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {receipt.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="bulk-process">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Process multiple receipts at once. AI will extract data and create
              expense entries automatically with your review and approval.
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <CardTitle>Bulk Processing Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <Zap className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <h3 className="mb-2 font-semibold text-lg">
                  No receipts in queue
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Upload receipts to process them in bulk
                </p>
                <Button onClick={handleUploadNew}>Upload Receipts</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Manager Component */}
      <ReceiptManager
        isGalleryOpen={isGalleryOpen}
        isUploadOpen={isUploadOpen}
        onGalleryClose={handleGalleryClose}
        onUploadClose={handleUploadClose}
        onUploadNew={handleUploadNew}
      />
    </div>
  );
};

export default ReceiptsContainer;
