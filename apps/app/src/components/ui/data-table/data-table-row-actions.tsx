import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import type { Row } from "@tanstack/react-table";
import { Ellipsis, type LucideIcon } from "lucide-react";

type ActionOption<TData> = {
  label: string;
  onClick: (row: TData) => void;
  icon: LucideIcon;
  destructive?: boolean;
};

type DataTableRowActionsProps<TData> = {
  row: Row<TData>;
  actions: ActionOption<TData>[];
};

export function DataTableRowActions<TData>({
  row,
  actions,
}: DataTableRowActionsProps<TData>) {
  // TODO receive actions and callbacks as props
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          variant="ghost"
        >
          <Ellipsis className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {actions.map(({ label, onClick, icon, destructive }) => {
          const Icon = icon;

          return (
            <DropdownMenuItem
              className={destructive ? "text-destructive" : ""}
              key={label}
              onClick={() => onClick(row.original)}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span className="ml-2">{label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
