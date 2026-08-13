"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";

const OPTIONS: { key: "en" | "am"; label: string; className?: string }[] = [
  { key: "en", label: "English" },
  { key: "am", label: "አማርኛ", className: "font-ethiopic" },
];

export function LocaleSwitcher() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const setLocale = useCallback(
    (locale: "en" | "am") => {
      const doSet = async () => {
        try {
          const res = await fetch("/api/locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale }),
          });
          if (res.ok) {
            setOpen(false);
            setTimeout(() => router.refresh(), 100);
          }
        } catch (e) {
          console.error("Failed to change locale", e);
        }
      };
      doSet();
    },
    [router],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (!menuRef.current || !buttonRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      if (buttonRef.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors hover:bg-accent"
        title={t("changeLanguage")}
      >
        <Globe className="h-4 w-4" aria-hidden />
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="sr-only">{t("changeLanguage")}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("changeLanguage")}
          className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-md shadow-md z-50"
        >
          <ul className="py-1">
            {OPTIONS.map((opt) => (
              <li key={opt.key} role="none">
                <button
                  role="menuitem"
                  onClick={() => setLocale(opt.key)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/10 ${opt.className || ""}`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
