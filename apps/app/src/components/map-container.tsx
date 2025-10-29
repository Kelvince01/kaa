"use client";

import { useRef } from "react";
import MapControls from "@/components/common/map/map-controls";
import MapSearch from "@/components/common/map/map-search";
import MapStyles from "@/components/common/map/map-styles";
import MapProvider from "@/lib/mapbox/provider";

export default function MapContainer({
  latitude,
  longitude,
  zoom = 10,
  className,
  enableSearch,
}: {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
  enableSearch?: boolean;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={className}>
      <div
        className="absolute inset-0 h-full w-full"
        id="map-container"
        ref={mapContainerRef}
      />

      <MapProvider
        initialViewState={{
          longitude,
          latitude,
          zoom,
        }}
        mapContainerRef={mapContainerRef}
      >
        {enableSearch && <MapSearch />}
        <MapControls />
        <MapStyles />
      </MapProvider>
    </div>
  );
}
