import { Button } from "@kaa/ui/components/button";
import { onlineManager } from "@tanstack/react-query";
import { Trash, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { lazyWithPreload } from "react-lazy-with-preload";
import {
  AvatarWrap,
  type AvatarWrapProps,
} from "@/components/common/avatar-wrap";
import { dialog } from "@/components/common/dialoger/state";
import { toaster } from "@/components/common/toaster";

const UploadUppy = lazyWithPreload(
  () => import("@/modules/files/upload/upload-uppy")
);

interface UploadAvatarProps extends AvatarWrapProps {
  setUrl: (url: string | null) => void;
}

export const UploadAvatar = ({
  type,
  id,
  name,
  url,
  setUrl,
}: UploadAvatarProps) => {
  const t = useTranslations();

  const removeImage = () => setUrl(null);

  // Open the upload dialog
  const openUploadDialog = () => {
    if (!onlineManager.isOnline())
      return toaster(t("common.action.offline.text"), "warning");

    dialog(
      <Suspense>
        <UploadUppy
          callback={(result) => {
            const url = result[0]?.url;
            if (url) setUrl(url);
            dialog.remove(true, "upload-image");
          }}
          imageMode="avatar"
          isPublic
          plugins={["webcam", "image-editor"]}
          uploadType="personal"
        />
      </Suspense>,
      {
        id: "upload-image",
        drawerOnMobile: false,
        title: t("common.upload_item", {
          item: t("common.profile_picture").toLowerCase(),
        }),
        className: "md:max-w-xl",
      }
    );
  };

  return (
    <div className="flex gap-4">
      <AvatarWrap
        className="h-16 w-16"
        id={id}
        name={name}
        type={type}
        url={url}
      />

      <div className="flex flex-col gap-2">
        <p className="font-light text-xs sm:text-sm">
          {t("common.upload_img_max_10mb.text")}
        </p>
        <div className="flex items-center gap-2">
          <Button
            onClick={openUploadDialog}
            onMouseOver={() => UploadUppy.preload()}
            size="sm"
            type="button"
            variant="plain"
          >
            <Upload className="mr-2" size={16} />
            <span>{t("common.upload")}</span>
          </Button>

          {url && (
            <Button onClick={removeImage} size="sm" variant="secondary">
              <Trash size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
