import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { TextEditorDialog, type TextFormatting } from "@/components/TextEditorDialog";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { WallToolsMenu } from "@/components/WallToolsMenu";
import {
  ArrowLeft,
  Save,
  Share2,
  Plus,
  Upload,
  Trash2,
  Settings,
  Eye,
  Layers,
  Move3D,
  Grid3X3,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { VisionRoom } from "@/components/VisionRoom";
import {
  VisionCanvas,
  type VisionCanvasObject,
} from "@/components/toolbar/VisionCanvas";
import { VisionToolbar } from "@/components/toolbar/VisionToolbar";
import { ObjectUploader } from "@/components/ObjectUploader";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useCollaboration } from "@/hooks/useCollaboration";
import {
  PresenceAvatars,
  CollaboratorCursors,
  ConnectionStatus,
} from "@/components/CollaboratorCursors";
import type { VisionBoard, Asset, AssetMetadata } from "@shared/schema";

// In future, load/save VisionObjects here and pass into VisionRoom
export default function BoardEditor() {
  const [, params] = useRoute("/boards/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const boardId = params?.id;
  const isNew = boardId === "new";
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [selectedWall, setSelectedWall] = useState<{
    name: string;
    position: { x: number; y: number; z: number };
  } | null>(null);
  const [showWallMenu, setShowWallMenu] = useState(false);

  const numericBoardId = !isNew && boardId ? parseInt(boardId, 10) : 0;

  const {
    collaborators,
    connected,
    sendCursorPosition,
    sendAssetUpdate,
    onMessage,
  } = useCollaboration({
    boardId: numericBoardId,
    userId: user?.id || "",
    userName:
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.email || "Anonymous",
    userAvatar: user?.profileImageUrl || null,
    enabled: !isNew && !!user?.id,
  });

  useEffect(() => {
    const unsubscribe = onMessage((type, payload) => {
      if (
        type === "asset_update" ||
        type === "asset_create" ||
        type === "asset_delete"
      ) {
        queryClient.invalidateQueries({
          queryKey: ["/api/boards", boardId, "assets"],
        });
      }
    });
    return unsubscribe;
  }, [onMessage, boardId]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editorContainerRef.current || !connected) return;
      const rect = editorContainerRef.current.getBoundingClientRect();
      sendCursorPosition(e.clientX - rect.left, e.clientY - rect.top);
    },
    [connected, sendCursorPosition]
  );

  const { data: board, isLoading: boardLoading } = useQuery<VisionBoard>({
    queryKey: ["/api/boards", boardId],
    enabled: !isNew && !!boardId,
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/boards", boardId, "assets"],
    enabled: !isNew && !!boardId,
  });

  const { data: objects = [], isLoading: objectsLoading } = useQuery<
    VisionCanvasObject[]
  >({
    queryKey: ["/api/boards", boardId, "objects"],
    enabled: !isNew && !!boardId,
  });

  useEffect(() => {
    if (board) {
      setTitle(board.title);
      setDescription(board.description || "");
      setVisibility(board.visibility);
    }
  }, [board]);

  const createBoardMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      visibility: string;
    }) => {
      const response = await apiRequest("POST", "/api/boards", data);
      return response.json();
    },
    onSuccess: (data: { id: number }) => {
      toast({ title: "Board created!" });
      navigate(`/boards/${data.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/boards"] });
    },
    onError: () => {
      toast({ title: "Failed to create board", variant: "destructive" });
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      visibility: string;
    }) => {
      return apiRequest("PATCH", `/api/boards/${boardId}`, data);
    },
    onSuccess: () => {
      toast({ title: "Board saved!" });
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId] });
    },
    onError: () => {
      toast({ title: "Failed to save board", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const data = { title, description, visibility };
    if (isNew) {
      createBoardMutation.mutate(data);
    } else {
      updateBoardMutation.mutate(data);
    }
  };

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const selectedMetadata = (selectedAsset?.metadata as AssetMetadata) || {};

  if (boardLoading && !isNew) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 p-3 border-b bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/boards")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Board Title"
            className="text-lg font-semibold border-none bg-transparent focus-visible:ring-0 max-w-xs"
            data-testid="input-board-title"
          />
          <Badge variant="secondary">
            {visibility === "private"
              ? "Private"
              : visibility === "public"
              ? "Public"
              : "Unlisted"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <div className="flex items-center gap-3 mr-2">
              {collaborators.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{collaborators.length + 1}</span>
                  </div>
                  <PresenceAvatars collaborators={collaborators} />
                </>
              )}
              <ConnectionStatus connected={connected} />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLeftPanel(!showLeftPanel)}
          >
            <Layers className="h-5 w-5" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Board Settings</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your vision board..."
                    className="resize-none"
                    data-testid="input-board-description"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Visibility
                  </label>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger data-testid="select-board-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="icon" data-testid="button-share">
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              createBoardMutation.isPending ||
              updateBoardMutation.isPending ||
              title.trim().length === 0
            }
            data-testid="button-save-board"
            title={title.trim().length === 0 ? "Enter a title to save" : undefined}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Assets */}
        <AnimatePresence>
          {showLeftPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r bg-sidebar overflow-hidden"
            >
              <div className="p-4 space-y-4 h-full overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Assets</h3>
                  <ObjectUploader
                    onGetUploadParameters={async () => {
                      const response = await apiRequest(
                        "POST",
                        "/api/objects/upload"
                      );
                      const data = (await response.json()) as {
                        uploadURL: string;
                      };
                      return { method: "PUT" as const, url: data.uploadURL };
                    }}
                    onComplete={(result) => {
                      console.log("Upload complete:", result);
                      // Will add asset to board
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </ObjectUploader>
                </div>

                {assetsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                  </div>
                ) : assets.length > 0 ? (
                  <div className="space-y-2">
                    {assets.map((asset) => (
                      <motion.div
                        key={asset.id}
                        className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedAssetId === asset.id
                            ? "border-primary"
                            : "border-transparent hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedAssetId(asset.id)}
                        whileHover={{ scale: 1.02 }}
                      >
                        <img
                          src={asset.url}
                          alt={asset.altText || "Asset"}
                          className="w-full h-20 object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Upload images to add to your vision room
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Canvas + 2D Overlay */}
        <div
          ref={editorContainerRef}
          className="flex-1 relative"
          onMouseMove={handleMouseMove}
          data-testid="editor-canvas-container"
        >
          <VisionRoom
            assets={assets}
            selectedAssetId={selectedAssetId}
            onAssetClick={(asset) => {
              setSelectedAssetId(asset.id);
              setShowWallMenu(false); // Close wall menu when clicking asset
            }}
            onWallClick={(wallName, position) => {
              // When user clicks a wall, show tools for that wall
              setSelectedWall({ name: wallName, position });
              setShowWallMenu(true);
              setSelectedAssetId(null); // Deselect any selected asset
            }}
            onAssetEdit={(asset) => {
              // Double click to edit - open text editor with existing data
              if (asset.type === "text" || asset.type === "note") {
                const meta = asset.metadata as any;
                setEditingAsset({
                  id: asset.id,
                  type: asset.type,
                  position: meta.position,
                  existingData: {
                    text: meta.text || "",
                    fontSize: meta.fontSize || (asset.type === "note" ? 16 : 32),
                    fontFamily: meta.fontFamily || (asset.type === "note" ? "monospace" : "sans-serif"),
                    color: meta.color || (asset.type === "note" ? "#000000" : "#ffffff"),
                    backgroundColor: meta.backgroundColor || (asset.type === "note" ? "#fef08a" : "rgba(31, 41, 55, 0.9)"),
                    bold: meta.bold || false,
                    italic: meta.italic || false,
                    underline: meta.underline || false,
                    alignment: meta.alignment || "left",
                  }
                });
                setShowTextEditor(true);
              }
            }}
            onAssetMove={async (assetId, position) => {
              // Update asset position when dragged
              try {
                const asset = assets.find(a => a.id === assetId);
                if (!asset) return;

                const currentMetadata = asset.metadata as any || {};
                const updatedMetadata = {
                  ...currentMetadata,
                  position: { x: position.x, y: position.y, z: position.z }
                };

                await apiRequest("PATCH", `/api/assets/${assetId}`, {
                  metadata: updatedMetadata
                });

                queryClient.invalidateQueries({
                  queryKey: ["/api/boards", boardId, "assets"],
                });
              } catch (error) {
                console.error("Error updating asset position:", error);
              }
            }}
          />
          {/* 2D Vision Objects Canvas */}
          {!objectsLoading && objects.length > 0 && (
            <VisionCanvas
              objects={objects}
              selectedId={null}
              onSelect={() => {}}
              onDeselect={() => {}}
              onChange={(id, updates) => {
                // Optimistic update and persist
                queryClient.setQueryData<VisionCanvasObject[]>(
                  ["/api/boards", boardId, "objects"],
                  (prev) =>
                    (prev || []).map((o) =>
                      o.id === id ? { ...o, ...updates } : o
                    )
                );
                apiRequest("PATCH", `/api/objects/${id}`, updates);
              }}
            />
          )}
          {/* Toolbar */}
          <div className="absolute top-4 right-4 z-20 rounded-md border bg-background/90">
            <VisionToolbar
              activeTool={activeTool}
              onAction={async (action) => {
                if (isNew || !numericBoardId) {
                  toast({
                    title: "Save the board first",
                    description:
                      "Create and save the board before adding objects.",
                  });
                  return;
                }

                // Handle different toolbar actions
                try {
                  if (action === "draw") {
                    // Open drawing canvas
                    setShowDrawingCanvas(true);
                    setActiveTool("draw");
                  } else if (action === "note") {
                    // Open text editor for sticky note
                    setEditingAsset({
                      type: "note",
                      position: {
                        x: (Math.random() - 0.5) * 8,
                        y: 2 + Math.random() * 4,
                        z: -9.8
                      }
                    });
                    setShowTextEditor(true);
                  } else if (action === "pin") {
                    // Create a pin marker
                    const randomX = (Math.random() - 0.5) * 8;
                    const randomY = 2 + Math.random() * 4;
                    const response = await apiRequest(
                      "POST",
                      `/api/boards/${numericBoardId}/assets`,
                      {
                        type: "pin",
                        url: "data:text/plain,Pin",
                        altText: "Pin",
                        metadata: {
                          position: { x: randomX, y: randomY, z: -9.8 },
                          scale: { x: 0.3, y: 0.3, z: 1 },
                          color: "#ef4444" // Red pin
                        }
                      }
                    );
                    queryClient.invalidateQueries({
                      queryKey: ["/api/boards", boardId, "assets"],
                    });
                    toast({ title: "Pin added - drag to reposition" });
                  } else if (action === "text") {
                    // Open text editor for floating text
                    setEditingAsset({
                      type: "text",
                      position: { x: 0, y: 3, z: -5 }
                    });
                    setShowTextEditor(true);
                  } else if (action === "image") {
                    toast({
                      title: "Upload an image",
                      description: "Use the Add button in the Assets panel to upload images.",
                    });
                  } else if (action === "link") {
                    // Create a link/reference asset
                    const response = await apiRequest(
                      "POST",
                      `/api/boards/${numericBoardId}/assets`,
                      {
                        type: "link",
                        url: "https://example.com",
                        altText: "Web Link",
                        metadata: {
                          position: { x: 2, y: 3, z: -5 },
                          scale: { x: 1.5, y: 1.5, z: 1 },
                        }
                      }
                    );
                    queryClient.invalidateQueries({
                      queryKey: ["/api/boards", boardId, "assets"],
                    });
                    toast({ title: "Link added to vision board" });
                  } else if (action === "goal") {
                    toast({
                      title: "Create a goal",
                      description: "Go to the Goals page to create and link goals.",
                    });
                  } else if (action === "sticker") {
                    toast({
                      title: "Stickers coming soon",
                      description: "This feature will be available in a future update.",
                    });
                  } else if (action === "delete") {
                    if (selectedAssetId) {
                      await apiRequest("DELETE", `/api/assets/${selectedAssetId}`);
                      setSelectedAssetId(null);
                      queryClient.invalidateQueries({
                        queryKey: ["/api/boards", boardId, "assets"],
                      });
                      toast({ title: "Asset deleted" });
                    } else {
                      toast({
                        title: "No asset selected",
                        description: "Select an asset to delete it.",
                        variant: "destructive"
                      });
                    }
                  }
                } catch (error) {
                  console.error("Toolbar action error:", error);
                  toast({
                    title: "Action failed",
                    description: "Could not complete the action. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
            />
          </div>
          <CollaboratorCursors
            collaborators={collaborators}
            containerRef={editorContainerRef}
          />

          {/* Floating Controls */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button variant="secondary" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button variant="secondary" size="sm">
              <Grid3X3 className="h-4 w-4 mr-1" />
              Snap
            </Button>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <AnimatePresence>
          {selectedAsset && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l bg-sidebar overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Properties</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedAssetId(null)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedAsset.url}
                    alt={selectedAsset.altText || "Asset"}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Position
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground">X</span>
                      <Slider
                        value={[selectedMetadata.position?.x || 0]}
                        min={-8}
                        max={8}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Y</span>
                      <Slider
                        value={[selectedMetadata.position?.y || 3]}
                        min={0.5}
                        max={7}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Z</span>
                      <Slider
                        value={[selectedMetadata.position?.z || -9.9]}
                        min={-9.9}
                        max={9.9}
                        step={0.1}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Scale
                  </label>
                  <Slider
                    value={[selectedMetadata.scale?.x || 2]}
                    min={0.5}
                    max={5}
                    step={0.1}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Alt Text
                  </label>
                  <Input
                    value={selectedAsset.altText || ""}
                    placeholder="Describe this image..."
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wall Tools Menu */}
      {showWallMenu && selectedWall && (
        <WallToolsMenu
          wallName={selectedWall.name}
          onToolSelect={async (tool) => {
            if (isNew || !numericBoardId) {
              toast({
                title: "Save the board first",
                description: "Create and save the board before adding objects.",
              });
              return;
            }

            try {
              if (tool === "note") {
                // Open text editor for sticky note at wall position
                setEditingAsset({
                  type: "note",
                  position: selectedWall.position,
                });
                setShowTextEditor(true);
              } else if (tool === "pin") {
                // Create pin at wall position
                await apiRequest(
                  "POST",
                  `/api/boards/${numericBoardId}/assets`,
                  {
                    type: "pin",
                    url: "data:text/plain,Pin",
                    altText: "Pin",
                    metadata: {
                      position: selectedWall.position,
                      scale: { x: 0.3, y: 0.3, z: 1 },
                      color: "#ef4444",
                    }
                  }
                );
                queryClient.invalidateQueries({
                  queryKey: ["/api/boards", boardId, "assets"],
                });
                toast({ title: `Pin added to ${selectedWall.name} wall` });
              } else if (tool === "text") {
                // Open text editor for floating text at wall position
                setEditingAsset({
                  type: "text",
                  position: selectedWall.position,
                });
                setShowTextEditor(true);
              } else if (tool === "draw") {
                // Open drawing canvas
                setShowDrawingCanvas(true);
              } else if (tool === "image") {
                toast({
                  title: "Upload an image",
                  description: "Use the Add button in the Assets panel to upload images.",
                });
              }
            } catch (error) {
              console.error("Error adding to wall:", error);
              toast({
                title: "Action failed",
                variant: "destructive",
              });
            }
          }}
          onClose={() => {
            setShowWallMenu(false);
            setSelectedWall(null);
          }}
        />
      )}

      {/* Drawing Canvas */}
      {showDrawingCanvas && (
        <DrawingCanvas
          onSave={async (imageData: string) => {
            try {
              // Create drawing asset on wall - use selected wall position or default
              const position = selectedWall?.position || {
                x: (Math.random() - 0.5) * 8,
                y: 2 + Math.random() * 4,
                z: -9.8
              };

              await apiRequest(
                "POST",
                `/api/boards/${numericBoardId}/assets`,
                {
                  type: "image",
                  url: imageData,
                  altText: "Wall Drawing",
                  metadata: {
                    position,
                    scale: { x: 3, y: 2.25, z: 1 },
                  }
                }
              );

              queryClient.invalidateQueries({
                queryKey: ["/api/boards", boardId, "assets"],
              });

              setShowDrawingCanvas(false);
              setActiveTool(null);
              toast({
                title: "Drawing added to wall",
                description: "Click and drag to reposition"
              });
            } catch (error) {
              console.error("Error saving drawing:", error);
              toast({
                title: "Failed to save drawing",
                variant: "destructive"
              });
            }
          }}
          onCancel={() => {
            setShowDrawingCanvas(false);
            setActiveTool(null);
          }}
        />
      )}

      {/* Text Editor Dialog */}
      <TextEditorDialog
        open={showTextEditor}
        onClose={() => {
          setShowTextEditor(false);
          setEditingAsset(null);
        }}
        initialData={editingAsset?.existingData}
        onSave={async (textData: TextFormatting) => {
          try {
            const metadata: any = {
              position: editingAsset.position,
              scale: { x: 1.5, y: 1.5, z: 1 },
              text: textData.text,
              fontSize: textData.fontSize,
              fontFamily: textData.fontFamily,
              color: textData.color,
              backgroundColor: textData.backgroundColor,
              bold: textData.bold,
              italic: textData.italic,
              underline: textData.underline,
              alignment: textData.alignment,
            };

            // For sticky notes, use yellow background by default
            if (editingAsset.type === "note" && textData.backgroundColor === "transparent") {
              metadata.backgroundColor = "#fef08a"; // Yellow sticky note
            }

            // If editing existing asset, update it
            if (editingAsset.id) {
              await apiRequest("PATCH", `/api/assets/${editingAsset.id}`, {
                metadata,
                url: `data:text/plain,${textData.text}`,
              });

              toast({
                title: editingAsset.type === "note" ? "Sticky note updated" : "Text updated"
              });
            } else {
              // Create new asset
              await apiRequest(
                "POST",
                `/api/boards/${numericBoardId}/assets`,
                {
                  type: editingAsset.type,
                  url: `data:text/plain,${textData.text}`,
                  altText: editingAsset.type === "note" ? "Sticky Note" : "Text element",
                  metadata,
                }
              );

              toast({
                title: editingAsset.type === "note" ? "Sticky note added" : "Text added",
                description: "Click and drag to reposition"
              });
            }

            queryClient.invalidateQueries({
              queryKey: ["/api/boards", boardId, "assets"],
            });
          } catch (error) {
            console.error("Error saving text:", error);
            toast({
              title: editingAsset?.id ? "Failed to update text" : "Failed to add text",
              variant: "destructive"
            });
          }
        }}
        title={editingAsset?.id
          ? (editingAsset?.type === "note" ? "Edit Sticky Note" : "Edit Text")
          : (editingAsset?.type === "note" ? "Create Sticky Note" : "Create Text")
        }
      />
    </div>
  );
}
