import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { cn } from "@kaa/ui/lib/utils";
import {
  type DialogT,
  dialog as dialogState,
} from "@/components/common/dialoger/state";
import { dropdowner } from "@/components/common/dropdowner/state";

type CustomInteractOutsideEvent = CustomEvent<{
  originalEvent: PointerEvent | FocusEvent;
}>;

export type DialogProp = {
  dialog: DialogT;
  removeDialog: (dialog: DialogT) => void;
};
export default function StandardDialog({ dialog, removeDialog }: DialogProp) {
  const {
    id,
    content,
    preventEscPress,
    container,
    open,
    description,
    title,
    className,
    containerBackdrop,
    containerBackdropClassName,
    autoFocus,
    hideClose,
    headerClassName = "",
  } = dialog;

  const closeDialog = () => {
    removeDialog(dialog);
    dialog.removeCallback?.();
  };
  const onOpenChange = (open: boolean) => {
    dialogState.update(dialog.id, { open });
    if (!open) closeDialog();
  };

  const handleInteractOutside = (event: CustomInteractOutsideEvent) => {
    const dropDown = dropdowner.getOpenDropdown();

    // Check if there is an open dropdown and if it is not modal
    if (dropDown && !dropDown.modal) event.preventDefault();

    // Check if the container exists and if there's no backdrop
    if (container && !containerBackdrop) event.preventDefault();
  };

  const handleEscapeKeyDown = (event: KeyboardEvent) => {
    if (preventEscPress) event.preventDefault();
  };

  return (
    <Dialog key={id} modal={!container} onOpenChange={onOpenChange} open={open}>
      {container && containerBackdrop && (
        <div
          className={cn(
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-100 bg-background/75 data-[state=closed]:animate-out data-[state=open]:animate-in",
            containerBackdropClassName
          )}
        />
      )}
      <DialogContent
        className={className}
        container={container}
        hideClose={hideClose}
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={handleInteractOutside}
        onOpenAutoFocus={(event: Event) => {
          if (!autoFocus) event.preventDefault();
        }}
      >
        <DialogHeader
          className={`${title || description ? headerClassName : "hidden"}`}
        >
          <DialogTitle
            className={`${title || title ? "" : "hidden"} h-6 leading-6`}
          >
            {title}
          </DialogTitle>
          <DialogDescription className={`${description ? "" : "hidden"}`}>
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* For accessibility */}
        {!(description || title) && <DialogTitle className="hidden" />}
        {content}
      </DialogContent>
    </Dialog>
  );
}
