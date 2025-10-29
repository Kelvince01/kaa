"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import type { Organization } from "../organization.type";
import { OrganizationForm } from "./organization-form";

type UpdateOrganizationSheetProps = {
  organization: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateOrganizationSheet({
  organization,
  open,
  onOpenChange,
}: UpdateOrganizationSheetProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Update Organization</SheetTitle>
          <SheetDescription>
            Update the organization details below.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {organization && (
            <OrganizationForm
              mode="edit"
              onCancel={handleCancel}
              onSuccess={handleSuccess}
              organization={organization}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
