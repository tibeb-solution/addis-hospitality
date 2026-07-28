"use client";

import { ThemeProvider } from "@/lib/theme-provider";
import { NextIntlClientProvider } from "next-intl";

export default function Providers({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: any;
  locale: string;
}) {
  return (
    <ThemeProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
