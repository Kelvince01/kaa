"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { X } from "lucide-react";
import type { Member } from "../member.type";
import { MemberStats } from "./member-stats";

type MemberStatsDialogProps = {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MemberStatsDialog({
  member,
  open,
  onOpenChange,
}: MemberStatsDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>{member?.name} - Statistics</DialogTitle>
              <DialogDescription>
                View detailed statistics and usage information for this member
              </DialogDescription>
            </div>
            <Button
              className="h-6 w-6 rounded-sm p-0 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={() => onOpenChange(false)}
              variant="ghost"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="pr-4">
            {member && <MemberStats memberId={member._id} />}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
