"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import type { Member } from "../member.type";
import { MemberForm } from "./member-form";

type UpdateMemberSheetProps = {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateMemberSheet({
  member,
  open,
  onOpenChange,
}: UpdateMemberSheetProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Update Member</SheetTitle>
          <SheetDescription>Update the member details below.</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {member && (
            <MemberForm
              member={member}
              mode="edit"
              onCancel={handleCancel}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
