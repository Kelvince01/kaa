import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect } from "react";
import { useOnlineManager } from "@/hooks/use-online-manager";
import type { UploadedUppyFile } from "@/lib/imado/types";
import UploadUppy from "@/modules/files/upload/upload-uppy";

const basicBlockTypes = {
  image: {
    allowedFileTypes: ["image/*"],
    plugins: ["image-editor", "screen-capture", "webcam"],
  },
  video: {
    allowedFileTypes: ["video/*"],
    plugins: ["screen-capture", "webcam"],
  },
  audio: {
    allowedFileTypes: ["audio/*"],
    plugins: ["audio", "screen-capture", "webcam"],
  },
  file: {
    allowedFileTypes: ["*/*"],
    plugins: ["screen-capture", "webcam"],
  },
};

type UppyFilePanelProps = {
  fileType: string;
  onOpenChange: (open: boolean) => void;
  onCreateCallback?: (result: UploadedUppyFile[]) => void;
};

const UppyFilePanel: React.FC<UppyFilePanelProps> = ({
  fileType,
  onOpenChange,
  onCreateCallback,
}) => {
  const t = useTranslations();
  const { isOnline } = useOnlineManager();

  const type = (fileType as keyof typeof basicBlockTypes) || "file";

  useEffect(() => {
    if (isOnline) return;
  }, [isOnline]);

  return (
    <Dialog defaultOpen={isOnline} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="h-6">
            {t("common.upload_item", {
              item: t(`common.${type}`).toLowerCase(),
            })}
          </DialogTitle>
          <DialogDescription className="hidden" />
        </DialogHeader>
        <UploadUppy
          callback={(result) => {
            onCreateCallback?.(result);
          }}
          imageMode="attachment"
          isPublic
          plugins={basicBlockTypes[type].plugins}
          restrictions={{
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxNumberOfFiles: 1,
            allowedFileTypes: basicBlockTypes[type].allowedFileTypes,
            maxTotalFileSize: 10 * 1024 * 1024, // 10MB
          }}
          uploadType="personal"
        />
      </DialogContent>
    </Dialog>
  );
};

export default UppyFilePanel;
