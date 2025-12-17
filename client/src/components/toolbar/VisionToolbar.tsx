import { Button } from "../ui/button";
import {
  Image as ImageIcon,
  Pencil,
  Type,
  Link as LinkIcon,
  Target,
  Trash2,
  Sticker,
} from "lucide-react";

export function VisionToolbar({
  onAction,
}: {
  onAction?: (action: string) => void;
}) {
  const tools = [
    { key: "image", icon: <ImageIcon className="w-4 h-4" />, label: "Image" },
    { key: "draw", icon: <Pencil className="w-4 h-4" />, label: "Draw" },
    { key: "text", icon: <Type className="w-4 h-4" />, label: "Text" },
    { key: "link", icon: <LinkIcon className="w-4 h-4" />, label: "Link" },
    { key: "sticker", icon: <Sticker className="w-4 h-4" />, label: "Sticker" },
    { key: "goal", icon: <Target className="w-4 h-4" />, label: "Goal" },
    { key: "delete", icon: <Trash2 className="w-4 h-4" />, label: "Delete" },
  ];

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      {tools.map((t) => (
        <Button
          key={t.key}
          variant="ghost"
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
