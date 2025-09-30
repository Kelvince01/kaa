import { cn } from "@kaa/ui/lib/utils";
import { useInView } from "react-intersection-observer";
import DeviceFrame from "@/components/frame";
import AttachmentsCarousel from "@/modules/files/upload/carousel";
import { useUIStore } from "@/shared/stores/ui.store";

type DeviceType = "mobile" | "tablet" | "pc";

type DeviceMockupProps = {
  lightSlides?: { url: string; name?: string }[];
  darkSlides?: { url: string; name?: string }[];
  className?: string;
  type: DeviceType;
};

const DeviceMockup = ({
  lightSlides,
  darkSlides,
  type,
  className,
}: DeviceMockupProps) => {
  const mode = useUIStore((state) => state.mode);

  const slides = mode === "dark" ? darkSlides : lightSlides;

  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0,
  });
  const mockupClass = `transition-opacity duration-700 ease-out ${inView ? "opacity-100" : "opacity-0"}`;

  return (
    <div className={cn(mockupClass, className)} ref={ref}>
      <DeviceFrame
        inView={inView}
        renderCarousel={(className) => (
          <AttachmentsCarousel
            classNameContainer={className}
            isDialog={false}
            slides={slides}
          />
        )}
        type={type}
      />
    </div>
  );
};

export default DeviceMockup;
