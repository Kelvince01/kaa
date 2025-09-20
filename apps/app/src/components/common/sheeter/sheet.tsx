import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import { useEffect, useRef, useState } from "react";
import {
  type SheetT,
  sheet as sheetState,
} from "@/components/common/sheeter/state";
import StickyBox from "@/components/common/sticky-box";

export type SheetProp = {
  sheet: SheetT;
  removeSheet: (sheet: SheetT) => void;
};

export default function DesktopSheet({ sheet, removeSheet }: SheetProp) {
  const {
    id,
    modal = true,
    side: sheetSide,
    open,
    description,
    scrollableOverlay,
    title,
    hideClose = false,
    className: sheetClassName,
    content,
  } = sheet;
  const sheetRef = useRef<HTMLDivElement>(null);

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
    if (!modal) return;
    sheetState.update(id, { open });
    if (!open) closeSheet();
  };

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    const activeElement = document.activeElement;
    if (!(modal || sheetRef.current?.contains(activeElement))) return;
    e.preventDefault();
    e.stopPropagation();
    closeSheet();
  };

  const handleInteractOutside = (
    event:
      | CustomEvent<{ originalEvent: PointerEvent }>
      | CustomEvent<{ originalEvent: FocusEvent }>
  ) => {
    const bodyClassList = document.body.classList;
    if (
      bodyClassList.contains("keep-menu-open") &&
      bodyClassList.contains("menu-sheet-open")
    )
      return;

    const mainContentElement = document.getElementById("app-content-inner");
    if (!modal && mainContentElement?.contains(event.target as Node))
      return closeSheet();
  };

  return (
    <Sheet modal={modal} onOpenChange={onOpenChange} open={open}>
      <SheetContent
        aria-describedby={undefined}
        className={`${className} items-start`}
        hideClose={hideClose}
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={handleInteractOutside} // Retained side value
        ref={sheetRef}
        scrollableOverlay={scrollableOverlay}
        side={side}
      >
        <StickyBox
          className={`z-10 flex items-center justify-between bg-background py-3 ${title ? "" : "hidden"}`}
        >
          <SheetTitle>{title}</SheetTitle>
        </StickyBox>
        <SheetHeader className={`${description || title ? "" : "hidden"}`}>
          <SheetDescription className={`${description ? "" : "hidden"}`}>
            {description}
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
