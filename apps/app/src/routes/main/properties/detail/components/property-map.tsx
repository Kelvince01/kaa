import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { Property } from "@/modules/properties/property.type";

interface PropertyWithCoordinates extends Property {
  coordinates?: {
    lat: number;
    lng: number;
  };
}

type PropertyMapProps = {
  properties: PropertyWithCoordinates[];
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  height?: string;
};

/**
 * Interactive map displaying property locations with info windows
 */
const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  initialCenter = { lat: 51.5074, lng: -0.1278 }, // Default to London
  initialZoom = 11,
  height = "100%",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(
    null
  );

  // Initialize Google Maps

  useEffect(() => {
    // Skip if already initialized or no element to attach to
    if (mapInstance || !mapRef.current) return;

    // Load Google Maps script if not already loaded
    if (!window.google?.maps) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
      return;
    }

    initMap();

    function initMap() {
      if (!mapRef.current) return;

      // Create map instance
      const map = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      // Create info window
      const info = new window.google.maps.InfoWindow({
        maxWidth: 300,
      });

      setMapInstance(map);
      setInfoWindow(info);
    }

    // Cleanup
    return () => {
      if (infoWindow) {
        infoWindow.close();
      }
      for (const marker of markers) {
        marker.setMap(null);
      }
    };
  }, [initialCenter, initialZoom, infoWindow, mapInstance, markers]);

  // Update markers when properties change
  useEffect(() => {
    if (!(mapInstance && infoWindow)) return;

    // Clear existing markers
    for (const marker of markers) {
      marker.setMap(null);
    }
    const newMarkers: google.maps.Marker[] = [];

    // Skip if no properties
    if (!properties.length) {
      setMarkers([]);
      return;
    }

    // Create bounds to fit all properties
    const bounds = new window.google.maps.LatLngBounds();

    // Create markers for each property
    for (const property of properties) {
      // Skip if no coordinates
      if (!(property.coordinates?.lat && property.coordinates?.lng)) return;

      const position = {
        lat: property.coordinates.lat,
        lng: property.coordinates.lng,
      };

      // Add position to bounds
      bounds.extend(position);

      // Create marker
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstance,
        title: property.title,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3B82F6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Create info window content
      const content = `
        <div class="p-2">
          <div class="font-bold text-md mb-1">${property.title}</div>
          <div class="text-sm text-gray-600 mb-2">${property.location}</div>
          <div class="flex items-center mb-2">
            <img src="${property.media?.images[0]?.url || "/images/placeholder-property.jpg"}" 
                 alt="${property.title}" 
                 class="w-24 h-16 object-cover rounded mr-2" />
            <div>
              <div class="font-bold text-md">${property.pricing?.rent} pcm</div>
              <div class="text-sm">${property.specifications?.bedrooms} bed, ${property.specifications?.bathrooms} bath</div>
            </div>
          </div>
          <a href="/properties/${property._id}" 
             class="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            View property
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
        </div>
      `;

      // Add click event to show info window
      marker.addListener("click", () => {
        infoWindow.setContent(content);
        infoWindow.open({
          anchor: marker,
          map: mapInstance,
        });
      });

      newMarkers.push(marker);
    }

    // Fit map to bounds if we have markers
    if (newMarkers.length > 0) {
      mapInstance.fitBounds(bounds);

      // Don't zoom in too far for single properties
      const listener = window.google.maps.event.addListener(
        mapInstance,
        "idle",
        () => {
          if ((mapInstance.getZoom() as number) > 16) {
            mapInstance.setZoom(16);
          }
          window.google.maps.event.removeListener(listener);
        }
      );
    }

    setMarkers(newMarkers);
  }, [properties, mapInstance, infoWindow, markers]);

  return (
    <>
      <div
        className="rounded-lg"
        ref={mapRef}
        style={{ height, width: "100%" }}
      />
      {!window.google?.maps && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100">
          <div className="p-4 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-primary-500 border-t-2 border-b-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyMap;
