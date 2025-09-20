// import { config } from "@kaa/config";
import DOMPurify from "dompurify";
import { lazy, Suspense, useMemo } from "react";
import Spinner from "@/components/common/spinner";
import { useBreakpoints } from "@/hooks/use-breakpoints";
import { useLocalFile } from "@/modules/files/hooks/use-local-file";

// Lazy-loaded components
const ReactPanZoom = lazy(() => import("@/modules/files/upload/render-image"));
const RenderAudio = lazy(() => import("@/modules/files/upload/render-audio"));
const RenderPDF = lazy(() => import("@/modules/files/upload/render-pdf"));
const RenderVideo = lazy(() => import("@/modules/files/upload/render-video"));

type AttachmentRenderProps = {
  type: string;
  url: string;
  altName?: string;
  imagePanZoom?: boolean;
  showButtons?: boolean;
  itemClassName?: string;
  containerClassName?: string;
  togglePanState?: boolean;
};

export const AttachmentRender = ({
  url: baseUrl,
  type,
  altName,
  showButtons,
  imagePanZoom = false,
  itemClassName,
  containerClassName,
  togglePanState,
}: AttachmentRenderProps) => {
  const isMobile = useBreakpoints("max", "sm");

  const sanitizedUrl = DOMPurify.sanitize(baseUrl);
  const { localUrl, localFileError } = useLocalFile(sanitizedUrl, type);

  const url = useMemo(() => {
    // Use direct URL for static images
    if (sanitizedUrl.startsWith("/static/")) return sanitizedUrl;

    // Use either remote URL or local URL pointing to indexedDB
    // return sanitizedUrl.startsWith(config.publicCDNUrl)
    return sanitizedUrl.startsWith("https://") ? sanitizedUrl : localUrl;
  }, [sanitizedUrl, localUrl]);

  if (sanitizedUrl === localUrl && localFileError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-background text-muted-foreground">
        <div className="my-8 text-center text-red-500 text-sm">
          {localFileError}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <Suspense fallback={<Spinner className="mt-[40vh]" />}>
        {type.includes("image") &&
          (imagePanZoom && !isMobile ? (
            <ReactPanZoom
              alt={altName}
              image={url}
              imageClass={itemClassName}
              showButtons={showButtons}
              togglePanState={togglePanState}
            />
          ) : (
            // biome-ignore lint/nursery/useImageSize: by author
            // biome-ignore lint/performance/noImgElement: by author
            <img
              alt={altName}
              className={`${itemClassName} h-full w-full`}
              src={url}
            />
          ))}
        {type.includes("audio") && (
          <RenderAudio className="-mt-48 mx-auto h-20 w-[80vw]" src={url} />
        )}
        {type.includes("video") && (
          <RenderVideo
            className="mx-auto aspect-video max-h-[90vh]"
            src={url}
          />
        )}
        {type.includes("pdf") && (
          <RenderPDF
            className="m-auto h-[95vh] w-[95vw] overflow-auto"
            file={url}
          />
        )}
      </Suspense>
    </div>
  );
};
