import { onlineManager } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type DialogT, dialog } from "@/components/common/dialoger/state";
import { toaster } from "@/components/common/toaster";
import AttachmentsCarousel from "@/modules/files/upload/carousel";

export type CarouselAttachment = {
  url: string;
  filename?: string;
  name?: string;
  contentType?: string;
};

export const openAttachmentDialog = (
  attachment: number,
  attachments: CarouselAttachment[],
  saveInSearchParams = false,
  dialogOptions?: Omit<DialogT, "id">
) => {
  const t = useTranslations("common");
  if (!onlineManager.isOnline())
    return toaster(t("action.offline.text"), "warning");

  const { removeCallback } = dialogOptions || {};
  dialog(
    <div className="-z-1 relative flex h-screen grow flex-wrap justify-center p-2">
      <AttachmentsCarousel
        isDialog
        saveInSearchParams={saveInSearchParams}
        slide={attachment}
        slides={attachments}
      />
    </div>,
    {
      id: "attachment-file-preview",
      drawerOnMobile: false,
      className:
        "min-w-full h-screen border-0 p-0 rounded-none flex flex-col mt-0",
      headerClassName: "absolute p-4 w-full backdrop-blur-xs bg-background/50",
      hideClose: true,
      autoFocus: true,
      removeCallback,
    }
  );
};
