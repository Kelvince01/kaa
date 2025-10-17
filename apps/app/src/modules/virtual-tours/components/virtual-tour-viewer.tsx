/**
 * Virtual Tour Viewer Component
 * Main component for viewing virtual tours with all advanced features
 */

"use client";

import type React from "react";
import { useEffect, useRef, useState, Suspense } from "react";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Button } from "@kaa/ui/components/button";
import { Badge } from "@kaa/ui/components/badge";
import { Progress } from "@kaa/ui/components/progress";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
	Play,
	Pause,
	Maximize,
	Minimize,
	Volume2,
	VolumeX,
	Settings,
	Users,
	Share,
	MessageCircle,
	Eye,
	Smartphone,
	Monitor,
	Headphones,
	Accessibility,
	Zap,
	Activity,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@kaa/ui/lib/utils";
import {
	useVirtualTourActions,
	useVirtualTourState,
	useVirtualTourStore,
} from "@/modules/properties";
import { useVirtualTour, useRealTimeMetrics, useServiceCapabilities } from "@/modules/properties";
import { useTrackTourView, useTrackSceneView, useStartXRSession } from "@/modules/properties";

// Import frontend services
import { WebXRService } from "@/lib/webxr";
import { MobilePWAService } from "@/lib/mobile";
import { AccessibilityService } from "@/lib/accessibility";
import { CollaborationClient } from "@/lib/collaboration";

interface VirtualTourViewerProps {
	tourId: string;
	propertyId?: string;
	autoplay?: boolean;
	showControls?: boolean;
	enableCollaboration?: boolean;
	enableXR?: boolean;
	className?: string;
}

export const VirtualTourViewer: React.FC<VirtualTourViewerProps> = ({
	tourId,
	propertyId,
	autoplay = false,
	showControls = true,
	enableCollaboration = false,
	enableXR = false,
	className,
}) => {
	const viewerRef = useRef<HTMLDivElement>(null);
	const [sessionId] = useState(() => crypto.randomUUID());
	const [viewStartTime, setViewStartTime] = useState<number>(0);

	// Store state
	// const {
	// 	currentTour,
	// 	currentScene,
	// 	currentView,
	// 	isPlaying,
	// 	isFullscreen,
	// 	volume,
	// 	xrMode,
	// 	xrSupported,
	// 	isMobile,
	// 	isOffline,
	// 	showTourControls,
	// 	accessibilityEnabled,
	// 	textToSpeech,
	// 	voiceControl,
	// 	setCurrentTour,
	// 	setCurrentScene,
	// 	setIsPlaying,
	// 	setXRSupported,
	// 	setIsMobile,
	// 	togglePlayPause,
	// 	toggleFullscreen,
	// 	nextScene,
	// 	previousScene,
	// 	adjustVolume,
	// } = useVirtualTourState();

	const currentTour = useVirtualTourStore(useShallow((state) => state.currentTour));
	const currentScene = useVirtualTourStore(useShallow((state) => state.currentScene));
	const currentView = useVirtualTourStore(useShallow((state) => state.currentView));
	const isPlaying = useVirtualTourStore(useShallow((state) => state.isPlaying));
	const isFullscreen = useVirtualTourStore(useShallow((state) => state.isFullscreen));
	const volume = useVirtualTourStore(useShallow((state) => state.volume));
	const xrMode = useVirtualTourStore(useShallow((state) => state.xrMode));
	const xrSupported = useVirtualTourStore(useShallow((state) => state.xrSupported));
	const isMobile = useVirtualTourStore(useShallow((state) => state.isMobile));
	const isOffline = useVirtualTourStore(useShallow((state) => state.isOffline));
	const showTourControls = useVirtualTourStore(useShallow((state) => state.showTourControls));
	const accessibilityEnabled = useVirtualTourStore(
		useShallow((state) => state.accessibilityEnabled)
	);
	const textToSpeech = useVirtualTourStore(useShallow((state) => state.textToSpeech));
	const voiceControl = useVirtualTourStore(useShallow((state) => state.voiceControl));
	const highContrast = useVirtualTourStore(useShallow((state) => state.highContrast));

	const setCurrentTour = useVirtualTourStore(useShallow((state) => state.setCurrentTour));
	const setCurrentScene = useVirtualTourStore(useShallow((state) => state.setCurrentScene));
	const setIsPlaying = useVirtualTourStore(useShallow((state) => state.setIsPlaying));
	const togglePlayPause = useVirtualTourActions().togglePlayPause;
	const toggleFullscreen = useVirtualTourActions().toggleFullscreen;
	const nextScene = useVirtualTourActions().nextScene;
	const previousScene = useVirtualTourActions().previousScene;
	const adjustVolume = useVirtualTourActions().adjustVolume;
	const setXRSupported = useVirtualTourStore(useShallow((state) => state.setXRSupported));
	const setIsMobile = useVirtualTourStore(useShallow((state) => state.setIsMobile));

	// Queries
	const { data: tour, isLoading, error } = useVirtualTour(tourId);
	const { data: capabilities } = useServiceCapabilities();
	const { data: realTimeMetrics } = useRealTimeMetrics(tourId);

	// Mutations
	const trackViewMutation = useTrackTourView();
	const trackSceneMutation = useTrackSceneView();
	const startXRMutation = useStartXRSession();

	// Initialize frontend services
	useEffect(() => {
		const initializeServices = async () => {
			// Detect device capabilities
			const deviceCapabilities = MobilePWAService.getDeviceCapabilities();
			setIsMobile(deviceCapabilities.deviceType === "mobile");

			// Check XR support
			const xrCapabilities = await import("@/lib/webxr").then((m) => m.getXRCapabilities());
			setXRSupported(xrCapabilities.webxr);

			// Initialize accessibility if enabled
			if (accessibilityEnabled) {
				await AccessibilityService.initialize();
			}

			// Initialize PWA features
			await MobilePWAService.initialize();
		};

		initializeServices().then((r) => null);
	}, [accessibilityEnabled, setIsMobile, setXRSupported]);

	// Set current tour when data loads
	useEffect(() => {
		if (tour && tour !== currentTour) {
			setCurrentTour(tour);
			if (tour.scenes.length > 0 && !currentScene) {
				setCurrentScene(tour.scenes[0]?.id as string);
			}
		}
	}, [tour, currentTour, currentScene, setCurrentTour, setCurrentScene]);

	// Track tour view on mount
	useEffect(() => {
		if (tour) {
			const deviceCapabilities = MobilePWAService.getDeviceCapabilities();

			trackViewMutation.mutate({
				tourId,
				metadata: {
					deviceType: deviceCapabilities.deviceType,
					location: "Kenya", // Could be detected
					sessionId,
				},
			});

			setViewStartTime(Date.now());
		}
	}, [tour, tourId, sessionId, trackViewMutation]);

	// Track scene views
	useEffect(() => {
		if (currentScene && viewStartTime > 0) {
			const timer = setTimeout(() => {
				const duration = Date.now() - viewStartTime;
				trackSceneMutation.mutate({
					tourId,
					sceneId: currentScene,
					sessionId,
					duration,
				});
			}, 5000); // Track after 5 seconds

			return () => clearTimeout(timer);
		}
	}, [currentScene, viewStartTime, tourId, sessionId, trackSceneMutation]);

	// Auto-play functionality
	useEffect(() => {
		if (autoplay && tour && tour.scenes.length > 1 && !isPlaying) {
			setIsPlaying(true);
		}
	}, [autoplay, tour, isPlaying, setIsPlaying]);

	// Auto-advance scenes when playing
	useEffect(() => {
		if (isPlaying && tour && tour.scenes.length > 1) {
			const timer = setTimeout(() => {
				nextScene();
			}, 10000); // 10 seconds per scene

			return () => clearTimeout(timer);
		}
	}, [isPlaying, currentScene, tour, nextScene]);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			if (!accessibilityEnabled) return;

			switch (event.key) {
				case "ArrowRight":
					nextScene();
					break;
				case "ArrowLeft":
					previousScene();
					break;
				case " ":
					event.preventDefault();
					togglePlayPause();
					break;
				case "f":
				case "F11":
					event.preventDefault();
					toggleFullscreen();
					break;
				case "ArrowUp":
					adjustVolume(0.1);
					break;
				case "ArrowDown":
					adjustVolume(-0.1);
					break;
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, [
		accessibilityEnabled,
		nextScene,
		previousScene,
		togglePlayPause,
		toggleFullscreen,
		adjustVolume,
	]);

	// Voice control integration
	useEffect(() => {
		if (voiceControl) {
			AccessibilityService.initializeVoiceControl().then((r) => null);

			const handleVoiceCommand = (event: any) => {
				const { command } = event.detail;
				switch (command) {
					case "next scene":
						nextScene();
						break;
					case "previous scene":
						previousScene();
						break;
					case "play tour":
						setIsPlaying(true);
						break;
					case "pause tour":
						setIsPlaying(false);
						break;
				}
			};

			AccessibilityService.on("voice-command-processed", handleVoiceCommand);
			return () => AccessibilityService.off("voice-command-processed", handleVoiceCommand) as any;
		}
	}, [voiceControl, nextScene, previousScene, setIsPlaying]);

	// XR session handling
	const handleStartXR = async (mode: "vr" | "ar") => {
		if (!xrSupported) {
			alert("XR not supported on this device");
			return;
		}

		try {
			// Start XR session on backend
			await startXRMutation.mutateAsync({
				tourId,
				mode,
				settings: {
					webxr: {
						enabled: true,
						handTracking: true,
						spatialAudio: true,
					},
				},
			});

			// Start XR session on frontend
			await WebXRService.startXRSession(mode, {
				webxr: {
					enabled: true,
					supportedDevices: [mode],
					handTracking: true,
					eyeTracking: false,
					spatialMapping: true,
					roomScale: false,
				},
				hapticFeedback: {
					enabled: true,
					intensity: 0.5,
					patterns: [],
				},
				spatialAudio: {
					enabled: true,
					ambientSounds: [],
					positionalAudio: true,
				},
				multiUser: {
					enabled: false,
					maxParticipants: 1,
					voiceChat: false,
					avatars: false,
				},
			});
		} catch (error) {
			console.error("XR session start failed:", error);
		}
	};

	if (isLoading) {
		return <VirtualTourViewerSkeleton />;
	}

	if (error || !tour) {
		return (
			<Card className={cn("flex h-96 w-full items-center justify-center", className)}>
				<CardContent>
					<p className="text-muted-foreground">
						{error ? "Failed to load virtual tour" : "Virtual tour not found"}
					</p>
				</CardContent>
			</Card>
		);
	}

	const currentSceneData = tour.scenes.find((s: { id: string | null }) => s.id === currentScene);
	const progress =
		currentScene && tour.scenes.length > 1
			? ((tour.scenes.findIndex((s: { id: string }) => s.id === currentScene) + 1) /
					tour.scenes.length) *
				100
			: 0;

	return (
		<Card className={cn("relative w-full overflow-hidden bg-black", className)}>
			{/* Tour Viewer Container */}
			<div
				ref={viewerRef}
				className={cn(
					"relative h-96 w-full overflow-hidden bg-gray-900",
					isFullscreen && "fixed inset-0 z-50 h-screen",
					accessibilityEnabled && "focus-visible:ring-2 focus-visible:ring-primary"
				)}
				tabIndex={accessibilityEnabled ? 0 : -1}
				role="application"
				aria-label={`Virtual tour: ${tour.title}`}
			>
				{/* Main Scene Display */}
				<div className="absolute inset-0 flex items-center justify-center">
					{currentSceneData ? (
						<>
							{/* Scene Image/Video */}
							<img
								src={currentSceneData.mediaUrl}
								alt={currentSceneData.description}
								className="h-full w-full object-cover"
								onLoad={() => {
									// Scene loaded - could trigger analytics
								}}
							/>

							{/* Hotspots Overlay */}
							{currentSceneData?.hotspots?.map((hotspotId: any) => {
								const hotspot = tour.hotspots.find((h: { id: any }) => h.id === hotspotId);
								if (!hotspot) return null;

								return (
									<button
										type="button"
										key={hotspot.id}
										className={cn(
											"absolute h-6 w-6 rounded-full border-2 border-white",
											"bg-blue-500 transition-colors hover:bg-blue-600",
											"animate-pulse hover:animate-none",
											"focus:outline-none focus:ring-2 focus:ring-white"
										)}
										style={{
											left: `${hotspot.position.x}px`,
											top: `${hotspot.position.y}px`,
										}}
										onClick={() => {
											// Handle hotspot click
											console.log("Hotspot clicked:", hotspot.content.title);
										}}
										aria-label={hotspot.content.title}
									>
										<span className="sr-only">{hotspot.content.title}</span>
									</button>
								);
							})}
						</>
					) : (
						<div className="text-center text-white">
							<p>No scene selected</p>
						</div>
					)}
				</div>

				{/* Loading Overlay */}
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/50">
						<div className="text-center text-white">
							<div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
							<p>Loading tour...</p>
						</div>
					</div>
				)}

				{/* XR Mode Indicator */}
				{xrMode !== "none" && (
					<div className="absolute top-4 left-4 rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
						{xrMode.toUpperCase()} Mode Active
					</div>
				)}

				{/* Tour Controls */}
				{showControls && showTourControls && (
					<div className="-translate-x-1/2 absolute bottom-4 left-1/2 transform">
						<div className="flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 backdrop-blur-sm">
							{/* Play/Pause */}
							<Button
								size="sm"
								variant="ghost"
								onClick={togglePlayPause}
								className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
								aria-label={isPlaying ? "Pause tour" : "Play tour"}
							>
								{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
							</Button>

							{/* Scene Navigation */}
							<Button
								size="sm"
								variant="ghost"
								onClick={previousScene}
								className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
								aria-label="Previous scene"
							>
								◀
							</Button>

							{/* Progress */}
							{tour.scenes.length > 1 && (
								<div className="flex items-center gap-2 px-2">
									<span className="text-sm text-white">
										{tour.scenes.findIndex((s: { id: string | null }) => s.id === currentScene) + 1}{" "}
										/ {tour.scenes.length}
									</span>
									<Progress value={progress} className="h-1 w-20" />
								</div>
							)}

							<Button
								size="sm"
								variant="ghost"
								onClick={nextScene}
								className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
								aria-label="Next scene"
							>
								▶
							</Button>

							{/* Volume */}
							<Button
								size="sm"
								variant="ghost"
								onClick={() => adjustVolume(volume > 0 ? -volume : 0.5)}
								className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
								aria-label={volume > 0 ? "Mute" : "Unmute"}
							>
								{volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
							</Button>

							{/* Fullscreen */}
							<Button
								size="sm"
								variant="ghost"
								onClick={toggleFullscreen}
								className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
								aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
							>
								{isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
							</Button>
						</div>
					</div>
				)}

				{/* Advanced Features Panel */}
				{capabilities?.features && (
					<div className="absolute top-4 right-4">
						<div className="rounded-lg bg-black/80 p-3 backdrop-blur-sm">
							<div className="flex flex-col gap-2">
								{/* XR Buttons */}
								{enableXR && xrSupported && (
									<div className="flex gap-1">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleStartXR("vr")}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
											aria-label="Start VR"
										>
											🥽
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleStartXR("ar")}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
											aria-label="Start AR"
										>
											📱
										</Button>
									</div>
								)}

								{/* Collaboration */}
								{enableCollaboration && capabilities.features.realTimeCollaboration && (
									<Button
										size="sm"
										variant="ghost"
										className="h-8 w-8 p-0 text-white hover:bg-white/20"
										aria-label="Start collaboration"
									>
										<Users className="h-4 w-4" />
									</Button>
								)}

								{/* Accessibility */}
								{capabilities.features.accessibility && (
									<Button
										size="sm"
										variant="ghost"
										className="h-8 w-8 p-0 text-white hover:bg-white/20"
										aria-label="Accessibility options"
									>
										<Accessibility className="h-4 w-4" />
									</Button>
								)}

								{/* Share */}
								<Button
									size="sm"
									variant="ghost"
									className="h-8 w-8 p-0 text-white hover:bg-white/20"
									aria-label="Share tour"
								>
									<Share className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Scene Information */}
				{currentSceneData && (
					<div className="absolute right-4 bottom-20 left-4">
						<Card className="border-white/20 bg-black/80 backdrop-blur-sm">
							<CardContent className="p-4">
								<h3 className="mb-1 font-semibold text-lg text-white">{currentSceneData.name}</h3>
								<p className="text-gray-300 text-sm">{currentSceneData.description}</p>

								{/* Scene Tags */}
								<div className="mt-2 flex gap-2">
									<Badge variant="secondary" className="bg-white/20 text-white">
										{currentSceneData.type}
									</Badge>
									{currentSceneData?.position?.floor && (
										<Badge variant="secondary" className="bg-white/20 text-white">
											Floor {currentSceneData.position.floor}
										</Badge>
									)}
									{currentSceneData?.position?.room && (
										<Badge variant="secondary" className="bg-white/20 text-white">
											{currentSceneData.position.room}
										</Badge>
									)}
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Real-time Metrics (for admins) */}
				{realTimeMetrics && (
					<div className="absolute top-4 left-4">
						<Card className="border-white/20 bg-black/80 backdrop-blur-sm">
							<CardContent className="p-2">
								<div className="flex items-center gap-2 text-white text-xs">
									<Eye className="h-3 w-3" />
									<span>{realTimeMetrics.realTimeMetrics?.activeViewers || 0}</span>
									<Activity className="ml-2 h-3 w-3" />
									<span>
										{Math.round(
											(realTimeMetrics.realTimeMetrics?.currentEngagementRate || 0) * 100
										)}
										%
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Offline Indicator */}
				{isOffline && (
					<div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 transform">
						<Card className="bg-orange-600 text-white">
							<CardContent className="p-4 text-center">
								<h3 className="mb-2 font-semibold">Offline Mode</h3>
								<p className="text-sm">You're viewing a cached version of this tour</p>
							</CardContent>
						</Card>
					</div>
				)}
			</div>

			{/* Tour Metadata */}
			<CardContent className="bg-white p-4">
				<div className="flex items-start justify-between">
					<div>
						<h2 className="mb-2 font-semibold text-xl">{tour.title}</h2>
						<p className="mb-3 text-muted-foreground">{tour.description}</p>

						{/* Tour Stats */}
						<div className="flex gap-4 text-muted-foreground text-sm">
							<span>👁 {tour.analytics.totalViews} views</span>
							<span>⏱ {Math.round(tour.analytics.averageDuration / 60000)}min avg</span>
							<span>📱 {tour.scenes.length} scenes</span>
							<span>📍 {tour.metadata.county}</span>
						</div>
					</div>

					{/* Tour Status */}
					<div className="flex flex-col items-end gap-2">
						<Badge
							variant={
								tour.status === "published"
									? "default"
									: tour.status === "processing"
										? "secondary"
										: tour.status === "draft"
											? "outline"
											: "destructive"
							}
						>
							{tour.status}
						</Badge>

						{/* Device Optimization Indicators */}
						<div className="flex gap-1">
							{isMobile && (
								<Badge variant="outline" className="text-xs">
									<Smartphone className="mr-1 h-3 w-3" />
									Mobile Optimized
								</Badge>
							)}
							{capabilities?.features.accessibility && (
								<Badge variant="outline" className="text-xs">
									<Accessibility className="mr-1 h-3 w-3" />
									Accessible
								</Badge>
							)}
							{capabilities?.features.edgeComputing && (
								<Badge variant="outline" className="text-xs">
									<Zap className="mr-1 h-3 w-3" />
									Edge Optimized
								</Badge>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

// Loading skeleton
const VirtualTourViewerSkeleton: React.FC = () => {
	return (
		<Card className="w-full">
			<div className="relative h-96 w-full bg-gray-100">
				<Skeleton className="h-full w-full" />

				{/* Control skeleton */}
				<div className="-translate-x-1/2 absolute bottom-4 left-1/2 transform">
					<div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2">
						<Skeleton className="h-6 w-6 rounded-full" />
						<Skeleton className="h-6 w-6 rounded-full" />
						<Skeleton className="h-2 w-20" />
						<Skeleton className="h-6 w-6 rounded-full" />
						<Skeleton className="h-6 w-6 rounded-full" />
						<Skeleton className="h-6 w-6 rounded-full" />
					</div>
				</div>
			</div>

			<CardContent className="p-4">
				<Skeleton className="mb-2 h-6 w-3/4" />
				<Skeleton className="mb-3 h-4 w-full" />
				<div className="flex gap-4">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-4 w-20" />
				</div>
			</CardContent>
		</Card>
	);
};

export default VirtualTourViewer;
