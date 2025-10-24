"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Separator } from "@kaa/ui/components/separator";
import { Archive, FileText, Grid, List, RefreshCw } from "lucide-react";
import React from "react";
import { toast } from "sonner";

import {
  DocumentBulkActions,
  DocumentCategory,
  DocumentCategoryFilter,
  DocumentList,
  DocumentStatus,
  type IDocument,
  useDocumentStore,
} from "../";

/**
 * Document List with Filtering Example
 *
 * This example demonstrates a comprehensive document listing interface
 * with advanced filtering, bulk operations, and multiple view modes.
 */
export function DocumentListWithFilteringExample() {
  const {
    filter,
    setFilter,
    clearFilter,
    viewMode,
    setViewMode,
    selectedDocuments,
    clearSelection,
    hasSelection,
    selectionCount,
  } = useDocumentStore();

  const [actionHistory, setActionHistory] = React.useState<string[]>([]);

  const handleDocumentClick = (document: IDocument) => {
    toast.info(`Viewing document: ${document.name}`);
    console.log("Document clicked:", document);
  };

  const handleDocumentSelect = (document: IDocument) => {
    console.log("Document selected:", document);
  };

  const handleBulkAction = (
    action: string,
    documentIds: string[],
    parameters?: any
  ) => {
    const actionMessage = `${action.toUpperCase()}: ${documentIds.length} document(s)`;
    setActionHistory((prev) => [actionMessage, ...prev.slice(0, 9)]);
    toast.success(actionMessage);
    console.log("Bulk action:", { action, documentIds, parameters });
  };

  const handleRefresh = () => {
    toast.info("Refreshing document list...");
    // In a real app, this would refetch the data
  };

  // Mock document counts for categories
  const mockCategoryCounts = {
    [DocumentCategory.GENERAL]: 12,
    [DocumentCategory.IDENTITY]: 5,
    [DocumentCategory.ADDRESS]: 8,
    [DocumentCategory.INCOME]: 15,
    [DocumentCategory.REFERENCES]: 3,
    [DocumentCategory.OTHER]: 7,
  };

  const mockStatusCounts = {
    [DocumentStatus.PENDING]: 8,
    [DocumentStatus.PROCESSING]: 12,
    [DocumentStatus.VERIFIED]: 25,
    [DocumentStatus.REJECTED]: 3,
    [DocumentStatus.EXPIRED]: 2,
    [DocumentStatus.ERROR]: 0,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <List className="h-5 w-5" />
            <span>Document List with Advanced Filtering</span>
          </CardTitle>
          <CardDescription>
            Comprehensive document management with filtering, bulk operations,
            and multiple view modes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Filters & View Options</h3>
              <div className="flex items-center space-x-2">
                {/* View mode toggle */}
                <div className="flex rounded-lg border p-1">
                  <Button
                    onClick={() => setViewMode("grid")}
                    size="sm"
                    variant={viewMode === "grid" ? "default" : "ghost"}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode("list")}
                    size="sm"
                    variant={viewMode === "list" ? "default" : "ghost"}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode("table")}
                    size="sm"
                    variant={viewMode === "table" ? "default" : "ghost"}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={handleRefresh} size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <Button
                  disabled={
                    !(filter.category || filter.status || filter.search)
                  }
                  onClick={clearFilter}
                  size="sm"
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Category and Status filters */}
            <DocumentCategoryFilter
              counts={mockCategoryCounts}
              onCategoriesChange={(categories) =>
                setFilter({
                  category: categories.length ? categories : undefined,
                  page: 1,
                })
              }
              onStatusesChange={(statuses) =>
                setFilter({
                  status: statuses.length ? statuses : undefined,
                  page: 1,
                })
              }
              selectedCategories={filter.category || []}
              selectedStatuses={filter.status || []}
              showClearButton={true}
              showStatusFilter={true}
              statusCounts={mockStatusCounts}
              variant="chips"
            />
          </div>

          <Separator />

          {/* Bulk Actions */}
          <DocumentBulkActions
            onAction={handleBulkAction}
            onClearSelection={clearSelection} // Mock total
            onSelectAll={() => {
              // Mock select all - in real app would select all visible documents
              toast.info("Select all functionality would be implemented here");
            }}
            selectedDocuments={selectedDocuments}
            totalDocuments={50}
            variant="expanded"
          />

          <Separator />

          {/* Document List */}
          <div className="min-h-96">
            <DocumentList
              maxHeight="400px" // We have our own header
              onDocumentClick={handleDocumentClick} // We have our own filters
              onDocumentSelect={handleDocumentSelect}
              showFilters={false}
              showHeader={false}
              showPagination={true}
            />
          </div>

          {/* Action History */}
          {actionHistory.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="flex items-center space-x-2 font-medium text-sm">
                  <Archive className="h-4 w-4" />
                  <span>Recent Actions</span>
                </h4>
                <div className="space-y-1">
                  {actionHistory.slice(0, 5).map((action, index) => (
                    <Badge
                      className="text-xs"
                      key={index.toString()}
                      variant="outline"
                    >
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-blue-600">
                {selectedDocuments.length}
              </div>
              <div className="text-muted-foreground text-xs">Selected</div>
            </div>
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-green-600">
                {mockStatusCounts[DocumentStatus.VERIFIED]}
              </div>
              <div className="text-muted-foreground text-xs">Verified</div>
            </div>
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-yellow-600">
                {mockStatusCounts[DocumentStatus.PENDING]}
              </div>
              <div className="text-muted-foreground text-xs">Pending</div>
            </div>
            <div className="space-y-1 text-center">
              <div className="font-bold text-2xl text-gray-600">
                {Object.values(mockCategoryCounts).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-muted-foreground text-xs">Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            {`import { 
  DocumentList, 
  DocumentCategoryFilter, 
  DocumentBulkActions,
  useDocumentStore 
} from "@/modules/documents";

function AdvancedDocumentList() {
  const { filter, setFilter, selectedDocuments } = useDocumentStore();
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <DocumentCategoryFilter
        selectedCategories={filter.category || []}
        onCategoriesChange={(cats) => setFilter({ category: cats })}
        variant="chips"
        showStatusFilter={true}
      />
      
      {/* Bulk Actions */}
      <DocumentBulkActions
        selectedDocuments={selectedDocuments}
        variant="expanded"
        onAction={(action, ids) => console.log(action, ids)}
      />
      
      {/* Document List */}
      <DocumentList
        onDocumentClick={(doc) => console.log('View:', doc)}
        maxHeight="500px"
      />
    </div>
  );
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
