"use client";

import { isDesktopApp } from "@kaa/desktop-client/platform";
import { usePathname } from "next/navigation";
import { DesktopTrafficLight } from "./desktop-traffic-light";

export function DesktopHeader() {
  const pathname = usePathname();

  if (!isDesktopApp() || pathname.includes("/search")) {
    return null;
  }

  // This is used to make the header draggable on macOS
  return (
    <div
      className="group absolute top-0 right-0 left-0 z-[51] h-5 overflow-hidden border-radius-[10px]"
      data-tauri-drag-region
    >
      <div className="hidden group-hover:flex">
        <DesktopTrafficLight />
      </div>
    </div>
  );
}
