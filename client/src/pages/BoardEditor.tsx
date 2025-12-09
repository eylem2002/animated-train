import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
import { ObjectUploader } from "@/components/ObjectUploader";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { VisionBoard, Asset, AssetMetadata } from "@shared/schema";

export default function BoardEditor() {
  const [, params] = useRoute("/boards/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const boardId = params?.id;
  const isNew = boardId === "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  const { data: board, isLoading: boardLoading } = useQuery<VisionBoard>({
    queryKey: ["/api/boards", boardId],
    enabled: !isNew && !!boardId,
  });

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/boards", boardId, "assets"],
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
    mutationFn: async (data: { title: string; description: string; visibility: string }) => {
      return apiRequest("POST", "/api/boards", data);
    },
    onSuccess: (data: any) => {
      toast({ title: "Board created!" });
      navigate(`/boards/${data.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/boards"] });
    },
    onError: () => {
      toast({ title: "Failed to create board", variant: "destructive" });
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; visibility: string }) => {
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
            {visibility === "private" ? "Private" : visibility === "public" ? "Public" : "Unlisted"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
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
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your vision board..."
                    className="resize-none"
                    data-testid="input-board-description"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Visibility</label>
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
            disabled={createBoardMutation.isPending || updateBoardMutation.isPending}
            data-testid="button-save-board"
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
                      const res = await apiRequest("POST", "/api/objects/upload");
                      return { method: "PUT" as const, url: res.uploadURL };
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

        {/* 3D Canvas */}
        <div className="flex-1 relative">
          <VisionRoom
            assets={assets}
            selectedAssetId={selectedAssetId}
            onAssetClick={(asset) => setSelectedAssetId(asset.id)}
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
                  <label className="text-sm font-medium mb-2 block">Position</label>
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
                  <label className="text-sm font-medium mb-2 block">Scale</label>
                  <Slider
                    value={[selectedMetadata.scale?.x || 2]}
                    min={0.5}
                    max={5}
                    step={0.1}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Alt Text</label>
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
    </div>
  );
}
