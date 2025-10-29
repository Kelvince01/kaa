"use client";

/**
 * Template Selector Component
 *
 * Component for selecting and previewing document templates
 */

import { LegalDocumentType, TemplateStatus } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
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
import { FileText, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { useTemplates } from "../legal-document.queries";
import { useLegalDocumentStore } from "../legal-document.store";
import type {
  ILegalDocumentTemplate,
  TemplateFilter,
} from "../legal-document.type";

type TemplateSelectorProps = {
  onSelect?: (template: ILegalDocumentTemplate) => void;
  showGenerateButton?: boolean;
};

export function TemplateSelector({
  onSelect,
  showGenerateButton = true,
}: TemplateSelectorProps) {
  const { setCurrentTemplate, setGenerateModalOpen } = useLegalDocumentStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<TemplateFilter>({
    status: TemplateStatus.ACTIVE,
  });

  const { data, isLoading } = useTemplates(filter);

  const handleSelectTemplate = (template: ILegalDocumentTemplate) => {
    setCurrentTemplate(template);
    onSelect?.(template);

    if (showGenerateButton) {
      setGenerateModalOpen(true);
    }
  };

  const filteredTemplates = data?.templates.filter((template) =>
    searchQuery
      ? template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            value={searchQuery}
          />
        </div>

        <Select
          onValueChange={(value) =>
            setFilter({
              ...filter,
              type: value === "all" ? undefined : (value as LegalDocumentType),
            })
          }
          value={filter.type || "all"}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(LegalDocumentType).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates?.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-lg">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates?.map((template) => (
            <Card
              className="cursor-pointer transition-shadow hover:shadow-lg"
              key={template._id}
              onClick={() => handleSelectTemplate(template)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base">{template.name}</span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {template.type.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline">v{template.version}</Badge>
                    {template.requiresSignature && (
                      <Badge variant="outline">Requires Signature</Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-muted-foreground text-sm">
                    <div className="flex justify-between">
                      <span>Fields:</span>
                      <span>{template.fields.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span>{template.usageCount} times</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jurisdiction:</span>
                      <span>{template.jurisdiction}</span>
                    </div>
                  </div>

                  {template?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template?.tags?.slice(0, 3).map((tag) => (
                        <Badge
                          className="text-xs"
                          key={tag}
                          variant="secondary"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {template?.tags?.length > 3 && (
                        <Badge className="text-xs" variant="secondary">
                          +{template?.tags?.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
