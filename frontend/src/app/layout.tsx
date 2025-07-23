import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Home, Shield, Lock, Unlock, BarChart3, Star, Menu, X } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TDP-QIMLE EHR System',
  description: 'Revolutionary EHR system with Temporal Differential Privacy and Quantum-Inspired Multi-Layer Encryption',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <nav className="bg-zinc-900 border-b-2 border-zinc-800">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
              <div className="flex items-center space-x-2">
                <Link href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors ">
                  <Shield className="w-8 h-8 text-primary" />
                  <span className="text-xl font-bold hidden sm:inline">TDP-QIMLE EHR System</span>
                </Link>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden md:flex w-fit mx-auto space-x-8 rounded-full bg-zinc-800/90  px-8 py-2 shadow-lg transition-colors duration-200">
                <Link href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors ">
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                {/* <Link href="/add-patient" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Shield className="w-4 h-4" />
                  <span>Add Patient</span>
                </Link> */}
                <Link href="/encrypt" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Lock className="w-4 h-4" />
                  <span>Encrypt Data</span>
                </Link>
                <Link href="/decrypt" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Unlock className="w-4 h-4" />
                  <span>Decrypt Data</span>
                </Link>
                {/* <Link href="/analytics" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </Link> */}
                <Link href="/algorithm" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Star className="w-4 h-4" />
                  <span>Algorithm</span>
                </Link>
                <Link href="/security" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Shield className="w-4 h-4" />
                  <span>Security</span>
                </Link>
              </nav>

              {/* Mobile Nav: only icons, visible on mobile (below md) */}
              <nav className="flex md:hidden w-fit mx-auto space-x-6 rounded-full bg-zinc-800/90 px-4 py-2 shadow-lg transition-colors duration-200">
                <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors ">
                  <Home className="w-6 h-6" />
                </Link>
                <Link href="/encrypt" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  <Lock className="w-6 h-6" />
                </Link>
                <Link href="/decrypt" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  <Unlock className="w-6 h-6" />
                </Link>
                <Link href="/algorithm" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  <Star className="w-6 h-6" />
                </Link>
                <Link href="/security" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  <Shield className="w-6 h-6" />
                </Link>
              </nav>
              {/* <ModeToggle /> */}
            </div>
          </nav>
          <main className="min-h-screen bg-background">
            {children}
          </main>
          <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} TDP-QIMLE EHR System - Revolutionary Privacy-Preserving Healthcare Technology
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
