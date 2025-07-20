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
                <Shield className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold">TDP-QIMLE EHR System</span>
              </div>

              <nav className="hidden md:flex space-x-8">
                <Link href="/" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Home className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                {/* <Link href="/add-patient" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Shield className="w-4 h-4" />
                  <span>Add Patient</span>
                </Link> */}
                <Link href="/encrypt" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Lock className="w-4 h-4" />
                  <span>Add Patient/Encrypt Data</span>
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
