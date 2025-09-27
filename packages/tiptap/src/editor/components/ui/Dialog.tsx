import type React from "react";
import { createPortal } from "react-dom";

type DialogProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  const onDismiss = () => {
    onOpenChange?.(false);
  };

  if (!open) return;

  return createPortal(
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: false positive
    // biome-ignore lint/a11y/useKeyWithClickEvents: false positive
    <div className="rte-dialog" onClick={onDismiss} role="dialog">
      {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: false positive */}
      {/** biome-ignore lint/a11y/useKeyWithClickEvents: false positive */}
      {/** biome-ignore lint/a11y/noStaticElementInteractions: false positive */}
      <div className="rte-dialog__content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    // biome-ignore lint/style/noNonNullAssertion: false positive
    document.querySelector("body")!
  );
};

export default Dialog;
