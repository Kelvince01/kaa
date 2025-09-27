"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@kaa/ui/components/resizable";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { ImperativePanelHandle } from "react-resizable-panels";
import MJMLEditor from "@/components/previewer/mjml-editor";
import MJMLPreview from "@/components/previewer/mjml-preview";
import { useKeyboard } from "@/hooks/use-keyboard";
import useMJMLProcessor from "@/hooks/use-mjml-processor";
import { usePreviewLayout } from "@/hooks/use-preview-layout";
import { HOTKEYS } from "@/lib/constants";

export const PreviewBuilder = () => {
  const { isAltPressed } = useKeyboard();
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);

  const {
    leftPanelSize,
    rightPanelSize,
    snapToLeft,
    snapToRight,
    snapToCenter,
  } = usePreviewLayout();

  const { error, isProcessing } = useMJMLProcessor();

  useHotkeys(
    HOTKEYS.SNAP_PREVIEW_LEFT?.key as string,
    (e) => {
      e.preventDefault();
      if (leftPanelRef.current) {
        if (leftPanelSize === 50) {
          // If already at center, snap to left
          snapToLeft();
          leftPanelRef.current.resize(0);
          rightPanelRef.current?.resize(100);
        } else {
          // If at any other position, return to center
          snapToCenter();
          leftPanelRef.current.resize(50);
          rightPanelRef.current?.resize(50);
        }
      }
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  useHotkeys(
    HOTKEYS.SNAP_PREVIEW_RIGHT?.key as string,
    (e) => {
      e.preventDefault();
      if (leftPanelRef.current) {
        if (leftPanelSize === 50) {
          // If already at center, snap to right
          snapToRight();
          leftPanelRef.current.resize(100);
          rightPanelRef.current?.resize(0);
        } else {
          // If at any other position, return to center
          snapToCenter();
          leftPanelRef.current.resize(50);
          rightPanelRef.current?.resize(50);
        }
      }
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  const renderPreview = () => {
    if (isProcessing)
      return (
        <div className="flex h-full items-center justify-center">
          <span className="font-sans">Processing...</span>
        </div>
      );
    if (error)
      return (
        <div className="flex h-full items-center justify-center space-y-4 p-12 text-red-500">
          <div className="flex flex-col items-start justify-center space-y-2">
            <span className="font-sans text-2xl">Error</span>
            <span className="font-serif">{error.message}</span>
          </div>
        </div>
      );
    return <MJMLPreview />;
  };

  return (
    <div className="h-full">
      <ResizablePanelGroup className="h-full" direction="horizontal">
        <ResizablePanel
          defaultSize={leftPanelSize}
          minSize={0}
          ref={leftPanelRef}
        >
          <MJMLEditor />
        </ResizablePanel>
        <ResizableHandle
          className="group relative data-[panel-group-direction=horizontal]:w-2"
          isAltPressed={isAltPressed}
          leftHint="<"
          rightHint=">"
          withHandle
        />
        <ResizablePanel
          defaultSize={rightPanelSize}
          minSize={0}
          ref={rightPanelRef}
        >
          {renderPreview()}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default PreviewBuilder;
