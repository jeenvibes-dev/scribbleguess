import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { type DrawingData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2 } from "lucide-react";

interface DrawingCanvasProps {
  isDrawer: boolean;
  onDraw: (data: DrawingData) => void;
  onClear: () => void;
  className?: string;
  currentColor?: string;
  currentSize?: number;
  mirrorMode?: boolean;
  hideControls?: boolean;
}

export interface DrawingCanvasRef {
  canvas: HTMLCanvasElement | null;
  applyDrawing: (data: DrawingData) => void;
}

const COLORS = [
  "#000000", "#FFFFFF", "#EF4444", "#F59E0B", "#FBBF24", "#84CC16",
  "#22C55E", "#14B8A6", "#06B6D4", "#3B82F6", "#6366F1", "#8B5CF6",
];

const SIZES = [2, 5, 10];

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({
  isDrawer,
  onDraw,
  onClear,
  className = "",
  currentColor: forcedColor,
  currentSize: forcedSize,
  mirrorMode = false,
  hideControls = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  const activeColor = forcedColor || color;
  const activeSize = forcedSize || size;

  const applyDrawing = useCallback((data: DrawingData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (data.type === "clear") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (data.type === "draw" && data.fromX !== undefined && data.fromY !== undefined && data.toX !== undefined && data.toY !== undefined) {
      ctx.strokeStyle = data.color || "#000000";
      ctx.lineWidth = data.size || 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(data.fromX, data.fromY);
      ctx.lineTo(data.toX, data.toY);
      ctx.stroke();
    }
  }, []);

  useImperativeHandle(ref, () => ({
    canvas: canvasRef.current,
    applyDrawing,
  }), [applyDrawing]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = "touches" in e ? (e as any).touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = "touches" in e ? (e as any).touches[0].clientY : (e as MouseEvent).clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const draw = useCallback((fromX: number, fromY: number, toX: number, toY: number, drawColor: string, drawSize: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    if (mirrorMode) {
      const mirrorX = canvas.width - toX;
      ctx.beginPath();
      ctx.moveTo(canvas.width - fromX, fromY);
      ctx.lineTo(mirrorX, toY);
      ctx.stroke();
    }
  }, [mirrorMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPositionRef.current = coords;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = isEraser ? "#FFFFFF" : activeColor;
    ctx.lineWidth = activeSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const continueDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;
    const coords = getCoordinates(e);
    if (!coords || !lastPositionRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const prevX = lastPositionRef.current.x;
    const prevY = lastPositionRef.current.y;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    if (mirrorMode) {
      const mirrorX = canvas.width - coords.x;
      ctx.lineTo(mirrorX, coords.y);
      ctx.stroke();
    }

    onDraw({
      type: "draw",
      color: isEraser ? "#FFFFFF" : activeColor,
      size: activeSize,
      fromX: prevX,
      fromY: prevY,
      toX: coords.x,
      toY: coords.y,
    });

    lastPositionRef.current = coords;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={startDrawing}
        onMouseMove={continueDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          startDrawing(mouseEvent as any);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const touch = e.touches[0];
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
          });
          continueDrawing(mouseEvent as any);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          stopDrawing();
        }}
        style={{ touchAction: 'none' }}
        className={`w-full h-auto bg-white rounded-lg shadow-canvas border-2 border-border ${
          isDrawer ? "cursor-crosshair" : "cursor-not-allowed"
        }`}
        data-testid="drawing-canvas"
      />

      {isDrawer && !hideControls && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap" data-testid="color-picker">
            {COLORS.map((c) => (
              <Button
                key={c}
                size="icon"
                variant={color === c && !isEraser ? "default" : "outline"}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className="h-10 w-10 rounded-md"
                style={{ backgroundColor: c, borderColor: c === "#FFFFFF" ? "#e5e7eb" : c }}
                data-testid={`color-${c}`}
              />
            ))}
            <Button
              size="icon"
              variant={isEraser ? "default" : "outline"}
              onClick={() => setIsEraser(!isEraser)}
              className="h-10 w-10"
              data-testid="button-eraser"
            >
              <Eraser className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Brush Size:</span>
            {SIZES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={size === s ? "default" : "outline"}
                onClick={() => setSize(s)}
                data-testid={`size-${s}`}
              >
                {s === 2 ? "S" : s === 5 ? "M" : "L"}
              </Button>
            ))}
          </div>

          <Button
            variant="destructive"
            onClick={clearCanvas}
            className="w-full"
            data-testid="button-clear-canvas"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Canvas
          </Button>
        </div>
      )}
    </div>
  );
});

DrawingCanvas.displayName = "DrawingCanvas";
