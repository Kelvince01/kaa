import { config } from "@kaa/config";
import { Button } from "@kaa/ui/components/button";
import {
  AdvancedMarker,
  APIProvider,
  ControlPosition,
  Map as GMap,
  InfoWindow,
  MapControl,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { Minus, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
// import Logo from "/logo/logo-icon-only.svg";
// import ErrorNotice from "@/components/common/error-notice";
import { useUIStore } from "@/shared/stores/ui.store";

import Logo from "../../../../public/logo/logo-icon-only.svg";

type MapConfig = {
  id: string;
  label: string;
  mapId?: string;
  mapTypeId?: string;
};

const mapStyles: MapConfig[] = [
  {
    id: "light",
    label: "Light",
    mapId: "49ae42fed52588c3",
    mapTypeId: "roadmap",
  },
  {
    id: "dark",
    label: "Dark",
    mapId: "739af084373f96fe",
    mapTypeId: "roadmap",
  },
];

const MarkerWithInfowindow = ({
  position,
}: {
  position: { lat: number; lng: number };
}) => {
  const t = useTranslations();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infowindowOpen, setInfowindowOpen] = useState(true);

  return (
    <>
      <AdvancedMarker
        onClick={() => setInfowindowOpen(true)}
        position={position}
        ref={markerRef}
        title="More info"
      >
        {/** biome-ignore lint/performance/noImgElement: noImgElement */}
        <img alt={config.name} height="30" src={Logo} width="30" />
      </AdvancedMarker>

      {infowindowOpen && (
        <InfoWindow anchor={marker} headerDisabled={true}>
          <div className="min-w-32 text-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <strong className="text-sm">{config.company.name}</strong>
              <Button
                onClick={() => setInfowindowOpen(false)}
                size="micro"
                variant="ghost"
              >
                <X size={14} />
              </Button>
            </div>
            <span className="block">{config.company.streetAddress}</span>
            <span className="block">{config.company.country}</span>
            <a
              href={config.company.googleMapsUrl}
              rel="noreferrer"
              target="_blank"
            >
              {t("common.get_directions")}
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

type CustomZoomControlProps = {
  controlPosition: ControlPosition;
  zoom: number;
  onZoomChange: (zoom: number) => void;
};

const CustomZoomControl = ({
  controlPosition,
  zoom,
  onZoomChange,
}: CustomZoomControlProps) => {
  return (
    <MapControl position={controlPosition}>
      <div className="m-2 flex flex-col p-1">
        <Button
          className="rounded-b-none border-b-0"
          onClick={() => onZoomChange(zoom + 0.5)}
          size="micro"
          variant="outlineGhost"
        >
          <Plus size={14} />
        </Button>
        <Button
          className="rounded-t-none"
          onClick={() => onZoomChange(zoom - 0.5)}
          size="micro"
          variant="outlineGhost"
        >
          <Minus size={14} />
        </Button>
      </div>
    </MapControl>
  );
};

const ContactFormMap = () => {
  const mode = useUIStore((state) => state.mode);
  const [zoom, setZoom] = useState(config.company.mapZoom);
  const [mapConfig] = useState<MapConfig>(
    mode === "dark" ? (mapStyles[1] as MapConfig) : (mapStyles[0] as MapConfig)
  );

  if (config.company.coordinates && config.googleMapsKey)
    return (
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          // <ErrorNotice
          //   error={error}
          //   level="app"
          //   resetErrorBoundary={resetErrorBoundary}
          // />
          <div>
            {error.message} {resetErrorBoundary.toString()}
          </div>
        )}
      >
        <div className="h-full w-full overflow-hidden md:px-4 md:pb-12">
          <APIProvider apiKey={config.googleMapsKey} libraries={["marker"]}>
            <GMap
              defaultCenter={config.company.coordinates}
              defaultZoom={config.company.mapZoom}
              disableDefaultUI
              gestureHandling={"greedy"}
              mapId={mapConfig.mapId || null}
              mapTypeId={mapConfig.mapTypeId}
              zoom={zoom}
            >
              <MarkerWithInfowindow position={config.company.coordinates} />
              <CustomZoomControl
                controlPosition={ControlPosition.LEFT_BOTTOM}
                onZoomChange={(zoom) => setZoom(zoom)}
                zoom={zoom}
              />
            </GMap>
          </APIProvider>
        </div>
      </ErrorBoundary>
    );
};
export default ContactFormMap;
