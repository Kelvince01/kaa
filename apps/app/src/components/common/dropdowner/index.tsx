import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import {
  type DropdownT,
  dropdownerState,
} from "@/components/common/dropdowner/state";

export function Dropdowner() {
  const [dropdown, setDropdown] = useState<DropdownT | null>(null);

  const dropdownContainerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return dropdownerState.subscribe((dropdowner) => {
      if ("remove" in dropdowner) {
        setDropdown(null);
        dropdownContainerRef.current = null;
      } else {
        setDropdown(dropdowner);

        if (!dropdownContainerRef.current)
          dropdownContainerRef.current = document.createElement("div");
        // Dynamically update alignment classes
        dropdownContainerRef.current.className = `absolute bottom-0 ${dropdowner.align === "start" ? "left-0" : "right-0"}`;
      }
    });
  }, []);

  if (!(dropdown?.trigger && dropdownContainerRef.current)) return null;

  dropdown.trigger.appendChild(dropdownContainerRef.current);
  return ReactDOM.createPortal(
    <DropdownMenu key={dropdown.id} modal={dropdown.modal} open={true}>
      <DropdownMenuTrigger />
      <DropdownMenuContent
        align={dropdown.align || "start"}
        className="data-[side=top]:-translate-y-7 p-0 data-[side=bottom]:translate-y-2"
        modal={dropdown.modal}
        onCloseAutoFocus={() => {
          if (dropdown.refocus && dropdown.trigger) dropdown.trigger.focus();
        }}
        onEscapeKeyDown={() => dropdownerState.remove()}
        onInteractOutside={(e) => {
          const isInside = dropdown.trigger?.contains(e.target as Node);
          if (!isInside) dropdownerState.remove();
        }}
        side="bottom"
      >
        {dropdown.content}
      </DropdownMenuContent>
    </DropdownMenu>,
    dropdownContainerRef.current
  );
}
