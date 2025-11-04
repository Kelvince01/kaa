"use client";

import mapboxgl, { type MarkerOptions } from "mapbox-gl";
import type React from "react";
import { useEffect, useRef } from "react";

import { useMap } from "@/contexts/map-context";
import type { LocationFeature } from "@/lib/mapbox/utils";

type Props = {
  longitude: number;
  latitude: number;
  data: any;
  onHover?: ({
    isHovered,
    position,
    marker,
    data,
  }: {
    isHovered: boolean;
    position: { longitude: number; latitude: number };
    marker: mapboxgl.Marker;
    data: LocationFeature;
  }) => void;
  onClick?: ({
    position,
    marker,
    data,
  }: {
    position: { longitude: number; latitude: number };
    marker: mapboxgl.Marker;
    data: LocationFeature;
  }) => void;
  children?: React.ReactNode;
} & MarkerOptions;

export default function Marker({
  children,
  latitude,
  longitude,
  data,
  onHover,
  onClick,
  ...props
}: Props) {
  const { map } = useMap();

  // Ref for the marker element and marker instance
  const markerElRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const handleHover = (isHovered: boolean) => {
    if (onHover && markerRef.current) {
      onHover({
        isHovered,
        position: { longitude, latitude },
        marker: markerRef.current,
        data,
      });
    }
  };

  const handleClick = () => {
    if (onClick && markerRef.current) {
      onClick({
        position: { longitude, latitude },
        marker: markerRef.current,
        data,
      });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: marker lifecycle
  useEffect(() => {
    const markerEl = markerElRef.current;
    if (!(map && markerEl)) return;

    const handleMouseEnter = () => handleHover(true);
    const handleMouseLeave = () => handleHover(false);

    markerEl.addEventListener("mouseenter", handleMouseEnter);
    markerEl.addEventListener("mouseleave", handleMouseLeave);
    markerEl.addEventListener("click", handleClick);

    const options: MarkerOptions = {
      element: markerEl,
      ...props,
    };

    const addMarker = () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }

      markerRef.current = new mapboxgl.Marker(options)
        .setLngLat([longitude, latitude])
        .addTo(map);
    };

    // Wait until map is fully loaded
    if (map.loaded()) {
      addMarker();
    } else {
      map.once("load", addMarker);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      markerEl.removeEventListener("mouseenter", handleMouseEnter);
      markerEl.removeEventListener("mouseleave", handleMouseLeave);
      markerEl.removeEventListener("click", handleClick);
    };
  }, [map, longitude, latitude]);

  return (
    <div>
      <div ref={markerElRef}>{children}</div>
    </div>
  );
}
