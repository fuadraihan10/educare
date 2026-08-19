import '@/lib/env'

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { CommandPaletteLoader } from "@/components/command-palette-loader";
import { prisma } from "@/lib/db";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getSchoolName(): Promise<string> {
  try {
    const school = await prisma.school.findFirst({ select: { name: true } });
    return school?.name ?? process.env.SCHOOL_NAME ?? 'School';
  } catch {
    return process.env.SCHOOL_NAME ?? 'School';
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const name = await getSchoolName();
  return {
    title: {
      default: name,
      template: `%s · ${name}`,
    },
    description: `Student management system for ${name}`,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CommandPaletteLoader />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
