"use client";

import React, { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";

interface Props {
  imageSrc: string;
  onCancel: () => void;
  onComplete: (blob: Blob) => void;
}

interface CropAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  cropAreaPixels: CropAreaPixels | null,
  outputSize = 512,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;

  const cropSize = Math.min(naturalWidth, naturalHeight);
  const crop = cropAreaPixels || {
    x: (naturalWidth - cropSize) / 2,
    y: (naturalHeight - cropSize) / 2,
    width: cropSize,
    height: cropSize,
  };

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      0.86,
    );
  });
}

export default function AvatarCropper({
  imageSrc,
  onCancel,
  onComplete,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAreaPixels, setCropAreaPixels] = useState<CropAreaPixels | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleConfirm = useCallback(async () => {
    try {
      const blob = await getCroppedImg(imageSrc, cropAreaPixels, 512);
      onComplete(blob);
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, cropAreaPixels, onComplete]);

  if (typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6"
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
    >
      <div
        ref={containerRef}
        className="my-auto max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-card p-4 shadow-xl sm:p-6"
      >
        <div className="relative h-[min(50vh,34rem)] min-h-56 rounded bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, croppedAreaPixels) =>
              setCropAreaPixels(croppedAreaPixels)
            }
            objectFit="contain"
          />
        </div>

        <div className="mt-4 space-y-4">
          <label className="block">
            <div className="mb-2 text-sm text-muted-foreground">
              Zoom out or in
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded border px-4 py-2"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-primary px-4 py-2 text-primary-foreground"
              onClick={handleConfirm}
            >
              Set photo
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
