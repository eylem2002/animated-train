import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as KonvaImage,
  Transformer,
} from "react-konva";

export type VisionCanvasObject = {
  id: number;
  type: "image" | "text" | "link" | "drawing" | "goal";
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
  rotation?: number | null;
  zIndex?: number | null;
  locked?: boolean | null;
  data?: any;
};

export function VisionCanvas({
  objects,
  onSelect,
  selectedId,
  onChange,
  onDeselect,
}: {
  objects: VisionCanvasObject[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  onDeselect?: () => void;
  onChange?: (id: number, updates: Partial<VisionCanvasObject>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize((prev) => {
          // Only update if size actually changed
          if (prev.width !== rect.width || prev.height !== rect.height) {
            return { width: rect.width, height: rect.height };
          }
          return prev;
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const shapeRefs = useRef<Record<number, any>>({});
  const transformerRef = useRef<any>(null);

  const selectedObj = useMemo(
    () => objects.find((o) => o.id === selectedId) || null,
    [objects, selectedId]
  );

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const node = selectedId ? shapeRefs.current[selectedId] : null;
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, objects]);

  return (
    <div className="absolute inset-0" ref={containerRef}>
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={(e) => {
          // deselect when clicking empty
          const clickedOnEmpty = e.target === e.target.getStage();
          if (clickedOnEmpty) onDeselect && onDeselect();
        }}
      >
        <Layer>
          {objects.map((obj) => {
            const common = {
              x: obj.x || 0,
              y: obj.y || 0,
              rotation: obj.rotation || 0,
              draggable: !obj.locked,
              onDragEnd: (e: any) => {
                onChange &&
                  onChange(obj.id, { x: e.target.x(), y: e.target.y() });
              },
              onClick: () => onSelect && onSelect(obj.id),
            };

            if (obj.type === "text") {
              return (
                <Text
                  key={obj.id}
                  {...common}
                  text={obj.data?.text || "Text"}
                  fontSize={obj.data?.fontSize || 24}
                  fill={obj.data?.color || "#222"}
                  ref={(node) => (shapeRefs.current[obj.id] = node)}
                />
              );
            }

            if (obj.type === "image") {
              // Simple placeholder rect until image loading is implemented
              return (
                <Rect
                  key={obj.id}
                  {...common}
                  width={obj.width || 160}
                  height={obj.height || 120}
                  fill="#eee"
                  stroke="#999"
                  ref={(node) => (shapeRefs.current[obj.id] = node)}
                />
              );
            }

            // Fallback
            return (
              <Rect
                key={obj.id}
                {...common}
                width={obj.width || 120}
                height={obj.height || 80}
                fill="#f7f7f7"
                stroke="#bbb"
                ref={(node) => (shapeRefs.current[obj.id] = node)}
              />
            );
          })}

          {selectedObj && !selectedObj.locked && (
            <Transformer
              ref={transformerRef}
              rotateEnabled
              anchorStroke="#555"
              borderStroke="#555"
              keepRatio={false}
              onTransformEnd={() => {
                const node = selectedId ? shapeRefs.current[selectedId] : null;
                if (!node) return;
                const updates: any = {
                  x: node.x(),
                  y: node.y(),
                  rotation: node.rotation(),
                };
                if (
                  typeof node.width === "function" &&
                  typeof node.height === "function"
                ) {
                  updates.width = Math.round(node.width());
                  updates.height = Math.round(node.height());
                }
                if (onChange && selectedId) onChange(selectedId, updates);
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
