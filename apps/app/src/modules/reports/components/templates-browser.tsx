"use client";

import type { ReportType } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { FileText, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSystemTemplates, useTemplates } from "../reports.queries";
import type { IReportTemplate } from "../reports.type";

type TemplatesBrowserProps = {
  onSelectTemplate?: (template: IReportTemplate) => void;
  showSystemTemplates?: boolean;
};

export function TemplatesBrowser({
  onSelectTemplate,
  showSystemTemplates = true,
}: TemplatesBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<ReportType | "all">("all");

  const { data: systemTemplatesData, isLoading: systemLoading } =
    useSystemTemplates();
  const { data: userTemplatesData, isLoading: userLoading } = useTemplates();

  const systemTemplates = systemTemplatesData || [];
  const userTemplates = userTemplatesData?.data?.items || [];

  const allTemplates = [
    ...(showSystemTemplates ? systemTemplates : []),
    ...userTemplates,
  ];

  const filteredTemplates = allTemplates.filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    const matchesType =
      selectedType === "all" || template.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = [...new Set(allTemplates.map((t) => t.category))].sort();

  const reportTypes = [
    ...new Set(allTemplates.map((t) => t.type)),
  ] as ReportType[];

  const getTypeLabel = (type: ReportType) =>
    type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  if (systemLoading || userLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Loading templates...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Templates
            </CardTitle>
            <CardDescription>
              Browse and select from available templates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              value={searchQuery}
            />
          </div>
          <Select onValueChange={setSelectedCategory} value={selectedCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) => setSelectedType(v as ReportType | "all")}
            value={selectedType}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {reportTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-lg">No templates found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                key={template._id.toString()}
                onClick={() => onSelectTemplate?.(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    {template.isSystemTemplate && (
                      <Badge className="ml-2" variant="secondary">
                        <Sparkles className="mr-1 h-3 w-3" />
                        System
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getTypeLabel(template.type)}
                      </Badge>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge
                            className="text-xs"
                            key={tag}
                            variant="secondary"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {onSelectTemplate && (
                      <Button
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTemplate(template);
                        }}
                        size="sm"
                      >
                        Use Template
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
