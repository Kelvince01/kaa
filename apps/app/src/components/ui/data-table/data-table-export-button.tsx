import { Button, type ButtonProps } from "@kaa/ui/components/button";
import { cn } from "@kaa/ui/lib/utils";
import { Download, FileDown } from "lucide-react";
import type * as React from "react";

export interface DataTableExportButtonProps extends ButtonProps {
  /**
   * Function to handle the export action
   */
  onExport?: () => void;
  /**
   * Whether the export is currently in progress
   */
  isExporting?: boolean;
  /**
   * Optional label for the export button
   */
  label?: string;
  /**
   * Optional file format for export (e.g., 'CSV', 'Excel', 'PDF')
   */
  format?: string;
}

export function DataTableExportButton({
  onExport,
  isExporting = false,
  label = "Export",
  format,
  className,
  variant = "outline",
  size = "sm",
  ...props
}: DataTableExportButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onExport?.();
  };

  return (
    <Button
      className={cn("h-8 gap-1", className)}
      disabled={isExporting}
      onClick={handleClick}
      size={size}
      variant={variant}
      {...props}
    >
      {isExporting ? (
        <div className="mr-2 h-4 w-4 animate-spin" />
      ) : format ? (
        <FileDown className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {format ? `${label} ${format}` : label}
    </Button>
  );
}
