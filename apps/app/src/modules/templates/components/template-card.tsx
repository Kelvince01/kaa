import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Copy, Edit, Eye, MoreHorizontal, Play, Trash } from "lucide-react";
import type { TemplateType } from "../template.type";

type TemplateCardProps = {
  template: TemplateType;
  isSelected?: boolean;
  onSelect?: (template: TemplateType) => void;
  onEdit?: (template: TemplateType) => void;
  onView?: (template: TemplateType) => void;
  onDelete?: (template: TemplateType) => void;
  onDuplicate?: (template: TemplateType) => void;
  onPreview?: (template: TemplateType) => void;
};

export function TemplateCard({
  template,
  isSelected = false,
  onSelect,
  onEdit,
  onView,
  onDelete,
  onDuplicate,
  onPreview,
}: TemplateCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      email: "bg-blue-100 text-blue-800",
      document: "bg-green-100 text-green-800",
      report: "bg-purple-100 text-purple-800",
      notification: "bg-orange-100 text-orange-800",
      welcome: "bg-pink-100 text-pink-800",
      payment: "bg-yellow-100 text-yellow-800",
      reminder: "bg-red-100 text-red-800",
      verification: "bg-indigo-100 text-indigo-800",
      maintenance: "bg-gray-100 text-gray-800",
      marketing: "bg-teal-100 text-teal-800",
      other: "bg-slate-100 text-slate-800",
    };
    return colors[category] || colors.other;
  };

  const getEngineIcon = (engine: string) => {
    const icons: Record<string, string> = {
      handlebars: "⚡",
      ejs: "📝",
      pug: "🐶",
      nunjucks: "🧶",
    };
    return icons[engine] || "📄";
  };

  return (
    <Card
      className={`group relative transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
    >
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(template)}
          />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <CardTitle className="line-clamp-1 font-semibold text-lg">
              {template.name}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {template.description}
            </CardDescription>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                size="sm"
                variant="ghost"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(template)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
              )}
              {onPreview && (
                <DropdownMenuItem onClick={() => onPreview(template)}>
                  <Play className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(template)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(template)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3 flex items-center justify-between">
          <Badge className={getCategoryColor(template.category)}>
            {template.category}
          </Badge>
          <div className="flex items-center space-x-1 text-muted-foreground text-sm">
            <span>{getEngineIcon(template.engine)}</span>
            <span>{template.engine}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Type:</span> {template.type}
          </div>
          <div className="text-sm">
            <span className="font-medium">Version:</span> {template.version}
          </div>
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge className="text-xs" key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge className="text-xs" variant="outline">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 border-t pt-3 text-muted-foreground text-xs">
          Updated {new Date(template.updatedAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
