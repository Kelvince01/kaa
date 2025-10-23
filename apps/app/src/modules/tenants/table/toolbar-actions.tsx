"use client";

import { Button } from "@kaa/ui/components/button";
import { Plus } from "lucide-react";

type TenantsTableToolbarActionsProps = {
  onCreate: () => void;
};

export function TenantsTableToolbarActions({
  onCreate,
}: TenantsTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button onClick={onCreate}>
        <Plus aria-hidden="true" className="mr-2 size-4" />
        Add Tenant
      </Button>
    </div>
  );
}
