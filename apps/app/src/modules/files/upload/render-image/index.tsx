import { Button } from "@kaa/ui/components/button";
import { cn } from "@kaa/ui/lib/utils";
import {
  Grab,
  Hand,
  Minus,
  Plus,
  RefreshCw,
  RotateCwSquare,
} from "lucide-react";
import type React from "react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { TooltipButton } from "@/components/common/tooltip-button";
import { dispatchCustomEvent } from "@/lib/custom-events";
import ImageViewer from "@/modules/files/upload/render-image/image-viewer";

type RenderImageProps = {
  image: string;
  alt?: string;
  ref?: React.Ref<HTMLImageElement>;
  customButton?: React.ReactNode;
  resetImageState?: boolean;
  imageClass?: string;
  showButtons?: boolean;
  togglePanState?: boolean;
};

type ControlButtonProps = {
  tooltipContent: string;
  onClick: () => void;
  icon: React.ReactNode;
  className: string;
};

const ControlButton = ({
  tooltipContent,
  onClick,
  icon,
  className,
}: ControlButtonProps) => (
  <TooltipButton toolTipContent={tooltipContent}>
    <Button
      className={cn(
        "rounded-none border border-input bg-background text-accent-foreground hover:bg-accent",
        className
      )}
      onClick={onClick}
    >
      {icon}
    </Button>
  </TooltipButton>
);

const RenderImage = forwardRef<HTMLImageElement, RenderImageProps>(
  (
    {
      image,
      alt,
      resetImageState,
      showButtons,
      imageClass,
      togglePanState = false,
    },
    forwardedRef
  ) => {
    const [dx, setDx] = useState(0);
    const [dy, setDy] = useState(0);

    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [panState, setPanState] = useState(!togglePanState);

    const imgRef = useRef<HTMLImageElement>(null);

    const calculateInitialZoom = () => {
      const imageElement = imgRef.current;
      if (imageElement) {
        const windowWidth = window.innerWidth - 40;
        const windowHeight = window.innerHeight - 100;

        const renderedWidth = imageElement.offsetWidth;
        const renderedHeight = imageElement.offsetHeight;

        const scaleX = windowWidth / renderedWidth;
        const scaleY = windowHeight / renderedHeight;

        setZoom(Math.min(scaleX, scaleY)); // Set zoom based on rendered size
      }
    };

    const resetAll = () => {
      setDx(0);
      setDy(0);
      calculateInitialZoom();
      setRotation(0);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: by author
    useEffect(() => {
      if (resetImageState) resetAll();
    }, [resetImageState]);

    const zoomIn = () => setZoom((prevZoom) => prevZoom + 0.2);
    const zoomOut = () =>
      setZoom((prevZoom) => (prevZoom >= 0.4 ? prevZoom - 0.2 : prevZoom));
    const rotateRight = () =>
      setRotation((prevRotation) =>
        prevRotation === 3 ? 0 : prevRotation + 1
      );

    const onPan = (dx: number, dy: number) => {
      setDx(dx);
      setDy(dy);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: by author
    useEffect(() => {
      const imageElement = imgRef.current;
      imageElement?.addEventListener("load", calculateInitialZoom); // Wait for image load if not
      return () =>
        imageElement?.removeEventListener("load", calculateInitialZoom);
    }, [image]);

    useEffect(() => {
      if (!forwardedRef) return;
      if (typeof forwardedRef === "function") forwardedRef(imgRef.current);
      else forwardedRef.current = imgRef.current;
    }, [forwardedRef]);

    return (
      <>
        {showButtons && (
          <div className="absolute bottom-3 left-[calc(50vw-6.5rem)] z-20 flex items-center justify-center gap-0 rounded-md bg-transparent text-sm shadow-xs ring-offset-background">
            <ControlButton
              className="rounded-l-md border-r-0"
              icon={<Plus size={14} />}
              onClick={zoomIn}
              tooltipContent="Zoom in"
            />
            <ControlButton
              className="border-r-0"
              icon={<Minus size={14} />}
              onClick={zoomOut}
              tooltipContent="Zoom out"
            />
            <ControlButton
              className="border-r-0"
              icon={<RotateCwSquare size={14} />}
              onClick={rotateRight}
              tooltipContent="Rotate right"
            />

            {togglePanState !== undefined && (
              <ControlButton
                className="border-r-0"
                icon={panState ? <Grab size={14} /> : <Hand size={14} />}
                onClick={() => {
                  setPanState(!panState);
                  dispatchCustomEvent("toggleCarouselDrag", panState);
                }}
                tooltipContent="Toggle pan view"
              />
            )}

            <ControlButton
              className="rounded-r-md"
              icon={<RefreshCw size={14} />}
              onClick={resetAll}
              tooltipContent="Reset"
            />
          </div>
        )}

        <ImageViewer
          className="z-10 flex h-full w-full items-center justify-center"
          enablePan={panState}
          key={dx}
          onPan={onPan}
          pandx={dx}
          pandy={dy}
          rotation={rotation}
          setZoom={setZoom}
          zoom={zoom}
        >
          {/* Image */}
          {/** biome-ignore lint/nursery/useImageSize: by author */}
          {/** biome-ignore lint/performance/noImgElement: by author */}
          <img
            alt={alt}
            className={imageClass}
            ref={imgRef}
            src={image}
            style={{ transform: `rotate(${rotation * 90}deg)`, width: "100%" }}
          />
        </ImageViewer>
      </>
    );
  }
);

export default RenderImage;
