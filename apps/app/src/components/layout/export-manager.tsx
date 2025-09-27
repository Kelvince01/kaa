"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Braces, Check, Code, Download, Image } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { HotkeyDropdownItem } from "@/components/common/hotkeys/hotkey-dropdown-item";
import { HotkeyIconButton } from "@/components/common/hotkeys/hotkey-icon-button";
import {
  type ExportOption,
  ExportOptions,
} from "@/components/export/export-options";
import { useHotkeysHandler } from "@/hooks/use-hotkeys-handler";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMJMLProcessor } from "@/hooks/use-mjml-processor";
import { useUIState } from "@/hooks/use-ui-state";
import { useViewport } from "@/hooks/use-viewport";
import { HOTKEYS, STORAGE_KEYS, UI_STATE } from "@/lib/constants";
import { copyToClipboard } from "@/lib/copy";

export function ExportManager() {
  const { content, html, vanillaHtml } = useMJMLProcessor();
  const [localLiquid] = useLocalStorage(
    STORAGE_KEYS.LOCAL_LIQUID as keyof typeof STORAGE_KEYS,
    "{}"
  );
  const [sharedLiquid] = useLocalStorage(
    STORAGE_KEYS.SHARED_LIQUID as keyof typeof STORAGE_KEYS,
    "{}"
  );
  const [exporting, setExporting] = useState(false);
  const { size } = useViewport();
  const { isOpen: isDropdownOpen, onOpenChange: onDropdownOpenChange } =
    useUIState(UI_STATE.EXPORT as keyof typeof UI_STATE);
  const { isOpen: isExportOptionsOpen, onOpenChange: onExportOptionsChange } =
    useUIState(UI_STATE.HTML_EXPORT_OPTIONS as keyof typeof UI_STATE);

  const handleCopy = async (data: string, type: string) => {
    await copyToClipboard(data, {
      onCopyStart: () => setExporting(true),
      onCopySuccess: () => onDropdownOpenChange(false),
      onCopyComplete: () => setExporting(false),
      toastMessage: `${type} copied to clipboard!`,
    });
  };

  const handleCopyHTML = () => handleCopy(html, "HTML");
  const handleCopyVanillaHTML = async () =>
    handleCopy(await vanillaHtml(), "Vanilla HTML");
  const handleCopyMJML = () => handleCopy(content, "MJML");
  const handleCopyLocalLiquid = () =>
    handleCopy(JSON.stringify(localLiquid, null, 2), "Local Liquid");
  const handleCopySharedLiquid = () =>
    handleCopy(JSON.stringify(sharedLiquid, null, 2), "Shared Liquid");

  const handleOpenHTMLExportOptions = () => {
    onDropdownOpenChange(false); // Close the export dropdown
    onExportOptionsChange(true); // Open the export options dialog
  };

  const htmlExportOptions: ExportOption[] = [
    {
      id: "liquid-processed-html",
      label: "Liquid Processed HTML",
      description:
        "This means that liquid templates will be substituted with the values you inputted in the liquid editor.",
      callback: handleCopyHTML,
    },
    {
      id: "vanilla-html",
      label: "Vanilla HTML",
      description:
        "This means that liquid templates will not be substituted with the values you inputted in the liquid editor. This is useful if you use external tools that can consume liquid templates (e.g. Customer.io).",
      callback: handleCopyVanillaHTML,
    },
  ];

  const handleExportImage = async () => {
    if (!(html && size)) {
      toast.error("Error", {
        description:
          "Unable to export: HTML content or viewport size not available.",
      });
      return;
    }

    setExporting(true);
    try {
      const iframe = document.createElement("iframe");
      iframe.style.width = `${size.width}px`;
      iframe.style.position = "absolute";
      iframe.style.left = "-9999px";
      iframe.style.top = "-9999px";
      document.body.appendChild(iframe);

      await new Promise<void>((resolve, reject) => {
        iframe.onload = () => resolve();
        iframe.onerror = () => reject(new Error("Iframe loading failed"));
        if (iframe.contentWindow) {
          iframe.contentWindow.document.open();
          iframe.contentWindow.document.write(html);
          iframe.contentWindow.document.close();
        } else {
          reject(new Error("iframe.contentWindow is null"));
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // biome-ignore lint/complexity/useOptionalChain: false positive
      if (!(iframe.contentWindow && iframe.contentWindow.document.body)) {
        document.body.removeChild(iframe);
        toast.error("Export Error", {
          description:
            "Failed to access iframe content for export - please record the replication steps and raise an issue on GitHub🙇‍♂ ️",
        });
        return;
      }

      const canvas = await html2canvas(iframe.contentWindow.document.body, {
        width: size.width,
      });
      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL("image/png");

      const pdfWidth = canvas.width;
      const pdfHeight = canvas.height;
      const orientation = pdfWidth > pdfHeight ? "l" : "p";

      const pdf = new jsPDF({
        orientation,
        unit: "px",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("email-preview.pdf");

      toast.success("Export Successful", {
        description: "PDF has been downloaded!",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export Failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred during export - please record the replication steps and raise an issue on GitHub🙇‍♂ ️",
      });
    } finally {
      onDropdownOpenChange(false);
      setTimeout(() => {
        setExporting(false);
      }, 1000);
    }
  };

  useHotkeysHandler({
    hotkeys: HOTKEYS.TOGGLE_COPY?.key,
    onTrigger: () => {
      onDropdownOpenChange(!isDropdownOpen);
    },
  });

  const htmlRef = useHotkeysHandler({
    hotkeys: HOTKEYS.COPY_HTML?.key,
    onTrigger: () => {
      if (isDropdownOpen) handleOpenHTMLExportOptions();
    },
    dependencies: [isDropdownOpen],
    options: {
      enabled: isDropdownOpen,
    },
  });

  const mjmlRef = useHotkeysHandler({
    hotkeys: HOTKEYS.COPY_MJML?.key,
    onTrigger: () => {
      if (isDropdownOpen) handleCopyMJML();
    },
    dependencies: [isDropdownOpen, content],
    options: {
      enabled: isDropdownOpen,
    },
  });

  const localRef = useHotkeysHandler({
    hotkeys: HOTKEYS.COPY_LOCAL?.key,
    onTrigger: () => {
      if (isDropdownOpen) handleCopyLocalLiquid();
    },
    dependencies: [isDropdownOpen, localLiquid],
    options: {
      enabled: isDropdownOpen,
    },
  });

  const sharedRef = useHotkeysHandler({
    hotkeys: HOTKEYS.COPY_SHARED?.key,
    onTrigger: () => {
      if (isDropdownOpen) handleCopySharedLiquid();
    },
    dependencies: [isDropdownOpen, sharedLiquid],
    options: {
      enabled: isDropdownOpen,
    },
  });

  const imageRef = useHotkeysHandler({
    hotkeys: HOTKEYS.EXPORT_IMAGE?.key,
    onTrigger: () => {
      if (isDropdownOpen) handleExportImage();
    },
    dependencies: [isDropdownOpen, html],
    options: {
      enabled: isDropdownOpen,
    },
  });

  return (
    <>
      <DropdownMenu onOpenChange={onDropdownOpenChange} open={isDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <HotkeyIconButton
            hotkey={HOTKEYS.TOGGLE_COPY?.hint}
            icon={exporting ? <Check className="text-green-500" /> : Download}
            showHotkeyOverride={isDropdownOpen}
            srText={HOTKEYS.TOGGLE_COPY?.description}
            title={HOTKEYS.TOGGLE_COPY?.description}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[220px]"
          ref={(el) => {
            htmlRef(el);
            mjmlRef(el);
            localRef(el);
            sharedRef(el);
            imageRef(el);
          }}
        >
          <HotkeyDropdownItem
            hotkey={HOTKEYS.COPY_HTML?.hint}
            icon={Code}
            label={HOTKEYS.COPY_HTML?.description}
            onClick={handleOpenHTMLExportOptions}
          />
          <HotkeyDropdownItem
            hotkey={HOTKEYS.COPY_MJML?.hint}
            icon={Code}
            label={HOTKEYS.COPY_MJML?.description}
            onClick={handleCopyMJML}
          />
          <DropdownMenuSeparator />
          <HotkeyDropdownItem
            hotkey={HOTKEYS.COPY_LOCAL?.hint}
            icon={Braces}
            label={HOTKEYS.COPY_LOCAL?.description}
            onClick={handleCopyLocalLiquid}
          />
          <HotkeyDropdownItem
            hotkey={HOTKEYS.COPY_SHARED?.hint}
            icon={Braces}
            label={HOTKEYS.COPY_SHARED?.description}
            onClick={handleCopySharedLiquid}
          />
          <DropdownMenuSeparator />
          <HotkeyDropdownItem
            hotkey={HOTKEYS.EXPORT_IMAGE?.hint}
            icon={Image}
            label={HOTKEYS.EXPORT_IMAGE?.description}
            onClick={handleExportImage}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportOptions
        description="Choose the HTML format you would like to copy."
        isOpen={isExportOptionsOpen}
        onOpenChange={onExportOptionsChange}
        options={htmlExportOptions}
        title="HTML Export Options"
      />
    </>
  );
}
