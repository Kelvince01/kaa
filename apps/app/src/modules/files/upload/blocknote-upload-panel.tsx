import type { PartialBlock } from "@blocknote/core";
import { type FilePanelProps, useBlockNoteEditor } from "@blocknote/react";
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
  onCreateCallback?: (result: UploadedUppyFile[]) => void;
};

const UppyFilePanel: React.FC<UppyFilePanelProps & FilePanelProps> = ({
  onCreateCallback,
  ...props
}) => {
  const t = useTranslations();
  const { block } = props;
  const { isOnline } = useOnlineManager();

  const editor = useBlockNoteEditor();
  const type = (block.type as keyof typeof basicBlockTypes) || "file";

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to close the menu only once
  useEffect(() => {
    if (isOnline) return;
    editor.filePanel?.closeMenu();
  }, [isOnline]);

  return (
    <Dialog
      defaultOpen={isOnline}
      onOpenChange={() => editor.filePanel?.closeMenu()}
    >
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
            for (const res of result) {
              const updateData: PartialBlock = {
                props: {
                  name: res.file.name,
                  url: res.url,
                },
              };
              editor.updateBlock(block, updateData);
            }
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
