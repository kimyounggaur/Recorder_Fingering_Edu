"use client";

import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { RECORDER_POSE_SOURCES } from "../data/poseAssets";

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const MAX_DEVICE_PIXEL_RATIO = 2;

function loadPose(source: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(source);
  if (cached) return cached;

  const pending = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => {
      imageCache.delete(source);
      reject(new Error(`Unable to load recorder pose: ${source}`));
    };
    image.src = source;
  });

  imageCache.set(source, pending);
  return pending;
}

function canRenderCanvas(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.CanvasRenderingContext2D !== "undefined"
  );
}

function syncCanvasSize(canvas: HTMLCanvasElement): boolean {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width === width && canvas.height === height) return false;
  canvas.width = width;
  canvas.height = height;
  return true;
}

function drawContained(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  opacity = 1,
) {
  const { width, height } = context.canvas;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  context.save();
  context.globalAlpha = opacity;
  context.drawImage(image, x, y, drawWidth, drawHeight);
  context.restore();
}

function paintImage(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawContained(context, image, image.naturalWidth, image.naturalHeight);
}

function snapshotCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const snapshot = document.createElement("canvas");
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;
  snapshot.getContext("2d")?.drawImage(canvas, 0, 0);
  return snapshot;
}

function easeOutQuint(progress: number): number {
  return 1 - Math.pow(1 - progress, 5);
}

export interface RecorderPoseStageProps {
  source: string;
  replaySource?: string | null;
  transitionKey: number | string;
  duration: number;
  reducedMotion?: boolean;
  className?: string;
}

/**
 * Cross-fades complete, aligned fingering poses. A new transition snapshots
 * the currently painted blend, so rapid note changes continue from the frame
 * the learner can actually see instead of jumping back to an old target.
 */
export function RecorderPoseStage({
  source,
  replaySource = null,
  transitionKey,
  duration,
  reducedMotion = false,
  className,
}: RecorderPoseStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generationRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const displayedImageRef = useRef<HTMLImageElement | null>(null);
  const displayedSourceRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [renderedSource, setRenderedSource] = useState<string | null>(null);

  useEffect(() => {
    if (!canRenderCanvas()) return;
    for (const poseSource of RECORDER_POSE_SOURCES) {
      void loadPose(poseSource).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canRenderCanvas()) return;

    if (typeof ResizeObserver === "undefined") {
      syncCanvasSize(canvas);
      return;
    }

    const observer = new ResizeObserver(() => {
      if (!syncCanvasSize(canvas)) return;
      const image = displayedImageRef.current;
      if (image) paintImage(canvas, image);
    });
    observer.observe(canvas);
    syncCanvasSize(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canRenderCanvas()) return;
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    let disposed = false;
    const replayPromise = replaySource ? loadPose(replaySource) : Promise.resolve(null);

    void Promise.all([loadPose(source), replayPromise])
      .then(([targetImage, replayImage]) => {
        if (disposed || generationRef.current !== generation) return;
        syncCanvasSize(canvas);

        const hasDisplayedFrame = displayedImageRef.current !== null;
        const replayingSamePose =
          displayedSourceRef.current === source &&
          replayImage !== null &&
          replaySource !== source;

        if (replayingSamePose && replayImage) {
          paintImage(canvas, replayImage);
        }

        if (!hasDisplayedFrame || reducedMotion || duration <= 0) {
          paintImage(canvas, targetImage);
          displayedImageRef.current = targetImage;
          displayedSourceRef.current = source;
          setRenderedSource(source);
          setReady(true);
          return;
        }

        const fromFrame = snapshotCanvas(canvas);
        const context = canvas.getContext("2d");
        if (!context) return;
        const startedAt = performance.now();

        const paintFrame = (now: number) => {
          if (disposed || generationRef.current !== generation) return;
          const linearProgress = Math.min(1, (now - startedAt) / duration);
          const easedProgress = easeOutQuint(linearProgress);

          context.clearRect(0, 0, canvas.width, canvas.height);
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          drawContained(
            context,
            fromFrame,
            fromFrame.width,
            fromFrame.height,
            1 - easedProgress,
          );
          drawContained(
            context,
            targetImage,
            targetImage.naturalWidth,
            targetImage.naturalHeight,
            easedProgress,
          );

          if (linearProgress < 1) {
            animationFrameRef.current = requestAnimationFrame(paintFrame);
            return;
          }

          paintImage(canvas, targetImage);
          displayedImageRef.current = targetImage;
          displayedSourceRef.current = source;
          setRenderedSource(source);
          animationFrameRef.current = null;
          setReady(true);
        };

        animationFrameRef.current = requestAnimationFrame(paintFrame);
      })
      .catch(() => {
        if (!disposed && generationRef.current === generation) setReady(false);
      });

    return () => {
      disposed = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [duration, reducedMotion, replaySource, source, transitionKey]);

  return (
    <div
      className={["recorder-pose-stage", className].filter(Boolean).join(" ")}
      data-ready={ready ? "true" : "false"}
      data-pose-source={source}
      data-rendered-source={renderedSource ?? ""}
      data-transition-key={transitionKey}
    >
      <NextImage
        className="recorder-pose-stage__fallback"
        src={source}
        alt=""
        width={976}
        height={1360}
        sizes="(max-width: 700px) 76vw, (max-width: 1100px) 48vw, 390px"
        unoptimized
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        className="recorder-pose-stage__canvas"
        aria-hidden="true"
      />
    </div>
  );
}
