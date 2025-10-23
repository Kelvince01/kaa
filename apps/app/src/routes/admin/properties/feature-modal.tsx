"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@kaa/ui/components/alert-dialog";
import { Star } from "lucide-react";
import type { Property } from "@/modules/properties/property.type";

export function ToggleFeaturedModal({
  isOpen,
  onClose,
  onConfirm,
  property,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  property: Property;
}) {
  const isFeatured = property?.featured;

  return (
    <AlertDialog onOpenChange={onClose} open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-2">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <AlertDialogTitle>
              {isFeatured ? "Remove Featured Status" : "Make Property Featured"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {isFeatured
              ? "Are you sure you want to remove featured status from this property?"
              : "Are you sure you want to make this property featured? Featured properties appear at the top of search results."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-yellow-600 text-white hover:bg-yellow-700"
            onClick={onConfirm}
          >
            {isFeatured ? "Remove Featured" : "Make Featured"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
