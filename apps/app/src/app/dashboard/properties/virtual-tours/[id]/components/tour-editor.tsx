/**
 * Tour Editor Component
 * Advanced editor with AI assistance and real-time collaboration
 */

"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import { Separator } from "@kaa/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  Camera,
  Edit,
  Eye,
  MapPin,
  MoreVertical,
  Navigation,
  Plus,
  Settings,
  Trash2,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  useAddHotspot,
  useAddScene,
  useGenerateSmartConnections,
  useUploadMedia,
  useVirtualTour,
} from "@/modules/virtual-tours";
import { useVirtualTourState } from "@/modules/virtual-tours/virtual-tour.store";

type TourEditorProps = {
  tourId: string;
  propertyId?: string;
};

export const TourEditor: React.FC<TourEditorProps> = ({ tourId }) => {
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [showAddScene, setShowAddScene] = useState(false);
  const [showAddHotspot, setShowAddHotspot] = useState(false);
  const [draggedHotspot, setDraggedHotspot] = useState<any>(null);

  // Queries
  const { data: tour, isLoading } = useVirtualTour(tourId);

  // Mutations
  const generateConnectionsMutation = useGenerateSmartConnections();
  const addSceneMutation = useAddScene();
  const addHotspotMutation = useAddHotspot();
  const uploadMediaMutation = useUploadMedia();

  // Store state
  const { currentScene, setCurrentScene, aiSuggestions, setAISuggestions } =
    useVirtualTourState();

  // Set current scene when tour loads
  useEffect(() => {
    if (tour && tour.scenes.length > 0 && !currentScene) {
      setCurrentScene(tour.scenes[0]?.id as string);
      setSelectedScene(tour.scenes[0]?.id as string);
    }
  }, [tour, currentScene, setCurrentScene]);

  const currentSceneData = tour?.scenes.find((s) => s.id === selectedScene);

  const handleGenerateConnections = () => {
    generateConnectionsMutation.mutate(tourId, {
      onSuccess: (data) => {
        setAISuggestions([
          ...aiSuggestions,
          {
            type: "connections",
            suggestions: data.connections,
            applied: data.applied,
          },
        ]);
      },
    });
  };

  const handleFileUpload = async (file: File, sceneId?: string) => {
    await uploadMediaMutation.mutateAsync({
      tourId,
      file,
      sceneId,
      metadata: { source: "editor" },
    });
  };

  if (isLoading || !tour) {
    return <TourEditorSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* AI Assistant Bar */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wand2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-700">AI Assistant</p>
                <p className="text-blue-600 text-sm">
                  Get intelligent suggestions for your tour
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                disabled={generateConnectionsMutation.isPending}
                onClick={handleGenerateConnections}
                size="sm"
                variant="outline"
              >
                {generateConnectionsMutation.isPending ? (
                  <>
                    <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-1 h-4 w-4" />
                    Smart Connect
                  </>
                )}
              </Button>

              <Button size="sm" variant="outline">
                <Wand2 className="mr-1 h-4 w-4" />
                Suggest Hotspots
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Editor Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Scene List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Scenes</CardTitle>
              <Button onClick={() => setShowAddScene(true)} size="sm">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 px-4 pb-4">
              {tour.scenes.map((scene, index) => (
                <div
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors",
                    selectedScene === scene.id
                      ? "border border-primary/20 bg-primary/10"
                      : "hover:bg-muted/50"
                  )}
                  key={scene.id}
                  onClick={() => {
                    setSelectedScene(scene.id);
                    setCurrentScene(scene.id);
                  }}
                >
                  <div className="h-8 w-12 shrink-0 overflow-hidden rounded bg-gray-100">
                    {scene.thumbnailUrl ? (
                      // biome-ignore lint/nursery/useImageSize: ignore
                      // biome-ignore lint/performance/noImgElement: ignore
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={scene.thumbnailUrl}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{scene.name}</p>
                    <p className="text-muted-foreground text-xs">
                      Scene {index + 1} • {scene.hotspots.length} hotspots
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Editing Area */}
        <div className="space-y-4 lg:col-span-2">
          {/* Scene Editor */}
          {currentSceneData ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {currentSceneData.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs" variant="outline">
                      {currentSceneData.type}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Scene Preview */}
                <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100">
                  {currentSceneData.mediaUrl ? (
                    // biome-ignore lint/nursery/useImageSize: ignore
                    // biome-ignore lint/performance/noImgElement: ignore
                    <img
                      alt={currentSceneData.description}
                      className="h-full w-full object-cover"
                      src={currentSceneData.mediaUrl}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center">
                        <Upload className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">
                          Upload scene media
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hotspot Overlay */}
                  {currentSceneData.hotspots.map((hotspotId) => {
                    const hotspot = tour.hotspots.find(
                      (h) => h.id === hotspotId
                    );
                    if (!hotspot) return null;

                    return (
                      <div
                        className={cn(
                          "absolute cursor-pointer rounded-full border-2 border-white transition-all",
                          "hover:scale-110",
                          selectedHotspot === hotspot.id
                            ? "ring-2 ring-primary"
                            : ""
                        )}
                        key={hotspot.id}
                        onClick={() => setSelectedHotspot(hotspot.id)}
                        style={{
                          left: `${hotspot.position.x}px`,
                          top: `${hotspot.position.y}px`,
                          width: `${hotspot.style.size}px`,
                          height: `${hotspot.style.size}px`,
                          backgroundColor: hotspot.style.color,
                        }}
                      >
                        <span className="sr-only">{hotspot.content.title}</span>
                      </div>
                    );
                  })}

                  {/* Add Hotspot Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity hover:opacity-100">
                    <Button
                      className="bg-white/90 text-black hover:bg-white"
                      onClick={() => setShowAddHotspot(true)}
                      size="sm"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add Hotspot
                    </Button>
                  </div>
                </div>

                {/* Scene Info */}
                <div className="space-y-3">
                  <div>
                    <label className="font-medium text-sm" htmlFor="scene-name">
                      Scene Name
                    </label>
                    <Input
                      className="mt-1"
                      placeholder="Enter scene name"
                      value={currentSceneData.name}
                    />
                  </div>

                  <div>
                    <label
                      className="font-medium text-sm"
                      htmlFor="scene-description"
                    >
                      Description
                    </label>
                    <Textarea
                      className="mt-1"
                      placeholder="Describe this scene"
                      rows={3}
                      value={currentSceneData.description}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Wand2 className="mr-1 h-3 w-3" />
                      AI Enhance
                    </Button>
                    <Button size="sm" variant="outline">
                      <MapPin className="mr-1 h-3 w-3" />
                      Add Hotspot
                    </Button>
                    <Button size="sm" variant="outline">
                      <Upload className="mr-1 h-3 w-3" />
                      Replace Media
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Camera className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 font-semibold">No Scene Selected</h3>
                <p className="text-muted-foreground">
                  Select a scene from the left panel to start editing
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Properties Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="scene" orientation="horizontal">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scene">Scene</TabsTrigger>
                <TabsTrigger value="hotspot">Hotspot</TabsTrigger>
              </TabsList>

              <TabsContent className="mt-4 space-y-4" value="scene">
                {selectedScene ? (
                  <div className="space-y-3">
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-xs"
                        htmlFor="scene-type"
                      >
                        SCENE TYPE
                      </label>
                      <p className="font-medium text-sm">
                        {currentSceneData?.type || "Unknown"}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <label
                        className="font-medium text-muted-foreground text-xs"
                        htmlFor="scene-position"
                      >
                        POSITION
                      </label>
                      <div className="mt-1 space-y-2">
                        {currentSceneData?.position.floor && (
                          <p className="text-sm">
                            Floor: {currentSceneData.position.floor}
                          </p>
                        )}
                        {currentSceneData?.position.room && (
                          <p className="text-sm">
                            Room: {currentSceneData.position.room}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <label
                        className="font-medium text-muted-foreground text-xs"
                        htmlFor="scene-connections"
                      >
                        CONNECTIONS
                      </label>
                      <p className="text-muted-foreground text-sm">
                        {currentSceneData?.connections.length || 0} connections
                      </p>
                      <Button
                        className="mt-2 w-full"
                        size="sm"
                        variant="outline"
                      >
                        <Navigation className="mr-1 h-3 w-3" />
                        Manage Connections
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <label
                        className="font-medium text-muted-foreground text-xs"
                        htmlFor="scene-hotspots"
                      >
                        HOTSPOTS
                      </label>
                      <p className="text-muted-foreground text-sm">
                        {currentSceneData?.hotspots.length || 0} hotspots
                      </p>
                      <Button
                        className="mt-2 w-full"
                        onClick={() => setShowAddHotspot(true)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Hotspot
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Eye className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Select a scene to view properties
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent className="mt-4 space-y-4" value="hotspot">
                {selectedHotspot ? (
                  <div className="space-y-3">
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-xs"
                        htmlFor="hotspot-type"
                      >
                        HOTSPOT TYPE
                      </label>
                      <p className="font-medium text-sm">Info Hotspot</p>
                    </div>

                    <Separator />

                    <div>
                      <label
                        className="font-medium text-muted-foreground text-xs"
                        htmlFor="hotspot-title"
                      >
                        TITLE
                      </label>
                      <Input className="mt-1" placeholder="Hotspot title" />
                    </div>

                    <div>
                      <label
                        className="font-medium text-muted-foreground text-xs"
                        htmlFor="hotspot-description"
                      >
                        DESCRIPTION
                      </label>
                      <Textarea
                        className="mt-1"
                        placeholder="Hotspot description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label
                        className="font-medium text-muted-foreground text-xs"
                        htmlFor="hotspot-style"
                      >
                        STYLE
                      </label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs" htmlFor="hotspot-color">
                            Color
                          </label>
                          <div className="mt-1 h-8 w-full rounded border bg-blue-500" />
                        </div>
                        <div>
                          <label className="text-xs" htmlFor="hotspot-size">
                            Size
                          </label>
                          <Input
                            className="mt-1"
                            defaultValue="20"
                            type="number"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Select a hotspot to edit properties
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      {aiSuggestions.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-green-700">
              <Wand2 className="h-4 w-4" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <div
                  className="rounded-lg border border-green-200 p-3"
                  key={index.toString()}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-green-700 text-sm">
                        {suggestion.type === "connections"
                          ? "Smart Scene Connections"
                          : "AI Suggestion"}
                      </p>
                      <p className="mt-1 text-green-600 text-sm">
                        {suggestion.type === "connections"
                          ? `Generated ${suggestion.applied} intelligent connections between scenes`
                          : suggestion.description || "AI-generated suggestion"}
                      </p>
                    </div>
                    <Badge className="text-xs" variant="outline">
                      {Math.round((suggestion.confidence || 0.8) * 100)}%
                      confidence
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Scene Dialog */}
      <Dialog onOpenChange={setShowAddScene} open={showAddScene}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Scene</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-medium text-sm" htmlFor="scene-name">
                Scene Name
              </label>
              <Input className="mt-1" placeholder="Enter scene name" />
            </div>
            <div>
              <label
                className="font-medium text-sm"
                htmlFor="scene-description"
              >
                Description
              </label>
              <Textarea
                className="mt-1"
                placeholder="Describe this scene"
                rows={3}
              />
            </div>
            <div>
              <label
                className="font-medium text-sm"
                htmlFor="scene-upload-media"
              >
                Upload Media
              </label>
              <div className="mt-1 rounded-lg border-2 border-muted-foreground/25 border-dashed p-6 text-center">
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Drop your 360° photo/video here or click to browse
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowAddScene(false)} variant="outline">
                Cancel
              </Button>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Add Scene
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Hotspot Dialog */}
      <Dialog onOpenChange={setShowAddHotspot} open={showAddHotspot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hotspot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-medium text-sm" htmlFor="hotspot-type">
                Hotspot Type
              </label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {["Info", "Navigation", "Media", "Contact"].map((type) => (
                  <Button key={type} size="sm" variant="outline">
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-medium text-sm" htmlFor="hotspot-title">
                Title
              </label>
              <Input className="mt-1" placeholder="Hotspot title" />
            </div>
            <div>
              <label
                className="font-medium text-sm"
                htmlFor="hotspot-description"
              >
                Description
              </label>
              <Textarea
                className="mt-1"
                placeholder="Hotspot description"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowAddHotspot(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Add Hotspot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TourEditorSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Card>
      <CardContent className="p-4">
        <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              className="h-16 w-full animate-pulse rounded bg-gray-200"
              key={i.toString()}
            />
          ))}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 aspect-video animate-pulse rounded bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
              <div className="h-20 w-full animate-pulse rounded bg-gray-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export default TourEditor;
