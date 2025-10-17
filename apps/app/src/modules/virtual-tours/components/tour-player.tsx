/**
 * Advanced Virtual Tour Player Component
 * Handles the main tour playback with all advanced features
 */

"use client";

import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@kaa/ui/components/card";
import { Button } from "@kaa/ui/components/button";
import { Badge } from "@kaa/ui/components/badge";
import { Slider } from "@kaa/ui/components/slider";
import { Switch } from "@kaa/ui/components/switch";
import { Separator } from "@kaa/ui/components/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
	Play,
	Pause,
	SkipForward,
	SkipBack,
	Volume2,
	VolumeX,
	Maximize,
	Minimize,
	RotateCw,
	Eye,
	MessageSquare,
	Users,
	Settings,
	Accessibility,
	Glasses,
	Smartphone,
	Download,
	Share,
	BarChart3,
	Zap,
	Home,
	Navigation,
	Mic,
	MicOff,
} from "lucide-react";
import { cn } from "@kaa/ui/lib/utils";
import {
	useVirtualTourActions,
	useVirtualTourState,
	useVirtualTourStore,
} from "../virtual-tour.store";
import type { VirtualTour } from "../virtual-tour.type";
import useVirtualTourIntegration from "../hooks/use-virtual-tour-integration";
import { AccessibilityService } from "../../../../lib/accessibility";

interface TourPlayerProps {
	tour: VirtualTour;
	className?: string;
	autoplay?: boolean;
	showControls?: boolean;
	enableCollaboration?: boolean;
	enableXR?: boolean;
	onSceneChange?: (sceneId: string) => void;
	onHotspotClick?: (hotspotId: string) => void;
}

export const TourPlayer: React.FC<TourPlayerProps> = ({
	tour,
	className,
	autoplay = false,
	showControls = true,
	enableCollaboration = false,
	enableXR = false,
	onSceneChange,
	onHotspotClick,
}) => {
	const playerRef = useRef<HTMLDivElement>(null);
	const [isHovering, setIsHovering] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [showChat, setShowChat] = useState(false);
	const [sessionId] = useState(() => crypto.randomUUID());

	// Store state
	// const {
	// 	currentScene,
	// 	currentView,
	// 	isPlaying,
	// 	isFullscreen,
	// 	volume,
	// 	xrMode,
	// 	showTourControls,
	// 	accessibilityEnabled,
	// 	textToSpeech,
	// 	voiceControl,
	// 	highContrast,
	// 	setCurrentScene,
	// 	setCurrentView,
	// 	setIsPlaying,
	// 	togglePlayPause,
	// 	toggleFullscreen,
	// 	nextScene,
	// 	previousScene,
	// 	adjustVolume,
	// 	setShowTourControls,
	// } = useVirtualTourState();

	const currentScene = useVirtualTourStore((state) => state.currentScene);
	const currentView = useVirtualTourStore((state) => state.currentView);
	const isPlaying = useVirtualTourStore((state) => state.isPlaying);
	const isFullscreen = useVirtualTourStore((state) => state.isFullscreen);
	const volume = useVirtualTourStore((state) => state.volume);
	const xrMode = useVirtualTourStore((state) => state.xrMode);
	const showTourControls = useVirtualTourStore((state) => state.showTourControls);
	const accessibilityEnabled = useVirtualTourStore((state) => state.accessibilityEnabled);
	const textToSpeech = useVirtualTourStore((state) => state.textToSpeech);
	const voiceControl = useVirtualTourStore((state) => state.voiceControl);
	const highContrast = useVirtualTourStore((state) => state.highContrast);
	const setCurrentScene = useVirtualTourStore((state) => state.setCurrentScene);
	const setCurrentView = useVirtualTourStore((state) => state.setCurrentView);
	const setIsPlaying = useVirtualTourStore((state) => state.setIsPlaying);
	const togglePlayPause = useVirtualTourActions().togglePlayPause;
	const toggleFullscreen = useVirtualTourActions().toggleFullscreen;
	const nextScene = useVirtualTourActions().nextScene;
	const previousScene = useVirtualTourActions().previousScene;
	const adjustVolume = useVirtualTourActions().adjustVolume;
	const setShowTourControls = useVirtualTourStore((state) => state.setShowTourControls);

	// Integration hook
	const integration = useVirtualTourIntegration(tour.id, {
		enableXR,
		enableCollaboration,
		enableAccessibility: accessibilityEnabled,
		enableMobileOptimization: true,
	});

	// Get current scene data
	const currentSceneData = tour.scenes.find((s) => s.id === currentScene) || tour.scenes[0];

	// Initialize first scene
	useEffect(() => {
		if (tour.scenes.length > 0 && !currentScene) {
			setCurrentScene(tour.scenes[0]?.id as string);
		}
	}, [tour.scenes, currentScene, setCurrentScene]);

	// Handle scene change callback
	useEffect(() => {
		if (currentScene && onSceneChange) {
			onSceneChange(currentScene);
		}
	}, [currentScene, onSceneChange]);

	// Auto-play functionality
	useEffect(() => {
		if (autoplay && tour.scenes.length > 1) {
			setIsPlaying(true);
		}
	}, [autoplay, tour.scenes.length, setIsPlaying]);

	// Auto-advance scenes when playing
	useEffect(() => {
		let interval: NodeJS.Timeout;

		if (isPlaying && tour.scenes.length > 1) {
			interval = setInterval(() => {
				nextScene();
			}, 8000); // 8 seconds per scene
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isPlaying, tour.scenes.length, nextScene]);

	// Keyboard controls
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			// Only handle if player is focused or accessibility is enabled
			if (!accessibilityEnabled && document.activeElement !== playerRef.current) return;

			switch (event.key) {
				case " ":
					event.preventDefault();
					togglePlayPause();
					break;
				case "ArrowRight":
					nextScene();
					break;
				case "ArrowLeft":
					previousScene();
					break;
				case "f":
				case "F11":
					event.preventDefault();
					toggleFullscreen();
					break;
				case "ArrowUp":
					event.preventDefault();
					adjustVolume(0.1);
					break;
				case "ArrowDown":
					event.preventDefault();
					adjustVolume(-0.1);
					break;
				case "h":
					setShowTourControls(!showTourControls);
					break;
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, [
		accessibilityEnabled,
		togglePlayPause,
		nextScene,
		previousScene,
		toggleFullscreen,
		adjustVolume,
		showTourControls,
		setShowTourControls,
	]);

	// Voice control integration
	useEffect(() => {
		if (voiceControl && integration.services.accessibility.available) {
			const handleVoiceCommand = (event: any) => {
				const { command, action } = event.detail;

				switch (action) {
					case "navigate-next":
						nextScene();
						break;
					case "navigate-previous":
						previousScene();
						break;
					case "toggle-play-pause":
						togglePlayPause();
						break;
				}

				if (textToSpeech) {
					AccessibilityService.speak(`Command executed: ${command}`);
				}
			};

			AccessibilityService.on("voice-command-processed", handleVoiceCommand);
			return () => AccessibilityService.off("voice-command-processed", handleVoiceCommand) as any;
		}
	}, [
		voiceControl,
		textToSpeech,
		nextScene,
		previousScene,
		togglePlayPause,
		integration.services.accessibility.available,
	]);

	// Handle hotspot clicks
	const handleHotspotClick = useCallback(
		(hotspotId: string) => {
			const hotspot = tour.hotspots.find((h) => h.id === hotspotId);
			if (!hotspot) return;

			// Analytics tracking would happen here
			onHotspotClick?.(hotspotId);

			// Handle hotspot action
			if (hotspot.content.action) {
				switch (hotspot.content.action.type) {
					case "navigate":
						setCurrentScene(hotspot.content.action.target);
						break;
					case "call":
						window.open(`tel:${hotspot.content.action.target}`);
						break;
					case "email":
						window.open(`mailto:${hotspot.content.action.target}`);
						break;
					case "whatsapp":
						window.open(`https://wa.me/${hotspot.content.action.target}`);
						break;
					case "external":
						window.open(hotspot.content.action.target, "_blank");
						break;
				}
			}

			// Speak hotspot content if TTS is enabled
			if (textToSpeech) {
				AccessibilityService.speak(
					`${hotspot.content.title}. ${hotspot.content.description || ""}`
				);
			}
		},
		[tour.hotspots, onHotspotClick, setCurrentScene, textToSpeech]
	);

	// Calculate progress
	const progress =
		currentScene && tour.scenes.length > 1
			? ((tour.scenes.findIndex((s) => s.id === currentScene) + 1) / tour.scenes.length) * 100
			: 0;

	return (
		<div
			ref={playerRef}
			className={cn(
				"group relative w-full overflow-hidden bg-black",
				isFullscreen ? "fixed inset-0 z-50" : "aspect-video rounded-lg",
				accessibilityEnabled && "outline-none focus-visible:ring-2 focus-visible:ring-primary",
				className
			)}
			tabIndex={accessibilityEnabled ? 0 : -1}
			role="application"
			aria-label={`Virtual tour: ${tour.title}`}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
		>
			{/* Main Scene Display */}
			<div className="absolute inset-0">
				{currentSceneData && (
					<>
						{/* Scene Media */}
						<img
							src={currentSceneData.mediaUrl}
							alt={currentSceneData.description}
							className="h-full w-full object-cover"
							draggable={false}
						/>

						{/* Hotspots */}
						{currentSceneData.hotspots.map((hotspotId) => {
							const hotspot = tour.hotspots.find((h) => h.id === hotspotId);
							if (!hotspot || !hotspot.style.visible) return null;

							return (
								<Tooltip key={hotspot.id}>
									<TooltipTrigger asChild>
										<button
											type="button"
											className={cn(
												"absolute rounded-full border-2 border-white transition-all duration-300",
												"hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-white",
												hotspot.style.animation === "pulse" && "animate-pulse",
												hotspot.style.animation === "bounce" && "animate-bounce"
											)}
											style={{
												left: `${hotspot.position.x}px`,
												top: `${hotspot.position.y}px`,
												width: `${hotspot.style.size}px`,
												height: `${hotspot.style.size}px`,
												backgroundColor: hotspot.style.color,
											}}
											onClick={() => handleHotspotClick(hotspot.id)}
											aria-label={hotspot.content.title}
										>
											<span className="sr-only">
												{hotspot.content.title}
												{hotspot.content.description && `: ${hotspot.content.description}`}
											</span>
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<div className="max-w-xs">
											<p className="font-medium">{hotspot.content.title}</p>
											{hotspot.content.description && (
												<p className="mt-1 text-muted-foreground text-sm">
													{hotspot.content.description}
												</p>
											)}
										</div>
									</TooltipContent>
								</Tooltip>
							);
						})}

						{/* Scene Connections */}
						{currentSceneData.connections.map((connection, index) => {
							const targetScene = tour.scenes.find((s) => s.id === connection.targetSceneId);
							if (!targetScene) return null;

							return (
								<Tooltip key={`${connection.targetSceneId}-${index}`}>
									<TooltipTrigger asChild>
										<button
											type="button"
											className="absolute flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-500/80 transition-all hover:scale-110 hover:bg-blue-500"
											style={{
												left: `${connection.position.x}px`,
												top: `${connection.position.y}px`,
											}}
											onClick={() => setCurrentScene(connection.targetSceneId)}
											aria-label={`Go to ${targetScene.name}`}
										>
											<Navigation className="h-4 w-4 text-white" />
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Go to {targetScene.name}</p>
									</TooltipContent>
								</Tooltip>
							);
						})}
					</>
				)}
			</div>

			{/* XR Mode Overlay */}
			{xrMode !== "none" && (
				<div className="absolute top-4 right-4 left-4">
					<Card className="border-blue-500 bg-blue-600 text-white">
						<div className="flex items-center justify-between p-3">
							<div className="flex items-center gap-2">
								{xrMode === "vr" ? (
									<Glasses className="h-5 w-5" />
								) : (
									<Smartphone className="h-5 w-5" />
								)}
								<span className="font-medium">{xrMode.toUpperCase()} Mode Active</span>
							</div>
							<Button
								size="sm"
								variant="ghost"
								onClick={integration.endXRSession}
								className="text-white hover:bg-white/20"
							>
								Exit {xrMode.toUpperCase()}
							</Button>
						</div>
					</Card>
				</div>
			)}

			{/* Loading Overlay */}
			{!currentSceneData && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/80">
					<div className="text-center text-white">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
						<p>Loading virtual tour...</p>
					</div>
				</div>
			)}

			{/* Tour Controls */}
			{showControls && showTourControls && (isHovering || isPlaying) && (
				<div className="-translate-x-1/2 absolute bottom-4 left-1/2 transform transition-opacity duration-300">
					<Card className="border-white/20 bg-black/90 backdrop-blur-sm">
						<div className="flex items-center gap-3 p-3">
							{/* Playback Controls */}
							<div className="flex items-center gap-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											onClick={previousScene}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
											disabled={tour.scenes.length <= 1}
										>
											<SkipBack className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Previous Scene</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											onClick={togglePlayPause}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
										>
											{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
										</Button>
									</TooltipTrigger>
									<TooltipContent>{isPlaying ? "Pause" : "Play"}</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											onClick={nextScene}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
											disabled={tour.scenes.length <= 1}
										>
											<SkipForward className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Next Scene</TooltipContent>
								</Tooltip>
							</div>

							<Separator orientation="vertical" className="h-6 bg-white/20" />

							{/* Progress */}
							{tour.scenes.length > 1 && (
								<div className="flex min-w-[120px] items-center gap-2">
									<span className="whitespace-nowrap text-sm text-white">
										{tour.scenes.findIndex((s) => s.id === currentScene) + 1} / {tour.scenes.length}
									</span>
									<div className="h-1 w-16 overflow-hidden rounded-full bg-white/20">
										<div
											className="h-full bg-white transition-all duration-300"
											style={{ width: `${progress}%` }}
										/>
									</div>
								</div>
							)}

							<Separator orientation="vertical" className="h-6 bg-white/20" />

							{/* Volume Control */}
							<div className="flex items-center gap-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => adjustVolume(volume > 0 ? -volume : 0.5)}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
										>
											{volume > 0 ? (
												<Volume2 className="h-4 w-4" />
											) : (
												<VolumeX className="h-4 w-4" />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent>Volume</TooltipContent>
								</Tooltip>

								<Slider
									value={[volume]}
									onValueChange={([value]) => adjustVolume(value ? value - volume : 0.5)}
									max={1}
									step={0.1}
									className="w-16"
								/>
							</div>

							<Separator orientation="vertical" className="h-6 bg-white/20" />

							{/* Advanced Features */}
							<div className="flex items-center gap-1">
								{/* XR Mode */}
								{enableXR && integration.xrCapabilities?.webxr && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														size="sm"
														variant="ghost"
														className="h-8 w-8 p-0 text-white hover:bg-white/20"
													>
														<Glasses className="h-4 w-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>XR Mode</TooltipContent>
											</Tooltip>
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuItem
												onClick={() => integration.startXRSession("vr")}
												disabled={!integration.xrCapabilities?.vr}
											>
												<Glasses className="mr-2 h-4 w-4" />
												Start VR
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => integration.startXRSession("ar")}
												disabled={!integration.xrCapabilities?.ar}
											>
												<Smartphone className="mr-2 h-4 w-4" />
												Start AR
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}

								{/* Collaboration */}
								{enableCollaboration && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => integration.startCollaboration("viewer")}
												className={cn(
													"h-8 w-8 p-0 text-white hover:bg-white/20",
													integration.services.collaboration.active && "bg-blue-500"
												)}
											>
												<Users className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{integration.services.collaboration.active
												? "Leave Collaboration"
												: "Start Collaboration"}
										</TooltipContent>
									</Tooltip>
								)}

								{/* Voice Control */}
								{accessibilityEnabled && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => integration.toggleAccessibility("voiceControl")}
												className={cn(
													"h-8 w-8 p-0 text-white hover:bg-white/20",
													voiceControl && "bg-green-500"
												)}
											>
												{voiceControl ? (
													<Mic className="h-4 w-4" />
												) : (
													<MicOff className="h-4 w-4" />
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{voiceControl ? "Disable Voice Control" : "Enable Voice Control"}
										</TooltipContent>
									</Tooltip>
								)}

								{/* Accessibility */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => integration.toggleAccessibility("highContrast")}
											className={cn(
												"h-8 w-8 p-0 text-white hover:bg-white/20",
												highContrast && "bg-yellow-500"
											)}
										>
											<Accessibility className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Accessibility Options</TooltipContent>
								</Tooltip>

								{/* Download for Offline */}
								{integration.services.mobile.available && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="sm"
												variant="ghost"
												onClick={integration.downloadForOffline}
												className="h-8 w-8 p-0 text-white hover:bg-white/20"
											>
												<Download className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Download for Offline</TooltipContent>
									</Tooltip>
								)}

								{/* Share */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => {
												navigator.share?.({
													title: tour.title,
													text: tour.description,
													url: `${window.location.origin}/tours/${tour.id}`,
												});
											}}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
										>
											<Share className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Share Tour</TooltipContent>
								</Tooltip>

								{/* Fullscreen */}
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
											onClick={toggleFullscreen}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
										>
											{isFullscreen ? (
												<Minimize className="h-4 w-4" />
											) : (
												<Maximize className="h-4 w-4" />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</TooltipContent>
								</Tooltip>
							</div>
						</div>
					</Card>
				</div>
			)}

			{/* Scene Info Panel */}
			{currentSceneData && (isHovering || isPlaying) && (
				<div className="absolute top-4 right-4 left-4 transition-opacity duration-300">
					<Card className="border-white/20 bg-black/80 backdrop-blur-sm">
						<div className="p-4">
							<h3 className="mb-1 font-medium text-lg text-white">{currentSceneData.name}</h3>
							<p className="mb-2 text-gray-300 text-sm">{currentSceneData.description}</p>

							<div className="flex items-center gap-2">
								<Badge variant="outline" className="border-white/40 bg-white/20 text-white">
									{currentSceneData.type}
								</Badge>
								{currentSceneData.position.floor && (
									<Badge variant="outline" className="border-white/40 bg-white/20 text-white">
										Floor {currentSceneData.position.floor}
									</Badge>
								)}
								{currentSceneData.position.room && (
									<Badge variant="outline" className="border-white/40 bg-white/20 text-white">
										{currentSceneData.position.room}
									</Badge>
								)}
							</div>
						</div>
					</Card>
				</div>
			)}

			{/* Real-time Features Status */}
			{integration.isInitialized && (
				<div className="absolute top-4 right-4">
					<div className="flex flex-col gap-2">
						{/* Service Status Indicators */}
						{integration.services.xr.available && (
							<Badge variant="outline" className="border-white/20 bg-black/80 text-white text-xs">
								<Glasses className="mr-1 h-3 w-3" />
								XR Ready
							</Badge>
						)}

						{integration.services.collaboration.active && (
							<Badge variant="default" className="bg-blue-600 text-white text-xs">
								<Users className="mr-1 h-3 w-3" />
								Live
							</Badge>
						)}

						{integration.services.accessibility.active && (
							<Badge variant="outline" className="border-white/20 bg-black/80 text-white text-xs">
								<Accessibility className="mr-1 h-3 w-3" />
								A11y
							</Badge>
						)}
					</div>
				</div>
			)}

			{/* Scene List (Mini-map) */}
			{tour.scenes.length > 1 && (isHovering || isPlaying) && (
				<div className="absolute right-4 bottom-20 transition-opacity duration-300">
					<Card className="border-white/20 bg-black/80 backdrop-blur-sm">
						<div className="p-2">
							<div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
								{tour.scenes.map((scene, index) => (
									<button
										type="button"
										key={scene.id}
										onClick={() => setCurrentScene(scene.id)}
										className={cn(
											"flex items-center gap-2 rounded p-2 text-left text-xs transition-colors",
											currentScene === scene.id
												? "bg-white/30 text-white"
												: "text-gray-300 hover:bg-white/20 hover:text-white"
										)}
									>
										<div className="h-6 w-8 flex-shrink-0 overflow-hidden rounded bg-gray-600">
											{scene.thumbnailUrl && (
												<img
													src={scene.thumbnailUrl}
													alt=""
													className="h-full w-full object-cover"
												/>
											)}
										</div>
										<span className="flex-1 truncate">{scene.name}</span>
										<span className="text-xs opacity-60">{index + 1}</span>
									</button>
								))}
							</div>
						</div>
					</Card>
				</div>
			)}

			{/* Accessibility Announcements Region */}
			{accessibilityEnabled && (
				<div id="tour-announcements" aria-live="polite" aria-atomic="true" className="sr-only" />
			)}
		</div>
	);
};

export default TourPlayer;
