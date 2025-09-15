"use client";

import { Window } from "@kaa/desktop-client/core";

export function DesktopTrafficLight() {
  const getMainWindow = async () => {
    const mainWindow = await Window.getByLabel("main");
    if (!mainWindow) {
      throw new Error("Main window not found");
    }
    return mainWindow;
  };

  const handleClose = async () => {
    try {
      const window = await getMainWindow();
      // Hide the main window instead of closing it
      await window.hide();
    } catch (error) {
      console.error("Failed to hide main window:", error);
    }
  };

  const handleMinimize = async () => {
    try {
      const window = await getMainWindow();
      await window.minimize();
    } catch (error) {
      console.error("Failed to minimize main window:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      const window = await getMainWindow();
      const isMaximized = await window.isMaximized();

      if (isMaximized) {
        await window.unmaximize();
      } else {
        await window.toggleMaximize();
      }
    } catch (error) {
      console.error("Failed to toggle maximize main window:", error);
    }
  };

  return (
    <div className="fixed top-[8px] left-[8px] flex space-x-[8px]">
      {/* Close button (red) */}
      <button
        aria-label="Close window"
        className="h-[10px] w-[10px] cursor-pointer rounded-full bg-border hover:bg-red-500"
        onClick={handleClose}
        type="button"
      />
      {/* Minimize button (yellow) */}
      <button
        aria-label="Minimize window"
        className="h-[10px] w-[10px] cursor-pointer rounded-full bg-border hover:bg-yellow-500"
        onClick={handleMinimize}
        type="button"
      />
      {/* Maximize/Restore button (green) */}
      <button
        aria-label="Toggle maximize"
        className="h-[10px] w-[10px] cursor-pointer rounded-full bg-border hover:bg-green-500"
        onClick={handleMaximize}
        type="button"
      />
    </div>
  );
}
