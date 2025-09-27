"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { ExportManager } from "@/components/layout/export-manager";
import { LayoutManager } from "@/components/layout/layout-manager";
import { PreviewBuilder } from "@/components/previewer/preview-builder";
import { ViewportManager } from "@/components/previewer/viewport-manager";
import { useLayout } from "@/hooks/use-layout";

export function MJMLDialog() {
  const { isFullScreen } = useLayout();

  return (
    <Dialog>
      <DialogContent
        className={`border-b px-5 transition-colors duration-200 ${
          isFullScreen
            ? "fixed border-transparent bg-transparent"
            : "sticky bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        }`}
      >
        <DialogHeader>
          <div>
            <DialogTitle>MJML Dialog</DialogTitle>
            <ViewportManager />
            <ExportManager />
            <LayoutManager />
          </div>
        </DialogHeader>

        <PreviewBuilder />
      </DialogContent>
    </Dialog>
  );
}
