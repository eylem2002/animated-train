import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Move,
  Check,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TextEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (textData: TextFormatting) => void;
  initialData?: TextFormatting;
  title?: string;
}

export interface TextFormatting {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  alignment: "left" | "center" | "right";
}

const FONT_FAMILIES = [
  { value: "sans-serif", label: "Sans Serif" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
  { value: "cursive", label: "Cursive" },
  { value: "fantasy", label: "Fantasy" },
];

const PRESET_COLORS = [
  "#ffffff", "#000000", "#ef4444", "#f97316", "#f59e0b",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#ec4899", "#f43f5e",
];

const PRESET_BACKGROUNDS = [
  "transparent", "#1f2937", "#374151", "#4b5563", "#6b7280",
  "#fef3c7", "#fef08a", "#fde68a", "#fcd34d", "#fbbf24",
  "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed",
];

export function TextEditorDialog({
  open,
  onClose,
  onSave,
  initialData,
  title = "Edit Text",
}: TextEditorDialogProps) {
  const [formatting, setFormatting] = useState<TextFormatting>({
    text: "",
    fontSize: 24,
    fontFamily: "sans-serif",
    color: "#ffffff",
    backgroundColor: "transparent",
    bold: false,
    italic: false,
    underline: false,
    alignment: "left",
  });

  useEffect(() => {
    if (initialData) {
      setFormatting(initialData);
    }
  }, [initialData]);

  const handleSave = () => {
    if (formatting.text.trim()) {
      onSave(formatting);
      onClose();
    }
  };

  const toggleStyle = (style: "bold" | "italic" | "underline") => {
    setFormatting((prev) => ({ ...prev, [style]: !prev[style] }));
  };

  const getPreviewStyle = () => ({
    fontSize: `${formatting.fontSize}px`,
    fontFamily: formatting.fontFamily,
    color: formatting.color,
    backgroundColor: formatting.backgroundColor,
    fontWeight: formatting.bold ? "bold" : "normal",
    fontStyle: formatting.italic ? "italic" : "normal",
    textDecoration: formatting.underline ? "underline" : "none",
    textAlign: formatting.alignment,
    padding: "20px",
    borderRadius: "8px",
    minHeight: "100px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      formatting.alignment === "center"
        ? "center"
        : formatting.alignment === "right"
        ? "flex-end"
        : "flex-start",
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Customize your text with rich formatting options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="text-content" className="text-sm font-medium">
              Text Content
            </Label>
            <Input
              id="text-content"
              value={formatting.text}
              onChange={(e) =>
                setFormatting((prev) => ({ ...prev, text: e.target.value }))
              }
              placeholder="Enter your text here..."
              className="text-lg"
              autoFocus
            />
          </div>

          {/* Formatting Tabs */}
          <Tabs defaultValue="style" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="position">Position</TabsTrigger>
            </TabsList>

            {/* Style Tab */}
            <TabsContent value="style" className="space-y-4 mt-4">
              {/* Text Formatting Buttons */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Formatting</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formatting.bold ? "default" : "outline"}
                    size="icon"
                    onClick={() => toggleStyle("bold")}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={formatting.italic ? "default" : "outline"}
                    size="icon"
                    onClick={() => toggleStyle("italic")}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={formatting.underline ? "default" : "outline"}
                    size="icon"
                    onClick={() => toggleStyle("underline")}
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Alignment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Alignment</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formatting.alignment === "left" ? "default" : "outline"}
                    size="icon"
                    onClick={() =>
                      setFormatting((prev) => ({ ...prev, alignment: "left" }))
                    }
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={formatting.alignment === "center" ? "default" : "outline"}
                    size="icon"
                    onClick={() =>
                      setFormatting((prev) => ({ ...prev, alignment: "center" }))
                    }
                    title="Align Center"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={formatting.alignment === "right" ? "default" : "outline"}
                    size="icon"
                    onClick={() =>
                      setFormatting((prev) => ({ ...prev, alignment: "right" }))
                    }
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Font Size</Label>
                  <span className="text-sm text-muted-foreground">
                    {formatting.fontSize}px
                  </span>
                </div>
                <Slider
                  value={[formatting.fontSize]}
                  onValueChange={([value]) =>
                    setFormatting((prev) => ({ ...prev, fontSize: value }))
                  }
                  min={12}
                  max={72}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Family</Label>
                <Select
                  value={formatting.fontFamily}
                  onValueChange={(value) =>
                    setFormatting((prev) => ({ ...prev, fontFamily: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem
                        key={font.value}
                        value={font.value}
                        style={{ fontFamily: font.value }}
                      >
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4 mt-4">
              {/* Text Color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Text Color
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setFormatting((prev) => ({ ...prev, color }))
                      }
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        formatting.color === color
                          ? "border-primary scale-110"
                          : "border-gray-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formatting.color}
                  onChange={(e) =>
                    setFormatting((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-full h-10"
                />
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() =>
                        setFormatting((prev) => ({ ...prev, backgroundColor: bg }))
                      }
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        formatting.backgroundColor === bg
                          ? "border-primary scale-110"
                          : "border-gray-300 hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: bg === "transparent" ? "#fff" : bg,
                        backgroundImage:
                          bg === "transparent"
                            ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                            : "none",
                        backgroundSize: bg === "transparent" ? "8px 8px" : "auto",
                        backgroundPosition:
                          bg === "transparent" ? "0 0, 0 4px, 4px -4px, -4px 0px" : "0 0",
                      }}
                      title={bg}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Position Tab */}
            <TabsContent value="position" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Move className="w-4 h-4" />
                <p className="text-sm">
                  After placing the text, you can click and drag it to any position
                  on your vision board. Use the camera controls to navigate in 3D
                  space.
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Tips for positioning:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Click on the text to select it</li>
                  <li>• Drag it to move horizontally</li>
                  <li>• Use camera controls to view from different angles</li>
                  <li>• Selected items show a highlight border</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Live Preview</Label>
            <div
              className="border-2 border-dashed rounded-lg"
              style={getPreviewStyle()}
            >
              {formatting.text || "Your text will appear here..."}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formatting.text.trim()}
            >
              <Check className="w-4 h-4 mr-2" />
              Save Text
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
