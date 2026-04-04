import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "COMMAND NET | IAF",
  description: "Indigenous GIS based OFC Network Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900`} suppressHydrationWarning>
        <Toaster richColors position="top-right" duration={5000} />
        
        {/* Global Navbar */}
        <nav className="bg-slate-950 text-slate-100 border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Logo / Brand */}
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">COMMAND NET</span>
                  <span className="text-[0.6rem] font-mono text-slate-400 uppercase tracking-widest leading-none">IAF OFC NMS v1.0.0</span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-1 font-medium text-sm">
                  <a href="/" className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-emerald-400 transition-colors">Overview</a>
                  <a href="/map" className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-emerald-400 transition-colors">GIS Map</a>
                  <a href="/alarms" className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-emerald-400 transition-colors">Active Alarms</a>
                  <a href="/work-orders" className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-emerald-400 transition-colors">Dispatch</a>
                  <a href="/reports" className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-emerald-400 transition-colors">Analytics</a>
                </div>
              </div>

            </div>
          </div>
        </nav>

        <main className="flex-1 w-full relative">
          {children}
        </main>
      </body>
    </html>
  );
}
