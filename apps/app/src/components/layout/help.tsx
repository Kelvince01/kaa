"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { HelpCircle } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { HotkeyIconButton } from "@/components/common/hotkeys/hotkey-icon-button";
import Separator from "@/components/common/separator";
import { useUIState } from "@/hooks/use-ui-state";
import { HOTKEYS, STANDARD_HOTKEYS, UI_STATE } from "@/lib/constants";

export function HelpDialog() {
  const { isOpen, onOpenChange } = useUIState(UI_STATE.HELP);

  useHotkeys(
    HOTKEYS.TOGGLE_HELP.key,
    (e) => {
      e.preventDefault();
      onOpenChange(!isOpen);
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <span className="font-sans text-xl">Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription>
            <span className="font-serif text-muted-foreground text-sm">
              Hitting{" "}
              <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                alt
              </kbd>{" "}
              opens up mini keywords beside the various buttons to help you
              navigate the app. I hope you find using this as fun as it was to
              build!
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {STANDARD_HOTKEYS.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 font-sans font-semibold text-lg">
                {section.title}
              </h3>
              <Separator className="mb-4" />
              <div className="space-y-2">
                {section.hotkeys.map((hotkey) => (
                  <div
                    className="flex items-center justify-between space-y-1"
                    key={hotkey.key}
                  >
                    <span className="font-serif text-muted-foreground text-sm">
                      {hotkey.description}
                    </span>
                    <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                      {hotkey.key.replace(/\+/g, " + ")}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HelpButton() {
  const { onOpenChange } = useUIState(UI_STATE.HELP);

  return (
    <HotkeyIconButton
      className="relative"
      hotkey={HOTKEYS.TOGGLE_HELP.hint}
      icon={HelpCircle}
      onClick={() => onOpenChange(true)}
      srText={HOTKEYS.TOGGLE_HELP.description}
      title={HOTKEYS.TOGGLE_HELP.description}
    />
  );
}
