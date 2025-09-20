import { useCallback, useEffect, useRef, useState } from "react";
import StandardDialog from "@/components/common/dialoger/dialog";
import DrawerDialog from "@/components/common/dialoger/drawer";
import {
  DialogState,
  type DialogT,
  type DialogToRemove,
} from "@/components/common/dialoger/state";
import { sheet } from "@/components/common/sheeter/state";
import { useBreakpoints } from "@/hooks/use-breakpoints";

export function Dialoger() {
  const [dialogs, setDialogs] = useState<DialogT[]>([]);
  const [updatedDialogs, setUpdatedDialogs] = useState<DialogT[]>([]);
  const isMobile = useBreakpoints("max", "sm");
  const prevFocusedElement = useRef<HTMLElement | null>(null);

  const removeDialog = useCallback((dialog: DialogT | DialogToRemove) => {
    setDialogs((dialogs) => dialogs.filter(({ id }) => id !== dialog.id));
    if (dialog.refocus && prevFocusedElement.current) {
      // Timeout is needed to prevent focus from being stolen by the dialog that was just removed
      setTimeout(() => {
        prevFocusedElement.current?.focus();
        prevFocusedElement.current = null;
      }, 1);
    }
  }, []);

  useEffect(() => {
    return DialogState.subscribe((dialog) => {
      if ("remove" in dialog) return removeDialog(dialog);

      if ("reset" in dialog)
        return setUpdatedDialogs((updatedDialogs) =>
          updatedDialogs.filter(({ id }) => id !== dialog.id)
        );

      // Make sure no sheet is open due to z-index issues
      if (isMobile) sheet.remove();

      prevFocusedElement.current = (document.activeElement ||
        document.body) as HTMLElement;
      setUpdatedDialogs((updatedDialogs) => [
        ...updatedDialogs.filter((d) => d.id !== dialog.id),
        dialog,
      ]);
      setDialogs((dialogs) => [
        ...dialogs.filter((d) => d.id !== dialog.id),
        dialog,
      ]);
    });
  }, [isMobile, removeDialog]);

  if (!dialogs.length) return null;

  return dialogs.map((dialog) => {
    const existingDialog = updatedDialogs.find(({ id }) => id === dialog.id);
    const DialogComponent =
      isMobile && dialog.drawerOnMobile ? DrawerDialog : StandardDialog;
    return (
      <DialogComponent
        dialog={existingDialog ?? dialog}
        key={dialog.id}
        removeDialog={removeDialog}
      />
    );
  });
}
