"use client";

import React, { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";

interface Props {
  imageSrc: string;
  onCancel: () => void;
  onComplete: (blob: Blob) => void;
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
  crop: { x: number; y: number },
  zoom: number,
  aspect = 1,
  outputSize = 512,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;

  // calculate crop box in pixels
  const cropWidth = naturalWidth / zoom;
  const cropHeight = naturalHeight / zoom;

  const sx = naturalWidth / 2 - cropWidth / 2 + crop.x;
  const sy = naturalHeight / 2 - cropHeight / 2 + crop.y;

  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.drawImage(
    image,
    sx,
    sy,
    cropWidth,
    cropHeight,
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleConfirm = useCallback(async () => {
    try {
      const blob = await getCroppedImg(imageSrc, crop, zoom, 1, 512);
      onComplete(blob);
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, crop, zoom, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={containerRef}
        className="bg-card rounded-lg p-4 w-[90vw] max-w-2xl"
      >
        <div className="relative h-80 bg-black rounded">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
          />
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="flex-1">
            <div className="text-sm text-muted-foreground">Zoom</div>
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

          <div className="flex-shrink-0 flex items-center gap-2">
            <button className="px-3 py-2 rounded border" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="px-3 py-2 rounded bg-primary text-primary-foreground"
              onClick={handleConfirm}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
