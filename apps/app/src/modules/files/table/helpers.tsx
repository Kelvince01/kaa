import { t } from "i18next";
import { Suspense } from "react";
import { dialog } from "@/components/common/dialoger/state";
import type { UploadedUppyFile } from "@/lib/imado/types";
import { nanoid } from "@/shared/utils/nanoid";
import {
  useFileCreateMutation,
  useFileDeleteMutation,
} from "../file.mutations";
import UploadUppy from "../upload/upload-uppy";

/**
 * Utility function to format bytes into human-readable format
 *
 * @param bytes The size in bytes
 * @returns Nicely formatted size
 */
export const formatBytes = (bytes: string): string => {
  const parsedBytes = Number(bytes);

  if (parsedBytes <= 0 || Number.isNaN(parsedBytes)) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(parsedBytes) / Math.log(1024));

  // Show 2 decimal places for MB or higher, else round to whole number
  const formattedSize = (parsedBytes / 1024 ** index).toFixed(
    index > 1 ? 2 : 0
  );

  return `${formattedSize} ${sizes[index]}`;
};

const maxNumberOfFiles = 20;
const maxTotalFileSize = 10 * 1024 * 1024 * maxNumberOfFiles; // for maxNumberOfFiles files at 10MB max each

/**
 * Open the upload dialog
 */
export const openAttachmentsUploadDialog = (organizationId: string) => {
  const UploadDialog = ({ organizationId }: { organizationId: string }) => {
    const { mutate: createAttachments } = useFileCreateMutation();
    const { mutate: deleteAttachments } = useFileDeleteMutation();

    const handleCallback = (result: UploadedUppyFile[]) => {
      const files = result.map(({ file, url }) => ({
        id: file.id || nanoid(),
        url,
        size: String(file.size || 0),
        contentType: file.type,
        filename: file.name || "unknown",
        organizationId,
      }));

      createAttachments({ files: files as any, orgIdOrSlug: organizationId });
      dialog.remove(true, "upload-attachment");
    };

    const handleSuccessesRetryCallback = async (
      result: UploadedUppyFile[],
      ids: string[]
    ) => {
      handleCallback(result);

      await deleteAttachments({ orgIdOrSlug: organizationId, ids });
    };

    return (
      <UploadUppy
        callback={handleCallback}
        imageMode="attachment"
        isPublic
        onRetrySuccessCallback={handleSuccessesRetryCallback}
        plugins={["webcam", "image-editor", "screen-capture", "audio"]}
        restrictions={{
          maxNumberOfFiles,
          allowedFileTypes: ["*/*"],
          maxTotalFileSize,
        }}
        uploadType="personal"
      />
    );
  };

  dialog(
    <Suspense>
      <UploadDialog organizationId={organizationId} />
    </Suspense>,
    {
      id: "upload-attachment",
      drawerOnMobile: false,
      title: t("common.upload_item", {
        item: t("common.attachments").toLowerCase(),
      }),
      description: t("common.upload_multiple.text", {
        item: t("common.attachments").toLowerCase(),
        count: maxNumberOfFiles,
      }),
      className: "md:max-w-xl",
    }
  );
};
