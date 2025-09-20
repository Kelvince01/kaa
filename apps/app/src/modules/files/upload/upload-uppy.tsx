"use client";

import { config } from "@kaa/config";
import Audio from "@uppy/audio";
import type { Uppy, UppyOptions } from "@uppy/core";
import ImageEditor, { type ImageEditorOptions } from "@uppy/image-editor";
import { Dashboard } from "@uppy/react";
import ScreenCapture from "@uppy/screen-capture";
import type { WebcamOptions } from "@uppy/webcam";
import Webcam from "@uppy/webcam";
import { useEffect, useState } from "react";
import { ImadoUppy } from "@/lib/imado";
import type { UploadedUppyFile, UppyBody, UppyMeta } from "@/lib/imado/types";
import { useUIStore } from "@/shared/stores/ui.store";
import { getImageEditorOptions } from "./image-editor-options";

// import "@uppy/audio/dist/style.css";
import "@uppy/audio/css/style.css";
import "@uppy/dashboard/css/style.min.css";
import "@uppy/image-editor/css/style.css";
import "@uppy/screen-capture/css/style.css";
import "@uppy/webcam/css/style.css";
import "@/modules/files/upload/uppy.css";

export type UploadUppyProps = {
  uploadType: "organization" | "personal";
  isPublic: boolean;
  plugins?: ("webcam" | "image-editor" | "audio" | "screen-capture" | string)[];
  restrictions?: Partial<UppyOptions<UppyMeta, UppyBody>["restrictions"]>;
  imageMode?: "cover" | "avatar" | "attachment";
  organizationId?: string;
  callback?: (result: UploadedUppyFile[]) => void;
  onRetrySuccessCallback?: (
    result: UploadedUppyFile[],
    previousIds: string[]
  ) => void;
};

const uppyRestrictions = config.uppy.defaultRestrictions;

// Here we init imadoUppy, an enriched Uppy instance that we use to upload files.
// For more info in Imado, see: https://imado.eu/
// For more info on Uppy and its APIs, see: https://uppy.io/docs/

export const UploadUppy = ({
  uploadType,
  isPublic,
  organizationId,
  restrictions = {},
  plugins = [],
  imageMode = "attachment",
  callback,
  onRetrySuccessCallback,
}: UploadUppyProps) => {
  const [uppy, setUppy] = useState<Uppy | null>(null);
  const mode = useUIStore((state) => state.mode);

  // Set uppy options with restrictions
  const uppyOptions: UppyOptions<UppyMeta, UppyBody> = {
    restrictions: {
      ...uppyRestrictions,
      minFileSize: null,
      minNumberOfFiles: null,
      ...restrictions,
      requiredMetaFields: restrictions.requiredMetaFields ?? [],
    },
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to initialize uppy only once
  useEffect(() => {
    const initializeUppy = async () => {
      const imadoUppy = await ImadoUppy(uploadType, uppyOptions, {
        public: isPublic,
        organizationId,
        statusEventHandler: {
          onComplete: (mappedResult) => {
            if (callback) callback(mappedResult);
          },
          onRetrySuccess(results, localStoreIds) {
            if (onRetrySuccessCallback)
              onRetrySuccessCallback(results, localStoreIds);
          },
          onFileEditorComplete: () => {
            // If in image mode, start upload directly after editing
            if (["cover", "avatar"].includes(imageMode)) imadoUppy.upload();
          },
        },
      });

      const imageEditorOptions: ImageEditorOptions =
        getImageEditorOptions(imageMode);

      const webcamOptions: WebcamOptions<UppyMeta, UppyBody> = {
        videoConstraints: { width: 1280, height: 720 },
      };

      if (["cover", "avatar"].includes(imageMode))
        webcamOptions.modes = ["picture"];

      // Set plugins based on plugins props
      if (plugins.includes("webcam")) imadoUppy.use(Webcam, webcamOptions);
      if (plugins.includes("image-editor"))
        imadoUppy.use(ImageEditor, imageEditorOptions);
      if (plugins.includes("audio")) imadoUppy.use(Audio);
      if (plugins.includes("screen-capture")) imadoUppy.use(ScreenCapture);

      setUppy(imadoUppy);
    };

    initializeUppy();
  }, []);

  return (
    <>
      {uppy && (
        <Dashboard
          autoOpen={
            ["cover", "avatar"].includes(imageMode) ? "imageEditor" : null
          }
          height="400px"
          proudlyDisplayPoweredByUppy={false}
          theme={mode}
          uppy={uppy}
          width="100%"
        />
      )}
    </>
  );
};

export default UploadUppy;
