import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OFC NMS - IAF",
  description: "Indigenous GIS based OFC Network Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col`} suppressHydrationWarning>
        <Toaster richColors position="top-right" />
        {/* Navigation placeholder could go here */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
