"use client";

import { useRef } from "react";
import MapControls from "@/components/common/map/map-controls";
import MapSearch from "@/components/common/map/map-search";
import MapStyles from "@/components/common/map/map-styles";
import MapProvider from "@/lib/mapbox/provider";

export default function MapboxPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="h-screen w-screen">
      <div
        className="absolute inset-0 h-full w-full"
        id="map-container"
        ref={mapContainerRef}
      />

      <MapProvider
        initialViewState={{
          longitude: -122.4194,
          latitude: 37.7749,
          zoom: 10,
        }}
        mapContainerRef={mapContainerRef}
      >
        <MapSearch />
        <MapControls />
        <MapStyles />
      </MapProvider>
    </div>
  );
}
