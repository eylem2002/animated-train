import { Button } from "../ui/button";
import {
  Image as ImageIcon,
  Pencil,
  Type,
  Link as LinkIcon,
  Target,
  Trash2,
  Sticker,
  Pin,
  StickyNote,
} from "lucide-react";

export function VisionToolbar({
  onAction,
  activeTool,
}: {
  onAction?: (action: string) => void;
  activeTool?: string | null;
}) {
  const tools = [
    { key: "image", icon: <ImageIcon className="w-4 h-4" />, label: "Image" },
    { key: "draw", icon: <Pencil className="w-4 h-4" />, label: "Draw on Wall" },
    { key: "note", icon: <StickyNote className="w-4 h-4" />, label: "Sticky Note" },
    { key: "pin", icon: <Pin className="w-4 h-4" />, label: "Pin" },
    { key: "text", icon: <Type className="w-4 h-4" />, label: "Text" },
    { key: "link", icon: <LinkIcon className="w-4 h-4" />, label: "Link" },
    { key: "goal", icon: <Target className="w-4 h-4" />, label: "Goal" },
    { key: "delete", icon: <Trash2 className="w-4 h-4" />, label: "Delete" },
  ];

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      {tools.map((t) => (
        <Button
          key={t.key}
          variant={activeTool === t.key ? "default" : "ghost"}
          size="icon"
          title={t.label}
          onClick={() => onAction && onAction(t.key)}
        >
          {t.icon}
        </Button>
      ))}
    </div>
  );
}
