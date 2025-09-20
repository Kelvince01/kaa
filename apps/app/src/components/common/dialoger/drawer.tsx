import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@kaa/ui/components/drawer";
import type { DialogProp } from "@/components/common/dialoger/dialog";
import { dialog as dialogState } from "@/components/common/dialoger/state";

export default function DrawerDialog({ dialog, removeDialog }: DialogProp) {
  const {
    id,
    content,
    open,
    description,
    title,
    className,
    headerClassName = "",
  } = dialog;

  const onOpenChange = (open: boolean) => {
    dialogState.update(dialog.id, { open });
    if (!open) {
      removeDialog(dialog);
      dialog.removeCallback?.();
    }
  };

  return (
    <Drawer key={id} onOpenChange={onOpenChange} open={open}>
      <DrawerContent className={className}>
        <DrawerHeader
          className={`${title || description ? headerClassName : "hidden"}`}
        >
          <DrawerTitle className={`${title ? "" : "hidden"} h-6 text-left`}>
            {title}
          </DrawerTitle>
          <DrawerDescription className={`${description ? "" : "hidden"}`}>
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
