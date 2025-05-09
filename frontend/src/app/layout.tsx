import type { Metadata } from 'next'
import './globals.css'; // If using Tailwind or your own CSS
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy-Preserving EHR',
  description: 'Cloud-based EHR with privacy-preserving computation',
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
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Privacy-Preserving EHR</h1>
            <div className="flex gap-4">
              <Link href="/" className="hover:underline">Dashboard</Link>
              <Link href="/add-patient" className="hover:underline">Add Patient</Link>
              <Link href="/analytics" className="hover:underline">Analytics</Link>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-gray-800 text-white p-4 text-center">
          <p>&copy; {new Date().getFullYear()} Privacy-Preserving EHR System</p>
        </footer>
      </body>
    </html>
  );
}
