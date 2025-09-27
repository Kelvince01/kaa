"use client";

import { useState } from "react";
import { useUIState } from "@/hooks/use-ui-state";
import { UI_STATE } from "@/lib/constants";

export const usePreviewLayout = () => {
  const [leftPanelSize, setLeftPanelSize] = useState(50);
  const { onOpenChange } = useUIState(
    UI_STATE.RESIZABLE_PANEL as keyof typeof UI_STATE
  );

  const snapToLeft = () => {
    onOpenChange(false);
    if (leftPanelSize === 0) return;
    setLeftPanelSize(0);
  };

  const snapToRight = () => {
    onOpenChange(false);
    if (leftPanelSize === 100) return;
    setLeftPanelSize(100);
  };

  const snapToCenter = () => {
    onOpenChange(false);
    if (leftPanelSize === 50) return;
    setLeftPanelSize(50);
  };

  return {
    leftPanelSize,
    rightPanelSize: 100 - leftPanelSize,
    snapToLeft,
    snapToRight,
    snapToCenter,
  };
};
