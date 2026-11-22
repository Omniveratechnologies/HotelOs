import { useEffect, useRef, useState } from "react";
import { cn } from "@hotelos/utils";

/**
 * Signature pad with a dashed frame, faint baseline and "Sign here"
 * placeholder. Works with mouse and touch (Pointer Events). Calls `onChange`
 * with a PNG data URL when signed, or `null` after Clear.
 *
 * @param {Object} props - Component properties.
 * @param {(dataUrl: string | null) => void} props.onChange - Called on stroke end / clear.
 * @param {string} [props.label] - Optional label above the pad.
 * @param {string} [props.placeholder='Sign here'] - Placeholder text.
 * @param {number} [props.height=180] - Pad height in px.
 * @param {boolean} [props.disabled=false] - Disables drawing.
 * @param {string} [props.className] - Extra classes.
 * @returns {React.ReactElement}
 */
export function SignaturePad({
  onChange,
  label,
  placeholder = "Sign here",
  height = 180,
  disabled = false,
  className = "",
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  // Size the canvas to its container (devicePixelRatio-aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const { width } = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const ctx = canvas.getContext("2d");
      const image =
        canvas.width > 0 && canvas.height > 0
          ? ctx.getImageData(0, 0, canvas.width, canvas.height)
          : null;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.round(height * ratio);
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1e293b";
      if (image) ctx.putImageData(image, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [height]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startStroke = (e) => {
    if (disabled) return;
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current.setPointerCapture?.(e.pointerId);
  };

  const continueStroke = (e) => {
    if (!drawingRef.current || disabled) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
    setHasInk(false);
    onChange(null);
  };

  return (
    <div className={className}>
      {label && (
        <span className="text-brand-900 mb-1.5 block text-sm font-semibold">
          {label}
        </span>
      )}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-dashed",
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
            : "border-gray-300 bg-white",
        )}
        style={{ height }}
      >
        {/* Baseline */}
        <span
          aria-hidden="true"
          className="border-surface-200 pointer-events-none absolute right-4 left-4 border-b"
          style={{ bottom: height * 0.3 }}
        />
        {!hasInk && (
          <span
            aria-hidden="true"
            className="text-surface-400 pointer-events-none absolute inset-0 flex items-center justify-center text-sm"
          >
            {placeholder}
          </span>
        )}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={label || "Signature pad"}
          className={cn(
            "h-full w-full touch-none",
            disabled ? "pointer-events-none" : "cursor-crosshair",
          )}
          onPointerDown={startStroke}
          onPointerMove={continueStroke}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
        />
      </div>
      <div className="mt-1.5 flex justify-end">
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || !hasInk}
          className="text-surface-500 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-3.5 w-3.5"
          >
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
          </svg>
          Clear
        </button>
      </div>
    </div>
  );
}

export default SignaturePad;
