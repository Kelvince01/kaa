"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Download, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Photo } from "./types";

type BulkOperationsProps = {
  photos: Photo[];
  selectedIds: string[];
  onSelectionChangeAction: (ids: string[]) => void;
  onBulkDeleteAction: (ids: string[]) => void;
  onBulkTagAction: (ids: string[], tags: string[]) => void;
  onBulkCaptionAction: (ids: string[], caption: string) => void;
  onSetPrimaryAction: (id: string) => void;
};

export function BulkOperations({
  photos,
  selectedIds,
  onSelectionChangeAction,
  onBulkDeleteAction,
  onBulkTagAction,
  onBulkCaptionAction,
  onSetPrimaryAction,
}: BulkOperationsProps) {
  const [bulkCaption, setBulkCaption] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const isAllSelected =
    selectedIds.length === photos.length && photos.length > 0;
  const isPartiallySelected =
    selectedIds.length > 0 && selectedIds.length < photos.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChangeAction([]);
    } else {
      onSelectionChangeAction(photos.map((p) => p.id));
    }
  };

  const availableTags = [
    "bedroom",
    "kitchen",
    "bathroom",
    "living-room",
    "exterior",
    "garden",
    "parking",
  ];

  return (
    <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isAllSelected}
              data-state={
                isAllSelected
                  ? "checked"
                  : isPartiallySelected
                    ? "indeterminate"
                    : "unchecked"
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="font-medium text-sm">
              {selectedIds.length > 0
                ? `${selectedIds.length} selected`
                : "Select all"}
            </span>
          </div>

          {selectedIds.length > 0 && (
            <Badge variant="secondary">
              {selectedIds.length} photo{selectedIds.length !== 1 ? "s" : ""}{" "}
              selected
            </Badge>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              className="text-destructive hover:text-destructive"
              onClick={() => onBulkDeleteAction(selectedIds)}
              size="sm"
              variant="outline"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
            <Button size="sm" variant="outline">
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3">
          {/* Bulk Caption */}
          <div className="space-y-2">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
            <label className="font-medium text-sm">
              Add Caption to Selected
            </label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                onChange={(e) => setBulkCaption(e.target.value)}
                placeholder="Enter caption..."
                value={bulkCaption}
              />
              <Button
                disabled={!bulkCaption.trim()}
                onClick={() => {
                  onBulkCaptionAction(selectedIds, bulkCaption);
                  setBulkCaption("");
                }}
                size="sm"
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Bulk Tagging */}
          <div className="space-y-2">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
            <label className="font-medium text-sm">Add Tag to Selected</label>
            <div className="flex gap-2">
              <Select onValueChange={setSelectedTag} value={selectedTag}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag.replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!selectedTag}
                onClick={() => {
                  if (selectedTag) {
                    onBulkTagAction(selectedIds, [selectedTag]);
                    setSelectedTag("");
                  }
                }}
                size="sm"
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Set Primary */}
          <div className="space-y-2">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
            <label className="font-medium text-sm">Set Primary Photo</label>
            <Select onValueChange={onSetPrimaryAction}>
              <SelectTrigger>
                <SelectValue placeholder="Choose primary" />
              </SelectTrigger>
              <SelectContent>
                {photos
                  .filter((p) => selectedIds.includes(p.id))
                  .map((photo) => (
                    <SelectItem key={photo.id} value={photo.id}>
                      Photo {photos.findIndex((p) => p.id === photo.id) + 1}
                      {photo.caption && ` - ${photo.caption.slice(0, 20)}...`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
