import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  StickyNote,
  Pin,
  Type,
  Pencil,
  Image as ImageIcon,
  X,
} from "lucide-react";

interface WallToolsMenuProps {
  wallName: string;
  onToolSelect: (tool: string) => void;
  onClose: () => void;
}

export function WallToolsMenu({
  wallName,
  onToolSelect,
  onClose,
}: WallToolsMenuProps) {
  const tools = [
    { key: "note", icon: StickyNote, label: "Add Sticky Note", color: "text-yellow-500" },
    { key: "pin", icon: Pin, label: "Add Pin", color: "text-red-500" },
    { key: "text", icon: Type, label: "Add Text", color: "text-purple-500" },
    { key: "draw", icon: Pencil, label: "Draw", color: "text-blue-500" },
    { key: "image", icon: ImageIcon, label: "Add Image", color: "text-green-500" },
  ];

  const getWallDisplayName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1) + " Wall";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {getWallDisplayName(wallName)}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Choose what you want to add to this wall:
        </p>

        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.key}
                variant="outline"
                className="h-auto flex-col gap-2 p-4 hover:scale-105 transition-transform"
                onClick={() => {
                  onToolSelect(tool.key);
                  onClose();
                }}
              >
                <Icon className={`w-6 h-6 ${tool.color}`} />
                <span className="text-sm font-medium">{tool.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Tip: After adding, you can click and drag to reposition items
          </p>
        </div>
      </Card>
    </div>
  );
}
