import { toast } from "sonner";

type CopyToClipboardOptions = {
  onCopyStart?: () => void;
  onCopySuccess?: () => void;
  onCopyError?: (err: unknown) => void;
  onCopyComplete?: () => void;
  toastMessage?: string;
  showToast?: boolean;
  resetDelay?: number;
};

export async function copyToClipboard(
  data: string,
  options: CopyToClipboardOptions = {}
) {
  const {
    onCopyStart,
    onCopySuccess,
    onCopyError,
    onCopyComplete,
    toastMessage,
    showToast = true,
    resetDelay = 1000,
  } = options;

  try {
    if (onCopyStart) onCopyStart();

    await navigator.clipboard.writeText(data);

    if (onCopySuccess) onCopySuccess();

    if (showToast && toastMessage) {
      toast.success(toastMessage);
    }
  } catch (err) {
    console.error("Failed to copy text: ", err);

    if (onCopyError) onCopyError(err);

    if (showToast) {
      toast.error("Failed to copy to clipboard");
    }
  } finally {
    if (resetDelay > 0 && onCopyComplete) {
      setTimeout(() => {
        onCopyComplete();
      }, resetDelay);
    }
  }
}
