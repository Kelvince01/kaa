"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@kaa/ui/components/sheet";
import { PlusIcon } from "lucide-react";
import * as React from "react";
import { MemberForm } from "./member-form";

type CreateMemberSheetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export function CreateMemberSheet({
  open,
  onOpenChange,
  showTrigger = true,
}: CreateMemberSheetProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleSuccess = () => {
    handleOpenChange(false);
  };

  const handleCancel = () => {
    handleOpenChange(false);
  };

  return (
    <Sheet onOpenChange={handleOpenChange} open={open ?? isOpen}>
      {showTrigger && (
        <SheetTrigger asChild>
          <Button size="sm">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Member
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Create New Member</SheetTitle>
          <SheetDescription>
            Add a new member to your organization. Fill in the details below.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <MemberForm
            mode="create"
            onCancel={handleCancel}
            onSuccess={handleSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
