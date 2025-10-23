"use client";

import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Search } from "lucide-react";

export function PropertyManagementFilters({
  searchTerm,
  setSearchTerm,
  propertyStatus,
  setPropertyStatus,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  propertyStatus: string;
  setPropertyStatus: (value: string) => void;
}) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex flex-1 flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search properties..."
            value={searchTerm}
          />
        </div>
        <Select onValueChange={setPropertyStatus} value={propertyStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {/* <SelectItem value="all">All Status</SelectItem> */}
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
