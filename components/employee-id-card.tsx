"use client";

import React, { useState, useRef, useEffect } from "react";
import { encodeCode128, formatEmployeeId } from "@/lib/employee-id";
import { Download, RefreshCw, Printer, CheckCircle2, ShieldCheck, Mail, Phone, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmployeeIdCardProps {
  fullName: string;
  position?: string;
  idNumber?: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  onRefresh?: () => void;
  showControls?: boolean;
}

export default function EmployeeIdCard({
  fullName,
  position = "Hospitality Professional",
  idNumber,
  email,
  phone,
  avatarUrl,
  isVerified = true,
  showControls = true,
}: EmployeeIdCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const formattedId = formatEmployeeId(idNumber, email || fullName);
  const barcodePattern = encodeCode128(formattedId);

  const displayPosition = (position && position.trim().length > 0)
    ? position.toUpperCase()
    : "HOSPITALITY PROFESSIONAL";

  const displayName = (fullName && fullName.trim().length > 0)
    ? fullName.toUpperCase()
    : "ADDIS EMPLOYEE";

  // Canvas drawing function for high-res PNG export
  const renderCardToCanvas = async (side: "front" | "back"): Promise<HTMLCanvasElement> => {
    const scale = 3; // 3x scale for crisp 300DPI export
    const width = 380 * scale;
    const height = 580 * scale;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    // Colors
    const tealDark = "#004838";
    const tealDeep = "#023c2f";
    const goldYellow = "#e5a93c";
    const goldLight = "#f4cb63";
    const textColor = "#0f1e1a";

    // Rounded card background
    const radius = 24 * scale;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    // White base
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (side === "front") {
      // 1. Top Teal Header with curve
      ctx.fillStyle = tealDark;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, 95 * scale);
      ctx.bezierCurveTo(width * 0.75, 115 * scale, width * 0.25, 65 * scale, 0, 95 * scale);
      ctx.closePath();
      ctx.fill();

      // Gold wave outline
      ctx.strokeStyle = goldYellow;
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 95 * scale);
      ctx.bezierCurveTo(width * 0.25, 65 * scale, width * 0.75, 115 * scale, width, 95 * scale);
      ctx.stroke();

      // Lanyard punch hole
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      const holeW = 80 * scale;
      const holeH = 14 * scale;
      const holeX = (width - holeW) / 2;
      const holeY = 10 * scale;
      const holeR = 7 * scale;
      ctx.roundRect(holeX, holeY, holeW, holeH, holeR);
      ctx.fill();

      // Top text inside front card body
      ctx.textAlign = "center";
      ctx.fillStyle = "#0c2820";
      ctx.font = `bold ${18 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("ADDIS HOSPITALITY", width / 2, 120 * scale);

      ctx.fillStyle = "#1e3d34";
      ctx.font = `bold ${11 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("-------SOLUTIONS PLC-------", width / 2, 134 * scale);

      ctx.fillStyle = "#0c2820";
      ctx.font = `bold ${13 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("AHS MEMBER", width / 2, 150 * scale);

      // Photo Box (Rounded Rectangle)
      const photoW = 150 * scale;
      const photoH = 165 * scale;
      const photoX = (width - photoW) / 2;
      const photoY = 158 * scale;
      const photoR = 16 * scale;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, photoR);
      ctx.clip();

      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(photoX, photoY, photoW, photoH);

      // Draw Avatar if available, else placeholder silhouette
      if (avatarUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // fallback gracefully
            img.src = avatarUrl;
          });
          if (img.width > 0) {
            ctx.drawImage(img, photoX, photoY, photoW, photoH);
          }
        } catch {
          // fallback to silhouette
        }
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(photoX + photoW / 2, photoY + photoH * 0.4, 30 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(photoX + photoW / 2, photoY + photoH * 1.1, 55 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Photo Frame Border
      ctx.strokeStyle = tealDark;
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, photoR);
      ctx.stroke();

      // Employee Name
      ctx.fillStyle = "#051a14";
      ctx.font = `900 ${20 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText(displayName, width / 2, 350 * scale);

      // Position Tag
      ctx.fillStyle = "#0e3a2f";
      ctx.font = `bold ${14 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText(displayPosition, width / 2, 370 * scale);

      // ID Number
      ctx.fillStyle = "#051a14";
      ctx.font = `bold ${15 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText(`ID No.: ${formattedId}`, width / 2, 392 * scale);

      // Contact details
      ctx.fillStyle = "#334155";
      ctx.font = `${10 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText(`Email: ${email}  •  Phone: ${phone}`, width / 2, 410 * scale);

      // Draw Barcode
      const barY = 422 * scale;
      const barH = 32 * scale;
      const barTotalW = 220 * scale;
      const unitW = barTotalW / barcodePattern.length;
      const barStartX = (width - barTotalW) / 2;

      ctx.fillStyle = "#000000";
      for (let i = 0; i < barcodePattern.length; i++) {
        if (barcodePattern[i] === "1") {
          ctx.fillRect(barStartX + i * unitW, barY, unitW + 0.5, barH);
        }
      }

      // Bottom Teal & Gold Wave
      ctx.fillStyle = tealDark;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(width, height);
      ctx.lineTo(width, height - 90 * scale);
      ctx.bezierCurveTo(width * 0.7, height - 120 * scale, width * 0.3, height - 60 * scale, 0, height - 90 * scale);
      ctx.closePath();
      ctx.fill();

      // Gold wave curve
      ctx.strokeStyle = goldYellow;
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(0, height - 90 * scale);
      ctx.bezierCurveTo(width * 0.3, height - 60 * scale, width * 0.7, height - 120 * scale, width, height - 90 * scale);
      ctx.stroke();

      // Bottom Logo Text in white
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${14 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("addis hospitality service", width / 2, height - 35 * scale);
      ctx.font = `${9 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = goldLight;
      ctx.fillText("Official Verified Identity Badge", width / 2, height - 18 * scale);

    } else {
      // BACK SIDE
      // 1. Top Teal Header
      ctx.fillStyle = tealDark;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, 100 * scale);
      ctx.bezierCurveTo(width * 0.75, 120 * scale, width * 0.25, 75 * scale, 0, 100 * scale);
      ctx.closePath();
      ctx.fill();

      // Gold wave
      ctx.strokeStyle = goldYellow;
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 100 * scale);
      ctx.bezierCurveTo(width * 0.25, 75 * scale, width * 0.75, 120 * scale, width, 100 * scale);
      ctx.stroke();

      // Lanyard punch hole
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      const holeW = 80 * scale;
      const holeH = 14 * scale;
      const holeX = (width - holeW) / 2;
      const holeY = 10 * scale;
      const holeR = 7 * scale;
      ctx.roundRect(holeX, holeY, holeW, holeH, holeR);
      ctx.fill();

      // Back Top Header Typography
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${18 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("ADDIS HOSPITALITY", width / 2, 48 * scale);

      ctx.fillStyle = goldYellow;
      ctx.font = `bold ${12 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("-------SOLUTIONS PLC-------", width / 2, 64 * scale);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `italic ${10 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("Visual & Verbal Identity Addis hospitality Service", width / 2, 80 * scale);

      // Back Content: ABOUT AHS
      ctx.textAlign = "left";
      ctx.fillStyle = "#0c2820";
      ctx.font = `900 ${17 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("ABOUT AHS", 24 * scale, 140 * scale);

      // Paragraph 1 (wrapped)
      ctx.fillStyle = "#1e293b";
      ctx.font = `${11 * scale}px 'Segoe UI', Roboto, sans-serif`;
      const p1 =
        "Addis Hospitality Solutions PLC (AHS) is a professional hospitality workforce solutions provider dedicated to connecting skilled and passionate individuals with leading restaurants, hotels, cafes, catering companies, event venues, and supermarkets.";
      wrapText(ctx, p1, 24 * scale, 160 * scale, width - 48 * scale, 15 * scale);

      // Paragraph 2
      const p2 =
        "We believe in people, potential, and partnership. Together, we build a better hospitality industry.";
      wrapText(ctx, p2, 24 * scale, 240 * scale, width - 48 * scale, 15 * scale);

      // 4 Bullet points
      const bullets = [
        "Trusted Recruitment Partner",
        "Quality Employment Opportunities",
        "Professional Growth & Development",
        "Integrity, Respect & Excellence",
      ];

      let bulletY = 285 * scale;
      bullets.forEach((bullet) => {
        ctx.fillStyle = "#004838";
        ctx.font = `bold ${13 * scale}px 'Segoe UI', Roboto, sans-serif`;
        ctx.fillText("➔", 24 * scale, bulletY);

        ctx.fillStyle = "#0f172a";
        ctx.font = `bold ${12 * scale}px 'Segoe UI', Roboto, sans-serif`;
        ctx.fillText(bullet, 44 * scale, bulletY);
        bulletY += 22 * scale;
      });

      // Authorized Signature line
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${12 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("Authorized Signature  ___________________________", 24 * scale, 395 * scale);

      // ID Badge Tag on back
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.roundRect(24 * scale, 415 * scale, width - 48 * scale, 26 * scale, 6 * scale);
      ctx.fill();
      ctx.fillStyle = "#004838";
      ctx.font = `bold ${11 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`MEMBER ID: ${formattedId}`, width / 2, 432 * scale);

      // Bottom Teal Footer
      ctx.fillStyle = tealDark;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(width, height);
      ctx.lineTo(width, height - 90 * scale);
      ctx.bezierCurveTo(width * 0.7, height - 110 * scale, width * 0.3, height - 70 * scale, 0, height - 90 * scale);
      ctx.closePath();
      ctx.fill();

      // Gold wave
      ctx.strokeStyle = goldYellow;
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(0, height - 90 * scale);
      ctx.bezierCurveTo(width * 0.3, height - 70 * scale, width * 0.7, height - 110 * scale, width, height - 90 * scale);
      ctx.stroke();

      // Footer notice text
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = `italic ${10 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillText("This card is the property of Addis Hospitality Solutions PLC.", width / 2, height - 42 * scale);
      ctx.font = `italic ${9.5 * scale}px 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = goldLight;
      ctx.fillText("If found, please return to the nearest AHS office.", width / 2, height - 24 * scale);
    }

    ctx.restore();
    return canvas;
  };

  // Helper to wrap text cleanly on canvas
  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  // Download card as PNG
  const handleDownload = async (side: "front" | "back" | "both") => {
    try {
      setIsDownloading(true);
      if (side === "front" || side === "back") {
        const canvas = await renderCardToCanvas(side);
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `AHS_ID_${side.toUpperCase()}_${formattedId}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // Both sides side-by-side
        const canvasFront = await renderCardToCanvas("front");
        const canvasBack = await renderCardToCanvas("back");

        const combined = document.createElement("canvas");
        const gap = 40;
        combined.width = canvasFront.width * 2 + gap;
        combined.height = canvasFront.height;
        const ctx = combined.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, combined.width, combined.height);
          ctx.drawImage(canvasFront, 0, 0);
          ctx.drawImage(canvasBack, canvasFront.width + gap, 0);

          const link = document.createElement("a");
          link.download = `AHS_ID_COMPLETE_${formattedId}.png`;
          link.href = combined.toDataURL("image/png");
          link.click();
        }
      }
    } catch (err) {
      console.error("Error downloading ID Card:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 3D Flip Card Container */}
      <div className="relative perspective-1000 w-[350px] sm:w-[380px] h-[550px] sm:h-[580px] select-none">
        <div
          className={`relative w-full h-full transition-transform duration-700 preserve-3d cursor-pointer ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
          title="Click to flip card"
        >
          {/* ================= FRONT SIDE ================= */}
          <div className="absolute inset-0 w-full h-full rounded-3xl bg-white shadow-2xl border border-border/80 overflow-hidden flex flex-col justify-between backface-hidden">
            {/* Top Teal Banner with wave */}
            <div className="relative bg-[#004838] pt-2 pb-6 px-4 text-center">
              {/* Lanyard punch hole */}
              <div className="w-20 h-3.5 bg-white rounded-full mx-auto shadow-inner border border-black/10" />

              {/* Decorative wave background */}
              <div className="absolute -bottom-4 left-0 right-0 h-8 overflow-hidden pointer-events-none">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  className="w-full h-full text-[#004838] fill-current"
                >
                  <path d="M0.00,49.98 C150.00,150.00 349.20,-50.00 500.00,49.98 L500.00,0.00 L0.00,0.00 Z" />
                </svg>
              </div>
              <div className="absolute -bottom-4 left-0 right-0 h-8 overflow-hidden pointer-events-none">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  className="w-full h-full fill-none stroke-[#e5a93c] stroke-[6]"
                >
                  <path d="M0.00,49.98 C150.00,150.00 349.20,-50.00 500.00,49.98" />
                </svg>
              </div>
            </div>

            {/* Front Header */}
            <div className="text-center pt-2 px-4">
              <h2 className="font-extrabold text-lg tracking-wide text-[#0c2820] uppercase leading-tight">
                Addis Hospitality
              </h2>
              <div className="text-[11px] font-bold tracking-widest text-[#1e3d34] uppercase">
                -------SOLUTIONS PLC-------
              </div>
              <div className="text-xs font-black tracking-wider text-[#0c2820] uppercase mt-0.5">
                AHS Member
              </div>
            </div>

            {/* Employee Portrait Photo */}
            <div className="flex justify-center my-1">
              <div className="w-36 h-40 rounded-2xl overflow-hidden border-2 border-[#004838] bg-slate-100 shadow-md relative flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 flex flex-col items-center justify-center text-slate-500">
                    <div className="w-16 h-16 rounded-full bg-slate-400/50 mb-1" />
                    <span className="text-[11px] font-semibold text-slate-600">PHOTO</span>
                  </div>
                )}
              </div>
            </div>

            {/* Name, Position & ID */}
            <div className="text-center px-4 space-y-1">
              <h3 className="font-black text-xl text-[#051a14] tracking-tight uppercase leading-tight">
                {displayName}
              </h3>
              <p className="font-bold text-xs text-[#0e3a2f] uppercase tracking-wide">
                {displayPosition}
              </p>
              <div className="inline-block bg-slate-100 px-3 py-0.5 rounded-full border border-slate-200">
                <p className="font-bold text-xs text-[#051a14] tracking-wide">
                  ID No.: <span className="font-mono text-[#004838]">{formattedId}</span>
                </p>
              </div>

              <div className="pt-1 text-[11px] text-slate-600 flex items-center justify-center gap-3">
                <span className="truncate max-w-[150px]">{email}</span>
                <span>•</span>
                <span>{phone}</span>
              </div>
            </div>

            {/* Unique Barcode */}
            <div className="px-6 flex flex-col items-center">
              <div className="h-7 w-56 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox={`0 0 ${barcodePattern.length} 30`}
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {barcodePattern.split("").map((bit, idx) =>
                    bit === "1" ? (
                      <rect
                        key={idx}
                        x={idx}
                        y={0}
                        width={1}
                        height={30}
                        fill="#000000"
                      />
                    ) : null,
                  )}
                </svg>
              </div>
            </div>

            {/* Bottom Wave & Logo */}
            <div className="relative bg-[#004838] text-white pt-5 pb-3 px-4 text-center mt-2">
              <div className="absolute -top-4 left-0 right-0 h-8 overflow-hidden pointer-events-none">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  className="w-full h-full text-[#004838] fill-current"
                >
                  <path d="M0.00,49.98 C150.00,150.00 349.20,-50.00 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" />
                </svg>
              </div>
              <div className="absolute -top-4 left-0 right-0 h-8 overflow-hidden pointer-events-none">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  className="w-full h-full fill-none stroke-[#e5a93c] stroke-[6]"
                >
                  <path d="M0.00,49.98 C150.00,150.00 349.20,-50.00 500.00,49.98" />
                </svg>
              </div>

              <div className="relative z-10 flex items-center justify-center gap-2">
                <span className="font-bold text-xs tracking-wider text-white">
                  addis hospitality service
                </span>
              </div>
              <p className="text-[9px] text-[#f4cb63] tracking-wide mt-0.5">
                Official Verified Identity Badge
              </p>
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div className="absolute inset-0 w-full h-full rounded-3xl bg-white shadow-2xl border border-border/80 overflow-hidden flex flex-col justify-between rotate-y-180 backface-hidden">
            {/* Top Teal Banner */}
            <div className="relative bg-[#004838] pt-2 pb-5 px-4 text-center text-white">
              {/* Lanyard punch hole */}
              <div className="w-20 h-3.5 bg-white rounded-full mx-auto shadow-inner border border-black/10" />

              <h2 className="font-extrabold text-base tracking-wide text-white uppercase mt-1">
                ADDIS HOSPITALITY
              </h2>
              <div className="text-[10px] font-bold tracking-widest text-[#e5a93c] uppercase">
                -------SOLUTIONS PLC-------
              </div>
              <div className="text-[9px] italic text-slate-200">
                Visual &amp; Verbal Identity Addis hospitality Service
              </div>

              {/* Gold wave */}
              <div className="absolute -bottom-3 left-0 right-0 h-6 overflow-hidden pointer-events-none">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  className="w-full h-full fill-none stroke-[#e5a93c] stroke-[5]"
                >
                  <path d="M0.00,49.98 C150.00,150.00 349.20,-50.00 500.00,49.98" />
                </svg>
              </div>
            </div>

            {/* Back Content Body */}
            <div className="px-5 py-2 flex-1 flex flex-col justify-between text-left">
              <div>
                <h3 className="font-extrabold text-sm tracking-wide text-[#0c2820] uppercase mb-1">
                  ABOUT AHS
                </h3>
                <p className="text-[10.5px] leading-snug text-slate-700 font-medium">
                  <strong>Addis Hospitality Solutions PLC (AHS)</strong> is a professional hospitality workforce solutions provider dedicated to connecting skilled and passionate individuals with leading <strong>restaurants, hotels, cafes, catering companies, event venues, and supermarkets</strong>.
                </p>
                <p className="text-[10.5px] leading-snug text-slate-700 font-medium mt-1.5">
                  We believe in people, potential, and partnership. Together, we build a better hospitality industry.
                </p>

                {/* 4 Bullet Points */}
                <div className="mt-2.5 space-y-1">
                  {[
                    "Trusted Recruitment Partner",
                    "Quality Employment Opportunities",
                    "Professional Growth & Development",
                    "Integrity, Respect & Excellence",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                      <span className="text-[#004838] font-bold text-xs leading-none">➔</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signature Line */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-900">
                  Authorized Signature <span className="inline-block border-b-2 border-slate-400 w-36 ml-1" />
                </div>
                <div className="mt-2 bg-slate-100 rounded-md py-1 px-2 text-center border border-slate-200">
                  <span className="text-[10px] font-bold text-[#004838]">
                    MEMBER ID: {formattedId}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Notice */}
            <div className="relative bg-[#004838] text-white py-3 px-4 text-center">
              <div className="absolute -top-3 left-0 right-0 h-6 overflow-hidden pointer-events-none">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  className="w-full h-full fill-none stroke-[#e5a93c] stroke-[5]"
                >
                  <path d="M0.00,49.98 C150.00,150.00 349.20,-50.00 500.00,49.98" />
                </svg>
              </div>

              <p className="text-[9.5px] italic text-slate-100">
                This card is the property of Addis Hospitality Solutions PLC.
              </p>
              <p className="text-[9px] italic text-[#f4cb63]">
                If found, please return to the nearest AHS office.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Actions */}
      {showControls && (
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              {isVerified ? "Verified Official Member Badge" : "Pending Verification"}
            </span>
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Flip to {isFlipped ? "Front" : "Back"}
            </button>
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!isVerified || isDownloading}
              onClick={() => handleDownload("front")}
              className="w-full gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              Front (PNG)
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!isVerified || isDownloading}
              onClick={() => handleDownload("back")}
              className="w-full gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              Back (PNG)
            </Button>

            <Button
              variant="default"
              size="sm"
              disabled={!isVerified || isDownloading}
              onClick={() => handleDownload("both")}
              className="w-full gap-1.5 text-xs font-semibold bg-[#004838] hover:bg-[#00382b] text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Both Sides
            </Button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            disabled={!isVerified}
            onClick={handlePrint}
            className="w-full gap-2 text-xs"
          >
            <Printer className="h-4 w-4" />
            Print ID Badge
          </Button>
        </div>
      )}
    </div>
  );
}
