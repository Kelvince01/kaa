// import { config } from "@kaa/config";
import { Button } from "@kaa/ui/components/button";
import {
  Carousel as BaseCarousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@kaa/ui/components/carousel";
import { cn } from "@kaa/ui/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { Download, ExternalLink, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useDownloader from "react-use-downloader";
import { dialog } from "@/components/common/dialoger/state";
import { useEventListener } from "@/hooks/use-event-listener";
import { AttachmentRender } from "@/modules/files/upload/attachment-render";
import FilePlaceholder from "@/modules/files/upload/file-placeholder";
import { openAttachmentDialog } from "@/modules/files/upload/helpers";

type CarouselPropsBase = {
  slide?: number;
  slides?: {
    url: string;
    id?: string;
    name?: string;
    filename?: string;
    contentType?: string;
  }[];
  classNameContainer?: string;
};

type CarouselProps =
  | (CarouselPropsBase & {
      isDialog: true;
      saveInSearchParams: boolean; // Required when isDialog is true
    })
  | (CarouselPropsBase & {
      isDialog?: false;
      saveInSearchParams?: never; // Disallowed when isDialog is false
    });

const AttachmentsCarousel = ({
  slides = [],
  isDialog = false,
  slide = 0,
  saveInSearchParams = false,
  classNameContainer,
}: CarouselProps) => {
  const router = useRouter();
  const attachmentPreview = useSearchParams().get("attachmentPreview");
  const searchParams = useSearchParams();

  const [current, setCurrent] = useState(
    slides.findIndex((slide) => slide.url === attachmentPreview) ?? 0
  );
  const [watchDrag, setWatchDrag] = useState(slides.length > 1);

  const itemClass = isDialog ? "object-contain" : "";
  const autoplay = Autoplay({
    delay: 4000,
    stopOnInteraction: true,
    stopOnMouseEnter: true,
  });

  const { download } = useDownloader();

  useEventListener("toggleCarouselDrag" as keyof WindowEventMap, (e: Event) => {
    const shouldWatchDrag = (e as CustomEvent).detail && slides.length > 1;
    setWatchDrag(shouldWatchDrag);
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to navigate to the current slide
  useEffect(() => {
    if (!saveInSearchParams || slides.length === 0) return;

    const currentSlide = slides[current] ? slides[current] : undefined;

    if (currentSlide?.id === attachmentPreview)
      // Only navigate if the current slide is different from the attachmentPreview
      return;

    // Decide whether to replace the history entry based on whether the attachmentPreview is already set
    const useReplace = attachmentPreview !== undefined;

    const params = new URLSearchParams(searchParams.toString());

    if (currentSlide?.id) {
      params.set("attachmentPreview", currentSlide.id);
    } else {
      params.delete("attachmentPreview");
    }

    const url = `?${params.toString()}`;

    if (useReplace) {
      router.replace(url); // like `replace: true`
    } else {
      router.push(url); // like `replace: false`
    }
  }, [current]);

  // Reopen dialog after reload if the attachmentPreview parameter exists
  return (
    <BaseCarousel
      className="group h-full w-full"
      isDialog={isDialog}
      opts={{ duration: 20, loop: true, startIndex: slide, watchDrag }}
      plugins={isDialog ? [] : [autoplay]}
      setApi={(api) => {
        if (!api) return;
        setCurrent(api.selectedScrollSnap());
        api.on("select", () => setCurrent(api.selectedScrollSnap()));
      }}
    >
      {slides[current] && isDialog && (
        <div className="fixed top-0 left-0 z-10 flex w-full gap-2 bg-background/60 p-3 text-center backdrop-blur-xs sm:text-left">
          {slides[current].name && (
            <h2 className="ml-1 flex h-6 items-center gap-2 text-base leading-6 tracking-tight">
              {slides[current].contentType && (
                <FilePlaceholder
                  contentType={slides[current].contentType}
                  iconSize={16}
                  strokeWidth={2}
                />
              )}
              {slides[current].name}
            </h2>
          )}
          <div className="grow" />
          {/* {slides[current].url.startsWith(config.publicCDNUrl) && ( */}
          {slides[current].url.startsWith("https://") && (
            <Button
              className="-my-1 h-8 w-8 opacity-70 hover:opacity-100"
              onClick={() => window.open(slides[current]?.url, "_blank")}
              size="icon"
              variant="ghost"
            >
              <ExternalLink className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          )}

          {slides[current].url.startsWith("https://") && (
            <Button
              className="-my-1 h-8 w-8 opacity-70 hover:opacity-100"
              onClick={() =>
                download(
                  slides[current]?.url || "",
                  slides[current]?.filename || "file"
                )
              }
              size="icon"
              variant="ghost"
            >
              <Download className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          )}

          <Button
            className="-my-1 h-8 w-8 opacity-70 hover:opacity-100"
            onClick={() => dialog.remove()}
            size="icon"
            variant="ghost"
          >
            <X className="h-6 w-6" strokeWidth={1.5} />
          </Button>
        </div>
      )}

      <CarouselContent className="h-full">
        {slides?.map(({ url, contentType = "image" }, idx) => {
          return (
            <CarouselItem
              key={url}
              onClick={() => {
                if (isDialog) return;
                openAttachmentDialog(idx, slides);
              }}
            >
              <AttachmentRender
                altName={`Slide ${idx}`}
                containerClassName={cn(
                  "justify-center, relative flex h-full items-center overflow-hidden",
                  classNameContainer
                )}
                imagePanZoom={isDialog}
                itemClassName={itemClass}
                showButtons={current === idx}
                togglePanState
                type={contentType}
                url={url}
              />
            </CarouselItem>
          );
        })}
      </CarouselContent>
      {(slides?.length ?? 0) > 1 && (
        <>
          <CarouselPrevious className="left-4 opacity-0 transition-opacity group-hover:opacity-100 lg:left-8" />
          <CarouselNext className="right-4 opacity-0 transition-opacity group-hover:opacity-100 lg:right-8" />
        </>
      )}
      {!isDialog && (
        <CarouselDots
          className="relative mt-[calc(1rem+2%)]"
          gap="lg"
          size="sm"
        />
      )}
    </BaseCarousel>
  );
};

export default AttachmentsCarousel;
