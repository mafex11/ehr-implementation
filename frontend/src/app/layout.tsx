import type { Metadata } from 'next'
import './globals.css'; // If using Tailwind or your own CSS
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy-Preserving EHR',
  description: 'Cloud-based EHR with privacy-preserving computation and encryption',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-blue-600 text-white p-4 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">🔒 Privacy-Preserving EHR</h1>
            <div className="flex gap-6">
              <Link href="/" className="hover:underline flex items-center gap-2">
                📊 Dashboard
              </Link>
              <Link href="/add-patient" className="hover:underline flex items-center gap-2">
                ➕ Add Patient
              </Link>
              <Link href="/encrypt" className="hover:underline flex items-center gap-2">
                🔒 Encrypt Data
              </Link>
              <Link href="/decrypt" className="hover:underline flex items-center gap-2">
                🔓 Decrypt Data
              </Link>
              <Link href="/analytics" className="hover:underline flex items-center gap-2">
                📈 Analytics
              </Link>
              <Link href="/how-it-works" className="hover:underline flex items-center gap-2">
                🔬 How it Works
              </Link>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-gray-800 text-white p-4 text-center">
          <p>&copy; {new Date().getFullYear()} Privacy-Preserving EHR System with Differential Privacy Encryption</p>
        </footer>
      </body>
    </html>
  );
}
