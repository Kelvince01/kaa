import { toast } from "sonner";
import { useCreateExpense } from "../../financials.queries";
import { ReceiptGallery } from "./receipt-gallery";
import { ReceiptUploadModal } from "./receipt-upload-modal";

type ReceiptManagerProps = {
  isUploadOpen: boolean;
  onUploadClose: () => void;
  isGalleryOpen: boolean;
  onGalleryClose: () => void;
  onUploadNew: () => void;
};

export function ReceiptManager({
  isUploadOpen,
  onUploadClose,
  isGalleryOpen,
  onGalleryClose,
  onUploadNew,
}: ReceiptManagerProps) {
  const { mutate: createExpense } = useCreateExpense();

  const handleCreateExpense = (expenseData: any) => {
    createExpense(expenseData, {
      onSuccess: () => {
        toast.success("Expense created successfully from receipt!");
        onUploadClose();
      },
      onError: (error) => {
        toast.error("Failed to create expense");
        console.error("Error creating expense:", error);
      },
    });
  };

  return (
    <>
      <ReceiptUploadModal
        isOpen={isUploadOpen}
        onClose={onUploadClose}
        // useCreateExpense={(expenseData) => createExpense(expenseData)}
        // onCreateExpense={handleCreateExpense}
      />

      <ReceiptGallery
        isOpen={isGalleryOpen}
        onClose={onGalleryClose}
        onUploadNew={() => {
          onGalleryClose();
          onUploadNew();
        }}
      />
    </>
  );
}
