"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@kaa/ui/components/button";

interface TenantsTableToolbarActionsProps {
	onCreate: () => void;
}

export function TenantsTableToolbarActions({ onCreate }: TenantsTableToolbarActionsProps) {
	return (
		<div className="flex items-center gap-2">
			<Button onClick={onCreate}>
				<Plus className="mr-2 size-4" aria-hidden="true" />
				Add Tenant
			</Button>
		</div>
	);
}
