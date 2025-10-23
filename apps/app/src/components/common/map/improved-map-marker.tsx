"use client";

import mapboxgl, { type MarkerOptions } from "mapbox-gl";
import type React from "react";
import { useEffect, useRef, useCallback, useMemo } from "react";

import { useMap } from "@/contexts/map-context";
import type { LocationFeature } from "@/lib/mapbox/utils";
import { cn } from "@kaa/ui/lib/utils";

// Enhanced prop types with better TypeScript support
export interface MapMarkerProps extends Omit<MarkerOptions, "element"> {
	longitude: number;
	latitude: number;
	data?: any;
	className?: string;
	children?: React.ReactNode;
	// Event handlers with better typing
	onHover?: (event: {
		isHovered: boolean;
		position: { longitude: number; latitude: number };
		marker: mapboxgl.Marker;
		data?: any;
	}) => void;
	onClick?: (event: {
		position: { longitude: number; latitude: number };
		marker: mapboxgl.Marker;
		data?: any;
	}) => void;
	onLoad?: (marker: mapboxgl.Marker) => void;
	// Animation and styling options
	animate?: boolean;
	hoverScale?: number;
	// Accessibility
	ariaLabel?: string;
	role?: string;
}

export function ImprovedMapMarker({
	children,
	latitude,
	longitude,
	data,
	className,
	onHover,
	onClick,
	onLoad,
	animate = true,
	hoverScale = 1.1,
	ariaLabel,
	role = "button",
	...markerOptions
}: MapMarkerProps) {
	const { map } = useMap();
	const markerRef = useRef<HTMLDivElement | null>(null);
	const markerInstanceRef = useRef<mapboxgl.Marker | null>(null);
	const isHoveredRef = useRef(false);

	// Memoize position to prevent unnecessary updates
	const position = useMemo(() => ({ longitude, latitude }), [longitude, latitude]);

	// Stable event handlers
	const handleMouseEnter = useCallback(() => {
		if (isHoveredRef.current) return;
		isHoveredRef.current = true;

		if (animate && markerRef.current) {
			markerRef.current.style.transform = `scale(${hoverScale})`;
		}

		if (onHover && markerInstanceRef.current) {
			onHover({
				isHovered: true,
				position,
				marker: markerInstanceRef.current,
				data,
			});
		}
	}, [animate, hoverScale, onHover, position, data]);

	const handleMouseLeave = useCallback(() => {
		if (!isHoveredRef.current) return;
		isHoveredRef.current = false;

		if (animate && markerRef.current) {
			markerRef.current.style.transform = "scale(1)";
		}

		if (onHover && markerInstanceRef.current) {
			onHover({
				isHovered: false,
				position,
				marker: markerInstanceRef.current,
				data,
			});
		}
	}, [animate, onHover, position, data]);

	const handleClick = useCallback(
		(event: Event) => {
			event.preventDefault();
			event.stopPropagation();

			if (onClick && markerInstanceRef.current) {
				onClick({
					position,
					marker: markerInstanceRef.current,
					data,
				});
			}
		},
		[onClick, position, data]
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				handleClick(event);
			}
		},
		[handleClick]
	);

	// Setup marker
	useEffect(() => {
		const markerEl = markerRef.current;
		if (!map || !markerEl) return;

		// Create marker with options
		const marker = new mapboxgl.Marker({
			element: markerEl,
			...markerOptions,
		}).setLngLat([longitude, latitude]);

		// Add to map
		marker.addTo(map);
		markerInstanceRef.current = marker;

		// Setup event listeners
		markerEl.addEventListener("mouseenter", handleMouseEnter);
		markerEl.addEventListener("mouseleave", handleMouseLeave);
		markerEl.addEventListener("click", handleClick);
		markerEl.addEventListener("keydown", handleKeyDown);

		// Call onLoad callback
		if (onLoad) {
			onLoad(marker);
		}

		// Cleanup function
		return () => {
			// Remove event listeners
			markerEl.removeEventListener("mouseenter", handleMouseEnter);
			markerEl.removeEventListener("mouseleave", handleMouseLeave);
			markerEl.removeEventListener("click", handleClick);
			markerEl.removeEventListener("keydown", handleKeyDown);

			// Remove marker from map
			marker.remove();
			markerInstanceRef.current = null;
		};
	}, [
		map,
		longitude,
		latitude,
		markerOptions,
		handleMouseEnter,
		handleMouseLeave,
		handleClick,
		handleKeyDown,
		onLoad,
	]);

	return (
		<div
			ref={markerRef}
			className={cn(
				"cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
				animate && "transition-transform duration-200 ease-out",
				className
			)}
			tabIndex={onClick ? 0 : -1}
			role={role}
			aria-label={ariaLabel || "Map marker"}
		>
			{children}
		</div>
	);
}

export default ImprovedMapMarker;
