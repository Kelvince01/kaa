import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@kaa/ui/components/drawer";
import { useEffect, useState } from "react";
import type { SheetProp } from "@/components/common/sheeter/sheet";
import { sheet as sheetState } from "@/components/common/sheeter/state";

export default function MobileSheet({ sheet, removeSheet }: SheetProp) {
  const {
    modal = true,
    side: sheetSide,
    description,
    title,
    className: sheetClassName,
    content,
    open,
  } = sheet;

  // State to retain side value even after sheet removal
  const [side, setSide] = useState(sheetSide);
  const [className, setClassName] = useState(sheetClassName);

  // Prevent flickering of sheet when its removed
  useEffect(() => {
    if (sheetSide) {
      setSide(sheetSide); // Update side when new sheet is created
      setClassName(sheetClassName);
    }
  }, [sheetSide, sheetClassName]);

  const closeSheet = () => {
    removeSheet(sheet);
    sheet.removeCallback?.();
  };

  const onOpenChange = (open: boolean) => {
    sheetState.update(sheet.id, { open });
    if (!open) closeSheet();
  };

  return (
    <Drawer
      direction={side}
      modal={modal}
      noBodyStyles
      onClose={closeSheet}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DrawerContent
        className={className}
        direction={side}
        onEscapeKeyDown={closeSheet}
      >
        <DrawerHeader className={`${description || title ? "" : "hidden"}`}>
          <DrawerTitle className={`mb-2 font-medium ${title ? "" : "hidden"}`}>
            {title}
          </DrawerTitle>
          <DrawerDescription
            className={`font-light text-muted-foreground pb-4${description ? "" : "hidden"}`}
          >
            {description}
          </DrawerDescription>
        </DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
