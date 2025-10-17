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
import type { Property } from "@/modules/properties/property.type";
import type { Contract } from "../../contract.type";

type DeleteContractModalProps = {
  contract: Contract;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteContractModal({
  contract,
  open,
  onClose,
  onConfirm,
}: DeleteContractModalProps) {
  return (
    <AlertDialog onOpenChange={onClose} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete Contract for {(contract?.property as Property)?.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this contract for{" "}
            {(contract?.property as Property)?.title}? This action cannot be
            undone and will permanently remove all associated data including
            updates, attachments, and history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
